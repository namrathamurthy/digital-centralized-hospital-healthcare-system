import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { clerkId, email, name } = await request.json();

    if (!clerkId || !email) {
      return NextResponse.json({ success: false, error: 'Missing clerkId or email' }, { status: 400 });
    }

    const usersPath = path.join(process.cwd(), 'data', 'db', 'users.json');
    let users = [];
    if (fs.existsSync(usersPath)) {
      const fileData = fs.readFileSync(usersPath, 'utf8');
      if (fileData) {
        users = JSON.parse(fileData);
      }
    }

    // 1. Check if user already exists by clerkId
    let existingUser = users.find(u => u.clerkId === clerkId);

    // 2. Fallback: check by email (if they registered previously but didn't have a clerkId)
    if (!existingUser) {
      existingUser = users.find(u => u.email === email);
      if (existingUser) {
        // Link their account to Clerk
        existingUser.clerkId = clerkId;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      }
    }

    if (existingUser) {
      // Don't send passwords back, even if they exist
      const { password, ...safeUser } = existingUser;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // 3. User is entirely new. Create them as a Patient by default.
    const newUser = {
      _id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clerkId,
      name,
      email,
      role: 'patient',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, user: newUser });

  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
