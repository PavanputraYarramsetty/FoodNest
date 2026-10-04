import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldAlert, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Search, 
  KeyRound, 
  Edit, 
  X, 
  PlusCircle,
  MailCheck,
  Mail,
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import AlertBanner from '../../components/ui/AlertBanner';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import MotionButton from '../../components/ui/MotionButton';

const ManageCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [blockFilter, setBlockFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit customer modal state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '', hostel_block: '', email_verified: false });
  const [editLoading, setEditLoading] = useState(false);

  // Manual Email Verification modal state
  const [verifyingCustomer, setVerifyingCustomer] = useState(null);
  const [verifyEmailInput, setVerifyEmailInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/admin/customers');
      setCustomers(res.data.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load customers list'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (customer) => {
    try {
      await axios.put(`/admin/customers/${customer.id}/block`);
      setMessage({
        type: 'success',
        text: `Customer ${customer.is_blocked ? 'unblocked' : 'blocked'} successfully!`
      });
      fetchCustomers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update customer status' });
    }
  };

  const deleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action is permanent.')) return;
    try {
      await axios.delete(`/admin/customers/${customerId}`);
      setMessage({ type: 'success', text: 'Customer account deleted' });
      fetchCustomers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete customer' });
    }
  };

  const resetPassword = async (customer) => {
    if (!window.confirm(`Are you sure you want to reset ${customer.name}'s password to Reset@123?`)) return;
    try {
      const res = await axios.put(`/admin/customers/${customer.id}/reset-password`);
      setMessage({ type: 'success', text: res.data.message || 'Password reset successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password' });
    }
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      hostel_block: customer.hostel_block || '',
      email_verified: !!customer.email_verified
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`/admin/customers/${editingCustomer.id}`, editFormData);
      setMessage({ type: 'success', text: 'Customer details updated successfully!' });
      setEditingCustomer(null);
      fetchCustomers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update customer' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenVerifyModal = (customer) => {
    setVerifyingCustomer(customer);
    setVerifyEmailInput(customer.email || '');
  };

  const handleVerifySubmit = async (e, verifiedStatus = true) => {
    if (e && e.preventDefault) e.preventDefault();
    if (verifiedStatus && !verifyEmailInput.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid email address before verifying' });
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await axios.put(`/admin/customers/${verifyingCustomer.id}/verify-email`, {
        email: verifyEmailInput.trim(),
        verified: verifiedStatus
      });
      setMessage({ 
        type: 'success', 
        text: res.data.message || (verifiedStatus ? 'Email verified successfully!' : 'Email unverified successfully!') 
      });
      setVerifyingCustomer(null);
      fetchCustomers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update email verification status' 
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const filtered = customers
    .filter(cust => !blockFilter || cust.hostel_block === blockFilter)
    .filter(cust => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return (
        (cust.name && cust.name.toLowerCase().includes(lowerQuery)) ||
        (cust.phone && cust.phone.includes(lowerQuery)) ||
        (cust.email && cust.email.toLowerCase().includes(lowerQuery)) ||
        (cust.hostel_block && cust.hostel_block.toLowerCase().includes(lowerQuery))
      );
    });

  return (
    <div>
      <PageHeader
        title="Manage Customers"
        subtitle="View, verify emails, block, or manage customer accounts"
        badge={`${customers.length} ${customers.length === 1 ? 'Customer' : 'Customers'}`}
        showBack={true}
        backTo="/admin/home"
      />

      <AlertBanner type={message.type} show={!!message.text}>
        {message.type === 'success' ? <CheckCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> : <AlertCircle size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />}
        {message.text}
      </AlertBanner>

      <div className="customer-toolbar">
        <div className="customer-toolbar-left">
          <div className="customer-search-wrap">
            <Search size={16} className="customer-search-icon" />
            <input
              type="text"
              id="customer-search"
              className="customer-search-input"
              placeholder="Search by name, phone, email, or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="customer-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="customer-filter-wrap">
            <select
              className="customer-filter-select"
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              id="customer-block-filter"
              aria-label="Filter by Hostel Block"
            >
              <option value="">All Hostel Blocks</option>
              <option value="F Block (Old)">F Block (Old)</option>
              <option value="Others(A, B, C, D, F)">Others(A, B, C, D, F)</option>
            </select>
          </div>
        </div>

        <div className="customer-toolbar-right">
          <span className="customer-results-count">
            Showing <strong>{filtered.length}</strong> of {customers.length} customers
          </span>
          {(blockFilter || searchQuery) && (
            <MotionButton
              className="btn btn-ghost btn-sm customer-clear-btn"
              onClick={() => { setBlockFilter(''); setSearchQuery(''); }}
            >
              Clear Filters
            </MotionButton>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="No customers match your current search or filters."
        />
      ) : (
        <div className="customer-table-wrapper">
          <table className="customer-table table-responsive-cards">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Customer Name</th>
                <th style={{ minWidth: '120px' }}>Phone</th>
                <th style={{ minWidth: '230px' }}>Email & Verification</th>
                <th style={{ minWidth: '140px' }}>Hostel Block</th>
                <th style={{ minWidth: '95px' }}>Status</th>
                <th style={{ minWidth: '135px' }}>Joined Date & Time</th>
                <th style={{ minWidth: '190px', width: '190px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cust) => (
                <tr key={cust.id}>
                  <td data-label="Customer Name">
                    <div className="customer-name-cell">
                      <div className="customer-avatar-badge" aria-hidden="true">
                        {cust.name ? cust.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="customer-name-text">{cust.name}</span>
                    </div>
                  </td>
                  <td data-label="Phone" className="customer-phone-cell">
                    {cust.phone}
                  </td>
                  <td data-label="Email & Verification">
                    <div className="customer-email-cell-box">
                      {cust.email ? (
                        <div className="customer-email-text" title={cust.email}>
                          {cust.email}
                        </div>
                      ) : (
                        <span className="customer-no-email">No email provided</span>
                      )}
                      
                      <div style={{ marginTop: '0.25rem' }}>
                        {cust.email_verified ? (
                          <span 
                            className="customer-email-status-tag verified" 
                            title="Email is verified. Click to manage."
                            onClick={() => handleOpenVerifyModal(cust)}
                          >
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <button 
                            type="button"
                            className="customer-email-status-tag unverified-btn" 
                            title="Click to manually verify this customer's email"
                            onClick={() => handleOpenVerifyModal(cust)}
                          >
                            <AlertCircle size={12} /> Unverified · Verify Now
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Hostel Block">
                    <span className="customer-block-chip">{cust.hostel_block || '—'}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${cust.is_blocked ? 'badge-blocked' : 'badge-active'}`}>
                      <span className="status-dot" />
                      {cust.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td data-label="Joined Date & Time" className="customer-date-cell">
                    {cust.created_at ? (
                      <div className="customer-date-time-wrapper">
                        <span className="customer-date-text">
                          {new Date(cust.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="customer-time-text">
                          {new Date(cust.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <div className="customer-actions-group">
                      <MotionButton
                        className="customer-action-btn edit"
                        onClick={() => navigate(`/admin/create-order?customerId=${cust.id}`)}
                        title="Create Order for this Customer"
                        aria-label={`Create Order for ${cust.name}`}
                        style={{ color: 'var(--primary-400)' }}
                      >
                        <PlusCircle size={15} />
                      </MotionButton>

                      {/* Manual Email Verification Button */}
                      <MotionButton
                        className={`customer-action-btn ${cust.email_verified ? 'verified-action' : 'verify'}`}
                        onClick={() => handleOpenVerifyModal(cust)}
                        title={cust.email_verified ? 'Manage Verified Email' : 'Manually Verify Customer Email'}
                        aria-label={`Verify email for ${cust.name}`}
                      >
                        <MailCheck size={15} />
                      </MotionButton>

                      <MotionButton
                        className="customer-action-btn edit"
                        onClick={() => handleEditClick(cust)}
                        title="Edit Customer Details"
                        aria-label={`Edit ${cust.name}`}
                      >
                        <Edit size={15} />
                      </MotionButton>
                      <MotionButton
                        className={`customer-action-btn ${cust.is_blocked ? 'unblock' : 'block'}`}
                        onClick={() => toggleBlockStatus(cust)}
                        title={cust.is_blocked ? 'Unblock Customer Account' : 'Block Customer Account'}
                        aria-label={cust.is_blocked ? `Unblock ${cust.name}` : `Block ${cust.name}`}
                      >
                        <ShieldAlert size={15} />
                      </MotionButton>
                      <MotionButton
                        className="customer-action-btn reset"
                        onClick={() => resetPassword(cust)}
                        title="Reset Password to Reset@123"
                        aria-label={`Reset password for ${cust.name}`}
                      >
                        <KeyRound size={15} />
                      </MotionButton>
                      <MotionButton
                        className="customer-action-btn delete"
                        onClick={() => deleteCustomer(cust.id)}
                        title="Delete Customer Permanently"
                        aria-label={`Delete ${cust.name}`}
                      >
                        <Trash2 size={15} />
                      </MotionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Email Verification Modal */}
      {verifyingCustomer && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)', padding: '1rem'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-surface)', padding: '2rem', borderRadius: '1.25rem',
            width: '100%', maxWidth: '520px', position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-light)'
          }}>
            <button 
              onClick={() => setVerifyingCustomer(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e'
              }}>
                <MailCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
                  Admin Email Verification
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  Manually verify customer's email address
                </p>
              </div>
            </div>

            {/* Customer Summary Chip */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {verifyingCustomer.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  📞 {verifyingCustomer.phone} {verifyingCustomer.hostel_block ? `· Block: ${verifyingCustomer.hostel_block}` : ''}
                </div>
              </div>
              <div>
                {verifyingCustomer.email_verified ? (
                  <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                    <CheckCircle size={12} style={{ marginRight: '0.3rem', display: 'inline' }} /> Currently Verified
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <AlertCircle size={12} style={{ marginRight: '0.3rem', display: 'inline' }} /> Currently Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Guide Info Box */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              lineHeight: '1.45',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.25rem' }}>
                <Info size={15} /> How Manual Verification Works
              </div>
              If the customer faces difficulties with automatic email verification, ask them to send an email message to <strong style={{ color: 'var(--text-primary)' }}>aparnadevicanteen@gmail.com</strong>. Once confirmed, enter their email below and click <strong>"Verify Email"</strong>.
            </div>

            <form onSubmit={(e) => handleVerifySubmit(e, true)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Customer Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="form-input"
                    placeholder="Enter customer's verified email address (e.g. name@gmail.com)"
                    value={verifyEmailInput}
                    onChange={(e) => setVerifyEmailInput(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <div>
                  {verifyingCustomer.email_verified && (
                    <MotionButton
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                      onClick={() => handleVerifySubmit(null, false)}
                      disabled={verifyLoading}
                    >
                      Remove Verification
                    </MotionButton>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <MotionButton
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setVerifyingCustomer(null)}
                    disabled={verifyLoading}
                  >
                    Cancel
                  </MotionButton>
                  <MotionButton
                    type="submit"
                    className="btn btn-success"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    disabled={verifyLoading}
                  >
                    <CheckCircle size={16} />
                    {verifyLoading ? 'Verifying...' : 'Mark as Verified'}
                  </MotionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)', padding: '1rem'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-surface)', padding: '2rem', borderRadius: '1.25rem',
            width: '100%', maxWidth: '520px', position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-light)'
          }}>
            <button 
              onClick={() => setEditingCustomer(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>Edit Customer</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hostel Block</label>
                <select 
                  className="form-input"
                  value={editFormData.hostel_block}
                  onChange={(e) => setEditFormData({...editFormData, hostel_block: e.target.value})}
                  required
                >
                  <option value="">Select Block</option>
                  <option value="F Block (Old)">F Block (Old)</option>
                  <option value="Others(A, B, C, D, F)">Others(A, B, C, D, F)</option>
                </select>
              </div>

              {/* Email Verification Status Toggle */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-light)',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '0.25rem'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} style={{ color: editFormData.email_verified ? '#22c55e' : '#eab308' }} />
                    Email Verified
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Admin override to mark email as verified
                  </div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={editFormData.email_verified}
                    onChange={(e) => setEditFormData({...editFormData, email_verified: e.target.checked})}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-500)' }}
                  />
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <MotionButton
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </MotionButton>
                <MotionButton
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </MotionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;