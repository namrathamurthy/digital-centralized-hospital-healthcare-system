import { NextResponse } from 'next/server';
const { connectDB } = require('../../../server-utils/db');
const { getLogs } = require('../../../server-utils/logger');
const { verifySession } = require('../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterMode = searchParams.get('filter'); // 'mine' = only my logs

    let query = {};

    // Only Admins have global view access
    if (session.role === 'admin') {
      // If they explicitly ask for only their own logs (e.g. on their personal dashboard tab)
      if (filterMode === 'mine') {
        query = { userId: String(session._id) };
      }
      // Otherwise, they get all logs (empty query)
    } else {
      // All other roles (receptionist, doctor, billing, lab, pharmacy, patient) strictly only see their own logs
      query = { userId: String(session._id) };
    }
    const logs = await getLogs(query);
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    console.error('Logs API error:', err);
    return NextResponse.json({ error: 'Server error retrieving logs' }, { status: 500 });
  }
}
