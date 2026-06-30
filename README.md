# BlockAid

> A blockchain-based fundraising platform where every donation is held in escrow and verifiable on-chain. Give with proof, not promises.

BlockAid is a decentralized donation platform built as a Final Year Project at the University of Lahore. It brings transparency and trust to online fundraising by holding donations in escrow smart contracts on the Polygon network. Funds are released to campaign creators only when funding goals are met — otherwise, backers can reclaim their contributions.

**Live demo:** blockaid-beryl.vercel.app

---

## Key features

- **Escrow donations** — contributions are held by a smart contract, not forwarded directly to creators.
- **Goal-gated withdrawals** — creators can only withdraw once a campaign reaches its funding goal.
- **Trustless refunds** — if a campaign misses its deadline without meeting its goal, backers reclaim their funds on-chain.
- **On-chain verifiability** — every donation has a transaction hash inspectable on Polygonscan.
- **Campaign management** — create campaigns with images (stored on IPFS), post updates, and receive comments.
- **Wallet integration** — connect MetaMask, with automatic Polygon Amoy network detection and switching.
- **Admin panel** — monitor users, campaigns, and donations; moderate comments with an audit log.
- **Full authentication** — register, log in, and manage profiles with secure JWT cookies.

---

## Tech stack

| Layer           | Technology                                     |
| --------------- | ---------------------------------------------- |
| Framework       | Next.js 14 (App Router), React 18, TypeScript  |
| Styling         | Tailwind CSS (dark glassmorphism design)       |
| Database        | MongoDB Atlas with Mongoose                    |
| Auth            | JWT (HttpOnly cookies), bcrypt, Zod validation |
| Smart contracts | Solidity 0.8.24, Hardhat 3                     |
| Blockchain      | Polygon Amoy testnet (chain ID 80002)          |
| Web3            | ethers.js v6, MetaMask                         |
| File storage    | IPFS via Pinata                                |
| Testing         | Hardhat (contracts), Playwright (E2E)          |
| CI/CD           | GitHub Actions                                 |
| Deployment      | Vercel                                         |

---

## Architecture

BlockAid is a single Next.js application with API routes, using a hybrid on-chain / off-chain model:

- **On-chain (source of truth):** A `CampaignFactory` contract deploys individual `Campaign` escrow contracts. Each campaign holds donations, enforces the goal and deadline, and handles withdrawals and refunds using a pull-based, reentrancy-safe pattern.
- **Off-chain (metadata + performance):** MongoDB stores campaign metadata (title, description, images, category) and mirrors on-chain state for fast browsing, searching, and sorting. The blockchain always wins on conflict.

---

## Getting started

### Prerequisites

- Node.js 22.13.0 or later (required by Hardhat 3)
- A MongoDB Atlas account (free tier works)
- A Pinata account for IPFS uploads
- MetaMask with the Polygon Amoy testnet added
- Test POL from the [Polygon Amoy faucet](https://faucet.polygon.technology)

### Installation

```bash
git clone https://github.com/hasaan07/blockaid.git
cd blockaid
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_long_random_secret

# Blockchain
NEXT_PUBLIC_FACTORY_ADDRESS=your_deployed_factory_address
NEXT_PUBLIC_AMOY_RPC=https://rpc-amoy.polygon.technology
DEPLOYER_PRIVATE_KEY=your_wallet_private_key_for_deploying_contracts

# IPFS
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

> **Never commit `.env.local`.** It is gitignored by default.

### Deploy the smart contracts

```bash
npx hardhat build
npx hardhat run scripts/deploy.ts --network amoy
```

Copy the deployed factory address into `NEXT_PUBLIC_FACTORY_ADDRESS` in `.env.local`.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

```bash
# Smart contract tests (Hardhat)
npx hardhat test

# End-to-end tests (Playwright)
npm run test:e2e

# Watch E2E tests run in the interactive UI
npm run test:e2e:ui

# Lint and type-check
npm run lint
npm run type-check
```

Continuous integration runs the full pipeline (lint, type-check, contract compilation, contract tests, and E2E tests) on every push via GitHub Actions.

---

## Project structure

```
blockaid/
├── contracts/              # Solidity smart contracts
│   ├── Campaign.sol        # Escrow campaign contract
│   └── CampaignFactory.sol # Factory that deploys campaigns
├── scripts/                # Deployment scripts
├── test/                   # Hardhat contract tests
├── tests/e2e/              # Playwright end-to-end tests
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   ├── components/         # React components
│   ├── lib/                # Utilities (web3, auth, db, formatting)
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Auth middleware
│   ├── hooks/              # React hooks
│   └── types/              # Shared TypeScript types
└── .github/workflows/      # CI pipeline
```

---

## How the escrow works

1. A creator deploys a campaign contract with a goal and deadline.
2. Backers donate POL, which the contract holds in escrow.
3. **If the goal is met:** the creator can withdraw the funds.
4. **If the deadline passes without meeting the goal:** each backer can claim a full refund.

This removes the need to trust the platform or the creator — the smart contract enforces the rules.

---

## Authors

- **Hasaan Azmat**
- **Muhammad Ghufran**

Final Year Project — University of Lahore
Supervised by Sir Muhammad Tayyab

---

## License

This project was developed for academic purposes as a Final Year Project.
