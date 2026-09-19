import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      placementId,
      startupId,
      internId,
      punctuality,
      technical,
      communication,
      autonomy,
      endorsement,
      isPublic,
    } = body;

    if (!placementId || !startupId || !internId || !endorsement) {
      return NextResponse.json(
        { success: false, message: 'Missing mandatory scorecard fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('intern_performance_evaluations')
      .insert({
        placement_id: placementId,
        startup_id: startupId,
        intern_id: internId,
        punctuality_score: punctuality || 5,
        technical_score: technical || 5,
        communication_score: communication || 5,
        autonomy_score: autonomy || 5,
        written_endorsement: endorsement.trim(),
        is_public_on_dossier: Boolean(isPublic),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Scorecard insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, evaluationId: data.id });
  } catch (err: any) {
    console.error('Scorecard uncaught error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}