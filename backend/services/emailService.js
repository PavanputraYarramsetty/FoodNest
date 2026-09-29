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

const sendVerificationEmail = async (toEmail, otp) => {
  const subject = `${otp} is your verification code - AparnaCanteen`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #ea580c; margin: 0; font-size: 24px;">AparnaDevi Canteen</h2>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Hostel Dining & Online Ordering</p>
      </div>
      <div style="background-color: #fff7ed; border-radius: 10px; padding: 20px; border: 1px solid #ffedd5; text-align: center; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 14px 0;">Use the 6-digit verification code below to verify your email address:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; background-color: #ffffff; padding: 14px 24px; border-radius: 8px; border: 2px dashed #f97316; display: inline-block; font-family: 'Courier New', monospace;">
          ${otp}
        </div>
        <p style="color: #9a3412; font-size: 13px; margin: 14px 0 0 0; font-weight: 500;">⏱️ Valid for 10 minutes</p>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
        Enter this code directly in the canteen app to complete your email verification.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0; border-top: 1px solid #f3f4f6; padding-top: 12px;">
        If you did not request this code, please ignore this email or contact support at aparnadevicanteen@gmail.com.
      </p>
    </div>
  `;

  return sendEmail(toEmail, subject, html);
};

const sendPasswordResetEmail = async (toEmail, otp) => {
  const subject = `${otp} is your password reset OTP - AparnaCanteen`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #ea580c; margin: 0; font-size: 24px;">AparnaDevi Canteen</h2>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>
      <div style="background-color: #fff7ed; border-radius: 10px; padding: 20px; border: 1px solid #ffedd5; text-align: center; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 14px 0;">Use the 6-digit OTP code below to set a new password:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; background-color: #ffffff; padding: 14px 24px; border-radius: 8px; border: 2px dashed #f97316; display: inline-block; font-family: 'Courier New', monospace;">
          ${otp}
        </div>
        <p style="color: #9a3412; font-size: 13px; margin: 14px 0 0 0; font-weight: 500;">⏱️ Valid for 15 minutes</p>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
        Enter this code on the password reset screen along with your new password.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0; border-top: 1px solid #f3f4f6; padding-top: 12px;">
        If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
      </p>
    </div>
  `;

  return sendEmail(toEmail, subject, html);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmail
};
