import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    let password = 'EducaTon@0820';

    try {
      const rawText = await req.text();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (typeof parsed === 'string') {
          const inner = JSON.parse(parsed);
          if (inner.password) password = inner.password;
        } else if (parsed.password) {
          password = parsed.password;
        }
      }
    } catch {
      password = 'EducaTon@0820';
    }

    const adminEmail = 'admin@dglobalgrowthfield.com';

    // 1. Check if admin exists in Supabase Auth
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json(
        { success: false, message: 'Auth list error: ' + listError.message },
        { status: 500 }
      );
    }

    const existingAdmin = userList?.users?.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    let adminId = '';

    if (existingAdmin) {
      adminId = existingAdmin.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Super',
          last_name: 'Admin',
          role: 'admin',
        },
      });

      if (updateError) {
        return NextResponse.json(
          { success: false, message: 'Failed to update admin password: ' + updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Super',
          last_name: 'Admin',
          role: 'admin',
        },
      });

      if (createError || !newUser.user) {
        return NextResponse.json(
          { success: false, message: 'Failed to create admin: ' + (createError?.message || 'Unknown error') },
          { status: 500 }
        );
      }
      adminId = newUser.user.id;
    }

    // 2. Ensure public.profiles table matches the auth UUID
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: adminId,
      role: 'admin',
      status: 'active',
      first_name: 'Super',
      last_name: 'Admin',
      email: adminEmail,
      phone: '+2348000000000',
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, message: 'Profile update failed: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account admin@dglobalgrowthfield.com successfully provisioned and synchronized!',
      adminId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Server error: ' + err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}