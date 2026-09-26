import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Minus, 
  User, 
  UserPlus, 
  ShoppingBag, 
  Hash, 
  Search, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  CreditCard, 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import LoadingState from '../../components/ui/LoadingState';
import MotionButton from '../../components/ui/MotionButton';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Order Counter State
  const [orderCounter, setOrderCounter] = useState({ currentLastNumber: 0, nextOrderNumber: 1 });
  const [customOrderNumber, setCustomOrderNumber] = useState('');
  const [isManualOrderNum, setIsManualOrderNum] = useState(false);

  // Customer Mode & Selection State
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'new'
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  
  const [newCustomerDetails, setNewCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    hostel_block: 'F Block (Old)'
  });

  // Menu & Quantities State
  const [menu, setMenu] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');

  // Order Details State
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [orderStatus, setOrderStatus] = useState('Pending');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch next order number
      const counterRes = await axios.get('/admin/orders/next-number');
      if (counterRes.data.success) {
        setOrderCounter({
          currentLastNumber: counterRes.data.currentLastNumber,
          nextOrderNumber: counterRes.data.nextOrderNumber
        });
        setCustomOrderNumber(counterRes.data.nextOrderNumber.toString());
      }

      // 2. Fetch menu items
      const menuRes = await axios.get('/admin/menu');
      const availableItems = (menuRes.data.data || []).filter(item => item.is_available);
      setMenu(availableItems);

      // 3. Fetch registered customers
      const customersRes = await axios.get('/admin/customers');
      if (customersRes.data.success) {
        setCustomers(customersRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load initial order data:', err);
      toast.error('Failed to load required data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCounter = async () => {
    try {
      const counterRes = await axios.get('/admin/orders/next-number');
      if (counterRes.data.success) {
        setOrderCounter({
          currentLastNumber: counterRes.data.currentLastNumber,
          nextOrderNumber: counterRes.data.nextOrderNumber
        });
        if (!isManualOrderNum) {
          setCustomOrderNumber(counterRes.data.nextOrderNumber.toString());
        }
        toast.success('Order counter refreshed!');
      }
    } catch (err) {
      toast.error('Failed to refresh order counter');
    }
  };

  // Quantity controls
  const handleIncrement = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleDecrement = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const handleSetQuantity = (itemId, val) => {
    const parsed = parseInt(val);
    setQuantities(prev => ({
      ...prev,
      [itemId]: isNaN(parsed) ? 0 : Math.max(0, parsed)
    }));
  };

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(menu.map(item => item.category || 'General'))).sort();
  }, [menu]);

  // Filtered menu items
  const filteredMenu = useMemo(() => {
    const q = menuSearch.toLowerCase().trim();
    return menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || (item.category || 'General') === selectedCategory;
      const matchesSearch = !q || item.item_name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, menuSearch]);

  // Selected customer object
  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered customers for dropdown search
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers.slice(0, 10);
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.hostel_block || '').toLowerCase().includes(q)
    ).slice(0, 15);
  }, [customers, customerSearch]);

  // Cart items calculation
  const cartItems = useMemo(() => {
    return menu
      .filter(item => (quantities[item.id] || 0) > 0)
      .map(item => ({
        menuItem: item.id,
        name: item.item_name,
        price: Number(item.price),
        quantity: quantities[item.id],
        totalPrice: Number(item.price) * quantities[item.id]
      }));
  }, [menu, quantities]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  // Handle Form Submission
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Please add at least one menu item to create the order');
      return;
    }

    if (customerMode === 'existing' && !selectedCustomerId) {
      toast.error('Please select a customer or switch to enter new customer details');
      return;
    }

    if (customerMode === 'new') {
      if (!newCustomerDetails.name.trim()) {
        toast.error('Please enter customer name');
        return;
      }
      if (!newCustomerDetails.phone.trim()) {
        toast.error('Please enter customer phone number');
        return;
      }
      const phoneRegex = /^(?:\+91|91)?\d{10}$/;
      if (!phoneRegex.test(newCustomerDetails.phone.trim())) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
    }

    const targetOrderNum = parseInt(customOrderNumber);
    if (!targetOrderNum || isNaN(targetOrderNum) || targetOrderNum <= 0) {
      toast.error('Please enter a valid positive Order ID number');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        order_number: targetOrderNum,
        items: cartItems.map(item => ({ menuItem: item.menuItem, quantity: item.quantity })),
        payment_method: paymentMethod,
        status: orderStatus
      };

      if (customerMode === 'existing') {
        payload.customer_id = selectedCustomerId;
      } else {
        payload.customer_details = {
          name: newCustomerDetails.name.trim(),
          phone: newCustomerDetails.phone.trim(),
          email: newCustomerDetails.email.trim(),
          hostel_block: newCustomerDetails.hostel_block
        };
      }

      const res = await axios.post('/admin/orders/create', payload);

      if (res.data.success) {
        toast.success(`Order #${targetOrderNum} created successfully!`);
        // Navigate to Admin Orders list
        navigate('/admin/orders');
      }
    } catch (err) {
      console.error('Failed to create order:', err);
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Preparing Create Order page..." />;
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <PageHeader
        title="Create Customer Order"
        subtitle="Place an order on behalf of a customer with custom Order ID"
        showBack={true}
        backTo="/admin/orders"
      />

      {/* Top Banner: Incremented Order ID Controls */}
      <div 
        className="glass-card admin-create-order-counter-banner"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-400)',
              flexShrink: 0
            }}
          >
            <Hash size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Current Latest: <strong style={{ color: '#fff', fontSize: '0.95rem' }}>#{orderCounter.currentLastNumber || 0}</strong>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={14} /> Next Auto: <strong style={{ color: 'var(--success)', fontSize: '1rem' }}>#{orderCounter.nextOrderNumber}</strong>
              </span>
              <button 
                type="button" 
                onClick={handleRefreshCounter} 
                className="btn btn-ghost btn-sm" 
                style={{ padding: '0.15rem 0.45rem', fontSize: '0.72rem', gap: '0.2rem' }}
                title="Refresh order counter"
              >
                <RefreshCw size={12} /> Sync
              </button>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Order ID auto-increments. You can also customize the ID below.
            </p>
          </div>
        </div>

        {/* Order ID Input Field */}
        <div className="admin-create-order-counter-input-wrap">
          <div className="admin-create-order-counter-input-box">
            <label htmlFor="custom-order-id-input" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-400)', whiteSpace: 'nowrap' }}>
              Order ID #:
            </label>
            <input
              id="custom-order-id-input"
              type="number"
              min="1"
              className="form-input"
              style={{
                width: '100px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: parseInt(customOrderNumber) <= orderCounter.currentLastNumber ? 'var(--warning)' : 'var(--primary-300)',
                borderColor: parseInt(customOrderNumber) <= orderCounter.currentLastNumber ? 'rgba(234, 179, 8, 0.5)' : undefined,
                padding: '0.35rem 0.5rem'
              }}
              value={customOrderNumber}
              onChange={(e) => {
                setCustomOrderNumber(e.target.value);
                setIsManualOrderNum(true);
              }}
              placeholder="e.g. 105"
            />
          </div>
          {parseInt(customOrderNumber) <= orderCounter.currentLastNumber && (
            <span style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: 600 }}>
              ⚠️ ID #{customOrderNumber} exists or is old. Recommended: #{orderCounter.nextOrderNumber}
            </span>
          )}
        </div>
      </div>

      <div className="admin-create-order-grid">
        
        {/* LEFT COLUMN: Customer Selection & Small-Sized Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section 1: Customer Details */}
          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <div className="admin-create-order-customer-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--primary-400)' }} /> Customer Details
              </h3>
              
              {/* Customer Mode Tabs */}
              <div className="admin-create-order-customer-tabs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`btn btn-sm ${customerMode === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '6px', fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                >
                  <User size={13} style={{ marginRight: '0.25rem' }} /> Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`btn btn-sm ${customerMode === 'new' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: '6px', fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                >
                  <UserPlus size={13} style={{ marginRight: '0.25rem' }} /> Enter New
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div>
                <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
                  <Search size={16} className="search-bar-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search customer by name, phone, or block..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                {/* Customer List Selection */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No registered customers found. Switch to "Enter New" tab to create one!
                    </div>
                  ) : (
                    filteredCustomers.map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: selectedCustomerId === cust.id ? '2px solid var(--primary-500)' : '1px solid rgba(255,255,255,0.08)',
                          background: selectedCustomerId === cust.id ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{cust.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                            <span>📞 {cust.phone || 'N/A'}</span>
                            <span>🏢 {cust.hostel_block || 'N/A'}</span>
                          </div>
                        </div>
                        {selectedCustomerId === cust.id && (
                          <CheckCircle2 size={18} style={{ color: 'var(--primary-400)' }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* New Customer Form */
              <div className="admin-create-order-new-customer-form">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full Name"
                    value={newCustomerDetails.name}
                    onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="10-digit Phone Number"
                    value={newCustomerDetails.phone}
                    onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, phone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Hostel Block *</label>
                  <select
                    className="form-input"
                    value={newCustomerDetails.hostel_block}
                    onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, hostel_block: e.target.value })}
                  >
                    <option value="F Block (Old)">F Block (Old)</option>
                    <option value="Others(A, B, C, D, F)">Others(A, B, C, D, F)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Email Address (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="customer@email.com"
                    value={newCustomerDetails.email}
                    onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, email: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Small-Sized Menu Selection */}
          <div className="glass-card" style={{ padding: '1.15rem' }}>
            <div className="admin-create-order-menu-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--primary-400)' }} /> Menu Items (Small Sized View)
              </h3>

              {/* Search Bar for Menu */}
              <div className="admin-create-order-menu-search-wrap">
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search item..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  style={{ paddingLeft: '2rem', paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '0.75rem', WebkitOverflowScrolling: 'touch' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`btn btn-sm ${selectedCategory === 'All' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.2rem 0.65rem', fontSize: '0.78rem', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.2rem 0.65rem', fontSize: '0.78rem', borderRadius: '9999px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Small-Sized Menu Grid */}
            <div 
              className="admin-create-order-menu-grid"
            >
              {filteredMenu.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No available items match your search.
                </div>
              ) : (
                filteredMenu.map(item => {
                  const qty = quantities[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: qty > 0 ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: qty > 0 ? '1.5px solid var(--primary-500)' : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '10px',
                        padding: '0.65rem 0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span 
                            style={{
                              fontSize: '0.62rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              background: item.is_veg !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: item.is_veg !== false ? 'var(--success)' : 'var(--danger)',
                              border: `1px solid ${item.is_veg !== false ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}
                          >
                            {item.is_veg !== false ? 'VEG' : 'NON-VEG'}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary-400)' }}>
                            ₹{item.price}
                          </span>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: '0.5rem', lineHeight: '1.2' }}>
                          {item.item_name}
                        </div>
                      </div>

                      {/* Small Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '0.15rem' }}>
                        <button
                          type="button"
                          onClick={() => handleDecrement(item.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.25rem 0.45rem', height: 'auto', minWidth: '28px', color: qty > 0 ? '#fff' : 'var(--text-muted)' }}
                          disabled={qty === 0}
                        >
                          <Minus size={12} />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => handleSetQuantity(item.id, e.target.value)}
                          style={{
                            width: '32px',
                            textAlign: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: qty > 0 ? 'var(--primary-400)' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleIncrement(item.id)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.25rem 0.45rem', height: 'auto', minWidth: '28px' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Checkout */}
        <div className="glass-card admin-create-order-summary-card" style={{ padding: '1.15rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} style={{ color: 'var(--primary-400)' }} /> Order Summary
          </h3>

          {/* Customer Badge */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Customer
            </div>
            {customerMode === 'existing' ? (
              selectedCustomerObj ? (
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{selectedCustomerObj.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    📞 {selectedCustomerObj.phone} | 🏢 {selectedCustomerObj.hostel_block}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                  ⚠️ No customer selected!
                </div>
              )
            ) : (
              newCustomerDetails.name ? (
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{newCustomerDetails.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    📞 {newCustomerDetails.phone || 'Pending'} | 🏢 {newCustomerDetails.hostel_block}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                  Enter details on the left form
                </div>
              )
            )}
          </div>

          {/* Selected Items List */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Selected Items ({cartItems.length})
            </div>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No items added yet. Click <strong>+</strong> on any menu item.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                {cartItems.map(item => (
                  <div
                    key={item.menuItem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ₹{item.price} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>
                        ₹{item.totalPrice}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetQuantity(item.menuItem, 0)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.1rem' }}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Status Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Initial Status</label>
              <select
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Method</label>
              <select
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="COD">COD (Cash)</option>
              </select>
            </div>
          </div>

          {/* Total & Submit Button */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Amount</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                ₹{cartTotal}
              </span>
            </div>

            <MotionButton
              className="btn btn-primary btn-block"
              onClick={handleSubmitOrder}
              disabled={submitting || cartItems.length === 0}
              style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700, gap: '0.5rem' }}
            >
              {submitting ? (
                <>Creating Order...</>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirm & Create Order #{customOrderNumber || '—'}
                </>
              )}
            </MotionButton>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateOrder;
