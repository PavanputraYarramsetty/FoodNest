import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import MotionButton from '../components/ui/MotionButton';
import { useMotionSafe } from '../lib/motion';
import MagicRings from '../components/MagicRings';
import ThemeToggleDock from '../components/ThemeToggleDock';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  
  const initialEmail = location.state?.email || sessionStorage.getItem('foodnest_reset_email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [isLocked, setIsLocked] = useState(Boolean(initialEmail));

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { forgotPassword, resetPassword } = useAuth();
  const { transition } = useMotionSafe();
  const cardRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setIsLocked(true);
      sessionStorage.setItem('foodnest_reset_email', location.state.email);
    } else {
      const savedEmail = sessionStorage.getItem('foodnest_reset_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setIsLocked(true);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer countdown for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Send OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || 'A 6-digit OTP code has been sent to your registered email.');
      setStep(2);
      setCountdown(30); // 30 seconds cooldown
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your connection or try again shortly.');
      } else {
        setError(err.message || 'Failed to send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: cleanOtp,
        newPassword,
        confirmPassword
      });
      setMessage(res.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        sessionStorage.removeItem('foodnest_reset_email');
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please verify the 6-digit code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ background: 'transparent' }}>
      <ThemeToggleDock />

      {/* Background Magic Rings */}
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
        <div className="auth-card" ref={cardRef} style={{ maxWidth: '450px' }}>
          <div className="auth-header">
            <motion.div
              className="auth-logo"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...transition, delay: 0.1 }}
            >
              <img src="/canteen-logo.png" alt="AparnaDevi Logo" className="auth-logo-img" />
            </motion.div>
            <h1 className="auth-title">
              {step === 1 ? 'Reset Password' : 'Enter OTP Code'}
            </h1>
            <p className="auth-subtitle">
              {step === 1 
                ? 'Click below to receive a 6-digit reset code to your email.'
                : `Enter the 6-digit code sent to ${email} along with your new password.`}
            </p>
          </div>

          <AlertBanner type="error" show={!!error}>
            <AlertCircle size={18} style={{ marginRight: '0.5rem' }} />
            {error}
          </AlertBanner>

          {message && (
            <div style={{ textAlign: 'center', padding: '0.85rem', background: 'rgba(20, 255, 100, 0.1)', color: '#14FF64', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <CheckCircle size={22} style={{ margin: '0 auto 6px', display: 'block' }} />
              {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="Registered email address"
                    value={email}
                    readOnly={isLocked}
                    disabled={isLocked}
                    onChange={(e) => {
                      if (!isLocked) {
                        setEmail(e.target.value);
                        setError('');
                      }
                    }}
                    style={isLocked ? { cursor: 'not-allowed', color: 'var(--text-primary)', opacity: 0.9 } : {}}
                    required
                  />
                </div>
              </div>

              <MotionButton
                type="submit"
                className="btn btn-primary btn-lg auth-submit-btn"
                disabled={loading || !email}
                style={{ width: '100%' }}
                id="forgot-password-submit"
              >
                {loading ? <span className="btn-spinner" aria-hidden="true" /> : 'Send 6-Digit OTP'}
              </MotionButton>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <div style={{ marginBottom: '0.35rem' }}>
                  <label className="form-label" htmlFor="otp" style={{ margin: 0 }}>6-Digit OTP Code</label>
                </div>
                <div className="auth-input-wrapper">
                  <KeyRound size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    id="otp"
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
                    autoFocus
                    style={{ letterSpacing: '4px', fontWeight: 700, fontSize: '1.1rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    className="form-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={countdown > 0 || loading}
                  style={{
                    background: 'none', border: 'none',
                    color: countdown > 0 ? 'var(--text-muted)' : 'var(--primary-400)',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <MotionButton
                type="submit"
                className="btn btn-primary btn-lg auth-submit-btn"
                disabled={loading}
                style={{ width: '100%' }}
                id="reset-password-submit"
              >
                {loading ? <span className="btn-spinner" aria-hidden="true" /> : 'Reset Password & Continue'}
              </MotionButton>
            </form>
          )}

          <div className="auth-footer" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
