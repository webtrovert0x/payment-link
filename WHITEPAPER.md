# BOT PayLink Protocol: Decentralized Non-Custodial Merchant Payment System on Bohr Chain
**Technical Whitepaper — Version 1.0.0**  
**Author**: Bohr Protocol Engineering Working Group  
**Status**: Mainnet / Testnet Active (Chain ID: 968)  
**Smart Contract**: `PaymentLink.sol`  
**Verified Contract Address**: `0xb66140aDF4712c46485fE44ADE219aC2bF8cC700`  
**BohrScan Explorer**: [https://scan.bohr.life/address/0xb66140aDF4712c46485fE44ADE219aC2bF8cC700#code](https://scan.bohr.life/address/0xb66140aDF4712c46485fE44ADE219aC2bF8cC700#code)

---

## 1. Abstract

Decentralized peer-to-peer commerce frequently suffers from user friction, human error during manual address copying, clipboard poisoning, and price-settlement ambiguities. Existing custodial merchant payment gateways reintroduce centralized counterparty risk, custodial delays, and fee extraction. 

The **BOT PayLink Protocol** introduces a trustless, non-custodial smart contract infrastructure on **Bohr Chain** that allows merchants, freelancers, developers, and automated services to generate deterministic, cryptographically bound payment requests. Each link locks the recipient address, payment token, required value, and expiry parameters into an immutable on-chain state machine. Customers connect their EVM wallet and fulfill payments in a single transaction with immediate direct-to-merchant settlement. This paper outlines the mathematical, architectural, and security model of the protocol, formally proving protection against parameter tampering, reentrancy, front-running, and double-spending.

---

## 2. Introduction & Motivation

### 2.1 The Friction of Conventional Web3 Payments
In standard cryptocurrency transfers, a merchant presents a raw public address (e.g., `0x55DA...eC16`) and an invoice amount. This workflow suffers from critical vulnerabilities:
1. **Address Poisoning & Clipboard Hijack**: Malware or confusing address similarities frequently lead to lost or stolen funds.
2. **Amount Discrepancy & Over/Under-Payments**: Customers often input an erroneous decimal value or gas deduction, resulting in unresolved merchant reconciliation disputes.
3. **Receipt Ambiguity**: Standard native coin transfers emit no indexed application events, making real-time automated receipt verification computationally expensive and unreliable for merchant backends.
4. **Third-Party Custodial Risk**: Traditional crypto payment processors hold funds in omnibus wallets, introducing credit risks and payout throttling.

### 2.2 Protocol Design Goals
The BOT PayLink Protocol satisfies five core tenets:
* **Strict Non-Custodial Settlement**: The smart contract never retains merchant revenue; funds are atomized and transferred immediately to the designated recipient in the transaction execution frame.
* **Cryptographic Tamper-Proof Binding**: Payment parameters (recipient, currency, exact amount, and maximum redemptions) cannot be modified after link creation.
* **Determinism & Idempotency**: Single-use links cannot be drained or double-paid.
* **Deterministic On-Chain Receipts**: Structured event logs and stateful receipt arrays store payer notes, exact block timestamps, and payment reference numbers.
* **Minimal Gas Overhead**: Optimized Solidity compilation yielding minimal execution fees on Bohr Chain.

---

## 3. Cryptographic & State Machine Architecture

### 3.1 Deterministic Link Identifier Derivation

Each payment link is identified by a unique 32-byte hash ($H_{link}$) computed via Keccak-256 over an 8-tuple comprising the network domain, contract instance, caller authority, destination, token standard, settlement value, per-merchant monotonic nonce, and block timestamp:

$$H_{link} = \text{keccak256}\Big(\text{chainid} \parallel \text{address}(this) \parallel \text{merchant} \parallel \text{recipient} \parallel \text{token} \parallel \text{amount} \parallel \nu_{merchant} \parallel t_{creation}\Big)$$

Where:
* $\text{chainid} = 968$ (Bohr Network, EIP-155 replay protection).
* $\nu_{merchant} \in \mathbb{N}_{\ge 0}$ is an auto-incrementing nonce managed per merchant account.
* $\text{token} = 0x0000000000000000000000000000000000000000$ specifies native **BOT**, or an ERC20 contract address.

This formulation guarantees that even if two identical requests with the same price and recipient are minted in the same block, distinct monotonic nonces prevent link collisions or pre-image confusion attacks.

### 3.2 State Machine Formalization

The payment link entity is represented by the tuple:

$$\mathcal{L} = \langle \text{id}, \text{merchant}, \text{recipient}, \text{token}, \text{amount}, \text{expiry}, \text{isReusable}, \text{maxUses}, \text{paidCount}, \text{totalPaidAmount}, \text{isCancelled}, \text{paymentRef}, \text{createdAt} \rangle$$

The state space transition $\mathcal{S} \xrightarrow{pay()} \mathcal{S}'$ is bounded by predicate conditions:

$$\mathcal{P}_{\text{valid}}(\mathcal{L}, \text{tx}) \iff \begin{cases}
\mathcal{L}.\text{id} \neq 0x0 \\
\neg \mathcal{L}.\text{isCancelled} \\
\mathcal{L}.\text{expiry} = 0 \lor t_{block} \le \mathcal{L}.\text{expiry} \\
\mathcal{L}.\text{isReusable} = \text{false} \implies \mathcal{L}.\text{paidCount} = 0 \\
\mathcal{L}.\text{isReusable} = \text{true} \land \mathcal{L}.\text{maxUses} > 0 \implies \mathcal{L}.\text{paidCount} < \mathcal{L}.\text{maxUses} \\
\mathcal{L}.\text{token} = 0x0 \implies \text{msg.value} = \mathcal{L}.\text{amount} \\
\mathcal{L}.\text{token} \neq 0x0 \implies \text{msg.value} = 0
\end{cases}$$

If any predicate component is violated, the EVM execution frame immediately reverts with an explicit error, reverting all state transitions.

```
                  +-----------------------------------+
                  |      Merchant Creates Link        |
                  |  createPaymentLink(recipient,...) |
                  +-----------------+-----------------+
                                    |
                                    v
                           [ Status: ACTIVE ]
                             /            \
              Customer Pays /              \ Merchant Cancels
                           /                \
                          v                  v
                 +------------------+   +-------------------+
                 | Validated on-chain|  | Status: CANCELLED |
                 | Funds transferred |  | (Irreversible)    |
                 +--------+---------+   +-------------------+
                          |
             +------------+------------+
             |                         |
             v                         v
     (Single-Use Link)          (Reusable Link)
      paidCount == 1             paidCount < maxUses ?
             |                         |
             v                         +---> [ Stay ACTIVE ]
    [ Status: COMPLETED ]              |
     (Cannot be repaid)                v (Cap Reached)
                              [ Status: EXHAUSTED ]
```

---

## 4. Smart Contract Specifications

### 4.1 Interface and Method Descriptions

#### `createPaymentLink`
```solidity
function createPaymentLink(
    address payable recipient,
    address token,
    uint256 amount,
    uint256 expiry,
    bool isReusable,
    uint32 maxUses,
    string calldata paymentRef
) external returns (bytes32 linkId);
```
* **Pre-conditions**:
  * `recipient != address(0)`
  * `amount > 0`
  * If `expiry > 0`, require `expiry > block.timestamp`
* **Post-conditions**:
  * Emits `PaymentLinkCreated(linkId, merchant, recipient, token, amount, ...)`
  * Increments `merchantNonces[msg.sender]`
  * Enforces `maxUses = 1` if `!isReusable`

#### `pay`
```solidity
function pay(bytes32 linkId, string calldata payerNote) external payable nonReentrant;
```
* **Pre-conditions**:
  * Evaluates predicate $\mathcal{P}_{\text{valid}}$
* **State Updates**:
  * `link.paidCount += 1`
  * `link.totalPaidAmount += link.amount`
  * Appends `Receipt` to `_linkReceipts[linkId]`
* **Asset Transfer**:
  * Native BOT: `(bool success, ) = destination.call{value: msg.value}(""); require(success);`
  * ERC-20: `IERC20(token).transferFrom(msg.sender, destination, amount); require(success);`
* **Event**:
  * Emits `PaymentCompleted(...)`

#### `cancelPaymentLink`
```solidity
function cancelPaymentLink(bytes32 linkId) external;
```
* **Access Control**: Strictly restricted to `msg.sender == link.merchant`.
* Sets `link.isCancelled = true`. Emits `PaymentLinkCancelled`.

---

## 5. Security & Threat Modeling

| Attack Vector | Vulnerability Description | Protocol Mitigation |
| :--- | :--- | :--- |
| **Recipient Substitution** | Attacker intercepts or modifies recipient in frontend payload. | **Guaranteed on-chain**: Recipient is etched in contract storage under the keccak256 hash. Customers pay into the contract, which transfers directly to the stored recipient. |
| **Price Tampering** | Customer underpays or alters expected token units. | **Strict Value Equality**: `require(msg.value == link.amount)` ensures exact wei-level precision. |
| **Reentrancy Attack** | Malicious recipient contract attempts recursive callback during transfer. | **Checks-Effects-Interactions & Mutex**: State counters (`paidCount`) are incremented *prior* to external transfer; guarded with custom `nonReentrant` modifier. |
| **Replay across Chains** | Attacker replays payload on another EVM network. | **EIP-155 Domain Binding**: Contract binds `block.chainid` (968 for Bohr) directly into link hash generation. |
| **Front-Running / MEV** | Searcher attempts to frontrun link payment. | Payment execution is idempotent and benefits solely the designated recipient. Single-use lock rejects duplicate attempts. |
| **Double Spending** | Customer attempts multiple rapid payments to single-use link. | `paidCount` is checked at state onset; any subsequent execution fails on `paidCount == 0`. |

---

## 6. Bohr Chain Network Parameters

The BOT PayLink Protocol operates with the following network configurations:

* **Network Name**: Bohr Testnet
* **Chain ID**: `968`
* **Consensus Mechanism**: Proof-of-Authority / High-throughput EVM
* **Native Currency**: `BOT` (18 Decimals)
* **RPC Endpoint**: `https://rpc.bohr.life`
* **Block Explorer**: `https://scan.bohr.life`
* **Target Block Time**: ~3 seconds
* **Contract Address**: `0xb66140aDF4712c46485fE44ADE219aC2bF8cC700`

---

## 7. Merchant & Consumer Experience

### 7.1 Shareable Link Format
Merchant links resolve using deterministic web URLs:
```
https://paylink.bohr.life/?link=0x746f6b656e...
```
Where the URL query parameter `link` contains the `bytes32` identifier.

### 7.2 QR Code Integration
The merchant interface dynamically renders ISO/IEC 18004 compliant QR codes encoding the complete link URL, enabling frictionless mobile-to-desktop or in-person point-of-sale (POS) terminal settlements.

---

## 8. Conclusion

The **BOT PayLink Protocol** provides a bulletproof foundation for Web3 commerce on Bohr Chain. By combining on-chain cryptographic binding, instantaneous non-custodial settlement, and zero-leakage security architectures, the protocol bridges the gap between decentralized smart contracts and real-world commercial usability.

---
*© 2026 Bohr Protocol. All source code released under the MIT Open Source License.*
