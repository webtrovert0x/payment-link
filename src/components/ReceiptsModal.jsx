import React, { useEffect, useState } from 'react';
import { fetchReceipts } from '../services/contractClient.js';
import { EXPLORER_URL } from '../services/contractConfig.js';
import { X, Receipt as ReceiptIcon, ExternalLink, Calendar, User, MessageSquare, Loader2 } from 'lucide-react';

export default function ReceiptsModal({ link, onClose }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchReceipts(link.id);
        setReceipts(data);
      } catch (err) {
        console.error('Failed to load receipts:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [link.id]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(5, 7, 10, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '1.75rem',
        position: 'relative',
        background: '#12151e',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--purple-bg)',
            color: 'var(--purple-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ReceiptIcon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>On-Chain Payment Receipts</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Ref: <strong style={{ color: 'var(--text-main)' }}>{link.paymentRef}</strong> • Total Collected: <strong style={{ color: 'var(--purple-light)' }}>{link.totalPaidFormatted} BOT</strong>
            </p>
          </div>
        </div>

        {/* Content list */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingRight: '4px',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin-slow" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 0.75rem', color: 'var(--purple-primary)' }} />
              <p>Fetching on-chain receipts...</p>
            </div>
          ) : receipts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-default)',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No payments recorded yet for this link.</p>
            </div>
          ) : (
            receipts.map((rcpt, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    Payment #{idx + 1}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--purple-light)' }}>
                    +{rcpt.amountFormatted} BOT
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Payer:</span>
                  <a
                    href={`${EXPLORER_URL}/address/${rcpt.payer}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono"
                    style={{ color: 'var(--purple-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <span>{rcpt.payer.slice(0, 6)}...{rcpt.payer.slice(-4)}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  <Calendar size={14} />
                  <span>{rcpt.date.toLocaleString()}</span>
                </div>

                {rcpt.payerNote && (
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.45rem 0.65rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: '3px solid var(--purple-primary)',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                  }}>
                    <MessageSquare size={13} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--purple-primary)' }} />
                    <span>"{rcpt.payerNote}"</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn-secondary" style={{ width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
