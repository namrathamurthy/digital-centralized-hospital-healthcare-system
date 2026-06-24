import { NextResponse } from 'next/server';
import { getCollection } from '../../../../server-utils/jsonDb';
import { verifySession } from '../../../../server-utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await verifySession(req);
    // Allow any logged-in user to view the leaderboard (patients use it for booking)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dept = searchParams.get('dept');

    const doctorsDb = getCollection('doctor');
    let allDoctors = await doctorsDb.find({});
    
    if (dept && dept !== 'all') {
      allDoctors = allDoctors.filter(d => d.department === dept);
    }

    const summaryDb = getCollection('doctor_rating_summary');
    const allSummaries = await summaryDb.find({});
    const summaryMap = {};
    allSummaries.forEach(s => {
      summaryMap[s._id] = s;
    });

    const leaderboard = allDoctors.map(d => {
      const s = summaryMap[d._id] || { 
        avg_overall: 0, 
        total_reviews: 0, 
        top_tags: [] 
      };
      return {
        id: d._id,
        name: d.name,
        department: d.department,
        cabin: d.cabin,
        avg_overall: s.avg_overall,
        total_reviews: s.total_reviews,
        top_tags: s.top_tags
      };
    });

    // Sort by rating descending, then by total reviews
    leaderboard.sort((a, b) => {
      if (b.avg_overall !== a.avg_overall) {
        return b.avg_overall - a.avg_overall;
      }
      return b.total_reviews - a.total_reviews;
    });

    return NextResponse.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
