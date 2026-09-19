import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('to') || 'https://dglobalgrowthfield.com';
  const ref = searchParams.get('ref') || '';
  const campaign = searchParams.get('campaign') || 'direct';

  if (ref) {
    try {
      // 1. Resolve Geo and IP info from headers
      const forwarded = req.headers.get('x-forwarded-for');
      const visitorIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
      const visitorCity = req.headers.get('x-vercel-ip-city') || 'Lagos';
      const visitorCountry = req.headers.get('x-vercel-ip-country') || 'NG';

      // 2. Locate Intern by either subdomain handle or NHC ID
      const { data: intern } = await supabaseAdmin
        .from('intern_profiles')
        .select('id, referral_clicks')
        .or(`subdomain_handle.eq.${ref},nhc_id.eq.${ref}`)
        .maybeSingle();

      if (intern) {
        // 3. Log click directly to the ledger
        await supabaseAdmin.from('referral_clicks_ledger').insert({
          intern_id: intern.id,
          subdomain_handle: ref,
          target_page: target,
          visitor_ip: visitorIp,
          visitor_city: visitorCity,
          visitor_country: visitorCountry,
          device_type: 'Outbound / Deep-Link',
          duration_seconds: 5,
        });

        // 4. Increment overall counter
        await supabaseAdmin
          .from('intern_profiles')
          .update({ referral_clicks: (intern.referral_clicks || 0) + 1 })
          .eq('id', intern.id);
      }
    } catch (err) {
      console.error('Outbound tracking redirect error:', err);
    }
  }

  // 5. Ensure valid destination URL and preserve affiliate query parameters
  try {
    const destinationUrl = new URL(target.startsWith('http') ? target : `https://${target}`);
    if (ref) destinationUrl.searchParams.set('ref', ref);
    if (campaign) destinationUrl.searchParams.set('campaign', campaign);
    return NextResponse.redirect(destinationUrl.toString(), 307);
  } catch {
    return NextResponse.redirect('https://dglobalgrowthfield.com', 307);
  }
}