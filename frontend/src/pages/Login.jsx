import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, Lock, AlertCircle, Eye, EyeOff, LogOut, KeyRound, CheckCircle, PhoneCall } from 'lucide-react';
import MotionButton from '../components/ui/MotionButton';
import AlertBanner from '../components/ui/AlertBanner';
import AnimatedModal from '../components/ui/AnimatedModal';
import { useMotionSafe } from '../lib/motion';
import MagicRings from '../components/MagicRings';
import ThemeToggleDock from '../components/ThemeToggleDock';

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState('otp'); // 'email' or 'otp'
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccessMsg, setVerifySuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const { user, login, updateEmail, resendVerification, verifyEmail, logout, checkVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const { transition } = useMotionSafe();
  const cardRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resend Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Dynamic verification check on identifier input
  useEffect(() => {
    const rawVal = formData.identifier.trim();
    if (!rawVal || rawVal.length < 3) {
      setIsEmailVerified(false);
      setVerifiedEmail('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkVerificationStatus(rawVal);
        if (res?.isVerified) {
          setIsEmailVerified(true);
          const retrievedEmail = res.email || (rawVal.includes('@') ? rawVal : '');
          setVerifiedEmail(retrievedEmail);
          if (retrievedEmail) {
            sessionStorage.setItem('foodnest_reset_email', retrievedEmail);
          }
        } else {
          setIsEmailVerified(false);
          setVerifiedEmail('');
        }
      } catch {
        setIsEmailVerified(false);
        setVerifiedEmail('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.identifier, checkVerificationStatus]);

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

      const loggedUser = await login(credentials);

      if (loggedUser.role === 'admin') {
        proceedToApp(loggedUser);
      } else if (!loggedUser.email) {
        setEmailInput('');
        setOtpInput('');
        setVerifyStep('email');
        setVerifyError('');
        setVerifySuccessMsg('');
        setShowVerifyModal(true);
      } else if (!loggedUser.email_verified) {
        setEmailInput(loggedUser.email);
        setOtpInput('');
        setVerifyStep('otp');
        setVerifyError('');
        setVerifySuccessMsg('');
        setShowVerifyModal(true);
        // Automatically request fresh OTP
        triggerSendOtp(loggedUser.email);
      } else {
        proceedToApp(loggedUser);
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your connection or try again shortly.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const proceedToApp = (userObj) => {
    if (userObj.role === 'admin') {
      navigate('/admin/home', { replace: true });
    } else {
      navigate('/customer/home', { replace: true });
    }
  };

  const triggerSendOtp = async (emailToUse) => {
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await resendVerification(emailToUse || emailInput.trim());
      setVerifySuccessMsg(res.message || `6-digit verification code sent to ${emailToUse || emailInput.trim()}`);
      setCountdown(30);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Submit email if user had no email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccessMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setVerifyError('Please enter a valid email address.');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await updateEmail(emailInput.trim());
      setVerifySuccessMsg(res.message || `6-digit verification code sent to ${emailInput.trim()}`);
      setVerifyStep('otp');
      setCountdown(30);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Failed to save email. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Submit 6-digit OTP
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setVerifyError('');

    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setVerifyError('Please enter the 6-digit OTP code.');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await verifyEmail(cleanOtp, emailInput.trim());
      setVerifySuccessMsg(res.message || 'Email verified successfully!');
      setTimeout(() => {
        setShowVerifyModal(false);
        navigate('/customer/home', { replace: true });
      }, 1000);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCancelVerification = () => {
    logout();
    setShowVerifyModal(false);
    setOtpInput('');
    setEmailInput('');
    setError('Verification incomplete. Please verify your email to log in.');
  };

  return (
    <div className="auth-page" style={{ background: 'transparent' }}>
      <ThemeToggleDock />

      {/* Themed Magic Rings Background */}
      <div
        className="auth-magic-rings"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {!isMobile && (
          <MagicRings
            color="#ff4500"
            colorTwo="#f97316"
            colorThree="#ffb703"
            ringCount={4}
            speed={0.6}
            attenuation={8}
            lineThickness={1.5}
            baseRadius={0.36}
            radiusStep={0.16}
            scaleRate={0.1}
            opacity={0.68}
            blur={0}
            noiseAmount={0.02}
            rotation={0}
            ringGap={1.35}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            mouseInfluence={0}
            hoverScale={1.0}
            parallax={0}
            clickBurst={false}
          />
        )}
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
              <img src="/canteen-logo.png" alt="AparnaDevi Logo" className="auth-logo-img" />
            </motion.div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to order your favorite hostel meals</p>
          </div>

          <AlertBanner type="error" show={!!error}>
            <AlertCircle size={18} style={{ marginRight: '0.5rem' }} />
            {error}
          </AlertBanner>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-identifier">
                Email or Mobile Number
              </label>
              <div className="auth-input-wrapper">
                <Phone size={18} className="auth-input-icon" />
                <input
                  type="text"
                  id="login-identifier"
                  name="identifier"
                  className="form-input"
                  placeholder="Enter email or mobile number"
                  value={formData.identifier}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
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

            <MotionButton
              type="submit"
              className="btn btn-primary btn-lg auth-submit-btn"
              style={{ width: '100%' }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? <span className="btn-spinner" aria-hidden="true" /> : 'Sign In'}
            </MotionButton>
          </form>

          <div className="auth-footer">
            {isEmailVerified && (
              <div style={{ marginBottom: '0.45rem' }}>
                <Link
                  to="/forgot-password"
                  state={{ email: verifiedEmail, identifier: formData.identifier }}
                  onClick={() => {
                    if (verifiedEmail) {
                      sessionStorage.setItem('foodnest_reset_email', verifiedEmail);
                    }
                  }}
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}
                >
                  Forgot Password?
                </Link>
              </div>
            )}
            <div>
              Don't have an account? <Link to="/register" replace>Sign Up</Link>
            </div>

            <div
              className="auth-contact-section"
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {/* Canteen Manager */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  Canteen Manager
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 500 }}>
                    9603649488
                  </span>
                  <a
                    href="tel:9603649488"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.28rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.28)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(249, 115, 22, 0.28)';
                    }}
                  >
                    <PhoneCall size={11} />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Accounts Support Team */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  Accounts Support Team
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 500 }}>
                    9989092333
                  </span>
                  <a
                    href="tel:9989092333"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.28rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.28)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(249, 115, 22, 0.28)';
                    }}
                  >
                    <PhoneCall size={11} />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Unified OTP Email Verification Modal */}
      <AnimatedModal 
        open={showVerifyModal} 
        onClose={() => {}} 
        title="Email Verification"
      >
        <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', margin: 0, color: 'var(--primary-400)' }}>
            {verifyStep === 'email' ? 'EMAIL REQUIRED' : 'VERIFY EMAIL WITH OTP'}
          </h2>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem 2rem 2rem 2rem' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {verifyStep === 'email'
              ? 'Please provide your email address to receive your 6-digit verification code.'
              : `Enter the 6-digit verification code sent to ${emailInput}.`}
          </p>

          <AlertBanner type="error" show={!!verifyError}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {verifyError}
          </AlertBanner>

          {verifySuccessMsg && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(20, 255, 100, 0.1)', color: '#14FF64', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
              <CheckCircle size={18} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
              {verifySuccessMsg}
            </div>
          )}

          {verifyStep === 'email' ? (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="required-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    type="email"
                    name="requiredEmail"
                    className="form-input"
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setVerifyError('');
                    }}
                    required
                    id="required-email"
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelVerification}
                  disabled={verifyLoading}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                >
                  <LogOut size={16} /> Cancel
                </button>
                <MotionButton 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={verifyLoading}
                  style={{ flex: 2, minHeight: '40px' }}
                >
                  {verifyLoading ? <span className="btn-spinner" aria-hidden="true" /> : 'Send 6-Digit OTP'}
                </MotionButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" htmlFor="verify-otp" style={{ margin: 0 }}>6-Digit Verification Code</label>
                  <button
                    type="button"
                    onClick={() => { setVerifyStep('email'); setVerifyError(''); setVerifySuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-400)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                  >
                    Change Email
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <KeyRound size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    id="verify-otp"
                    name="otp"
                    className="form-input"
                    placeholder="e.g. 123456"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setVerifyError('');
                    }}
                    maxLength={6}
                    required
                    autoFocus
                    style={{ letterSpacing: '6px', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Didn't get the code?</span>
                <button
                  type="button"
                  onClick={() => triggerSendOtp(emailInput)}
                  disabled={countdown > 0 || verifyLoading}
                  style={{
                    background: 'none', border: 'none',
                    color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary-400)',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelVerification}
                  disabled={verifyLoading}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                >
                  <LogOut size={16} /> Cancel
                </button>
                <MotionButton 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={verifyLoading}
                  style={{ flex: 2, minHeight: '40px' }}
                >
                  {verifyLoading ? <span className="btn-spinner" aria-hidden="true" /> : 'Verify & Continue'}
                </MotionButton>
              </div>
            </form>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
};

export default Login;
