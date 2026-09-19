import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

export const EMAIL_FROM = `${process.env.EMAIL_FROM_NAME || 'D Global Growthfield'} <${process.env.EMAIL_FROM_ADDRESS || 'notifications@dglobalgrowthfield.com'}>`;
export const CEO_EMAIL = process.env.CEO_EMAIL_ADDRESS || 'scorefield@dglobalgrowthfield.com';