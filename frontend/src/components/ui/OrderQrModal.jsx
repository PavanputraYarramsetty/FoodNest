import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, X, CheckCircle2, Clock, ChefHat } from 'lucide-react';
import AnimatedModal from './AnimatedModal';
import MotionButton from './MotionButton';
import toast from 'react-hot-toast';

const OrderQrModal = ({ open, onClose, order }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && order) {
      generateQr();
    }
  }, [open, order]);

  const generateQr = async () => {
    setLoading(true);
    try {
      // Encode order ID in QR code
      const qrText = order.id || `ORDER_${order.order_number}`;
      const url = await QRCode.toDataURL(qrText, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0e0b12',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `AparnaCanteen_Order_QR_${order.order_number || 'code'}.png`;
    link.click();
    toast.success('QR Code saved!');
  };

  if (!order) return null;

  const orderNumStr = order.order_number ? `#${order.order_number}` : `#${order.id?.substring(0, 6)}`;

  return (
    <AnimatedModal open={open} onClose={onClose} maxWidth="420px" title={`Order QR - ${orderNumStr}`}>
      <div style={{ padding: '1.25rem', textAlign: 'center' }}>
        
        {/* Header Title & Order ID */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <QrCode size={20} /> Order {orderNumStr}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', textAlign: 'left', marginTop: '0.15rem' }}>
              ID: {order.id}
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose} 
            style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Display Card */}
        <div 
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'inline-block',
            marginBottom: '1rem',
            border: '4px solid var(--primary-500)'
          }}
        >
          {loading ? (
            <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              <div className="spinner" style={{ borderColor: 'var(--primary-500)' }} />
            </div>
          ) : (
            <img 
              src={qrDataUrl} 
              alt={`QR Code for Order ${orderNumStr}`} 
              style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }} 
            />
          )}
        </div>

        {/* Order Details Badge & Total */}
        <div 
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status</div>
            <span className={`badge badge-${(order.status || 'Pending').toLowerCase()}`} style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
              {order.status}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Amount</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>
              ₹{order.total_amount}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', lineHeight: '1.4' }}>
          📱 Present this QR code to the canteen staff at the counter for quick collection and order verification.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <MotionButton
            className="btn btn-ghost"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Close
          </MotionButton>
          <MotionButton
            className="btn btn-primary"
            onClick={handleDownloadQr}
            style={{ flex: 1.2, gap: '0.4rem' }}
          >
            <Download size={16} /> Save QR Image
          </MotionButton>
        </div>

      </div>
    </AnimatedModal>
  );
};

export default OrderQrModal;
