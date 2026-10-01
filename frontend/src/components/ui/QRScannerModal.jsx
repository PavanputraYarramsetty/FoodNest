import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, X, Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, ShieldAlert, Check, FlipHorizontal } from 'lucide-react';
import AnimatedModal from './AnimatedModal';
import MotionButton from './MotionButton';
import toast from 'react-hot-toast';

const QRScannerModal = ({ open, onClose, onScanSuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [cameraError, setCameraError] = useState('');
  const [cameraMode, setCameraMode] = useState('environment'); // 'environment' (Back camera) | 'user' (Front camera)
  const [cameras, setCameras] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && activeTab === 'camera') {
      initAndStartCamera(cameraMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, activeTab]);

  const requestCameraPermissionDirectly = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported by your browser or environment. Please use the Upload QR Image tab.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: cameraMode } 
      });
      // Stop temporary stream track so html5-qrcode can take over
      stream.getTracks().forEach(track => track.stop());
      toast.success('Camera permission granted!');
      initAndStartCamera(cameraMode);
    } catch (err) {
      console.error('Direct camera request error:', err);
      const errStr = String(err);
      let msg = 'Camera access was not granted or no camera device was found.';
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
        msg = 'Camera permission was blocked. Click the 🔒 (Lock) icon in your browser address bar and select "Allow" for Camera.';
      } else if (errStr.includes('NotFoundError') || errStr.includes('Requested device not found')) {
        msg = 'No camera device was detected on your device. You can use the "Upload QR Image" tab below to scan QR codes instantly.';
      }
      setCameraError(msg);
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

  const initAndStartCamera = async (facing = 'environment') => {
    setCameraError('');
    setIsScanning(true);

    try {
      await stopCamera();

      const scannerId = 'admin-qr-reader-box';
      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 15, 
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0
      };

      // Discover available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
        }
      } catch (e) {
        console.warn('Could not list cameras:', e);
      }

      // Try chosen facing mode (default: 'environment' for Back Camera)
      try {
        await html5QrCode.start(
          { facingMode: facing },
          config,
          (decodedText) => handleSuccess(decodedText),
          () => {}
        );
      } catch (modeErr) {
        console.warn(`Could not start with facingMode: ${facing}, falling back to alternative`, modeErr);
        
        // If back camera failed (e.g. laptop webcam only has user/front), try the other facing mode
        const fallbackMode = facing === 'environment' ? 'user' : 'environment';
        try {
          await html5QrCode.start(
            { facingMode: fallbackMode },
            config,
            (decodedText) => handleSuccess(decodedText),
            () => {}
          );
        } catch (fallbackErr) {
          // Last resort: if devices exist, use device[0]
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (devices && devices.length > 0) {
            await html5QrCode.start(
              devices[0].id,
              config,
              (decodedText) => handleSuccess(decodedText),
              () => {}
            );
          } else {
            throw fallbackErr;
          }
        }
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      let errMsg = 'Camera permission denied or no camera device found on this system.';
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
        errMsg = 'Camera permission was blocked by your browser. Please click the 🔒 (Lock) icon in your browser address bar to allow Camera access.';
      } else if (errStr.includes('NotFoundError') || errStr.includes('Requested device not found')) {
        errMsg = 'No webcam or camera device was detected on your device.';
      }
      setCameraError(errMsg);
      setIsScanning(false);
    }
  };

  const handleFacingModeChange = (mode) => {
    setCameraMode(mode);
    initAndStartCamera(mode);
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
      toast.error('No valid QR code found in this image. Please select a clearer QR image.');
    }
  };

  const handleModalClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <AnimatedModal open={open} onClose={handleModalClose} maxWidth="480px" title="Scan Order QR Code">
      <div style={{ padding: '1.25rem', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Scan size={22} /> Order QR Code Scanner
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
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px', marginBottom: '0.85rem', border: '1px solid rgba(255,255,255,0.1)' }}>
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
            <Upload size={14} /> Upload QR Image / Bill
          </button>
        </div>

        {/* Two-Option Camera Selector: Back Camera (Default) vs Front Camera */}
        {activeTab === 'camera' && !cameraError && (
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ 
              display: 'flex', 
              gap: '0.4rem', 
              background: 'rgba(0,0,0,0.25)', 
              padding: '0.25rem', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.08)' 
            }}>
              <button
                type="button"
                onClick={() => handleFacingModeChange('environment')}
                className={`btn btn-sm ${cameraMode === 'environment' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  flex: 1, 
                  fontSize: '0.8rem', 
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                  fontWeight: cameraMode === 'environment' ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Camera size={13} /> Back Camera (Default)
              </button>
              <button
                type="button"
                onClick={() => handleFacingModeChange('user')}
                className={`btn btn-sm ${cameraMode === 'user' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  flex: 1, 
                  fontSize: '0.8rem', 
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                  fontWeight: cameraMode === 'user' ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <FlipHorizontal size={13} /> Front Camera
              </button>
            </div>
          </div>
        )}

        {/* Camera View Area */}
        {activeTab === 'camera' ? (
          <div>
            {cameraError ? (
              <div 
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <AlertCircle size={20} /> Camera Access Blocked or Not Found
                </div>
                
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: '1.4' }}>
                  {cameraError}
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '0.85rem', borderLeft: '3px solid var(--primary-500)' }}>
                  <strong>💡 How to Enable Camera in Browser:</strong>
                  <ol style={{ margin: '0.35rem 0 0 1.25rem', padding: 0, lineHeight: '1.5' }}>
                    <li>Click the 🔒 (Lock) or Site Settings icon on your browser address bar (top left).</li>
                    <li>Toggle <strong>Camera</strong> permission to <strong>Allow</strong>.</li>
                    <li>Click <strong>Allow Camera Access</strong> below!</li>
                  </ol>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => requestCameraPermissionDirectly()}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, gap: '0.3rem' }}
                  >
                    <Camera size={13} /> Allow Camera Access
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('file')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, gap: '0.3rem' }}
                  >
                    <Upload size={13} /> Upload QR Image Instead
                  </button>
                </div>
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
              Hold the order QR code or printed bill token up to the camera to scan automatically.
            </p>
          </div>
        ) : (
          /* File Upload Area */
          <div 
            style={{
              padding: '2.25rem 1.5rem',
              border: '2px dashed rgba(249, 115, 22, 0.4)',
              borderRadius: '12px',
              background: 'rgba(249, 115, 22, 0.04)',
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'all 0.2s ease'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div id="admin-qr-file-box" style={{ display: 'none' }} />
            <Upload size={36} style={{ color: 'var(--primary-400)', marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Click to upload QR Image or Invoice Bill PDF Screenshot
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Supports PNG, JPG, WEBP formats. Instant scanning.
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
