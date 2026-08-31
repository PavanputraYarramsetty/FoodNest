import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Home, UtensilsCrossed, ClipboardList, User, HelpCircle, Menu, X, Megaphone, MessageSquarePlus, Bell, ChefHat, CheckCircle2 } from 'lucide-react';
import AppSidebar from '../components/layout/AppSidebar';
import PageTransition from '../components/ui/PageTransition';

const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customerToast, setCustomerToast] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const prevCustomerOrdersRef = useRef([]);
  const isCustomerFirstLoad = useRef(true);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // Unlock Audio Context on first click/touch
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // Live background polling for customer orders
    pollCustomerOrders();
    const interval = setInterval(pollCustomerOrders, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const playCustomerChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(880, now + 0.15); // A5

      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.setValueAtTime(440, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  const pollCustomerOrders = async () => {
    try {
      const res = await axios.get('/orders/me');
      const orders = res.data.data || [];

      if (isCustomerFirstLoad.current) {
        prevCustomerOrdersRef.current = orders;
        isCustomerFirstLoad.current = false;
        return;
      }

      // Check for status changes
      orders.forEach(newOrder => {
        const prev = prevCustomerOrdersRef.current.find(o => o.id === newOrder.id);
        const displayId = newOrder.id ? newOrder.id.substring(0, 6).toUpperCase() : 'ORDER';

        if (prev && prev.status !== newOrder.status) {
          if (newOrder.status === 'Preparing') {
            setCustomerToast({
              id: newOrder.id,
              type: 'Preparing',
              title: '👨‍🍳 Kitchen Update',
              message: `Order #${displayId} is now being PREPARING in the kitchen!`
            });
            playCustomerChime();
          } else if (newOrder.status === 'Completed') {
            setCustomerToast({
              id: newOrder.id,
              type: 'Completed',
              title: '✅ Order Completed',
              message: `Order #${displayId} is COMPLETED! Thank you for ordering!!`
            });
            playCustomerChime();
          }
        }
      });

      prevCustomerOrdersRef.current = orders;
    } catch (err) {
      console.error('Customer poll error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/customer/home', icon: Home, label: 'Home' },
    { to: '/customer/menu', icon: UtensilsCrossed, label: 'Menu' },
    { to: '/customer/orders', icon: ClipboardList, label: 'My Orders' },
    { to: '/customer/feedback', icon: MessageSquarePlus, label: 'Give Feedback' },
    { to: '/customer/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
    { to: '/customer/support', icon: HelpCircle, label: 'Support' },
  ];

  return (
    <div className="app-layout">
      {/* Floating Top Notification Toast Banner */}
      <AnimatePresence>
        {customerToast && (
          <motion.div
            className="new-order-toast-banner"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            onClick={() => {
              navigate('/customer/orders');
              setCustomerToast(null);
            }}
            style={{
              background: customerToast.type === 'Completed'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {customerToast.type === 'Completed' ? <CheckCircle2 size={24} /> : <ChefHat size={24} />}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{customerToast.title}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>{customerToast.message}</div>
              </div>
            </div>
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setCustomerToast(null);
              }}
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        id="hamburger-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={sidebarOpen}
        whileTap={{ scale: 0.95 }}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </motion.button>

      <AppSidebar
        brand="AparnaCanteen"
        navLinks={navLinks}
        user={user}
        userRole={user?.role}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logoutId="logout-btn"
      />

      <main className="main-content">
        <PageTransition>
          <div className="page-container">
            <Outlet />
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default CustomerLayout;
