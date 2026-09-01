import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Phone, Mail, Lock, AlertCircle, Eye, EyeOff, MessageCircle, X, ExternalLink, LogOut } from 'lucide-react';
import MotionButton from '../components/ui/MotionButton';
import AlertBanner from '../components/ui/AlertBanner';
import AnimatedModal from '../components/ui/AnimatedModal';
import { useMotionSafe } from '../lib/motion';
import useNeonBorder from '../hooks/useNeonBorder';
import './StarsBackground.css';

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCommunityPopup, setShowCommunityPopup] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { login, updateEmail, resendVerification, logout } = useAuth();
  const navigate = useNavigate();
  const { transition } = useMotionSafe();
  const cardRef = useRef(null);
  useNeonBorder(cardRef, { color: '#CC9149', thickness: 3, borderSize: 50, glow: 80, speed: 14 });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = {
        identifier: formData.identifier,
        password: formData.password
      };

      const user = await login(credentials);

      if (user.role === 'admin') {
        proceedToApp(user);
      } else if (!user.email) {
        setShowEmailModal(true);
      } else if (!user.email_verified) {
        setShowUnverifiedModal(true);
      } else {
        proceedToApp(user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToApp = (userObj) => {
    if (userObj.role === 'admin') {
      navigate('/admin/home');
    } else {
      setShowCommunityPopup(true);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setEmailError('Please enter a valid email address.');
      setEmailLoading(false);
      return;
    }

    try {
      await updateEmail(emailInput.trim());
      setEmailSentSuccess('Verification email sent. Please check your inbox and verify your email.');
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to update email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setEmailError('');
    setEmailSentSuccess('');
    setEmailLoading(true);
    try {
      await resendVerification();
      setEmailSentSuccess('Verification email resent successfully! Please check your inbox.');
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to resend email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancelEmail = () => {
    logout();
    setShowEmailModal(false);
    setEmailInput('');
    setError('Login cancelled. Email is required to continue.');
  };

  const handleContinueToApp = () => {
    setShowCommunityPopup(false);
    navigate('/customer/home');
  };

  return (
    <div className="auth-page" style={{ background: 'transparent' }}>
      <div className="stars-container">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
      </div>
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <div className="auth-card" ref={cardRef}>
          <div className="auth-header">
            <motion.div
              className="auth-logo"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...transition, delay: 0.1 }}
            >
              <img src="/favicon.jpg" alt="Logo" className="sidebar-logo-img" />
            </motion.div>
            <h1 className="auth-title">AparnaCanteen</h1>
            <p className="auth-subtitle">Welcome back</p>
          </div>

          <AlertBanner type="error" show={!!error}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {error}
          </AlertBanner>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-identifier">Email or Phone Number</label>
              <div className="auth-input-wrapper">
                {formData.identifier.includes('@') ? (
                  <Mail size={18} className="auth-input-icon" />
                ) : (
                  <Phone size={18} className="auth-input-icon" />
                )}
                <input
                  type="text"
                  name="identifier"
                  className="form-input"
                  placeholder="Enter your email or phone number"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  id="login-identifier"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input has-toggle"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <MotionButton type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading} id="login-submit">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><LogIn size={18} /> Sign In</>}
            </MotionButton>
          </form>

          <div className="auth-footer">
            <div style={{ marginBottom: '1rem' }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Forgot Password?</Link>
            </div>
            <div>
              Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
            <div className="auth-contact-section">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                If any Password related queries contact to this number
              </p>
              <div className="auth-contact-actions">
                <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.925rem' }}>9989092333</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href="tel:9989092333" className="btn btn-secondary btn-sm">
                    <Phone size={14} /> Call
                  </a>
                  <a
                    href="https://wa.me/919989092333"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm btn-whatsapp"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mandatory Email Collection Modal */}
      <AnimatedModal 
        open={showEmailModal} 
        onClose={() => {}} 
        title="Email Required"
      >
        <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', margin: 0, color: 'var(--primary)' }}>
            ACTION REQUIRED
          </h2>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 2rem 2rem 2rem' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            To improve account security and communication, we now require an email address for all accounts. Please provide your email to continue.
          </p>

          <AlertBanner type="error" show={!!emailError}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {emailError}
          </AlertBanner>

          {emailSentSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(20, 255, 100, 0.1)', color: '#14FF64', borderRadius: '8px', textAlign: 'center' }}>
                {emailSentSuccess}
              </div>
              <button className="btn btn-secondary" onClick={handleCancelEmail}>Back to Login</button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="required-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    type="email"
                    name="requiredEmail"
                    className="form-input"
                    placeholder="Enter your email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError('');
                    }}
                    required
                    id="required-email"
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEmail}
                  disabled={emailLoading}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <LogOut size={18} /> Cancel
                </button>
                <MotionButton 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={emailLoading}
                  style={{ flex: 2 }}
                >
                  {emailLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Save & Continue'}
                </MotionButton>
              </div>
            </form>
          )}
        </div>
      </AnimatedModal>

      {/* Unverified Email Modal */}
      <AnimatedModal 
        open={showUnverifiedModal} 
        onClose={() => {}} 
        title="Email Verification Required"
      >
        <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', margin: 0, color: 'var(--primary)' }}>
            VERIFY EMAIL
          </h2>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 2rem 2rem 2rem' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Your email address has not been verified yet. Please check your inbox and click the verification link to continue.
          </p>

          <AlertBanner type="error" show={!!emailError}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {emailError}
          </AlertBanner>

          {emailSentSuccess && (
            <div style={{ padding: '1rem', background: 'rgba(20, 255, 100, 0.1)', color: '#14FF64', borderRadius: '8px', textAlign: 'center' }}>
              {emailSentSuccess}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                logout();
                setShowUnverifiedModal(false);
              }}
              disabled={emailLoading}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogOut size={18} /> Cancel
            </button>
            <MotionButton 
              type="button" 
              className="btn btn-primary" 
              disabled={emailLoading}
              onClick={handleResendVerification}
              style={{ flex: 2 }}
            >
              {emailLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Resend Email'}
            </MotionButton>
          </div>
        </div>
      </AnimatedModal>

      {/* Community Popup Modal */}
      <AnimatedModal open={showCommunityPopup} onClose={handleContinueToApp} title="Join Our Community">
        <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0, position: 'relative' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', margin: 0, color: 'var(--primary)' }}>
            JOIN OUR COMMUNITY
          </h2>
          <button className="btn btn-ghost" onClick={handleContinueToApp} style={{ position: 'absolute', right: '1rem', top: '1rem' }} aria-label="Close dialog">
            <X size={22} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem 2rem 2rem' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Scan the QR code below to join our WhatsApp community for exclusive updates, offers, and daily menus!
          </p>
          <div style={{ padding: '0.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <img src="/whatsapp-qr.jpg.jpeg" alt="WhatsApp Community QR Code" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
          </div>
          <a
            href="https://chat.whatsapp.com/IHM8VcxiERE9beVp64zFDQ"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <ExternalLink size={18} /> Join via Link
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleContinueToApp}
            style={{ color: 'var(--text-muted)', marginTop: '-0.5rem' }}
          >
            Continue to App
          </button>
        </div>
      </AnimatedModal>
    </div>
  );
};

export default Login;
