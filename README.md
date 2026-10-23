# 💎 BOT PayLink — Decentralized Merchant Payment Protocol

[![Network: BotChain Mainnet](https://img.shields.io/badge/Network-BotChain%20Mainnet%20(677)-a855f7?style=for-the-badge)](https://scan.botchain.ai)
[![Contract Verified](https://img.shields.io/badge/BotChainScan-Verified%20Contract-34d399?style=for-the-badge)](https://scan.botchain.ai/address/0xAC433aE018ed27EB4D081A0D4C61b6BCE08c9ae1#code)
[![Solidity: 0.8.20](https://img.shields.io/badge/Solidity-0.8.20-blue?style=for-the-badge)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](./LICENSE)

A high-performance, non-custodial decentralized payment link protocol on **BotChain (Chain ID: 677)**. Lets merchants, freelancers, developers, and online sellers create tamper-proof payment requests, share custom URLs or QR codes, and receive direct payments with automated on-chain receipts.

---

## 📋 Table of Contents
- [Verified Contract Details](#-verified-contract-details)
- [Network Specifications](#-network-specifications)
- [Core Architecture & Features](#-core-architecture--features)
- [Security & Zero-Leakage Architecture](#-security--zero-leakage-architecture)
- [Getting Started](#-getting-started)
- [Terminal Commands](#-terminal-commands)
- [Smart Contract Reference](#-smart-contract-reference)
- [Technical Whitepaper](#-technical-whitepaper)
- [License](#-license)

---

## 🔍 Verified Contract Details

The `PaymentLink.sol` smart contract is officially compiled and verified on BotChainScan:

| Parameter | Value |
|---|---|
| **Contract Name** | `PaymentLink` |
| **Mainnet Address** | [`0xAC433aE018ed27EB4D081A0D4C61b6BCE08c9ae1`](https://scan.botchain.ai/address/0xAC433aE018ed27EB4D081A0D4C61b6BCE08c9ae1#code) |
| **Compiler Version** | `v0.8.20+commit.a1b79de6` |
| **Optimization** | Enabled (200 runs) |
| **Verification Status** | **Verified (Pass)** |
| **BotChainScan Explorer** | [View Verified Source & ABI on BotChainScan](https://scan.botchain.ai/address/0xAC433aE018ed27EB4D081A0D4C61b6BCE08c9ae1#code) |

---

## 🌐 Network Specifications

| Parameter | BotChain Mainnet |
|---|---|
| **Chain ID** | `677` |
| **Currency Symbol** | `BOT` |
| **Currency Decimals** | `18` |
| **RPC Endpoint** | `https://rpc.botchain.ai` |
| **Block Explorer** | `https://scan.botchain.ai` |
| **Target Block Time** | `~3 seconds` |

---

## ⚡ Core Architecture & Features

### 1. Tamper-Proof Cryptographic Binding
Each payment request computes a deterministic 32-byte identifier using Keccak-256 over the chain ID, contract address, merchant address, recipient address, token currency, required amount, merchant nonce, and timestamp:
```solidity
linkId = keccak256(
    abi.encodePacked(
        block.chainid,
        address(this),
        msg.sender,
        recipient,
        token,
        amount,
        nonce,
        block.timestamp
    )
);
```
- Customers cannot alter the destination address.
- Customers cannot modify the requested price.
- Replay attacks on other chains are impossible (EIP-155 domain separation).

### 2. Flexible Link Modalities
- **Single-Use Links**: Strictly payable once. Re-payment attempts automatically revert.
- **Reusable Links**: Configurable as either unlimited (crowdfunding, donations) or capped with exact maximum payment limits.
- **On-Chain Expiry**: Optional unix timestamp expiry enforced at the block level.
- **Merchant Cancellation**: Merchants can invalidate active links anytime before payment.

### 3. Transparent On-Chain Receipts
Every settlement:
- Immediately forwards native BOT directly to the recipient's wallet via reentrancy-guarded atomic call.
- Records a permanent on-chain `Receipt` struct with the payer's address, amount, timestamp, and memo.
- Emits indexed `PaymentCompleted` events for instant frontend and webhook indexing.

### 4. Merchant Dashboard & Point-of-Sale (POS)
- **Merchant Hub**: Generate payment requests, filter active/expired/paid links, copy shareable URLs, download ISO QR codes, inspect customer receipts, and cancel requests.
- **Pay Link Experience**: Interactive payment screen displaying real-time contract status, merchant reference, wallet balance check, optional customer memo note, and one-click execution.

---

## 🛡️ Security & Zero-Leakage Architecture

- **Private Key Isolation**: Private keys in `.env` are strictly used during server-side compilation/deployment (`scripts/deploy.js`) and never exposed to the Vite client bundle (non-`VITE_` variables are excluded by default).
- **Git Shield**: `.gitignore` strictly protects `.env`, `.env.*`, `*.pem`, and `*.key` files to prevent accidental commits.
- **Reentrancy Protection**: Custom mutex guard (`_NOT_ENTERED` / `_ENTERED`) prevents reentrancy during external value transfers.
- **Checks-Effects-Interactions**: Storage updates (`paidCount`, `totalPaidAmount`) are committed before funds are dispatched.
- **Zero Address Validation**: Mandatory `require(recipient != address(0))` prevents burning of funds.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.0.0
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/your-username/payment-link.git
cd payment-link
npm install
```

### 3. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
Edit `.env` with your deployment private key (never commit this file):
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://rpc.botchain.ai
CHAIN_ID=677
VITE_PAYMENT_LINK_ADDRESS=0xAC433aE018ed27EB4D081A0D4C61b6BCE08c9ae1
VITE_REOWN_PROJECT_ID=3fcc6bba2d1de962d911bb5b5c3dba68
```

---

## 💻 Terminal Commands

| Command | Action |
|---|---|
| `npm run compile` | Compiles `contracts/PaymentLink.sol` using solc 0.8.20 and outputs artifacts to `src/contracts/` |
| `npm run deploy` | Deploys the contract to BotChain Mainnet, writes `deployedAddress.json`, and updates `.env` |
| `npm run verify` | Submits source code and verifies the deployed contract on BotChainScan via API |
| `npm run dev` | Starts the Vite local development server at `http://localhost:5173` |
| `npm run build` | Builds the optimized production frontend bundle in `dist/` |
| `npm run preview` | Previews the production build locally |

---

## 📑 Technical Whitepaper

Read the complete academic whitepaper at [`WHITEPAPER.md`](./WHITEPAPER.md), covering:
- Formal cryptographic proofs & state transitions
- EVM mathematical predicates
- Threat model & MEV analysis
- Gas optimization benchmarks

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
