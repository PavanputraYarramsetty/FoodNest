import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { Save, Loader2, Mail, Check, Bell, BellOff, ChefHat, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import MotionButton from '../../components/ui/MotionButton';
import LoadingState from '../../components/ui/LoadingState';
import { fadeUp } from '../../lib/motion';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Email notification toggles
  const [emailToggles, setEmailToggles] = useState({
    email_notify_preparing: true,
    email_notify_completed: true
  });
  const [togglingKey, setTogglingKey] = useState(null);

  const [templates, setTemplates] = useState({
    preparing_email_template: `*Order Update – AparnaCanteen*

Hello [Name]!

Your *Order #[OrderNumber]* is now being *prepared in the kitchen*.

*Total Amount:* ₹[TotalAmount]

Your order will be ready shortly. Thank you for your patience!

— *AparnaCanteen*`,
    completed_email_template: `*Order Completed – AparnaCanteen*

Hello [Name]!

Your *Order #[OrderNumber]* has been *successfully completed*.

Thank you for ordering from *AparnaCanteen*!
We hope you enjoyed your meal and look forward to serving you again!

— *AparnaCanteen*`
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, notifyRes] = await Promise.all([
        axios.get('/admin/settings'),
        axios.get('/admin/settings/email-notify')
      ]);
      
      if (settingsRes.data.success && settingsRes.data.data) {
        setTemplates(prev => ({
          ...prev,
          ...settingsRes.data.data
        }));
      }
      
      if (notifyRes.data.success && notifyRes.data.data) {
        setEmailToggles(notifyRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplates(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/admin/settings', templates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle email notification for a specific type
  const handleToggle = async (type) => {
    // type: 'preparing', 'completed', or 'both'
    setTogglingKey(type);
    try {
      let payload = {};
      
      if (type === 'both') {
        // If either is ON, turn both OFF. If both are OFF, turn both ON.
        const newState = !(emailToggles.email_notify_preparing && emailToggles.email_notify_completed);
        payload = {
          email_notify_preparing: newState,
          email_notify_completed: newState
        };
      } else if (type === 'preparing') {
        payload = { email_notify_preparing: !emailToggles.email_notify_preparing };
      } else if (type === 'completed') {
        payload = { email_notify_completed: !emailToggles.email_notify_completed };
      }

      const res = await axios.put('/admin/settings/email-notify', payload);
      if (res.data.success) {
        setEmailToggles(res.data.data);
        const anyOn = res.data.data.email_notify_preparing || res.data.data.email_notify_completed;
        toast.success(
          type === 'both'
            ? (anyOn ? 'Both email notifications enabled' : 'All email notifications disabled')
            : `${type.charAt(0).toUpperCase() + type.slice(1)} email ${res.data.data[`email_notify_${type}`] ? 'enabled' : 'disabled'}`
        );
      }
    } catch (err) {
      console.error('Failed to toggle email notification:', err);
      toast.error('Failed to update notification setting');
    } finally {
      setTogglingKey(null);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const bothOn = emailToggles.email_notify_preparing && emailToggles.email_notify_completed;
  const bothOff = !emailToggles.email_notify_preparing && !emailToggles.email_notify_completed;

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader 
        title="Settings" 
        subtitle="Manage automated email templates and system preferences" 
        showBack={true}
        backTo="/admin/home"
      />

      {/* ========== EMAIL NOTIFICATION TOGGLES SECTION ========== */}
      <motion.div
        className="card"
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        style={{ marginBottom: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <Bell size={24} color="var(--primary-400)" />
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Email Notification Controls</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Control when customers receive email notifications about their order status
            </p>
          </div>
        </div>

        {/* Status indicator banner */}
        <div style={{
          background: bothOff
            ? 'rgba(239, 68, 68, 0.08)'
            : bothOn
              ? 'rgba(34, 197, 94, 0.08)'
              : 'rgba(234, 179, 8, 0.08)',
          border: `1px solid ${bothOff
            ? 'rgba(239, 68, 68, 0.2)'
            : bothOn
              ? 'rgba(34, 197, 94, 0.2)'
              : 'rgba(234, 179, 8, 0.2)'}`,
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem'
        }}>
          {bothOff ? (
            <>
              <BellOff size={16} color="var(--danger)" />
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>All email notifications are OFF — customers will NOT receive any status emails</span>
            </>
          ) : bothOn ? (
            <>
              <Bell size={16} color="var(--success)" />
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>All email notifications are ON — customers receive emails for both statuses</span>
            </>
          ) : (
            <>
              <Bell size={16} color="var(--warning)" />
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                Partial — only {emailToggles.email_notify_preparing ? '"Preparing"' : '"Completed"'} emails are active
              </span>
            </>
          )}
        </div>

        {/* Toggle Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* BOTH toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.15rem',
              borderRadius: '12px',
              border: `1.5px solid ${bothOn ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-color)'}`,
              background: bothOn ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: bothOn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease'
              }}>
                <Mail size={20} style={{ color: bothOn ? 'var(--success)' : 'var(--danger)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Both (Preparing & Completed)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Master toggle — send emails for both status changes
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('both')}
              disabled={togglingKey === 'both'}
              aria-label="Toggle both email notifications"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
                opacity: togglingKey === 'both' ? 0.5 : 1, transition: 'opacity 0.2s'
              }}
            >
              {bothOn ? (
                <ToggleRight size={38} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
              ) : (
                <ToggleLeft size={38} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          </div>

          {/* PREPARING toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.15rem',
              borderRadius: '12px',
              border: `1.5px solid ${emailToggles.email_notify_preparing ? 'rgba(249, 115, 22, 0.25)' : 'var(--border-color)'}`,
              background: emailToggles.email_notify_preparing ? 'rgba(249, 115, 22, 0.04)' : 'var(--bg-card)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: emailToggles.email_notify_preparing ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease'
              }}>
                <ChefHat size={20} style={{ color: emailToggles.email_notify_preparing ? 'var(--primary-400)' : 'var(--text-muted)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Preparing Status Email
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Send email when order status changes to "Preparing"
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('preparing')}
              disabled={togglingKey === 'preparing'}
              aria-label="Toggle preparing email notification"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
                opacity: togglingKey === 'preparing' ? 0.5 : 1, transition: 'opacity 0.2s'
              }}
            >
              {emailToggles.email_notify_preparing ? (
                <ToggleRight size={38} strokeWidth={1.5} style={{ color: 'var(--primary-400)' }} />
              ) : (
                <ToggleLeft size={38} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          </div>

          {/* COMPLETED toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.15rem',
              borderRadius: '12px',
              border: `1.5px solid ${emailToggles.email_notify_completed ? 'rgba(34, 197, 94, 0.25)' : 'var(--border-color)'}`,
              background: emailToggles.email_notify_completed ? 'rgba(34, 197, 94, 0.04)' : 'var(--bg-card)',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: emailToggles.email_notify_completed ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease'
              }}>
                <CheckCircle2 size={20} style={{ color: emailToggles.email_notify_completed ? 'var(--success)' : 'var(--text-muted)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Completed Status Email
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Send email when order status changes to "Completed"
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('completed')}
              disabled={togglingKey === 'completed'}
              aria-label="Toggle completed email notification"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
                opacity: togglingKey === 'completed' ? 0.5 : 1, transition: 'opacity 0.2s'
              }}
            >
              {emailToggles.email_notify_completed ? (
                <ToggleRight size={38} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
              ) : (
                <ToggleLeft size={38} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: '1.5' }}>
          💡 When a toggle is <strong>OFF</strong>, the order status will still update in the system (customers can see it in "My Orders"), but no email notification will be sent for that status change.
        </p>
      </motion.div>

      {/* ========== EMAIL TEMPLATES SECTION ========== */}
      <motion.div 
        className="card"
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <Mail size={24} color="var(--primary-400)" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Automated Order Emails</h2>
        </div>

        <div style={{ background: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-400)', fontSize: '0.9rem' }}>Tip: Use Placeholders</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            You can type these exact words in your templates, and the system will magically replace them with real data before sending:
            <br />
            <strong style={{ color: 'var(--text-primary)' }}>[Name]</strong> - The customer's first name
            <br />
            <strong style={{ color: 'var(--text-primary)' }}>[OrderNumber]</strong> - The 6-digit order ID
            <br />
            <strong style={{ color: 'var(--text-primary)' }}>[TotalAmount]</strong> - The total price of the order
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>"Preparing" Email Template</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            This email is sent automatically to the customer when you click the "Start Preparing" (Chef Hat) button.
          </p>
          <textarea
            className="form-input"
            name="preparing_email_template"
            value={templates.preparing_email_template}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>"Completed" Email Template</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            This email is sent automatically when you click the "Mark as Completed" (Checkmark) button.
          </p>
          <textarea
            className="form-input"
            name="completed_email_template"
            value={templates.completed_email_template}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <MotionButton 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </MotionButton>
          
          {saveSuccess && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Check size={16} />
              <span>Saved successfully!</span>
            </motion.span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
