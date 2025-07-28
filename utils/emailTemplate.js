// utils/emailTemplates/otpTemplate.js

module.exports = (otp, purpose = "verify your email") => {
  return `
  <div style="font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f9fa; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
      <div style="background: #1f818c; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 40px; font-weight: 600; margin: 0;"> PAXAL</h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0;">Welcome To Your Parcel Management Solution</p>
      </div>
      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #444;">Hello there,</p>
        <p style="font-size: 16px; color: #444;">Use the OTP below to ${purpose}:</p>
        <div style="background: #f0f8f8; border-left: 4px solid #1f818c; padding: 25px; text-align: center; border-radius: 8px; box-shadow: 0 3px 10px rgba(31, 129, 140, 0.1);">
          <span style="font-size: 36px; font-weight: 700; color: #1f818c; letter-spacing: 3px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">This code will expire soon. Please do not share it with anyone.</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <p style="font-size: 14px; color: #666; font-weight: 600;">Need help?</p>
          <p style="font-size: 14px; color: #666;">Contact our <a href="mailto:support@paxal.com" style="color: #1f818c;">support team</a>.</p>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">
          Best regards,<br />
          <strong style="color: #1f818c;">The Paxal Team</strong>
        </p>
      </div>
      <div style="background-color: #f1f5f6; text-align: center; padding: 20px; font-size: 12px; color: #888;">
        <p>© ${new Date().getFullYear()} Paxal. All rights reserved.<br />123 Business Street, City, Country</p>
      </div>
    </div>
  </div>
  `;
};
