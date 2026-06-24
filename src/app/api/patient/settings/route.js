import { NextResponse } from 'next/server';
const { verifySession } = require('../../../../server-utils/auth');
const { getCollection } = require('../../../../server-utils/jsonDb');

export async function GET(req) {
  try {
    const user = await verifySession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const usersDb = getCollection('user');
    const fullUser = await usersDb.findById(user._id);
    
    // Return default settings if none exist
    const defaultSettings = {
      channel: 'WhatsApp',
      language: 'English',
      medication: true,
      labTest: true,
      appointment: true,
      dnd: false
    };

    return NextResponse.json({ 
      success: true, 
      settings: fullUser.reminderSettings || defaultSettings 
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await verifySession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const newSettings = await req.json();
    const usersDb = getCollection('user');
    
    await usersDb.findByIdAndUpdate(user._id, {
      $set: { reminderSettings: newSettings }
    });

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
