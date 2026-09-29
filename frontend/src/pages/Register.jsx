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
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, verifyEmail, resendVerification } = useAuth();
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

  // Focus OTP input when OTP section becomes active
  useEffect(() => {
    if (showOtpSection && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOtpSection]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 1: Submit Registration Form (triggers OTP)
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
      setSuccess(`A 6-digit verification code has been sent to ${formData.email.trim()}. Please enter it below.`);
      setShowOtpSection(true);
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

  // Step 2: Verify OTP
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
      await verifyEmail(cleanOtp, formData.email.trim());
      setSuccess('🎉 Verification successful! Your account is active. Redirecting to Sign In...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
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
              <h1 className="auth-title">Create Account</h1>
            </Link>
            <p className="auth-subtitle">Join AparnaCanteen today</p>
          </div>

          <AlertBanner type="error" show={!!error}>
            <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {error}
          </AlertBanner>

          <AlertBanner type="success" show={!!success}>
            <CheckCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            {success}
          </AlertBanner>

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
                  disabled={showOtpSection}
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
                  disabled={showOtpSection}
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
                  disabled={showOtpSection}
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
                  disabled={showOtpSection}
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
                  disabled={showOtpSection}
                  minLength={6}
                  id="register-password"
                />
                {!showOtpSection && (
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

            {!showOtpSection ? (
              <MotionButton
                type="submit"
                className="btn btn-primary btn-lg auth-submit-btn"
                style={{ width: '100%' }}
                disabled={loading}
                id="register-submit"
              >
                {loading ? <span className="btn-spinner" aria-hidden="true" /> : 'Create Account'}
              </MotionButton>
            ) : null}
          </form>

          {/* Inline OTP Section directly below details */}
          {showOtpSection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
              }}
            >
              <form onSubmit={handleVerifyOtp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" htmlFor="register-otp" style={{ margin: 0, fontWeight: 700, color: 'var(--primary-400)', fontSize: '0.9rem' }}>
                    Enter 6-Digit Code sent to {formData.email}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowOtpSection(false); setError(''); setSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                  >
                    Edit Details
                  </button>
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
                    style={{ letterSpacing: '6px', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
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

                <MotionButton
                  type="submit"
                  className="btn btn-primary btn-lg auth-submit-btn"
                  disabled={verifyLoading}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
                  id="verify-otp-submit"
                >
                  {verifyLoading ? <span className="btn-spinner" aria-hidden="true" /> : 'Verify OTP & Complete'}
                </MotionButton>
              </form>
            </motion.div>
          )}

          <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
            Already have an account? <Link to="/login" replace>Sign In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
