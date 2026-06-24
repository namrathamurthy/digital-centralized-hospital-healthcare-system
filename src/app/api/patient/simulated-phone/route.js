import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const { getCollection } = require('../../../../server-utils/jsonDb');
const { verifySession } = require('../../../../server-utils/auth');

export async function GET(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const logsDb = getCollection('log');
    // Fetch all logs for this patient where action is SYSTEM_REMINDER_SENT
    const allLogs = await logsDb.find({ userId: session._id, action: 'SYSTEM_REMINDER_SENT' });
    
    // Sort by timestamp ascending
    const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Map logs to clean message format
    const messages = sortedLogs.map((log) => {
      // Legacy format: Simulated delivery via WhatsApp: "Actual message here"
      // New format: JSON string { sender: 'ai' | 'patient', text: 'message' }
      let channel = 'WhatsApp';
      let content = log.details;
      let sender = 'ai'; // Default to ai
      
      try {
        const parsed = JSON.parse(log.details);
        sender = parsed.sender;
        content = parsed.text;
      } catch (e) {
        // Fallback for old legacy logs
        const match = log.details.match(/via (.*?): "(.*)"/s);
        if (match) {
          channel = match[1];
          content = match[2];
        }
      }

      return {
        id: log._id,
        channel,
        content,
        sender,
        timestamp: log.timestamp
      };
    });

    return NextResponse.json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching simulated phone messages:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
