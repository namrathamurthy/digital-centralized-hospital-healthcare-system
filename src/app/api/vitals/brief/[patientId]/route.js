import { NextResponse } from 'next/server';
import { getCollection } from '../../../../../server-utils/jsonDb';
import { verifySession } from '../../../../../server-utils/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(req, { params }) {
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { patientId } = await params;
    
    // Fetch last 7 days of readings to summarize
    const healthDb = getCollection('health_reading');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const readings = await healthDb.find({ patient_id: patientId });
    const recentReadings = readings.filter(r => r.recorded_at > weekAgo);
    
    if (recentReadings.length === 0) {
      return NextResponse.json({ success: false, brief: "No wearable data synced." });
    }

    // Simple aggregate function for our JSON DB
    const summary = {};
    for (const r of recentReadings) {
      if (!summary[r.metric]) summary[r.metric] = { values: [] };
      summary[r.metric].values.push(Number(r.value));
    }

    for (const metric in summary) {
      const vals = summary[metric].values;
      const sum = vals.reduce((a, b) => a + b, 0);
      summary[metric] = {
        avg: (sum / vals.length).toFixed(1),
        min: Math.min(...vals).toFixed(1),
        max: Math.max(...vals).toFixed(1),
        readings: vals.length
      };
    }

    // Check if GEMINI_API_KEY exists
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        success: true, 
        brief: "Gemini AI API Key not found. Please add GEMINI_API_KEY to your .env file to generate the 3-sentence health brief. But the data synced successfully!" 
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a clinical AI assistant for SmartCare Hospital. 
      Given 7 days of wearable data for a patient, write a highly concise 2-3 sentence health brief for their doctor.
      Mention any notable trends or anomalies. Use plain, professional clinical language.
      Data: ${JSON.stringify(summary)}
      Format: Start with the most notable finding. Flag anything outside normal ranges (like SpO2 < 95% or unusual HR).
      Keep it strictly under 50 words. Do not use greetings.
    `;

    const result = await model.generateContent(prompt);
    const briefText = result.response.text();

    return NextResponse.json({ success: true, brief: briefText });
  } catch (err) {
    console.error('Error generating AI vitals brief:', err);
    return NextResponse.json({ error: 'Server error generating brief' }, { status: 500 });
  }
}
