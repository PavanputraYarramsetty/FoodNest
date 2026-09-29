import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, KeyRound, Mail, Phone, UserCheck, ShieldCheck } from 'lucide-react';
import MotionButton from '../components/ui/MotionButton';
import AlertBanner from '../components/ui/AlertBanner';
import { useMotionSafe } from '../lib/motion';
import MagicRings from '../components/MagicRings';
import ThemeToggleDock from '../components/ThemeToggleDock';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hostelBlock: '',
    password: ''
  });
  const [otp, setOtp] = useState('');
  const [registrationStep, setRegistrationStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, resendVerification } = useAuth();
  const navigate = useNavigate();
  const { transition } = useMotionSafe();
  const cardRef = useRef(null);
  const otpInputRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resend Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus OTP input when OTP step becomes active
  useEffect(() => {
    if (registrationStep === 'otp' && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 350);
    }
  }, [registrationStep]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 1: Submit Registration Form → Send OTP → Stay on this page
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const phoneRegex = /^(?:\+91|91)?\d{10}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError('Please enter a valid phone number (10 digits, or 12/13 digits starting with 91 or +91).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({ ...formData, confirmPassword: formData.password });
      // ✅ Stay on same page — show OTP entry below
      setSuccess(`A 6-digit verification code has been sent to ${formData.email.trim()}. Enter it below to verify your email.`);
      setRegistrationStep('otp');
      setCountdown(30);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your connection or try again shortly.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP → Show success → Redirect to Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setVerifyLoading(true);

    try {
      // Call verify-otp API directly (without going through AuthContext.verifyEmail
      // which sets token/user state — we DON'T want auto-login here)
      const axios = (await import('axios')).default;
      await axios.post('/auth/verify-otp', {
        otp: cleanOtp,
        token: cleanOtp,
        email: formData.email.trim()
      });

      // ✅ Show success state — do NOT auto-login
      setError('');
      setSuccess('');
      setRegistrationStep('success');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired 6-digit code. Please check your email and try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setError('');
    setVerifyLoading(true);
    try {
      const res = await resendVerification(formData.email.trim());
      setSuccess(res.message || `A fresh 6-digit code was sent to ${formData.email.trim()}`);
      setCountdown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Allow editing details (go back to form step)
  const handleEditDetails = () => {
    setRegistrationStep('form');
    setOtp('');
    setError('');
    setSuccess('');
  };

  const isFormLocked = registrationStep !== 'form';

  return (
    <div className="auth-page" style={{ background: 'transparent' }}>
      {/* Theme Toggle Dock — fixed top right */}
      <ThemeToggleDock />

      {/* Themed MagicRings Background */}
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
        className="auth-container auth-container-wide"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <div className="auth-card" ref={cardRef}>
          <div className="auth-header">
            <Link to="/" className="auth-header-brand" title="Back to Home" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                className="auth-logo"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...transition, delay: 0.1 }}
              >
                <img src="/canteen-logo.png" alt="AparnaDevi Logo" className="auth-logo-img" />
              </motion.div>
              <h1 className="auth-title">
                {registrationStep === 'success' ? 'Account Verified!' : 'Create Account'}
              </h1>
            </Link>
            <p className="auth-subtitle">
              {registrationStep === 'form' && 'Join AparnaCanteen today'}
              {registrationStep === 'otp' && 'Almost there — verify your email'}
              {registrationStep === 'success' && 'You\'re all set to order!'}
            </p>
          </div>

          {/* ─── SUCCESS STATE ─── */}
          {registrationStep === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                textAlign: 'center',
                padding: '2rem 1.5rem',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '2px solid rgba(34, 197, 94, 0.4)',
                }}
              >
                <CheckCircle size={40} style={{ color: '#22c55e' }} />
              </motion.div>

              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#22c55e',
                marginBottom: '0.5rem',
              }}>
                🎉 Email Verified Successfully!
              </h2>

              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.92rem',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}>
                Your account is now active.<br />
                Redirecting to <strong>Sign In</strong> page in a few seconds...
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}>
                <span className="btn-spinner" aria-hidden="true" style={{ width: '18px', height: '18px' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Redirecting to login...</span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                style={{
                  marginTop: '1.25rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-400)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'underline',
                }}
              >
                Go to Sign In now →
              </button>
            </motion.div>
          ) : (
            <>
              {/* ─── ERROR / SUCCESS BANNERS ─── */}
              <AlertBanner type="error" show={!!error}>
                <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                {error}
              </AlertBanner>

              <AlertBanner type="success" show={!!success}>
                <CheckCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                {success}
              </AlertBanner>

              {/* ─── REGISTRATION FORM ─── */}
              <form onSubmit={handleSubmit}>
                <div className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="register-name">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isFormLocked}
                      id="register-name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-phone">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={isFormLocked}
                      id="register-phone"
                    />
                  </div>
                </div>

                <div className="auth-row-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="register-email">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isFormLocked}
                      id="register-email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="register-block">Hostel Block *</label>
                    <select
                      name="hostelBlock"
                      className="form-input"
                      value={formData.hostelBlock}
                      onChange={handleChange}
                      required
                      disabled={isFormLocked}
                      id="register-block"
                    >
                      <option value="">Select Block</option>
                      <option value="F Block (Old)">F Block (Old)</option>
                      <option value="Others(A, B, C, D, F)">Others(A, B, C, D, F)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-password">Password *</label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-input has-toggle"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isFormLocked}
                      minLength={6}
                      id="register-password"
                    />
                    {!isFormLocked && (
                      <button
                        type="button"
                        className="auth-toggle-password"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                {registrationStep === 'form' && (
                  <MotionButton
                    type="submit"
                    className="btn btn-primary btn-lg auth-submit-btn"
                    style={{ width: '100%' }}
                    disabled={loading}
                    id="register-submit"
                  >
                    {loading ? <span className="btn-spinner" aria-hidden="true" /> : 'Create Account'}
                  </MotionButton>
                )}
              </form>

              {/* ─── INLINE OTP SECTION (appears below Create Account) ─── */}
              {registrationStep === 'otp' && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    marginTop: '1.25rem',
                    padding: '1.35rem',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.06), rgba(234, 88, 12, 0.03))',
                    border: '1.5px solid rgba(249, 115, 22, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {/* OTP Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.6rem',
                    borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
                  }}>
                    <ShieldCheck size={20} style={{ color: 'var(--primary-400)' }} />
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--primary-400)',
                      fontSize: '0.95rem',
                    }}>
                      Email Verification
                    </span>
                  </div>

                  <form onSubmit={handleVerifyOtp}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" htmlFor="register-otp" style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        🔢 Enter 6-Digit Code sent to <strong style={{ color: 'var(--primary-400)' }}>{formData.email}</strong>
                      </label>
                    </div>

                    <div className="auth-input-wrapper" style={{ marginBottom: '0.85rem' }}>
                      <KeyRound size={18} className="auth-input-icon" />
                      <input
                        ref={otpInputRef}
                        type="text"
                        id="register-otp"
                        name="otp"
                        className="form-input"
                        placeholder="e.g. 123456"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setError('');
                        }}
                        maxLength={6}
                        required
                        style={{ letterSpacing: '8px', fontWeight: 700, fontSize: '1.3rem', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.82rem' }}>
                      <button
                        type="button"
                        onClick={handleEditDetails}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        ← Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={countdown > 0 || verifyLoading}
                        style={{
                          background: 'none', border: 'none',
                          color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary-400)',
                          cursor: countdown > 0 ? 'default' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                        }}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : '🔄 Resend Code'}
                      </button>
                    </div>

                    <MotionButton
                      type="submit"
                      className="btn btn-primary btn-lg auth-submit-btn"
                      disabled={verifyLoading || otp.length < 6}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #ea580c, #f97316)',
                        opacity: otp.length < 6 ? 0.7 : 1,
                      }}
                      id="verify-otp-submit"
                    >
                      {verifyLoading ? <span className="btn-spinner" aria-hidden="true" /> : '✓ Verify OTP & Complete'}
                    </MotionButton>
                  </form>
                </motion.div>
              )}

              <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
                Already have an account? <Link to="/login" replace>Sign In</Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

