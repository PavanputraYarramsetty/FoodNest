const sendEmail = async (toEmail, subject, htmlContent) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('BREVO_API_KEY is not defined. Email will not be sent.');
    return;
  }

  const payload = {
    sender: {
      name: process.env.BREVO_SENDER_NAME || 'AparnaCanteen',
      email: process.env.BREVO_SENDER_EMAIL || 'aparnadevicanteen@gmail.com'
    },
    to: [
      {
        email: toEmail
      }
    ],
    subject: subject,
    htmlContent: htmlContent
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Brevo API Error:', errorData);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Email sent successfully, messageId:', data.messageId);
    return data;
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    throw error;
  }
};

const sendVerificationEmail = async (toEmail, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

  const subject = 'Verify your email address - AparnaCanteen';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #CC9149;">Welcome to AparnaCanteen!</h2>
      <p style="color: #333; font-size: 16px;">Thank you for providing your email address. Please verify it to continue using the application securely.</p>
      <p style="color: #333; font-size: 16px;">Click the link below to verify your email (this link expires in 24 hours):</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #CC9149; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email</a>
      </div>
      <p style="color: #666; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail(toEmail, subject, html);
};

const sendPasswordResetEmail = async (toEmail, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

  const subject = 'Password Reset Request - AparnaCanteen';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #CC9149;">Password Reset Request</h2>
      <p style="color: #333; font-size: 16px;">We received a request to reset your password for your AparnaCanteen account.</p>
      <p style="color: #333; font-size: 16px;">Click the button below to create a new password (this link expires in 1 hour):</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #CC9149; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  `;

  return sendEmail(toEmail, subject, html);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmail
};
