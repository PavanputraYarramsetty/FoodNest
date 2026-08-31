import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { QrCode, CheckCircle2, RefreshCw, Smartphone, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import MotionButton from '../../components/ui/MotionButton';

const WhatsAppQR = () => {
  const [statusInfo, setStatusInfo] = useState({ status: 'connecting', qrDataUrl: null, isConnected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWhatsAppStatus();
    const interval = setInterval(fetchWhatsAppStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await axios.get('/admin/whatsapp/status');
      if (res.data.success) {
        setStatusInfo({
          status: res.data.status,
          qrDataUrl: res.data.qrDataUrl,
          isConnected: res.data.isConnected
        });
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      <PageHeader
        title="WhatsApp Auto-Notifier Setup"
        subtitle="1-Time QR Scan to connect your canteen WhatsApp for 100% automated background messaging"
      />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <motion.div
          className="leaderboard-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}
        >
          {statusInfo.isConnected ? (
            <div>
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', marginBottom: '1rem' }}>
                <CheckCircle2 size={48} />
              </div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                WhatsApp Connected & Active! ✅
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Your canteen WhatsApp is linked and running. All customer status updates (<strong>Preparing</strong> & <strong>Completed</strong>) are being automatically sent in the background.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.85rem', color: '#22c55e' }}>
                <ShieldCheck size={16} /> 24/7 Background Dispatch Active
              </div>
            </div>
          ) : statusInfo.qrDataUrl ? (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-400)', fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.1rem' }}>
                <Smartphone size={20} /> Scan QR Code with Canteen WhatsApp
              </div>
              
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', marginBottom: '1.5rem' }}>
                <img
                  src={statusInfo.qrDataUrl}
                  alt="WhatsApp Login QR Code"
                  style={{ width: '240px', height: '240px', display: 'block' }}
                />
              </div>

              <div style={{ textAlign: 'left', background: 'rgba(0, 0, 0, 0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  📱 How to Scan:
                </div>
                <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  <li>Open <strong>WhatsApp</strong> on your Canteen phone.</li>
                  <li>Tap <strong>3 dots ⋮</strong> (top-right) → <strong>Linked Devices</strong>.</li>
                  <li>Tap <strong>Link a Device</strong> and point camera at this QR code.</li>
                </ol>
              </div>

              <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <RefreshCw size={14} className="spin-icon" /> Auto-refreshing QR status...
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', marginBottom: '1rem' }}>
                <RefreshCw size={36} className="spin-icon" />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Initializing WhatsApp Connection...
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Preparing socket connection. If the QR code doesn't appear in 5 seconds, click Refresh.
              </p>
              <MotionButton
                className="btn btn-secondary btn-sm"
                onClick={fetchWhatsAppStatus}
                style={{ marginTop: '1rem', gap: '0.4rem' }}
              >
                <RefreshCw size={14} /> Refresh Status
              </MotionButton>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WhatsAppQR;
