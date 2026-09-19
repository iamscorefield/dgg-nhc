import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const text = await req.text();
    if (text) {
      body = JSON.parse(text);
    }

    const { clickId, durationSeconds, subdomain, targetPage, deviceType, sessionToken } = body;

    // 1. Duration Beacon Update (sendBeacon sends POST)
    if (clickId && typeof durationSeconds === 'number') {
      await supabaseAdmin
        .from('referral_clicks_ledger')
        .update({
          duration_seconds: durationSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clickId);

      return NextResponse.json({ success: true });
    }

    if (!subdomain) {
      return NextResponse.json({ success: false, message: 'Subdomain or NHC tag required' }, { status: 400 });
    }

    // 2. Client Geo/IP Header Resolution
    const forwarded = req.headers.get('x-forwarded-for');
    const visitorIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const visitorCity = req.headers.get('x-vercel-ip-city') || 'Lagos';
    const visitorCountry = req.headers.get('x-vercel-ip-country') || 'NG';

    // 3. Resolve Intern by subdomain_handle OR nhc_id
    const { data: intern } = await supabaseAdmin
      .from('intern_profiles')
      .select('id, referral_clicks')
      .or(`subdomain_handle.eq.${subdomain},nhc_id.eq.${subdomain}`)
      .maybeSingle();

    if (!intern) {
      return NextResponse.json({ success: false, message: 'Intern not located' }, { status: 404 });
    }

    // 4. Session Deduplication Check (Look for same visitor session within the last 30 minutes)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    let existingSession = null;
    if (sessionToken) {
      const { data } = await supabaseAdmin
        .from('referral_clicks_ledger')
        .select('id, duration_seconds')
        .eq('intern_id', intern.id)
        .eq('visitor_ip', visitorIp)
        .eq('target_page', targetPage || '/')
        .gte('created_at', thirtyMinsAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      existingSession = data;
    }

    if (existingSession) {
      return NextResponse.json({
        success: true,
        clickId: existingSession.id,
        isExistingSession: true,
      });
    }

    // 5. Fresh Unique Visitor Log
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('referral_clicks_ledger')
      .insert({
        intern_id: intern.id,
        subdomain_handle: subdomain,
        target_page: targetPage || '/',
        visitor_ip: visitorIp,
        visitor_city: visitorCity,
        visitor_country: visitorCountry,
        device_type: deviceType || 'Desktop',
        duration_seconds: 5,
      })
      .select('id')
      .single();

    if (logError) {
      return NextResponse.json({ success: false, error: logError.message }, { status: 500 });
    }

    // Increment overall tally
    await supabaseAdmin
      .from('intern_profiles')
      .update({ referral_clicks: (intern.referral_clicks || 0) + 1 })
      .eq('id', intern.id);

    return NextResponse.json({
      success: true,
      clickId: logEntry.id,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}