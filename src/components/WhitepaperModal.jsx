import React from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Key,
  ArrowRight
} from 'lucide-react';
import { EXPLORER_URL } from '../services/contractConfig.js';

export default function WhitepaperModal({ onClose, contractAddress }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '94%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0d0f14'
            }}>
              <FileText size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                BOT PayLink Protocol Whitepaper
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Decentralized Merchant Payment Protocol — Bohr Chain v1.0
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          fontSize: '0.88rem',
          lineHeight: '1.65',
          color: 'var(--text-secondary)'
        }}>
          {/* Status banner */}
          <div style={{
            background: 'rgba(192, 132, 252, 0.08)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--purple-primary)', fontSize: '0.92rem' }}>
                Verified On-Chain Contract
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {contractAddress || '0xb66140aDF4712c46485fE44ADE219aC2bF8cC700'}
              </div>
            </div>

            <a
              href={`${EXPLORER_URL}/address/${contractAddress || '0xb66140aDF4712c46485fE44ADE219aC2bF8cC700'}#code`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <span>View BohrScan Verification</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Section 1: Abstract */}
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            1. Abstract & Motivation
          </h3>
          <p style={{ marginBottom: '1.25rem' }}>
            Peer-to-peer cryptocurrency payments often suffer from address poisoning, manual transcription errors, clipboard hijacking, and merchant reconciliation disputes. The <strong>BOT PayLink Protocol</strong> provides a trustless, non-custodial smart contract infrastructure on Bohr Chain that cryptographically binds payment requests to their designated recipient, currency, and exact amount.
          </p>

          {/* Section 2: Cryptographic Binding */}
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            2. Deterministic Cryptographic Binding
          </h3>
          <p style={{ marginBottom: '0.75rem' }}>
            Every payment link receives an immutable 32-byte identifier generated on-chain via Keccak-256:
          </p>
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--purple-light)',
            marginBottom: '1.25rem'
          }}>
            keccak256(abi.encodePacked(block.chainid, address(this), msg.sender, recipient, token, amount, nonce, block.timestamp))
          </div>
          <p style={{ marginBottom: '1.25rem' }}>
            This mathematical binding guarantees that neither malicious proxies nor clients can redirect funds or alter invoice amounts without invalidating the smart contract execution.
          </p>

          {/* Section 3: Architecture Grid */}
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            3. Core Security Pillars
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--purple-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Lock size={16} /> Non-Custodial
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Funds are immediately forwarded to the bound recipient inside the transaction frame. The contract never locks custody.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <ShieldCheck size={16} /> Reentrancy Guard
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                State counters are incremented prior to external calls, protected with a custom reentrancy mutex lock.
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--purple-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Cpu size={16} /> Deterministic Receipts
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Permanent on-chain receipts record payer address, timestamp, payment index, and customer memo notes.
              </div>
            </div>
          </div>

          {/* Section 4: Specifications */}
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            4. Bohr Chain Specifications
          </h3>
          <div style={{
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div><strong>Network:</strong> Bohr Testnet</div>
              <div><strong>Chain ID:</strong> 968</div>
              <div><strong>Native Currency:</strong> BOT (18 Decimals)</div>
              <div><strong>RPC URL:</strong> https://rpc.bohr.life</div>
              <div><strong>Compiler:</strong> Solidity 0.8.20</div>
              <div><strong>Status:</strong> Verified on BohrScan</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            Full markdown whitepaper available in repository root (WHITEPAPER.md)
          </span>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
