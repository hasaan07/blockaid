/**
 * Donation model — records a confirmed on-chain donation.
 *
 * Created by the frontend AFTER MetaMask confirms the transaction.
 * The `txHash` field is unique and serves as the integrity anchor:
 * anyone can verify the donation on Polygonscan using this hash.
 */
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const donationSchema = new Schema(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    backerWallet: {
      // On-chain wallet address that sent the donation. We don't necessarily
      // know which user this corresponds to (a logged-in user with a connected
      // wallet, OR an anonymous donor — both possible).
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
        message: "Invalid backer wallet address",
      },
      index: true,
    },
    backerUser: {
      // Optional FK to a logged-in user, when we can correlate.
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    amountWei: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{64}$/.test(v),
        message: "Invalid transaction hash",
      },
    },
    blockNumber: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export type DonationDoc = InferSchemaType<typeof donationSchema> & { _id: string };

export const Donation: Model<DonationDoc> =
  (models.Donation as Model<DonationDoc>) || model<DonationDoc>("Donation", donationSchema);
