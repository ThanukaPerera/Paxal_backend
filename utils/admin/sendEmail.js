const nodemailer = require("nodemailer");

/**
 * Professional Email Utility for Paxal PMS
 * Supports multiple email templates and robust error handling
 */

// Email Templates
const EMAIL_TEMPLATES = {
  // Verification code template
  verification: (code, userName = 'User') => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code - Paxal</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; text-align: center; }
            .code-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; display: inline-block; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Paxal Parcel Management</h1>
                <p>Secure Verification Code</p>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Please use the verification code below to complete your authentication:</p>
                <div class="code-box">
                    <div class="code">${code}</div>
                </div>
                <p>This code will expire in <strong>10 minutes</strong> for security purposes.</p>
                <div class="warning">
                    ⚠️ If you didn't request this code, please ignore this email and contact support immediately.
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2024 Paxal Parcel Management System. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Welcome email template
  welcome: (userName) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Paxal</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .feature { display: flex; align-items: center; margin: 20px 0; }
            .feature-icon { font-size: 24px; margin-right: 15px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Paxal!</h1>
                <p>Your journey begins here</p>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Welcome to the Paxal Parcel Management System. We're excited to have you on board!</p>
                
                <h3>What you can do with Paxal:</h3>
                <div class="feature">
                    <span class="feature-icon">📦</span>
                    <span>Track and manage your parcels in real-time</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🚚</span>
                    <span>Schedule pickups and deliveries</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">📊</span>
                    <span>Access comprehensive analytics and reports</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🔒</span>
                    <span>Secure and reliable parcel management</span>
                </div>
                
                <p>If you have any questions, our support team is here to help!</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Paxal Parcel Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Password reset template
  passwordReset: (resetLink, userName = 'User') => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Paxal</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #fd7e14 0%, #e63946 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; text-align: center; }
            .reset-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
                <p>Paxal Security</p>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${resetLink}" class="reset-button">Reset Password</a>
                <p>This link will expire in <strong>1 hour</strong> for security purposes.</p>
                <div class="warning">
                    ⚠️ If you didn't request this reset, please ignore this email and contact support.
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2024 Paxal Parcel Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  // Admin account creation template
  adminAccount: (password, userName = 'Admin', adminId) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Account Created - Paxal</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; text-align: center; }
            .credentials-box { background: #f8f9fa; border: 2px solid #6c5ce7; border-radius: 8px; padding: 20px; margin: 30px 0; }
            .password { font-size: 24px; font-weight: bold; color: #6c5ce7; letter-spacing: 2px; margin: 10px 0; }
            .admin-id { font-size: 18px; color: #495057; margin: 10px 0; }
            .security-note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
            .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔑 Admin Account Created</h1>
                <p>Paxal Administration</p>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Your admin account has been successfully created for the Paxal Parcel Management System.</p>
                
                <div class="credentials-box">
                    <h3>Your Login Credentials:</h3>
                    <div class="admin-id"><strong>Admin ID:</strong> ${adminId}</div>
                    <div class="password"><strong>Password:</strong> ${password}</div>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Security Notice:</strong> Please change your password immediately after your first login for security purposes.
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>Log in to the admin dashboard</li>
                    <li>Change your password</li>
                    <li>Complete your profile setup</li>
                    <li>Familiarize yourself with the admin features</li>
                </ul>
                
                <div class="warning">
                    ⚠️ Keep your credentials secure and do not share them with anyone.
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2024 Paxal Parcel Management System. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `
};

/**
 * Enhanced email service with professional templates and robust error handling
 * @param {Object} options - Email configuration options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - Custom HTML content
 * @param {string} [options.template] - Template type (verification, welcome, passwordReset, adminAccount)
 * @param {Object} [options.templateData] - Data for template rendering
 * @param {string} [options.templateData.code] - Verification code
 * @param {string} [options.templateData.userName] - User name
 * @param {string} [options.templateData.resetLink] - Password reset link
 * @param {string} [options.templateData.password] - Admin account password
 * @param {string} [options.templateData.adminId] - Admin ID
 * @returns {Promise<Object>} Success/failure response
 */
const sendEmail = async (options) => {
  // Input validation
  if (!options || typeof options !== 'object') {
    console.error('❌ Email Error: Invalid options provided');
    return { success: false, message: 'Invalid email options provided' };
  }

  // Validate required fields
  const requiredFields = ['to', 'subject'];
  for (const field of requiredFields) {
    if (!options[field]) {
      console.error(`❌ Email Error: Missing '${field}' field`);
      return { success: false, message: `Missing '${field}' field in email options` };
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    console.error('❌ Email Error: Invalid email format');
    return { success: false, message: 'Invalid email address format' };
  }

  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured in environment variables');
    }

    // Create transporter with enhanced configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // Max 10 emails per second
    });

    // Verify SMTP connection
    await transporter.verify();

    // Generate email content
    let htmlContent = options.html;
    let textContent = options.text;

    // Use template if specified
    if (options.template && EMAIL_TEMPLATES[options.template]) {
      const templateData = options.templateData || {};
      
      switch (options.template) {
        case 'verification':
          if (!templateData.code) {
            throw new Error('Verification code is required for verification template');
          }
          htmlContent = EMAIL_TEMPLATES.verification(templateData.code, templateData.userName);
          textContent = `Your Paxal verification code is: ${templateData.code}`;
          break;
          
        case 'welcome':
          htmlContent = EMAIL_TEMPLATES.welcome(templateData.userName || 'User');
          textContent = `Welcome to Paxal Parcel Management System, ${templateData.userName || 'User'}!`;
          break;
          
        case 'passwordReset':
          if (!templateData.resetLink) {
            throw new Error('Reset link is required for password reset template');
          }
          htmlContent = EMAIL_TEMPLATES.passwordReset(templateData.resetLink, templateData.userName);
          textContent = `Reset your Paxal password: ${templateData.resetLink}`;
          break;
          
        case 'adminAccount':
          if (!templateData.password) {
            throw new Error('Password is required for admin account template');
          }
          htmlContent = EMAIL_TEMPLATES.adminAccount(templateData.password, templateData.userName, templateData.adminId);
          textContent = `Your Paxal admin account has been created. Admin ID: ${templateData.adminId}, Password: ${templateData.password}. Please change your password after first login.`;
          break;
          
        default:
          throw new Error(`Unknown template type: ${options.template}`);
      }
    }

    // Fallback for custom HTML without template
    if (!htmlContent && !options.template) {
      throw new Error("Either 'html' content or 'template' type must be provided");
    }

    // Auto-generate text content from HTML if not provided
    if (!textContent && htmlContent) {
      // Extract verification code for backwards compatibility
      const codeMatch = htmlContent.match(/\d{6}/);
      if (codeMatch) {
        textContent = `Your Paxal verification code is: ${codeMatch[0]}`;
      } else {
        textContent = 'Please view this email in HTML format for the best experience.';
      }
    }

    // Configure mail options
    const mailOptions = {
      from: `"Paxal Support" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Mailer': 'Paxal-PMS v1.0',
        'X-Priority': '1',
      },
    };

    // Add attachments if provided
    if (options.attachments && Array.isArray(options.attachments)) {
      mailOptions.attachments = options.attachments;
    }

    console.log(`📧 Sending email to: ${options.to} | Subject: ${options.subject}`);
    
    // Send email with timeout
    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout')), 30000)
    );

    await Promise.race([emailPromise, timeoutPromise]);
    
    console.log('✅ Email sent successfully');
    
    // Close transporter connection
    transporter.close();
    
    return { 
      success: true, 
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
      recipient: options.to 
    };

  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      recipient: options.to,
      timestamp: new Date().toISOString()
    });

    // Categorize errors for better handling
    let errorCategory = 'UNKNOWN_ERROR';
    if (error.message.includes('authentication')) {
      errorCategory = 'AUTH_ERROR';
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      errorCategory = 'NETWORK_ERROR';
    } else if (error.message.includes('timeout')) {
      errorCategory = 'TIMEOUT_ERROR';
    } else if (error.message.includes('Invalid')) {
      errorCategory = 'VALIDATION_ERROR';
    }

    return { 
      success: false, 
      message: `Failed to send email: ${error.message}`,
      errorCategory,
      timestamp: new Date().toISOString(),
      recipient: options.to
    };
  }
};

module.exports = sendEmail;
