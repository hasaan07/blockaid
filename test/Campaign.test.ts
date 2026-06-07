import { expect } from "chai";
import { network } from "hardhat";
import type { Campaign, CampaignFactory } from "../typechain-types";

describe("Campaign + CampaignFactory", () => {
  // Connection bound per-test-run.
  let ethers: Awaited<ReturnType<typeof network.connect>>["ethers"];
  let networkHelpers: Awaited<ReturnType<typeof network.connect>>["networkHelpers"];

  let factory: CampaignFactory;
  let creator: Awaited<ReturnType<typeof ethers.getSigners>>[number];
  let alice: typeof creator;
  let bob: typeof creator;
  let outsider: typeof creator;

  const ONE_ETHER = 10n ** 18n; // 1 POL in wei
  const GOAL = 5n * ONE_ETHER; // 5 POL goal
  const DAY = 24 * 60 * 60;

  beforeEach(async () => {
    const connection = await network.connect();
    ethers = connection.ethers;
    networkHelpers = connection.networkHelpers;

    [creator, alice, bob, outsider] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CampaignFactory");
    factory = (await Factory.deploy()) as unknown as CampaignFactory;
    await factory.waitForDeployment();
  });

  // Helper: create a fresh campaign with goal=5 POL, deadline=30 days from now.
  async function createFreshCampaign(): Promise<Campaign> {
    const deadline = (await networkHelpers.time.latest()) + 30 * DAY;
    const tx = await factory
      .connect(creator)
      .createCampaign("Books for Rural Kids", GOAL, deadline);
    const receipt = await tx.wait();

    // Pull the new campaign address from the CampaignCreated event.
    const log = receipt!.logs.find(
      (entry: unknown) =>
        typeof entry === "object" &&
        entry !== null &&
        "fragment" in entry &&
        // @ts-expect-error: fragment.name exists at runtime on Hardhat-decoded logs
        entry.fragment?.name === "CampaignCreated"
    );
    // @ts-expect-error: args exists at runtime on decoded logs
    const newAddress = log.args.campaignAddress as string;
    return (await ethers.getContractAt("Campaign", newAddress)) as unknown as Campaign;
  }

  // ============================================================
  // Factory tests
  // ============================================================
  describe("CampaignFactory", () => {
    it("deploys with zero campaigns", async () => {
      expect(await factory.campaignCount()).to.equal(0);
    });

    it("creates a new campaign and emits CampaignCreated", async () => {
      const deadline = (await networkHelpers.time.latest()) + 30 * DAY;
      await expect(factory.connect(creator).createCampaign("Test", GOAL, deadline)).to.emit(
        factory,
        "CampaignCreated"
      );
    });

    it("tracks deployed campaigns globally and per-creator", async () => {
      const deadline = (await networkHelpers.time.latest()) + 30 * DAY;
      await factory.connect(creator).createCampaign("A", GOAL, deadline);
      await factory.connect(creator).createCampaign("B", GOAL, deadline);
      await factory.connect(alice).createCampaign("C", GOAL, deadline);

      expect(await factory.campaignCount()).to.equal(3);
      expect(await factory.getCampaignsByCreator(creator.address)).to.have.lengthOf(2);
      expect(await factory.getCampaignsByCreator(alice.address)).to.have.lengthOf(1);
    });
  });

  // ============================================================
  // Constructor / deployment validation
  // ============================================================
  describe("Campaign constructor", () => {
    it("reverts if goal is zero", async () => {
      const deadline = (await networkHelpers.time.latest()) + DAY;
      await expect(factory.connect(creator).createCampaign("T", 0n, deadline)).to.be.revertedWith(
        "Goal must be > 0"
      );
    });

    it("reverts if deadline is in the past", async () => {
      const pastDeadline = (await networkHelpers.time.latest()) - DAY;
      await expect(
        factory.connect(creator).createCampaign("T", GOAL, pastDeadline)
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("sets immutable values correctly", async () => {
      const campaign = await createFreshCampaign();
      expect(await campaign.creator()).to.equal(creator.address);
      expect(await campaign.goalAmount()).to.equal(GOAL);
      expect(await campaign.title()).to.equal("Books for Rural Kids");
      expect(await campaign.receivedAmount()).to.equal(0n);
      expect(await campaign.withdrawn()).to.equal(false);
    });
  });

  // ============================================================
  // donate()
  // ============================================================
  describe("donate()", () => {
    it("accepts a valid donation and updates state", async () => {
      const campaign = await createFreshCampaign();

      await expect(campaign.connect(alice).donate({ value: ONE_ETHER }))
        .to.emit(campaign, "Donated")
        .withArgs(alice.address, ONE_ETHER, ONE_ETHER);

      expect(await campaign.receivedAmount()).to.equal(ONE_ETHER);
      expect(await campaign.contributions(alice.address)).to.equal(ONE_ETHER);
      expect(await campaign.contributorCount()).to.equal(1);
    });

    it("tracks multiple donations from same contributor", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });
      await campaign.connect(alice).donate({ value: ONE_ETHER });

      expect(await campaign.contributions(alice.address)).to.equal(ONE_ETHER * 2n);
      expect(await campaign.contributorCount()).to.equal(1); // still one unique contributor
    });

    it("tracks multiple unique contributors", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });
      await campaign.connect(bob).donate({ value: ONE_ETHER });

      expect(await campaign.contributorCount()).to.equal(2);
      expect(await campaign.receivedAmount()).to.equal(ONE_ETHER * 2n);
    });

    it("reverts on zero donation", async () => {
      const campaign = await createFreshCampaign();
      await expect(campaign.connect(alice).donate({ value: 0n })).to.be.revertedWith(
        "Donation must be > 0"
      );
    });

    it("reverts after deadline", async () => {
      const campaign = await createFreshCampaign();
      await networkHelpers.time.increase(31 * DAY); // jump past deadline

      await expect(campaign.connect(alice).donate({ value: ONE_ETHER })).to.be.revertedWith(
        "Campaign has ended"
      );
    });
  });

  // ============================================================
  // withdraw()
  // ============================================================
  describe("withdraw()", () => {
    it("allows creator to withdraw when goal is reached", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: GOAL }); // goal met exactly

      await expect(campaign.connect(creator).withdraw())
        .to.emit(campaign, "Withdrawn")
        .withArgs(creator.address, GOAL);

      expect(await campaign.withdrawn()).to.equal(true);
      expect(await ethers.provider.getBalance(await campaign.getAddress())).to.equal(0n);
    });

    it("reverts when called by non-creator", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: GOAL });

      await expect(campaign.connect(alice).withdraw()).to.be.revertedWith(
        "Only creator can withdraw"
      );
    });

    it("reverts when goal is not reached", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });

      await expect(campaign.connect(creator).withdraw()).to.be.revertedWith("Goal not reached");
    });

    it("reverts on second withdraw attempt", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: GOAL });
      await campaign.connect(creator).withdraw();

      await expect(campaign.connect(creator).withdraw()).to.be.revertedWith("Already withdrawn");
    });
  });

  // ============================================================
  // refund()
  // ============================================================
  describe("refund()", () => {
    it("allows contributor to claim refund after deadline if goal not met", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });
      await campaign.connect(bob).donate({ value: ONE_ETHER });
      await networkHelpers.time.increase(31 * DAY); // jump past deadline; goal=5, received=2

      const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);

      const tx = await campaign.connect(alice).refund();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const aliceBalanceAfter = await ethers.provider.getBalance(alice.address);
      expect(aliceBalanceAfter).to.equal(aliceBalanceBefore + ONE_ETHER - gasUsed);
      expect(await campaign.contributions(alice.address)).to.equal(0n);
    });

    it("reverts before deadline", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });

      await expect(campaign.connect(alice).refund()).to.be.revertedWith("Deadline has not passed");
    });

    it("reverts if goal was reached", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: GOAL });
      await networkHelpers.time.increase(31 * DAY);

      await expect(campaign.connect(alice).refund()).to.be.revertedWith(
        "Goal was reached, no refunds"
      );
    });

    it("reverts if caller did not contribute", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });
      await networkHelpers.time.increase(31 * DAY);

      await expect(campaign.connect(outsider).refund()).to.be.revertedWith(
        "No contribution to refund"
      );
    });

    it("only refunds once per contributor", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });
      await networkHelpers.time.increase(31 * DAY);
      await campaign.connect(alice).refund();

      await expect(campaign.connect(alice).refund()).to.be.revertedWith(
        "No contribution to refund"
      );
    });
  });

  // ============================================================
  // status()
  // ============================================================
  describe("status()", () => {
    it("returns Active before deadline if goal not met", async () => {
      const campaign = await createFreshCampaign();
      expect(await campaign.status()).to.equal("Active");
    });

    it("returns Funded when goal is reached (before deadline)", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: GOAL });
      expect(await campaign.status()).to.equal("Funded");
    });

    it("returns Expired after deadline if goal not met", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: ONE_ETHER });
      await networkHelpers.time.increase(31 * DAY);
      expect(await campaign.status()).to.equal("Expired");
    });

    it("returns Withdrawn after creator withdraws", async () => {
      const campaign = await createFreshCampaign();
      await campaign.connect(alice).donate({ value: GOAL });
      await campaign.connect(creator).withdraw();
      expect(await campaign.status()).to.equal("Withdrawn");
    });
  });
});
