import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getContractAddress, PAYMENT_LINK_ABI, EXPLORER_URL, NETWORK_NAME } from '../services/contractConfig.js';
import { fetchMerchantLinks } from '../services/contractClient.js';
import ShareModal from './ShareModal.jsx';
import ReceiptsModal from './ReceiptsModal.jsx';
import { 
  PlusCircle, 
  Share2, 
  Receipt, 
  Ban, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Layers, 
  AlertTriangle,
  Loader2, 
  Coins,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export default function MerchantDashboard({ onSelectLinkForPay, contractAddress, onOpenSettings }) {
  const { address, isConnected } = useAccount();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [expiryOption, setExpiryOption] = useState('0'); // 0, 3600, 86400, 604800, custom
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [isReusable, setIsReusable] = useState(false);
  const [maxUses, setMaxUses] = useState('1');

  // Async states
  const [creating, setCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successTx, setSuccessTx] = useState(null);

  // Links state
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Modals state
  const [activeShareLink, setActiveShareLink] = useState(null);
  const [activeReceiptsLink, setActiveReceiptsLink] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-fill recipient with connected wallet if empty
  useEffect(() => {
    if (isConnected && address && !recipient) {
      setRecipient(address);
    }
  }, [isConnected, address]);

  // Load merchant links
  const loadLinks = async () => {
    if (!address || !contractAddress) return;
    try {
      setLoadingLinks(true);
      const data = await fetchMerchantLinks(address);
      setLinks(data);
    } catch (err) {
      console.error('Error fetching merchant links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [address, contractAddress]);

  // Calculate Expiry timestamp
  const calculateExpiryTimestamp = () => {
    if (expiryOption === '0') return 0;
    const now = Math.floor(Date.now() / 1000);
    if (expiryOption === 'custom') {
      if (!customExpiryDate) return 0;
      return Math.floor(new Date(customExpiryDate).getTime() / 1000);
    }
    return now + parseInt(expiryOption, 10);
  };

  // Handle Form Submission
  const handleCreateLink = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessTx(null);

    if (!isConnected || !address) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    if (!contractAddress) {
      setErrorMessage('Contract address is not configured. Click the Contract button in the navbar to set it.');
      return;
    }

    if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) {
      setErrorMessage('Please enter a valid recipient address (0x...).');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    const expiryTimestamp = calculateExpiryTimestamp();
    if (expiryTimestamp > 0 && expiryTimestamp <= Math.floor(Date.now() / 1000)) {
      setErrorMessage('Expiry date must be in the future.');
      return;
    }

    try {
      setCreating(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PAYMENT_LINK_ABI, signer);

      const amountWei = ethers.parseEther(amount.toString());
      const maxUsesVal = isReusable ? (parseInt(maxUses, 10) || 0) : 1;
      const tokenAddress = ethers.ZeroAddress; // Native BOT token
      const memo = paymentRef.trim() || 'Payment Request';

      const tx = await contract.createPaymentLink(
        recipient.trim(),
        tokenAddress,
        amountWei,
        expiryTimestamp,
        isReusable,
        maxUsesVal,
        memo
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract linkId from event
      let createdLinkId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'PaymentLinkCreated') {
            createdLinkId = parsed.args.linkId;
            break;
          }
        } catch (err) {
          // Ignore unrelated logs
        }
      }

      setSuccessTx({
        hash: tx.hash,
        linkId: createdLinkId,
      });

      // Reset form
      setAmount('');
      setPaymentRef('');
      setExpiryOption('0');

      // Refresh links
      await loadLinks();

      // Automatically open share modal if linkId was extracted
      if (createdLinkId) {
        setActiveShareLink({
          id: createdLinkId,
          amountFormatted: amount,
          paymentRef: memo,
        });
      }
    } catch (err) {
      console.error('Error creating payment link:', err);
      setErrorMessage(err.reason || err.shortMessage || err.message || 'Failed to create payment link.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Cancel Link
  const handleCancelLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to cancel this payment link? Customers will no longer be able to pay it.')) {
      return;
    }

    try {
      setCancellingId(linkId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PAYMENT_LINK_ABI, signer);

      const tx = await contract.cancelPaymentLink(linkId);
      await tx.wait();
      await loadLinks();
    } catch (err) {
      console.error('Error cancelling link:', err);
      alert(err.reason || err.shortMessage || err.message || 'Failed to cancel link');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCopyLink = (linkId) => {
    const url = `${window.location.origin}${window.location.pathname}?link=${linkId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalRevenue = links.reduce((acc, curr) => acc + parseFloat(curr.totalPaidFormatted || 0), 0);
  const activeCount = links.filter((l) => l.status === 'active').length;
  const completedCount = links.filter((l) => l.status === 'completed').length;

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
              Merchant Command Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
              Create cryptographically bound BOT payment links with recipient locks, custom expiry, and instant receipts.
            </p>
          </div>

          <button
            onClick={loadLinks}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
            disabled={loadingLinks || !isConnected}
          >
            <RefreshCw size={15} className={loadingLinks ? 'spin' : ''} style={{ animation: loadingLinks ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh Links</span>
          </button>
        </div>

        {/* Analytics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1.75rem',
        }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Total Revenue</span>
              <Coins size={18} style={{ color: 'var(--purple-primary)' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--purple-light)' }}>
              {totalRevenue.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>BOT</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Active Links</span>
              <span className="pulse-indicator"></span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {activeCount}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Fulfilled Payments</span>
              <CheckCircle2 size={18} style={{ color: 'var(--purple-primary)' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {completedCount}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span>Total Created</span>
              <Layers size={18} style={{ color: 'var(--text-dim)' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {links.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Creator Form on Left, Created Links on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 420px) 1fr',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Creator Form Card */}
        <div className="glass-card" style={{ padding: '1.75rem', position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--purple-bg)',
              color: 'var(--purple-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <PlusCircle size={18} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Payment Link</h2>
          </div>

          {!contractAddress && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: 'var(--color-warning)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                <AlertTriangle size={15} />
                <span>Contract Not Deployed Yet</span>
              </div>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Connecting to the official PaymentLink protocol on BotChain Mainnet...
              </p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              >
                View Contract Details
              </button>
            </div>
          )}

          <form onSubmit={handleCreateLink}>
            {/* Amount Input */}
            <div className="form-group">
              <label className="form-label">
                <span>Requested Amount (BOT) *</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--purple-primary)' }}>Native BOT Token</span>
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="form-input font-mono"
                style={{ fontSize: '1.1rem', fontWeight: 600 }}
              />

              {/* Quick amount pills */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                {['1', '5', '10', '25', '100'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    style={{
                      background: amount === val ? 'var(--purple-bg)' : 'var(--bg-card)',
                      border: `1px solid ${amount === val ? 'var(--purple-primary)' : 'var(--border-subtle)'}`,
                      color: amount === val ? 'var(--purple-light)' : 'var(--text-muted)',
                      borderRadius: '6px',
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: 600,
                    }}
                  >
                    {val} BOT
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="form-group">
              <label className="form-label">
                <span>Bound Recipient Address *</span>
                {isConnected && address && recipient !== address && (
                  <button
                    type="button"
                    onClick={() => setRecipient(address)}
                    style={{ background: 'none', border: 'none', color: 'var(--purple-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Use My Wallet
                  </button>
                )}
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="form-input font-mono"
                style={{ fontSize: '0.82rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Funds will be locked exclusively to this address by the contract.
              </span>
            </div>

            {/* Payment Reference / Invoice memo */}
            <div className="form-group">
              <label className="form-label">
                <span>Payment Reference / Invoice Memo</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Invoice #2026-094, Web Dev Retainer"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Expiry Selector */}
            <div className="form-group">
              <label className="form-label">
                <span>Expiration Policy</span>
              </label>
              <select
                value={expiryOption}
                onChange={(e) => setExpiryOption(e.target.value)}
                className="form-select"
              >
                <option value="0">No Expiration (Indefinite)</option>
                <option value="3600">1 Hour</option>
                <option value="86400">24 Hours (1 Day)</option>
                <option value="259200">3 Days</option>
                <option value="604800">7 Days (1 Week)</option>
                <option value="custom">Custom Date & Time</option>
              </select>

              {expiryOption === 'custom' && (
                <input
                  type="datetime-local"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="form-input"
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                  required
                />
              )}
            </div>

            {/* Reusable Toggle */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isReusable ? '0.75rem' : '0' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Reusable Payment Link</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Allow multiple customers to pay this same link
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isReusable}
                  onChange={(e) => setIsReusable(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--purple-primary)',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {isReusable && (
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Maximum Payments Allowed (0 for Unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="form-input font-mono"
                    style={{ fontSize: '0.88rem', padding: '0.5rem 0.75rem' }}
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: 'var(--color-danger)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginBottom: '1rem',
              }}>
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creating || !isConnected}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {creating ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Creating On-Chain Link...</span>
                </>
              ) : !isConnected ? (
                <span>Connect Wallet to Create</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Payment Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Created Links Listing */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Your Created Links ({links.length})</h2>
          </div>

          {!isConnected ? (
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <Layers size={40} style={{ color: 'var(--purple-primary)', margin: '0 auto 1rem', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Connect Your Wallet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
                Connect your Web3 wallet to manage your payment links, track customer fulfillment, and collect payments.
              </p>
            </div>
          ) : loadingLinks ? (
            <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={36} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem', color: 'var(--purple-primary)' }} />
              <p>Fetching on-chain payment requests from {NETWORK_NAME}...</p>
            </div>
          ) : links.length === 0 ? (
            <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <PlusCircle size={36} style={{ color: 'var(--text-dim)', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>No Payment Links Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '360px', margin: '0 auto' }}>
                Use the generator form on the left to create your first decentralized payment link!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {links.map((link) => {
                const isCancelled = link.status === 'cancelled';
                const isCompleted = link.status === 'completed';
                const isExpired = link.status === 'expired';

                return (
                  <div key={link.id} className="glass-card-interactive" style={{ padding: '1.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.9rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                            {link.paymentRef}
                          </span>
                          <span className={`badge badge-${link.status}`}>
                            {link.status}
                          </span>
                          {link.isReusable && (
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '4px',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                            }}>
                              Reusable {link.maxUses > 0 ? `(Max ${link.maxUses})` : '(Unlimited)'}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                          <span>Created {link.createdAtDate.toLocaleDateString()}</span>
                          {link.expiryDate && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={12} />
                              <span>Expires: {link.expiryDate.toLocaleString()}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--purple-light)' }}>
                          {link.amountFormatted} <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>BOT</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Collected: <strong style={{ color: 'var(--color-success)' }}>{link.totalPaidFormatted} BOT</strong> ({link.paidCount} paid)
                        </div>
                      </div>
                    </div>

                    {/* Recipient info */}
                    <div style={{
                      background: 'var(--bg-input)',
                      padding: '0.65rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Locked Recipient:</span>
                        <a
                          href={`${EXPLORER_URL}/address/${link.recipient}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono"
                          style={{ color: 'var(--purple-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <span>{link.recipient.slice(0, 10)}...{link.recipient.slice(-6)}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Link ID:</span>
                        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {link.id.slice(0, 8)}...{link.id.slice(-6)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setActiveShareLink(link)}
                          className="btn-primary"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          <Share2 size={14} />
                          <span>Share / QR</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(link.id)}
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          {copiedId === link.id ? (
                            <>
                              <Check size={14} style={{ color: 'var(--color-success)' }} />
                              <span style={{ color: 'var(--color-success)' }}>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveReceiptsLink(link)}
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                          <Receipt size={14} />
                          <span>Receipts ({link.paidCount})</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => onSelectLinkForPay(link.id)}
                          className="btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                          title="Preview the checkout page as a customer"
                        >
                          <ArrowUpRight size={14} />
                          <span>Customer View</span>
                        </button>

                        {link.status === 'active' && (
                          <button
                            onClick={() => handleCancelLink(link.id)}
                            disabled={cancellingId === link.id}
                            className="btn-danger"
                          >
                            {cancellingId === link.id ? (
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Ban size={13} />
                            )}
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {activeShareLink && (
        <ShareModal
          link={activeShareLink}
          onClose={() => setActiveShareLink(null)}
        />
      )}

      {/* Receipts Modal */}
      {activeReceiptsLink && (
        <ReceiptsModal
          link={activeReceiptsLink}
          onClose={() => setActiveReceiptsLink(null)}
        />
      )}
    </div>
  );
}
