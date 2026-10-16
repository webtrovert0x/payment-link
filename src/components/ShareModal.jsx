import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, QrCode as QrIcon, Sparkles } from 'lucide-react';

export default function ShareModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const canvasRef = useRef(null);

  const checkoutUrl = `${window.location.origin}${window.location.pathname}?link=${link.id}`;

  useEffect(() => {
    QRCode.toDataURL(checkoutUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0c0e14',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [checkoutUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        maxWidth: '460px',
        padding: '1.75rem',
        position: 'relative',
        background: '#12151e',
        border: '1px solid var(--border-accent)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(192, 132, 252, 0.15)',
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
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--purple-bg)',
            color: 'var(--purple-primary)',
            marginBottom: '0.75rem'
          }}>
            <QrIcon size={24} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Share Payment Link</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {link.paymentRef || 'Payment Request'} • <strong style={{ color: 'var(--purple-light)' }}>{link.amountFormatted} BOT</strong>
          </p>
        </div>

        {/* QR Code Container */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          margin: '0 auto 1.5rem',
          width: 'fit-content'
        }}>
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Payment QR Code" 
              style={{ width: '210px', height: '210px', display: 'block', borderRadius: '4px' }}
            />
          ) : (
            <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
              Generating QR...
            </div>
          )}
        </div>

        {/* Shareable Link Box */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            Shareable Checkout Link
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.6rem',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              readOnly
              value={checkoutUrl}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                width: '100%',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ flex: 1, fontSize: '0.86rem', padding: '0.65rem' }}
          >
            <ExternalLink size={15} />
            <span>Open Link</span>
          </a>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, fontSize: '0.86rem', padding: '0.65rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
