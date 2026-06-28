import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the frontend payload for user details
    const body = await request.json().catch(() => ({}));
    const email = body.email || 'unknown@example.com';
    const name = body.name || 'New User';

    // Read demoRole from cookie if it exists
    const demoRoleCookie = request.cookies.get('demoRole');
    let role = demoRoleCookie ? demoRoleCookie.value : 'patient';
    
    // Ensure it's a valid role
    const validRoles = ['patient', 'doctor', 'receptionist', 'billing', 'lab', 'pharmacy'];
    if (!validRoles.includes(role)) {
      role = 'patient';
    }

    const usersPath = path.join(process.cwd(), 'data', 'db', 'users.json');
    let users = [];
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    }

    const existingUser = users.find(u => u.clerkId === userId);
    
    if (existingUser) {
      // If demoRole changed, update it so they can easily test different dashboards
      let changed = false;
      if (existingUser.role !== role) {
        existingUser.role = role;
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      }
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Create in our DB
    const newUser = {
      _id: userId,
      clerkId: userId,
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    
    // Add dummy fields if doctor
    if (role === 'doctor') {
      newUser.hospital = "SmartCare Neuro Center";
      newUser.department = "Cardiology";
      newUser.cabin = "203";
    }

    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, user: newUser });
  } catch (err) {
    console.error('Error syncing user:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
