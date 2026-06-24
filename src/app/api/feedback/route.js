import { NextResponse } from 'next/server';
import { getCollection } from '../../../server-utils/jsonDb';
import { verifySession } from '../../../server-utils/auth';

export async function POST(req) {
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { appointmentId, scores, tags, reviewText, isAnonymous } = await req.json();

    const appointmentsDb = getCollection('appointment');
    const appt = await appointmentsDb.findOne({ _id: appointmentId });

    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appt.patientId !== session._id) {
      return NextResponse.json({ error: 'Not your appointment' }, { status: 403 });
    }

    if (appt.status !== 'completed' && appt.status !== 'discharged') {
      return NextResponse.json({ error: 'Appointment not yet completed or discharged' }, { status: 400 });
    }

    const ratingsDb = getCollection('doctor_rating');
    const existing = await ratingsDb.findOne({ appointment_id: appointmentId });
    if (existing) {
      return NextResponse.json({ error: 'Already rated' }, { status: 409 });
    }

    const newRating = await ratingsDb.create({
      appointment_id: appointmentId,
      doctor_id: appt.doctorId,
      patient_id: isAnonymous ? null : session._id,
      score_overall: scores.overall || 5,
      score_comm: scores.comm || 5,
      score_wait: scores.wait || 5,
      score_diagnosis: scores.diagnosis || 5,
      score_bedside: scores.bedside || 5,
      tags: tags || [],
      review_text: reviewText || '',
      is_anonymous: isAnonymous || false,
      sentiment: 'neutral', 
      ai_summary: '', 
      created_at: new Date().toISOString()
    });

    // Trigger background refresh of summary
    refreshSummary(appt.doctorId).catch(console.error);
    
    // Attempt Gemini sentiment
    if (reviewText && reviewText.trim().length > 10) {
      analyzeSentiment(newRating._id, reviewText).catch(console.error);
    }

    return NextResponse.json({ success: true, rating: newRating });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function refreshSummary(doctorId) {
  const ratingsDb = getCollection('doctor_rating');
  const summaryDb = getCollection('doctor_rating_summary');
  
  const allRatings = await ratingsDb.find({ doctor_id: doctorId });
  if (!allRatings || allRatings.length === 0) return;

  const total = allRatings.length;
  let sumOverall = 0, sumComm = 0, sumWait = 0, sumDiag = 0, sumBed = 0;
  const tagCounts = {};

  allRatings.forEach(r => {
    sumOverall += r.score_overall || 0;
    sumComm += r.score_comm || 0;
    sumWait += r.score_wait || 0;
    sumDiag += r.score_diagnosis || 0;
    sumBed += r.score_bedside || 0;
    
    if (Array.isArray(r.tags)) {
      r.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const newSummary = {
    avg_overall: parseFloat((sumOverall / total).toFixed(2)),
    avg_comm: parseFloat((sumComm / total).toFixed(2)),
    avg_wait: parseFloat((sumWait / total).toFixed(2)),
    avg_diagnosis: parseFloat((sumDiag / total).toFixed(2)),
    avg_bedside: parseFloat((sumBed / total).toFixed(2)),
    total_reviews: total,
    top_tags: topTags,
    last_updated: new Date().toISOString()
  };

  const existing = await summaryDb.findOne({ _id: doctorId });
  if (existing) {
    await summaryDb.update(doctorId, newSummary);
  } else {
    await summaryDb.create({ _id: doctorId, ...newSummary });
  }
}

async function analyzeSentiment(ratingId, text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Analyse the sentiment of this hospital patient review. Respond ONLY with valid JSON — no markdown, no explanation. Format: {"sentiment":"positive"|"neutral"|"negative","insight":"one short sentence summary"}. Review: "${text}"` }] }]
      })
    });
    
    const data = await res.json();
    if (data.candidates && data.candidates.length > 0) {
      let raw = data.candidates[0].content.parts[0].text.trim();
      if (raw.startsWith('```json')) {
        raw = raw.substring(7, raw.length - 3).trim();
      } else if (raw.startsWith('```')) {
        raw = raw.substring(3, raw.length - 3).trim();
      }
      const parsed = JSON.parse(raw);
      
      const ratingsDb = getCollection('doctor_rating');
      await ratingsDb.update(ratingId, { 
        sentiment: parsed.sentiment || 'neutral', 
        ai_summary: parsed.insight || '' 
      });
    }
  } catch (err) {
    console.error('Gemini sentiment error:', err);
  }
}
