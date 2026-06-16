import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const User = require('../../../../models/User');
const Doctor = require('../../../../models/Doctor');
const { hashPassword } = require('../../../../server-utils/auth');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const { name, email, password, role, department, hospital, cabin } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing name, email, password, or role' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    if (role === 'doctor') {
      if (!department || !hospital || !cabin) {
        return NextResponse.json({ error: 'Doctor registration requires department, hospital, and cabin' }, { status: 400 });
      }
      await Doctor.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        department,
        hospital,
        cabin,
        status: 'active',
        currentToken: 0
      });
    }

    await writeLog('User Registered', `Registered user: ${name} with role: ${role}`, user._id, role);

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register API error:', err);
    return NextResponse.json({ error: 'Server registration error' }, { status: 500 });
  }
}
