import React from 'react';

interface InternWelcomeEmailProps {
  name: string;
}

export function InternWelcomeEmail({ name }: InternWelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', backgroundColor: '#f8fafc', padding: '40px 20px', color: '#1e293b' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ backgroundColor: '#f3e8ff', color: '#512d7c', padding: '6px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            D Global Growthfield
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '16px' }}>
            Welcome to the Elite Apprenticeship, {name}!
          </h1>
        </div>

        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          Dear {name},
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          I am personally thrilled to welcome you to D Global Growthfield (DGG). You have stepped into an environment engineered for high-performance software engineering, digital excellence, and professional growth.
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
          Over the coming weeks, you will work on real-world production architectures, collaborate with top startups, and refine your technical mastery under rigorous mentorship. Commit fully, build relentlessly, and make your mark.
        </p>

        <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#faf5ff', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#512d7c', margin: '0 0 4px 0' }}>Scorefield</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>Chief Executive Officer, D Global Growthfield</p>
        </div>
      </div>
    </div>
  );
}