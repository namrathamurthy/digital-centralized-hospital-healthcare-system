import { NextResponse } from 'next/server';
import { getCollection } from '../../../../../server-utils/jsonDb';
import { verifySession } from '../../../../../server-utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const session = await verifySession(req);
    const { id } = await params;

    // We allow anyone logged in to view ratings.
    // Patients see them while booking. Doctors see their own. Admins see all.
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const summaryDb = getCollection('doctor_rating_summary');
    const summary = await summaryDb.findOne({ _id: id });

    const ratingsDb = getCollection('doctor_rating');
    const allRatings = await ratingsDb.find({ doctor_id: id });
    
    // Sort by newest first
    const sortedRatings = allRatings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentRatings = sortedRatings.slice(0, 20);

    const safeRatings = recentRatings.map(r => ({
      _id: r._id,
      score_overall: r.score_overall,
      score_comm: r.score_comm,
      score_wait: r.score_wait,
      score_diagnosis: r.score_diagnosis,
      score_bedside: r.score_bedside,
      tags: r.tags,
      review_text: r.review_text,
      sentiment: r.sentiment,
      ai_summary: r.ai_summary,
      created_at: r.created_at,
      patient_id: r.is_anonymous ? null : r.patient_id,
      is_anonymous: r.is_anonymous
    }));

    return NextResponse.json({ 
      success: true, 
      summary: summary || {
        avg_overall: 0, avg_comm: 0, avg_wait: 0, avg_diagnosis: 0, avg_bedside: 0,
        total_reviews: 0, top_tags: []
      }, 
      reviews: safeRatings 
    });
  } catch (error) {
    console.error('Doctor ratings fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
