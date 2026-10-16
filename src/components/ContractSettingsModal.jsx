import React, { useState } from 'react';
import { getContractAddress, setCustomContractAddress, RPC_URL, EXPLORER_URL, CHAIN_ID } from '../services/contractConfig.js';
import { X, Settings, Terminal, Check, Globe, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';

export default function ContractSettingsModal({ onClose, onAddressUpdated }) {
  const [addressInput, setAddressInput] = useState(getContractAddress());
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setCustomContractAddress(addressInput.trim());
    setSaved(true);
    if (onAddressUpdated) onAddressUpdated();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setCustomContractAddress('');
    setAddressInput(getContractAddress());
    if (onAddressUpdated) onAddressUpdated();
  };

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
        maxWidth: '540px',
        padding: '1.75rem',
        position: 'relative',
        background: '#12151e',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      }}>
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
            <Settings size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Network & Contract Configuration</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Bohr Testnet (Chain ID {CHAIN_ID}) Live Node Settings
            </p>
          </div>
        </div>

        {/* Network Info Pills */}
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
            <span style={{ fontWeight: 600 }}>Bohr Testnet</span>
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

        {/* Contract Address Form */}
        <form onSubmit={handleSave} style={{ marginBottom: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">
              <span>PaymentLink Contract Address</span>
              {addressInput && (
                <a
                  href={`${EXPLORER_URL}/address/${addressInput}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--purple-primary)', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <span>Explorer</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </label>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x..."
              className="form-input font-mono"
              style={{ fontSize: '0.85rem' }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Set via <code>npm run deploy</code> or paste any deployed PaymentLink contract address here.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {saved ? (
                <>
                  <Check size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Address</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              title="Reset to default from build"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </form>

        {/* Deploy Guide Note */}
        <div style={{
          background: 'rgba(192, 132, 252, 0.04)',
          border: '1px solid rgba(192, 132, 252, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '0.9rem',
          fontSize: '0.82rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--purple-light)', fontWeight: 700, marginBottom: '0.35rem' }}>
            <Terminal size={15} />
            <span>Deploying from your Terminal</span>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '0.5rem' }}>
            To deploy your own instance of <code>PaymentLink.sol</code> with your private key:
          </p>
          <pre style={{
            background: 'var(--bg-darkest)',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.76rem',
            color: '#a78bfa',
            overflowX: 'auto',
          }}>
            1. Add PRIVATE_KEY=0x... to your .env file{"\n"}
            2. Run: npm run deploy
          </pre>
        </div>
      </div>
    </div>
  );
}
