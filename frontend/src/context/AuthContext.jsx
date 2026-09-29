import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const resolveApiUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  if (import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return 'https://aparnadevicanteen.onrender.com/api';
};

const API_URL = resolveApiUrl();

// Configure axios defaults
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('foodnest_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const savedUser = localStorage.getItem('foodnest_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = useCallback(async (credentials) => {
    const res = await axios.post('/auth/login', credentials);
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('foodnest_token', newToken);
    localStorage.setItem('foodnest_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await axios.post('/auth/register', data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('foodnest_token');
    localStorage.removeItem('foodnest_user');
    sessionStorage.removeItem('dosa_modal_shown');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Global Axios Interceptor for 401 Unauthorized (Expired Tokens)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            toast.error('Session expired. Please log in again.', { id: 'session-expired' });
            logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('foodnest_user', JSON.stringify(userData));
  }, []);

  const updateEmail = useCallback(async (email) => {
    const res = await axios.put('/auth/update-email', { email });
    const updatedUser = res.data.user;
    if (updatedUser) {
      updateUser(updatedUser);
    }
    return res.data;
  }, [updateUser]);

  const resendVerification = useCallback(async (email, identifier) => {
    const res = await axios.post('/auth/resend-verification', { email, identifier });
    if (res.data?.user) {
      updateUser(res.data.user);
    }
    return res.data;
  }, [updateUser]);

  const verifyEmail = useCallback(async (tokenOrOtp, email = null) => {
    const res = await axios.post('/auth/verify-otp', { 
      otp: tokenOrOtp, 
      token: tokenOrOtp,
      email: email || user?.email 
    });
    if (res.data?.token) {
      setToken(res.data.token);
      localStorage.setItem('foodnest_token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    }
    if (res.data?.user) {
      updateUser(res.data.user);
    } else if (user) {
      updateUser({ ...user, email_verified: true });
    }
    return res.data;
  }, [updateUser, user]);

  const checkVerificationStatus = useCallback(async (identifier) => {
    try {
      const res = await axios.post('/auth/check-verification', { identifier });
      return res.data;
    } catch {
      return { success: false, isVerified: false };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const res = await axios.post('/auth/forgot-password', { email });
    return res.data;
  }, []);

  const resetPassword = useCallback(async (tokenOrOtp, newPassword, confirmPassword, email = null) => {
    // Support object or arguments
    const payload = typeof tokenOrOtp === 'object' && tokenOrOtp !== null
      ? tokenOrOtp
      : { otp: tokenOrOtp, token: tokenOrOtp, newPassword, confirmPassword, email };

    const res = await axios.post('/auth/reset-password', payload);
    return res.data;
  }, []);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateEmail,
    resendVerification,
    verifyEmail,
    checkVerificationStatus,
    forgotPassword,
    resetPassword,
    isAuthenticated,
    isAdmin,
  }), [
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateEmail,
    resendVerification,
    verifyEmail,
    checkVerificationStatus,
    forgotPassword,
    resetPassword,
    isAuthenticated,
    isAdmin,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
