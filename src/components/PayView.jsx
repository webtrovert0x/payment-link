import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { fetchPaymentLink } from '../services/contractClient.js';
import { getContractAddress, PAYMENT_LINK_ABI, EXPLORER_URL, CHAIN_ID, NETWORK_NAME } from '../services/contractConfig.js';
import { 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  ArrowLeft,
  Sparkles,
  Download,
  Copy,
  Check,
  User,
  Coins,
  MessageSquare
} from 'lucide-react';

export default function PayView({ initialLinkId, onBackToMerchant, contractAddress }) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address });

  const [linkIdInput, setLinkIdInput] = useState(initialLinkId || '');
  const [currentLinkId, setCurrentLinkId] = useState(initialLinkId || '');
  const [linkData, setLinkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Payment states
  const [payerNote, setPayerNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Time remaining
  const [timeLeft, setTimeLeft] = useState('');

  // Fetch link details whenever currentLinkId changes
  const loadLink = async (id) => {
    if (!id || !id.startsWith('0x') || id.length !== 66) {
      setLinkData(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await fetchPaymentLink(id);
      if (!data) {
        setError('Payment link not found on-chain. Please verify the link ID.');
      }
      setLinkData(data);
    } catch (err) {
      console.error('Error fetching link:', err);
      setError(`Unable to load payment link. Please verify the contract is deployed and network is ${NETWORK_NAME}.`);
      setLinkData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentLinkId) {
      loadLink(currentLinkId);
    }
  }, [currentLinkId, contractAddress]);

  // Expiry countdown timer
  useEffect(() => {
    if (!linkData || !linkData.expiry || linkData.expiry === 0) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = linkData.expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = diff % 60;
        setTimeLeft(`${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [linkData]);

  // Handle Search / Link Load
  const handleSearch = (e) => {
    e.preventDefault();
    if (!linkIdInput.trim()) return;
    const cleanId = linkIdInput.trim();
    setCurrentLinkId(cleanId);
    // Update URL query param cleanly without reload
    const url = new URL(window.location);
    url.searchParams.set('link', cleanId);
    window.history.pushState({}, '', url);
  };

  // Trigger Payment
  const handlePay = async () => {
    if (!isConnected || !address) {
      open();
      return;
    }

    if (!contractAddress) {
      alert('Contract address is not configured.');
      return;
    }

    if (!linkData) return;

    try {
      setPaying(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PAYMENT_LINK_ABI, signer);

      const note = payerNote.trim() || 'Paid via BOT PayLink';
      
      console.log('Initiating payment for link:', linkData.id, 'Value:', linkData.amount);
      const tx = await contract.pay(linkData.id, note, {
        value: linkData.amount,
      });

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction receipt confirmed:', receipt);

      // Trigger celebratory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#c084fc', '#a855f7', '#34d399', '#ffffff'],
      });

      setPaymentSuccess({
        txHash: tx.hash,
        paidAt: new Date(),
        amount: linkData.amountFormatted,
        recipient: linkData.recipient,
        note: note,
        payer: address,
      });

      // Reload link data & balance
      await loadLink(linkData.id);
      if (refetchBalance) refetchBalance();
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.reason || err.shortMessage || err.message || 'Payment transaction failed.');
    } finally {
      setPaying(false);
    }
  };

  const hasInsufficientBalance = () => {
    if (!balanceData || !linkData) return false;
    const userBal = parseFloat(balanceData.formatted);
    const reqAmount = parseFloat(linkData.amountFormatted);
    return userBal < reqAmount;
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
      {/* Back button */}
      <button
        onClick={onBackToMerchant}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
      >
        <ArrowLeft size={14} />
        <span>Merchant Hub</span>
      </button>

      {/* Lookup Bar if no active link loaded or wanting to switch */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          background: 'var(--bg-surface)',
          padding: '0.45rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <input
            type="text"
            placeholder="Enter Payment Link ID (0x...)"
            value={linkIdInput}
            onChange={(e) => setLinkIdInput(e.target.value)}
            className="form-input font-mono"
            style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', padding: '0.65rem 0.85rem' }}
          />
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.2rem' }}>
            <span>Load Request</span>
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem', color: 'var(--purple-primary)' }} />
          <p>Verifying payment request on {NETWORK_NAME}...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="glass-card" style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderColor: 'rgba(248, 113, 113, 0.3)',
        }}>
          <AlertCircle size={40} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>Payment Request Not Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
            {error}
          </p>
        </div>
      )}

      {/* Active Link Loaded */}
      {!loading && linkData && (
        <div className="glass-card" style={{
          padding: '2.2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}>
          {/* Subtle glow header */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #c084fc, #a855f7, #34d399)',
          }} />

          {/* Verified Badge Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                On-Chain Verified Request
              </span>
            </div>

            <span className={`badge badge-${linkData.status}`}>
              {linkData.status}
            </span>
          </div>

          {/* Payment Title & Amount */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {linkData.paymentRef}
            </h1>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Created on {NETWORK_NAME} • {linkData.createdAtDate.toLocaleDateString()}
            </div>

            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem 2.5rem',
              background: 'linear-gradient(180deg, rgba(192, 132, 252, 0.08) 0%, rgba(192, 132, 252, 0.02) 100%)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--purple-light)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Amount Due
              </span>
              <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span>{linkData.amountFormatted}</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <img src="/botchain_logo.jpeg" alt="BOT" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid rgba(52, 211, 153, 0.4)', objectFit: 'cover' }} />
                  <span style={{ fontSize: '1.4rem', color: 'var(--purple-primary)' }}>BOT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Warning if active */}
          {linkData.expiry > 0 && (
            <div style={{
              background: linkData.isExpired ? 'var(--color-danger-bg)' : 'rgba(251, 191, 36, 0.08)',
              border: `1px solid ${linkData.isExpired ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.25)'}`,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: linkData.isExpired ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                <Clock size={16} />
                <span>{linkData.isExpired ? 'This payment link has expired' : 'Time remaining to pay:'}</span>
              </div>
              <strong style={{ color: linkData.isExpired ? 'var(--color-danger)' : 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
                {timeLeft || (linkData.isExpired ? 'Expired' : 'Calculating...')}
              </strong>
            </div>
          )}

          {/* Bound Details List */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.84rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cryptographically Bound Recipient:</span>
              <a
                href={`${EXPLORER_URL}/address/${linkData.recipient}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono"
                style={{ color: 'var(--purple-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                <span>{linkData.recipient.slice(0, 8)}...{linkData.recipient.slice(-6)}</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Merchant Creator:</span>
              <a
                href={`${EXPLORER_URL}/address/${linkData.merchant}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono"
                style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{linkData.merchant.slice(0, 8)}...{linkData.merchant.slice(-6)}</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Type:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {linkData.isReusable ? `Reusable (Paid ${linkData.paidCount}${linkData.maxUses > 0 ? ` / ${linkData.maxUses}` : ''})` : 'Single-Use (Strict Once)'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Network:</span>
              <span style={{ fontWeight: 600, color: 'var(--purple-light)' }}>
                {NETWORK_NAME} (Chain ID {CHAIN_ID})
              </span>
            </div>
          </div>

          {/* Payment Success View */}
          {paymentSuccess && (
            <div style={{
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <CheckCircle2 size={42} style={{ color: 'var(--color-success)', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.35rem' }}>
                Payment Successful!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1rem' }}>
                Funds have been directly delivered to the designated merchant recipient on {NETWORK_NAME}.
              </p>

              <div style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
                marginBottom: '1rem',
                wordBreak: 'break-all',
              }}>
                Tx: {paymentSuccess.txHash}
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <a
                  href={`${EXPLORER_URL}/tx/${paymentSuccess.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                >
                  <ExternalLink size={14} />
                  <span>View on BotChainScan</span>
                </a>
              </div>
            </div>
          )}

          {/* Checkout Action Section */}
          {!paymentSuccess && (
            <div>
              {/* Optional Payer Note */}
              <div className="form-group">
                <label className="form-label">
                  <span>Optional Memo / Receipt Note</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Recorded on-chain in receipt</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid by Alice (alice@example.com)"
                  value={payerNote}
                  onChange={(e) => setPayerNote(e.target.value)}
                  className="form-input"
                  disabled={linkData.status !== 'active'}
                />
              </div>

              {/* Connected Wallet & Balance check */}
              {isConnected && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.84rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)' }}>
                    <Coins size={15} style={{ color: 'var(--purple-primary)' }} />
                    <span>Your Balance:</span>
                  </div>
                  <span className="font-mono" style={{ fontWeight: 700, color: hasInsufficientBalance() ? 'var(--color-danger)' : 'var(--text-main)' }}>
                    {balanceData ? parseFloat(balanceData.formatted).toFixed(4) : '0.00'} BOT
                  </span>
                </div>
              )}

              {/* Insufficient funds warning */}
              {isConnected && hasInsufficientBalance() && (
                <div style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <AlertCircle size={16} />
                  <span>Insufficient BOT balance to pay {linkData.amountFormatted} BOT.</span>
                </div>
              )}

              {/* Status Reason Banner if not active */}
              {linkData.status !== 'active' && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: '#fb7185',
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                  fontWeight: 600,
                }}>
                  {linkData.status === 'completed' && 'This payment link has already reached its maximum payments and cannot be paid again.'}
                  {linkData.status === 'cancelled' && 'This payment link was cancelled by the merchant.'}
                  {linkData.status === 'expired' && 'This payment link has expired and is no longer accepting payments.'}
                </div>
              )}

              {/* Pay or Connect Button */}
              {!isConnected ? (
                <button
                  type="button"
                  onClick={() => open()}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.95rem', fontSize: '1.02rem' }}
                >
                  <CreditCard size={18} />
                  <span>Connect Wallet to Pay</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying || linkData.status !== 'active' || hasInsufficientBalance()}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.95rem', fontSize: '1.02rem' }}
                >
                  {paying ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Confirming On-Chain Transfer...</span>
                    </>
                  ) : linkData.status !== 'active' ? (
                    <span>Payment Unavailable ({linkData.status})</span>
                  ) : hasInsufficientBalance() ? (
                    <span>Insufficient BOT Balance</span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Pay {linkData.amountFormatted} BOT Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
