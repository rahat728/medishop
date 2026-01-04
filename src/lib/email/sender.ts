
import nodemailer from 'nodemailer';
import { emailTemplates } from './templates';

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: EmailOptions) {
    // If no credentials are set, just log the email (for dev)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('--- DEV EMAIL LOG ---');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('----------------------');
        return { messageId: 'dev-mode-log' };
    }

    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${options.to}:`, info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw to prevent blocking the app flow
        return null;
    }
}

export async function sendOrderConfirmationEmail(order: any, email: string) {
    const template = emailTemplates.orderConfirmation(order);
    await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
    });
}

export async function sendOrderDeliveredEmail(order: any, email: string) {
    const template = emailTemplates.orderDelivered(order);
    await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
    });
}

export async function sendOrderCancelledEmail(order: any, email: string) {
    const template = emailTemplates.orderCancelled(order);
    await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
    });
}
