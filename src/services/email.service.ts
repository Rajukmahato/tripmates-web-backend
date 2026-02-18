import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM, FRONTEND_URL } from '../configs';

export class EmailService {
    private transporter;
    private isConfigured: boolean;

    constructor() {
        this.isConfigured = !!EMAIL_USER && !!EMAIL_PASSWORD && !!EMAIL_HOST;
        
        if (!this.isConfigured) {
            console.warn('⚠️  Email service not fully configured. Missing credentials.');
            console.warn('   EMAIL_HOST:', EMAIL_HOST ? '✓' : '✗');
            console.warn('   EMAIL_USER:', EMAIL_USER ? '✓' : '✗');
            console.warn('   EMAIL_PASSWORD:', EMAIL_PASSWORD ? '✓' : '✗');
        }
        
        this.transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: false,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD,
            },
        });
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified');
            return true;
        } catch (error: any) {
            console.error('❌ Email service connection failed:', error?.message);
            return false;
        }
    }

    async sendPasswordResetEmail(email: string, resetToken: string, userName: string, platform: string = 'web') {
        console.log('🌐 EmailService.sendPasswordResetEmail called with:', {
            platform,
            platformType: typeof platform,
            email,
            FRONTEND_URL
        });

        // Generate platform-specific reset URL
        let resetUrl: string;
        
        if (platform === 'android') {
            // Android app deep link
            resetUrl = `tripmates://reset-password/?token=${resetToken}`;
            console.log('📱 Generated Android deep link:', resetUrl);
        } else if (platform === 'ios') {
            // iOS app deep link
            resetUrl = `tripmates://reset-password/?token=${resetToken}`;
            console.log('📱 Generated iOS deep link:', resetUrl);
        } else {
            // Web browser URL (default)
            resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
            console.log('🌐 Generated Web URL:', resetUrl);
        }

        const mailOptions = {
            from: EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request - TripMates',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${userName},</p>
                    <p>You have requested to reset your password. Click the button below to reset it:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    ${platform === 'android' || platform === 'ios' ? `
                        <p style="background-color: #f0f0f0; padding: 12px; border-radius: 4px; margin: 20px 0;">
                            <strong>📱 Mobile App Link:</strong><br/>
                            This link will open directly in the TripMates app.
                        </p>
                    ` : `
                        <p style="background-color: #f0f0f0; padding: 12px; border-radius: 4px; margin: 20px 0;">
                            <strong>🌐 Web Link:</strong><br/>
                            This link will open in your web browser.
                        </p>
                    `}
                    <p>Or copy and paste this link:</p>
                    <p style="color: #007bff; word-break: break-all; background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${resetUrl}</p>
                    <p><strong>⏱️ This link will expire in 1 hour.</strong></p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated email. Please do not reply.<br/>
                        If you have any issues, please contact support.
                    </p>
                </div>
            `,
        };

        try {
            // Verify transporter is configured
            if (!EMAIL_USER || !EMAIL_PASSWORD) {
                throw new Error('Email service not properly configured. Missing EMAIL_USER or EMAIL_PASSWORD.');
            }
            
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown email error';
            console.error('❌ Error sending password reset email:', errorMessage);
            console.error('Email config - Host:', EMAIL_HOST, 'Port:', EMAIL_PORT, 'User:', EMAIL_USER ? '***' : 'NOT_SET');
            throw new Error(`Failed to send reset email: ${errorMessage}`);
        }
    }

    async sendPasswordResetConfirmation(email: string, userName: string) {
        const mailOptions = {
            from: EMAIL_FROM,
            to: email,
            subject: 'Password Reset Successful - TripMates',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Successful</h2>
                    <p>Hello ${userName},</p>
                    <p>Your password has been successfully reset.</p>
                    <p>If you didn't make this change, please contact support immediately.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated email. Please do not reply.
                    </p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            return false;
        }
    }
}
