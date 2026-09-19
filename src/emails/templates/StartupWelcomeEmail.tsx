import React from 'react';

interface StartupWelcomeEmailProps {
  companyName: string;
  contactName: string;
}

export function StartupWelcomeEmail({ companyName, contactName }: StartupWelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', backgroundColor: '#f8fafc', padding: '40px 20px', color: '#1e293b' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '6px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            DGG Enterprise Partner
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '16px' }}>
            Welcome to DGG Startup Hub, {companyName}!
          </h1>
        </div>

        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          Dear {contactName},
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          On behalf of the team at D Global Growthfield, I am delighted to welcome {companyName} to our enterprise ecosystem. You now have direct access to vetted elite engineering talent, secure escrow vaults, and automated milestone disbursements.
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          Whether you are scaling your web infrastructure or deploying dedicated trial stipends, our platform is built to safeguard your capital and accelerate your startup milestones.
        </p>

        <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#fff7ed', borderRadius: '16px', border: '1px solid #fed7aa' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#c2410c', margin: '0 0 4px 0' }}>Scorefield</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>Chief Executive Officer, D Global Growthfield</p>
        </div>
      </div>
    </div>
  );
}