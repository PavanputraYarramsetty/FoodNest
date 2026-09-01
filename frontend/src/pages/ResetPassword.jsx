import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import MotionButton from '../components/ui/MotionButton';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await resetPassword(token, formData.newPassword, formData.confirmPassword);
      setSuccess(res.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Please enter your new password below.</p>
        </div>

        <AlertBanner type="error" show={!!error}>
          <AlertCircle size={18} style={{ marginRight: '0.5rem' }} />
          {error}
        </AlertBanner>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(20, 255, 100, 0.1)', color: '#14FF64', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  className="form-input"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
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
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <MotionButton type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Reset Password'}
            </MotionButton>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
