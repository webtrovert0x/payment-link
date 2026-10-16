import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { getContractAddress, EXPLORER_URL } from '../services/contractConfig.js';
import { 
  Link2, 
  Wallet, 
  Settings, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  CreditCard,
  FileText
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, onOpenWhitepaper }) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const contractAddress = getContractAddress();

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(12, 14, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
      }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div 
            onClick={() => setActiveTab('merchant')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(192, 132, 252, 0.35)',
              color: '#0d0f14'
            }}>
              <Link2 size={24} strokeWidth={2.6} />
            </div>
            <div>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <span>BOT PayLink</span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.5rem',
                  background: 'rgba(192, 132, 252, 0.15)',
                  color: 'var(--purple-primary)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: '999px',
                  fontWeight: 700
                }}>Bohr 968</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Decentralized Merchant Payment Protocol
              </div>
            </div>
          </div>

          {/* Navigation Pill */}
          <nav style={{
            display: 'flex',
            background: 'var(--bg-input)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`nav-tab ${activeTab === 'merchant' ? 'active' : ''}`}
            >
              <PlusCircle size={16} />
              <span>Merchant Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('checkout')}
              className={`nav-tab ${activeTab === 'checkout' ? 'active' : ''}`}
            >
              <CreditCard size={16} />
              <span>Pay Link</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Network & Wallet Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Whitepaper Button */}
          <button
            onClick={onOpenWhitepaper}
            style={{
              background: 'rgba(192, 132, 252, 0.08)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              color: 'var(--purple-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Read the BOT PayLink Technical Whitepaper"
          >
            <FileText size={15} />
            <span>Whitepaper</span>
          </button>

          {/* Contract status indicator */}
          <button
            onClick={onOpenSettings}
            style={{
              background: contractAddress ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 191, 36, 0.1)',
              border: `1px solid ${contractAddress ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 191, 36, 0.3)'}`,
              color: contractAddress ? 'var(--color-success)' : 'var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Configure or view PaymentLink contract address"
          >
            {contractAddress ? (
              <>
                <CheckCircle2 size={15} />
                <span>Contract Connected</span>
              </>
            ) : (
              <>
                <AlertCircle size={15} />
                <span>Contract Not Configured</span>
              </>
            )}
            <Settings size={14} style={{ opacity: 0.8 }} />
          </button>

          {/* AppKit Connect Wallet Button */}
          <appkit-button balance="show" />
        </div>
      </div>
    </header>
  );
}
