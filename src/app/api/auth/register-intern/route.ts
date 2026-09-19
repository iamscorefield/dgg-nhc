import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      educationLevel,
      institution,
      discipline,
      workExperience,
      specializationTrack,
      stateOfResidence,
      verifiedCertId,
    } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Missing required signup fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Create User in Supabase Auth (preserving exact raw password characters)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'intern',
      },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { success: false, message: authError?.message || 'Failed to create authentication user.' },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const nhcId = `DGG-NHC-2026-${randomSuffix}`;
    const subdomainHandle = `${firstName.trim().toLowerCase()}-${lastName.trim().toLowerCase()}-${randomSuffix}`.replace(/[^a-z0-9-]/g, '');

    // 2. Insert Core Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'intern',
      status: 'active',
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, message: 'Profile insertion failed: ' + profileError.message },
        { status: 500 }
      );
    }

    // 3. Insert Intern Specific Profile
    const { error: internError } = await supabaseAdmin.from('intern_profiles').insert({
      id: userId,
      nhc_id: nhcId,
      verified_cert_id: verifiedCertId ? verifiedCertId.trim() : null,
      education_level: educationLevel,
      institution: institution ? institution.trim() : null,
      discipline: discipline ? discipline.trim() : null,
      work_experience: workExperience,
      specialization_track: specializationTrack,
      state_of_residence: stateOfResidence,
      subdomain_handle: subdomainHandle,
    });

    if (internError) {
      return NextResponse.json(
        { success: false, message: 'Intern profile insertion failed: ' + internError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Intern registered successfully.',
      nhcId,
      subdomainHandle,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + err.message },
      { status: 500 }
    );
  }
}