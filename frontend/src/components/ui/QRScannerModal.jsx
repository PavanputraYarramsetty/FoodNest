import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, X, Camera, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import AnimatedModal from './AnimatedModal';
import MotionButton from './MotionButton';
import toast from 'react-hot-toast';

const QRScannerModal = ({ open, onClose, onScanSuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, activeTab]);

  const startCamera = async () => {
    setCameraError('');
    setIsScanning(true);

    try {
      // Ensure any existing instance is stopped first
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // ignore
        }
      }

      const scannerId = 'admin-qr-reader-box';
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 230, height: 230 } };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleSuccess(decodedText);
        },
        () => {
          // Ignore frame decode errors
        }
      );
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or camera not found. You can upload a QR image instead.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop warning:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // ignore audio errors
    }
  };

  const handleSuccess = async (text) => {
    playBeep();
    await stopCamera();
    onScanSuccess(text.trim());
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('admin-qr-file-box');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccess(decodedText);
    } catch (err) {
      console.error('Failed to scan file QR:', err);
      toast.error('No valid QR code found in this image. Please try another image.');
    }
  };

  const handleModalClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <AnimatedModal open={open} onClose={handleModalClose} maxWidth="460px" title="Scan Order QR Code">
      <div style={{ padding: '1.25rem', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Scan size={22} /> Admin QR Order Scanner
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={handleModalClose} 
            style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: '6px', fontSize: '0.82rem', gap: '0.4rem' }}
          >
            <Camera size={14} /> Live Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`btn btn-sm ${activeTab === 'file' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: '6px', fontSize: '0.82rem', gap: '0.4rem' }}
          >
            <Upload size={14} /> Upload QR Image
          </button>
        </div>

        {/* Camera View Area */}
        {activeTab === 'camera' ? (
          <div>
            {cameraError ? (
              <div 
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}
              >
                <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
                <div>{cameraError}</div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.75rem', gap: '0.3rem' }}
                >
                  <RefreshCw size={12} /> Retry Camera
                </button>
              </div>
            ) : (
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#000',
                  border: '2px solid var(--primary-500)',
                  minHeight: '260px'
                }}
              >
                <div id="admin-qr-reader-box" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Center the order QR code inside the camera box to scan automatically.
            </p>
          </div>
        ) : (
          /* File Upload Area */
          <div 
            style={{
              padding: '2rem 1.5rem',
              border: '2px dashed rgba(249, 115, 22, 0.4)',
              borderRadius: '12px',
              background: 'rgba(249, 115, 22, 0.04)',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div id="admin-qr-file-box" style={{ display: 'none' }} />
            <Upload size={32} style={{ color: 'var(--primary-400)', marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              Click to select or upload QR Image
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Supports PNG, JPG, WEBP invoice or QR screenshot
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        )}

      </div>
    </AnimatedModal>
  );
};

export default QRScannerModal;
