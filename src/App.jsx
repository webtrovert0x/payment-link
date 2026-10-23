import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import MerchantDashboard from './components/MerchantDashboard.jsx';
import PayView from './components/PayView.jsx';
import ContractSettingsModal from './components/ContractSettingsModal.jsx';
import WhitepaperModal from './components/WhitepaperModal.jsx';
import { getContractAddress, CHAIN_ID, EXPLORER_URL, NETWORK_NAME } from './services/contractConfig.js';
import { ShieldCheck, ExternalLink, Sparkles, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('merchant'); // 'merchant' | 'checkout'
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [contractAddress, setContractAddress] = useState(getContractAddress());
  const [showSettings, setShowSettings] = useState(false);
  const [showWhitepaper, setShowWhitepaper] = useState(false);

  // Check URL query parameters for ?link=0x...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkParam = params.get('link');
    if (linkParam && linkParam.startsWith('0x')) {
      setSelectedLinkId(linkParam);
      setActiveTab('checkout');
    }
  }, []);

  const handleSelectLinkForPay = (linkId) => {
    setSelectedLinkId(linkId);
    setActiveTab('checkout');
    const url = new URL(window.location);
    url.searchParams.set('link', linkId);
    window.history.pushState({}, '', url);
  };

  const handleBackToMerchant = () => {
    setActiveTab('merchant');
    const url = new URL(window.location);
    url.searchParams.delete('link');
    window.history.pushState({}, '', url);
  };

  const handleAddressUpdated = () => {
    setContractAddress(getContractAddress());
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenWhitepaper={() => setShowWhitepaper(true)}
      />

      <main style={{ flex: 1 }}>
        <div className="container">
          {activeTab === 'merchant' ? (
            <MerchantDashboard
              onSelectLinkForPay={handleSelectLinkForPay}
              contractAddress={contractAddress}
              onOpenSettings={() => setShowSettings(true)}
            />
          ) : (
            <PayView
              initialLinkId={selectedLinkId}
              onBackToMerchant={handleBackToMerchant}
              contractAddress={contractAddress}
            />
          )}
        </div>
      </main>

      {/* Ecosystem Section & Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, rgba(12, 14, 20, 0.95) 0%, rgba(8, 10, 15, 1) 100%)',
        padding: '2.5rem 0 2rem',
        marginTop: 'auto',
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Top row: BOT Chain Ecosystem Showcase */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            {/* BOT Chain Name & Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img
                src="/botchain_logo.jpeg"
                alt="BOT Chain Logo"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  boxShadow: '0 0 16px rgba(52, 211, 153, 0.35)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  objectFit: 'cover',
                }}
              />
              <div>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>BOT Chain</span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(192, 132, 252, 0.12)',
                    color: 'var(--purple-primary)',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}>
                    Mainnet 677
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                  Ecosystem Layer-1 for Decentralized Commerce & Micropayments
                </div>
              </div>
            </div>

            {/* Official BOT Chain Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: 'rgba(192, 132, 252, 0.08)',
                  border: '1px solid rgba(192, 132, 252, 0.25)',
                  color: 'var(--purple-primary)',
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src="/botchain_logo.jpeg"
                  alt="BOT Chain Logo"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid rgba(192, 132, 252, 0.3)',
                  }}
                />
                <span>BOT Chain Website</span>
                <ExternalLink size={13} style={{ opacity: 0.8 }} />
              </a>

              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  color: 'var(--color-success)',
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src="/botchain_logo.jpeg"
                  alt="BOT Chain Logo"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                  }}
                />
                <span>BOT Chain Explorer</span>
                <ExternalLink size={13} style={{ opacity: 0.8 }} />
              </a>
            </div>
          </div>

          {/* Bottom row: App Controls & Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                boxShadow: '0 0 8px var(--color-success)',
              }} />
              <span>Connected to {NETWORK_NAME} (Chain ID {CHAIN_ID})</span>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowWhitepaper(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FileText size={13} />
                <span>Whitepaper</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--purple-primary)',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                }}
              >
                Contract Details
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <ContractSettingsModal
          onClose={() => setShowSettings(false)}
          onAddressUpdated={handleAddressUpdated}
        />
      )}

      {/* Whitepaper Modal */}
      {showWhitepaper && (
        <WhitepaperModal
          onClose={() => setShowWhitepaper(false)}
          contractAddress={contractAddress}
        />
      )}
    </div>
  );
}
