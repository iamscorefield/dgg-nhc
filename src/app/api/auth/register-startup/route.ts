import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      founderName,
      founderRole,
      rcNumber,
      businessCategory,
      corporateEmail,
      phone,
      physicalAddress,
      operatingState,
      websiteUrl,
      linkedinUrl,
      socialHandle,
      companySummary,
      assessmentDate,
      assessmentTime,
      password,
    } = body;

    if (!corporateEmail || !companyName || !rcNumber) {
      return NextResponse.json(
        { success: false, message: 'Missing corporate registration details.' },
        { status: 400 }
      );
    }

    // Default startup password if booking without explicit password field
    const safePassword = password || 'Startup2026!';

    // 1. Create User in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: corporateEmail,
      password: safePassword,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        founder_name: founderName,
        role: 'entrepreneur',
      },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { success: false, message: authError?.message || 'Failed to create auth user.' },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    // 2. Insert Core Profile (status: pending_assessment)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'entrepreneur',
      status: 'pending_assessment',
      first_name: founderName.split(' ')[0] || founderName,
      last_name: founderName.split(' ').slice(1).join(' ') || 'Founder',
      email: corporateEmail,
      phone,
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, message: 'Profile insertion failed: ' + profileError.message },
        { status: 500 }
      );
    }

    // 3. Insert Startup Profile
    const { error: startupError } = await supabaseAdmin.from('startup_profiles').insert({
      id: userId,
      company_name: companyName,
      rc_number: rcNumber,
      business_category: businessCategory,
      founder_name: founderName,
      founder_role: founderRole,
      corporate_email: corporateEmail,
      phone,
      physical_address: physicalAddress,
      operating_state: operatingState,
      website_url: websiteUrl,
      linkedin_url: linkedinUrl,
      social_handle: socialHandle,
      company_summary: companySummary,
      assessment_date: assessmentDate,
      assessment_time: assessmentTime,
    });

    if (startupError) {
      return NextResponse.json(
        { success: false, message: 'Startup profile failed: ' + startupError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Startup registered and orientation assessment booked.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + err.message },
      { status: 500 }
    );
  }
}