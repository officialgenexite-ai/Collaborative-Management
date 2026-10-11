
const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

let transporter = createTransporter();

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('Email transporter verified successfully.');
  } catch (error) {
    console.error('Email transporter verification failed:', error);
    transporter = createTransporter();
  }
};

const sendMailWithRetry = async (mailOptions, retries = 2) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 1) {
        transporter = createTransporter();
      }
      await transporter.verify();
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      console.error(`EmailService send attempt ${attempt} failed:`, error?.message || error);
      if (attempt < retries && error?.code === 'ECONNECTION') {
        transporter = createTransporter();
      } else if (attempt < retries) {
        transporter = createTransporter();
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
};

verifyTransporter();

/**
 * Send 6-Digit OTP verification email to user
 * @param {string} email - User's email
 * @param {string} otp - 6-Digit OTP Code
 */
exports.sendVerificationEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome to Our Store! 🎉</h2>
          <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your verification:</p>
          
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #555;">Your Verification OTP:</p>
            <h1 style="margin: 10px 0; font-size: 36px; letter-spacing: 8px; color: #4CAF50; font-family: monospace;">${otp}</h1>
          </div>
          
          <p>This code is highly confidential and will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    };

    const info = await sendMailWithRetry(mailOptions, 3);
    console.log('Verification OTP email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send order confirmation email
 * @param {string} email - User's email
 * @param {Object} order - Order details
 */
exports.sendOrderConfirmation = async (email, order) => {
  try {
    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
      to: email,
      bcc: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `Order Confirmed - #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4CAF50;">📦 Order Confirmed!</h2>
          <p>Hi ${order.customerName || 'Customer'}, thank you for your purchase. Your payment was processed successfully via Stripe.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> $${Number(order.totalAmount || 0).toFixed(2)}</p>
            <p><strong>Status:</strong> Shipped</p>
          </div>
          
          <p>Your invoice is attached below for download or printing.</p>
          <p>You can track the live status of your delivery directly from your account dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">This is an automated receipt. Please do not reply directly.</p>
        </div>
      `,
      attachments: []
    };

    if (order.invoicePath) {
      mailOptions.attachments.push({
        filename: `invoice-${order._id}.pdf`,
        path: order.invoicePath
      });
    }

    const info = await sendMailWithRetry(mailOptions, 3);
    console.log('Order confirmation email sent to:', email, 'messageId:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    throw error;
  }
};

/**
 * Send workspace invitation email
 * @param {Object} options
 * @param {string} options.to - Invitee email
 * @param {string} options.workspaceName - Workspace name
 * @param {string} options.inviterName - Name of person who sent invite
 * @param {string} options.role - Role being offered
 * @param {string} options.acceptUrl - URL to accept the invite
 */
exports.sendWorkspaceInviteEmail = async ({
  to,
  workspaceName,
  inviterName,
  role,
  acceptUrl,
}) => {
  try {
    const mailOptions = {
      from: `"Collaborative Management" <${process.env.EMAIL_USER}>`,
      to,
      subject: `You're invited to join "${workspaceName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Workspace Invitation</h2>
          <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>"${workspaceName}"</strong> as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept the invitation. You'll need to log in or register with this email address (<strong>${to}</strong>).</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}"
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${acceptUrl}</p>
          <p style="color: #999; font-size: 12px;">This invitation expires in 7 days.</p>
        </div>
      `,
    };

    const info = await sendMailWithRetry(mailOptions, 3);
    console.log('Workspace invite email sent to:', to, 'messageId:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending workspace invite email:', error);
    throw new Error('Failed to send workspace invite email');
  }
};

/**
 * Notify an existing user they were added to a workspace
 */
exports.sendWorkspaceAddedEmail = async ({
  to,
  workspaceName,
  inviterName,
  role,
  workspaceUrl,
}) => {
  try {
    const mailOptions = {
      from: `"Collaborative Management" <${process.env.EMAIL_USER}>`,
      to,
      subject: `You've been added to "${workspaceName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to ${workspaceName}</h2>
          <p><strong>${inviterName}</strong> added you to the workspace <strong>"${workspaceName}"</strong> as a <strong>${role}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${workspaceUrl}"
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Open Workspace
            </a>
          </div>
        </div>
      `,
    };

    const info = await sendMailWithRetry(mailOptions, 3);
    console.log('Workspace added email sent to:', to, 'messageId:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending workspace added email:', error);
    throw new Error('Failed to send workspace added email');
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} resetToken - Password reset token
 */
exports.sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #007bff; text-align: center;">🔒 Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to secure your account and set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #007bff; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px;">This link will strictly expire in 1 hour.</p>
        </div>
      `,
    };

    await sendMailWithRetry(mailOptions, 3);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};
