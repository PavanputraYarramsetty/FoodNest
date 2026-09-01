import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import MotionButton from '../components/ui/MotionButton';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your email address to receive a password reset link.</p>
        </div>

        <AlertBanner type="error" show={!!error}>
          <AlertCircle size={18} style={{ marginRight: '0.5rem' }} />
          {error}
        </AlertBanner>

        {message ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(20, 255, 100, 0.1)', color: '#14FF64', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <MotionButton type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send Reset Link'}
            </MotionButton>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
