const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../db');
const emailService = require('../services/emailService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/register — Register a new customer
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, confirmPassword, hostelBlock, email } = req.body;

    if (!name || !phone || !password || !hostelBlock || !email) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if phone already exists
    const trimmedPhone = phone.trim();

    // Validate phone number format
    const phoneRegex = /^(?:\+91|91)?\d{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number (10 digits, or 12/13 digits starting with 91 or +91)' });
    }

    const tenDigitPhone = trimmedPhone.slice(-10);
    const possibleFormats = [tenDigitPhone, `91${tenDigitPhone}`, `+91${tenDigitPhone}`];

    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .in('phone', possibleFormats)
      .maybeSingle();

    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationOtp = generateOtp();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const { error } = await supabase.from('users').insert({
      name: name.trim(),
      phone: trimmedPhone,
      email: trimmedEmail,
      password: hashedPassword,
      hostel_block: hostelBlock,
      role: 'customer',
      verification_token: verificationOtp,
      verification_expires: verificationExpires.toISOString(),
      email_verified: false
    });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    try {
      await emailService.sendVerificationEmail(trimmedEmail, verificationOtp);
    } catch (emailErr) {
      console.error('Failed to send verification OTP during registration', emailErr);
    }

    res.status(201).json({
      success: true,
      message: `Registration successful! A 6-digit verification code has been sent to ${trimmedEmail}.`,
      email: trimmedEmail
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login — Login (universal email or phone identifier)
router.post('/login', async (req, res) => {
  try {
    const { identifier, phone, email, password, role } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    let query = supabase.from('users').select('*');

    // 1. Support new unified identifier
    if (identifier) {
      const trimmed = identifier.trim();
      if (trimmed.includes('@')) {
        query = query.eq('email', trimmed.toLowerCase());
      } else {
        const phoneRegex = /^(?:\+91|91)?\d{10}$/;
        if (phoneRegex.test(trimmed)) {
          const tenDigitPhone = trimmed.slice(-10);
          const possibleFormats = [tenDigitPhone, `91${tenDigitPhone}`, `+91${tenDigitPhone}`];
          query = query.in('phone', possibleFormats);
        } else {
          query = query.eq('phone', trimmed);
        }
      }
    }
    // 2. Support legacy role-based login format for backward compatibility
    else if (role === 'admin') {
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required for admin login' });
      }
      query = query.eq('email', email.trim().toLowerCase()).eq('role', 'admin');
    } else {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }
      const trimmed = phone.trim();
      const phoneRegex = /^(?:\+91|91)?\d{10}$/;
      if (phoneRegex.test(trimmed)) {
        const tenDigitPhone = trimmed.slice(-10);
        const possibleFormats = [tenDigitPhone, `91${tenDigitPhone}`, `+91${tenDigitPhone}`];
        query = query.in('phone', possibleFormats).eq('role', 'customer');
      } else {
        query = query.eq('phone', trimmed).eq('role', 'customer');
      }
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please sign up.' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        email_verified: user.email_verified,
        hostelBlock: user.hostel_block
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/update-email — Update user email and send 6-digit OTP
router.put('/update-email', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    // Check if email is already used by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .neq('id', req.user.id)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use by another account' });
    }

    const verificationOtp = generateOtp();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Update details in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        email: trimmedEmail,
        verification_token: verificationOtp,
        verification_expires: verificationExpires.toISOString(),
        email_verified: false
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    try {
      await emailService.sendVerificationEmail(trimmedEmail, verificationOtp);
    } catch (emailErr) {
      console.error('Failed to send verification OTP during update', emailErr);
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${trimmedEmail}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        email: updatedUser.email,
        email_verified: updatedUser.email_verified,
        hostelBlock: updatedUser.hostel_block
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/profile — Update user profile details
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, hostelBlock } = req.body;

    if (!name || !phone || !hostelBlock) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const trimmedPhone = phone.trim();

    // Validate phone number format
    const phoneRegex = /^(?:\+91|91)?\d{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number (10 digits, or 12/13 digits starting with 91 or +91)' });
    }

    // Check if phone number is already registered by another user
    const tenDigitPhone = trimmedPhone.slice(-10);
    const possibleFormats = [tenDigitPhone, `91${tenDigitPhone}`, `+91${tenDigitPhone}`];

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .in('phone', possibleFormats)
      .neq('id', req.user.id)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already in use by another account' });
    }

    // Update details in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        phone: trimmedPhone,
        hostel_block: hostelBlock
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        email: updatedUser.email,
        email_verified: updatedUser.email_verified,
        hostelBlock: updatedUser.hostel_block
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/password — Change user password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Retrieve user password hash from DB
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve account data' });
    }

    const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id);

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/verify-otp & /api/auth/verify-email — Verify email using 6-digit OTP or token
router.post(['/verify-otp', '/verify-email'], async (req, res) => {
  try {
    const { otp, token, email, identifier } = req.body;
    const code = (otp || token || '').toString().trim();

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    let query = supabase.from('users').select('id, name, role, phone, email, email_verified, hostel_block, verification_token, verification_expires');

    // If email or identifier is given, match specifically
    const lookupValue = (email || identifier || '').trim().toLowerCase();
    if (lookupValue) {
      if (lookupValue.includes('@')) {
        query = query.eq('email', lookupValue);
      } else {
        const phoneRegex = /^(?:\+91|91)?\d{10}$/;
        if (phoneRegex.test(lookupValue)) {
          const tenDigit = lookupValue.slice(-10);
          query = query.in('phone', [tenDigit, `91${tenDigit}`, `+91${tenDigit}`]);
        } else {
          query = query.eq('phone', lookupValue);
        }
      }
    } else {
      // Direct token match
      query = query.eq('verification_token', code);
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user) {
      return res.status(400).json({ success: false, message: 'Account or verification code not found' });
    }

    if (!user.verification_token || user.verification_token.trim() !== code) {
      return res.status(400).json({ success: false, message: 'Incorrect 6-digit verification code. Please check and try again.' });
    }

    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please click "Resend Code".' });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true, 
        verification_token: null, 
        verification_expires: null 
      })
      .eq('id', user.id)
      .select('id, name, role, phone, email, email_verified, hostel_block')
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    const jwtToken = generateToken(updatedUser.id, updatedUser.role);

    res.json({ 
      success: true, 
      message: 'Email verified successfully!',
      token: jwtToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        email: updatedUser.email,
        email_verified: updatedUser.email_verified,
        hostelBlock: updatedUser.hostel_block
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/resend-verification — Resend 6-digit OTP (Supports both logged-in and public requests)
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, identifier } = req.body;
    let userId = null;

    // Check if user has an auth token in header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Continue with public lookup
      }
    }

    let query = supabase.from('users').select('id, name, email, email_verified');

    if (userId) {
      query = query.eq('id', userId);
    } else {
      const lookup = (email || identifier || '').trim().toLowerCase();
      if (!lookup) {
        return res.status(400).json({ success: false, message: 'Email address or identifier is required' });
      }
      if (lookup.includes('@')) {
        query = query.eq('email', lookup);
      } else {
        const phoneRegex = /^(?:\+91|91)?\d{10}$/;
        if (phoneRegex.test(lookup)) {
          const tenDigit = lookup.slice(-10);
          query = query.in('phone', [tenDigit, `91${tenDigit}`, `+91${tenDigit}`]);
        } else {
          query = query.eq('phone', lookup);
        }
      }
    }

    const { data: currentUser, error } = await query.maybeSingle();

    if (error || !currentUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    let targetEmail = currentUser.email;

    // If new email is supplied in body
    if (email && email.trim() && email.trim().toLowerCase() !== currentUser.email) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', trimmedEmail)
        .neq('id', currentUser.id)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered by another account' });
      }

      targetEmail = trimmedEmail;
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'No email address registered on this account' });
    }

    if (currentUser.email_verified && targetEmail === currentUser.email) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const verificationOtp = generateOtp();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        email: targetEmail,
        email_verified: false,
        verification_token: verificationOtp,
        verification_expires: verificationExpires.toISOString()
      })
      .eq('id', currentUser.id)
      .select('id, name, role, phone, email, email_verified, hostel_block')
      .single();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    try {
      await emailService.sendVerificationEmail(targetEmail, verificationOtp);
      res.json({ 
        success: true, 
        message: `Verification code sent to ${targetEmail}`,
        email: targetEmail,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          role: updatedUser.role,
          phone: updatedUser.phone,
          email: updatedUser.email,
          email_verified: updatedUser.email_verified,
          hostelBlock: updatedUser.hostel_block
        }
      });
    } catch (emailErr) {
      console.error('Failed to send verification OTP email', emailErr);
      res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/check-verification
router.post('/check-verification', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.json({ success: true, isVerified: false });
    }

    const value = identifier.trim().toLowerCase();
    const isEmail = value.includes('@');

    let query = supabase.from('users').select('id, email, email_verified, role');
    if (isEmail) {
      query = query.eq('email', value);
    } else {
      const phoneRegex = /^(?:\+91|91)?\d{10}$/;
      if (phoneRegex.test(value)) {
        const tenDigit = value.slice(-10);
        query = query.in('phone', [tenDigit, `91${tenDigit}`, `+91${tenDigit}`]);
      } else {
        query = query.eq('phone', value);
      }
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user) {
      return res.json({ success: true, isVerified: false });
    }

    // Admins never require verification checks
    if (user.role === 'admin') {
      return res.json({
        success: true,
        isVerified: true,
        isAdmin: true
      });
    }

    return res.json({
      success: true,
      isVerified: !!user.email_verified
    });
  } catch (err) {
    return res.json({ success: false, isVerified: false });
  }
});

// POST /api/auth/forgot-password — Request 6-digit Password Reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const lookup = (email || identifier || '').trim().toLowerCase();

    if (!lookup) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email address' });
    }

    let query = supabase.from('users').select('id, name, email, email_verified');
    if (lookup.includes('@')) {
      query = query.eq('email', lookup);
    } else {
      const phoneRegex = /^(?:\+91|91)?\d{10}$/;
      if (phoneRegex.test(lookup)) {
        const tenDigit = lookup.slice(-10);
        query = query.in('phone', [tenDigit, `91${tenDigit}`, `+91${tenDigit}`]);
      } else {
        query = query.eq('phone', lookup);
      }
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user || !user.email) {
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a 6-digit OTP has been sent.' 
      });
    }

    const resetOtp = generateOtp();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        reset_token: resetOtp,
        reset_expires: resetExpires.toISOString()
      })
      .eq('id', user.id);

    if (!updateError) {
      try {
        await emailService.sendPasswordResetEmail(user.email, resetOtp);
      } catch (emailErr) {
        console.error('Failed to send password reset OTP email', emailErr);
      }
    }

    res.json({ 
      success: true, 
      message: `A 6-digit password reset OTP has been sent to ${user.email}`,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/reset-password — Reset password using 6-digit OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, identifier, otp, token, newPassword, confirmPassword } = req.body;
    const code = (otp || token || '').toString().trim();

    if (!code || !newPassword) {
      return res.status(400).json({ success: false, message: 'OTP code and new password are required' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let query = supabase.from('users').select('id, name, email, reset_token, reset_expires');
    const lookup = (email || identifier || '').trim().toLowerCase();

    if (lookup) {
      if (lookup.includes('@')) {
        query = query.eq('email', lookup);
      } else {
        const phoneRegex = /^(?:\+91|91)?\d{10}$/;
        if (phoneRegex.test(lookup)) {
          const tenDigit = lookup.slice(-10);
          query = query.in('phone', [tenDigit, `91${tenDigit}`, `+91${tenDigit}`]);
        } else {
          query = query.eq('phone', lookup);
        }
      }
    } else {
      query = query.eq('reset_token', code);
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user) {
      return res.status(400).json({ success: false, message: 'Invalid reset code or account not found' });
    }

    if (!user.reset_token || user.reset_token.trim() !== code) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit OTP code. Please check your email and try again.' });
    }

    if (user.reset_expires && new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Password reset OTP has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        reset_token: null,
        reset_expires: null
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    res.json({ 
      success: true, 
      message: 'Password reset successfully! You can now sign in with your new password.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
