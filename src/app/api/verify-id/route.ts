import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize external Supabase client using environment variables
const externalSupabaseUrl = process.env.EXTERNAL_SUPABASE_URL || '';
const externalSupabaseKey = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY || '';

const externalSupabase =
  externalSupabaseUrl && externalSupabaseKey
    ? createClient(externalSupabaseUrl, externalSupabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'A valid ID or Certificate number is required.' },
        { status: 400 }
      );
    }

    const cleanId = id.trim().toUpperCase();

    // 1. Query real external LMS database (admin_ledgers table)
    if (externalSupabase) {
      const { data, error } = await externalSupabase
        .from('admin_ledgers')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (error) {
        console.error('External Supabase query error:', error);
      }

      if (data) {
        // Parse full name if stored as a single string
        const rawName = data.full_name || data.name || data.student_name || '';
        const nameParts = rawName.trim().split(' ');
        const firstName = data.first_name || nameParts[0] || '';
        const lastName = data.last_name || nameParts.slice(1).join(' ') || '';

        return NextResponse.json({
          success: true,
          message: 'Certificate successfully verified against DGG-LMS records!',
          record: {
            certId: data.id,
            firstName,
            lastName,
            institution: data.institution || data.school || data.campus || 'University of Ibadan',
            discipline: data.discipline || data.course || data.department || 'Computer Science',
            track: data.track || data.specialization || 'TRK-01: Full Stack Development',
            issueDate: data.created_at || '2026-08-23',
          },
        });
      }
    }

    // 2. Fallback Local Development Mock Data
    const mockDatabase: Record<string, any> = {
      'DGG-CERT-2026-9041': {
        certId: 'DGG-CERT-2026-9041',
        firstName: 'Amina',
        lastName: 'Bello',
        institution: 'University of Ibadan',
        discipline: 'Data Analytics & Statistics',
        track: 'TRK-02: Data Analytics',
        gradePoint: 'Distinction',
        issueDate: 'Aug 20, 2026',
      },
      'DGG-CERT-2026-9042': {
        certId: 'DGG-CERT-2026-9042',
        firstName: 'Chidi',
        lastName: 'Chukwuma',
        institution: 'UNILAG (Nigeria)',
        discipline: 'Computer Science',
        track: 'TRK-01: Full Stack Development',
        gradePoint: '4.8 / 5.0',
        issueDate: 'Sep 02, 2026',
      },
    };

    if (mockDatabase[cleanId]) {
      return NextResponse.json({
        success: true,
        record: mockDatabase[cleanId],
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Certificate ID not found in external registry.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Server verification route error: ' + err.message },
      { status: 500 }
    );
  }
}