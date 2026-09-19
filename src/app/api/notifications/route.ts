import { NextResponse } from 'next/server';
import { resend, EMAIL_FROM, CEO_EMAIL } from '@/lib/resend';
import { InternWelcomeEmail } from '@/emails/templates/InternWelcomeEmail';
import { StartupWelcomeEmail } from '@/emails/templates/StartupWelcomeEmail';
import React from 'react';
import { render } from '@react-email/render';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipientEmail, name, companyName } = body;

    if (!recipientEmail || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let subject = '';
    let htmlContent = '';

    if (type === 'intern_welcome') {
      subject = 'Welcome to D Global Growthfield Apprenticeship';
      htmlContent = await render(React.createElement(InternWelcomeEmail, { name: name || 'Apprentice' }));
    } else if (type === 'startup_welcome') {
      subject = 'Welcome to DGG Startup & Escrow Hub';
      htmlContent = await render(React.createElement(StartupWelcomeEmail, { companyName: companyName || 'Startup Partner', contactName: name || 'Partner' }));
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Send email via Resend from CEO / Platform Identity
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [recipientEmail],
      replyTo: CEO_EMAIL,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}