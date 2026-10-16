import { ethers } from 'ethers';
import { getContractAddress, PAYMENT_LINK_ABI, RPC_URL, CHAIN_ID } from './contractConfig.js';

export function getReadProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getReadOnlyContract() {
  const address = getContractAddress();
  if (!address) return null;
  const provider = getReadProvider();
  return new ethers.Contract(address, PAYMENT_LINK_ABI, provider);
}

/**
 * Normalizes on-chain PaymentRequest struct
 */
export function formatPaymentRequest(raw) {
  if (!raw || !raw.id || raw.id === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expirySec = Number(raw.expiry);
  const isExpired = expirySec > 0 && nowSec > expirySec;
  const isCancelled = Boolean(raw.isCancelled);
  const paidCount = Number(raw.paidCount);
  const maxUses = Number(raw.maxUses);
  const isReusable = Boolean(raw.isReusable);
  
  let isFullyPaid = false;
  if (!isReusable && paidCount >= 1) {
    isFullyPaid = true;
  } else if (maxUses > 0 && paidCount >= maxUses) {
    isFullyPaid = true;
  }

  let status = 'active';
  if (isCancelled) {
    status = 'cancelled';
  } else if (isFullyPaid) {
    status = 'completed';
  } else if (isExpired) {
    status = 'expired';
  }

  return {
    id: raw.id,
    merchant: raw.merchant,
    recipient: raw.recipient,
    token: raw.token,
    isNative: raw.token === '0x0000000000000000000000000000000000000000',
    amount: raw.amount,
    amountFormatted: ethers.formatEther(raw.amount),
    expiry: expirySec,
    expiryDate: expirySec > 0 ? new Date(expirySec * 1000) : null,
    isReusable,
    maxUses,
    paidCount,
    totalPaidAmount: raw.totalPaidAmount,
    totalPaidFormatted: ethers.formatEther(raw.totalPaidAmount),
    isCancelled,
    paymentRef: raw.paymentRef || 'No reference',
    createdAt: Number(raw.createdAt),
    createdAtDate: new Date(Number(raw.createdAt) * 1000),
    status,
    isFullyPaid,
    isExpired,
  };
}

/**
 * Fetch a single payment link details
 */
export async function fetchPaymentLink(linkId) {
  const contract = getReadOnlyContract();
  if (!contract) {
    throw new Error('Contract address is not configured yet.');
  }

  const raw = await contract.getPaymentLink(linkId);
  return formatPaymentRequest(raw);
}

/**
 * Fetch receipts for a link
 */
export async function fetchReceipts(linkId) {
  const contract = getReadOnlyContract();
  if (!contract) return [];

  const rawList = await contract.getReceipts(linkId);
  return rawList.map((r) => ({
    linkId: r.linkId,
    payer: r.payer,
    amount: r.amount,
    amountFormatted: ethers.formatEther(r.amount),
    timestamp: Number(r.timestamp),
    date: new Date(Number(r.timestamp) * 1000),
    payerNote: r.payerNote,
  }));
}

/**
 * Fetch all link IDs created by a merchant
 */
export async function fetchMerchantLinks(merchantAddress) {
  const contract = getReadOnlyContract();
  if (!contract || !merchantAddress) return [];

  const linkIds = await contract.getMerchantLinks(merchantAddress);
  const requests = await Promise.all(
    linkIds.map(async (id) => {
      try {
        const raw = await contract.getPaymentLink(id);
        return formatPaymentRequest(raw);
      } catch (e) {
        console.error(`Failed to load link ${id}:`, e);
        return null;
      }
    })
  );

  return requests.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
}
