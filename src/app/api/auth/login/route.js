import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const User = require('../../../../models/User');
const { comparePassword, generateToken } = require('../../../../server-utils/auth');
const { writeLog } = require('../../../../server-utils/logger');

export async function POST(req) {
  await connectDB();
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const token = generateToken(user);
    await writeLog('User Logged In', `Logged in user: ${user.name} (${user.role})`, user._id, user.role);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Set token as HttpOnly cookie (valid for 7 days)
    response.headers.set('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax`);
    return response;
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Server login error' }, { status: 500 });
  }
}
