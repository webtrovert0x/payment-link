import React, { useState } from 'react';
import { getContractAddress, RPC_URL, EXPLORER_URL, CHAIN_ID, NETWORK_NAME } from '../services/contractConfig.js';
import { X, ShieldCheck, Copy, Check, ExternalLink, Cpu } from 'lucide-react';

export default function ContractSettingsModal({ onClose }) {
  const contractAddress = getContractAddress();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Verified Contract Details</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {NETWORK_NAME} (Chain ID {CHAIN_ID}) Immutable Smart Contract
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Network Info Grid */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.9rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          fontSize: '0.82rem',
        }}>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Network:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{NETWORK_NAME}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Chain ID:</span>
            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--purple-light)' }}>{CHAIN_ID}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Native Currency:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>BOT (18 decimals)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>RPC Node:</span>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{RPC_URL}</span>
          </div>
        </div>

        {/* Contract Address Card */}
        <div style={{
          background: 'rgba(192, 132, 252, 0.05)',
          border: '1px solid rgba(192, 132, 252, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--purple-primary)' }}>
              PAYMENTLINK CONTRACT (OFFICIAL)
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              background: 'rgba(52, 211, 153, 0.15)',
              color: 'var(--color-success)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
            }}>
              Verified on Explorer
            </span>
          </div>

          <div style={{
            background: 'var(--bg-darkest)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: '#ffffff', wordBreak: 'break-all' }}>
              {contractAddress}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: copied ? 'var(--color-success)' : 'var(--text-muted)',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              title="Copy Address"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* View on Explorer Link Button */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <a
            href={`${EXPLORER_URL}/address/${contractAddress}#code`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{
              flex: 1,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          >
            <span>View Verified Source & ABI on Explorer</span>
            <ExternalLink size={15} />
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          This contract is immutable and locked on BotChain Mainnet. No client overrides permitted.
        </div>
      </div>
    </div>
  );
}
