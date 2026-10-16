import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import MerchantDashboard from './components/MerchantDashboard.jsx';
import PayView from './components/PayView.jsx';
import ContractSettingsModal from './components/ContractSettingsModal.jsx';
import WhitepaperModal from './components/WhitepaperModal.jsx';
import { getContractAddress, CHAIN_ID, EXPLORER_URL } from './services/contractConfig.js';
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-darkest)',
        padding: '2rem 0',
        marginTop: 'auto',
      }}>
        <div className="container" style={{
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
            <span>Connected to Bohr Testnet (Chain ID {CHAIN_ID})</span>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowWhitepaper(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={13} />
              <span>Whitepaper</span>
            </button>

            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <span>BohrScan Explorer</span>
              <ExternalLink size={12} />
            </a>

            <button
              onClick={() => setShowSettings(true)}
              style={{ background: 'none', border: 'none', color: 'var(--purple-primary)', cursor: 'pointer', fontSize: 'inherit' }}
            >
              Settings & Deploy
            </button>
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
