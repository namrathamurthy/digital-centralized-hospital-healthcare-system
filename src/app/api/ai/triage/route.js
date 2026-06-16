import { NextResponse } from 'next/server';
const { connectDB } = require('../../../../server-utils/db');
const { verifySession } = require('../../../../server-utils/auth');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    // Allow anyone to run triage, even guests, but require symptoms
    const { symptoms } = await req.json();

    if (!symptoms || symptoms.trim().length < 3) {
      return NextResponse.json({ error: 'Symptoms description is too short' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let triageResult = null;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        console.log('Using Gemini LLM for triage check...');
        const prompt = `You are a professional medical triage AI helper.
Analyze the following patient symptoms and respond ONLY with a valid JSON object.
Do not include markdown code block formatting (such as \`\`\`json).
The JSON object must contain exactly three keys:
- "severity": Must be exactly one of "Low", "Medium", "High", or "Emergency".
- "aiAdvice": Concise clinical guidance or recommendation (max 100 words).
- "department": Recommended hospital department (e.g., "Cardiology", "General Medicine", "Pediatrics", "Orthopedics", "Emergency").

Patient symptoms: "${symptoms}"`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            })
          }
        );

        if (response.ok) {
          const resData = await response.json();
          let text = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Clean possible markdown wrapper
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          
          try {
            triageResult = JSON.parse(text);
            console.log('Gemini triage result:', triageResult);
          } catch (jsonErr) {
            console.error('Failed to parse Gemini JSON response:', text);
          }
        } else {
          console.warn('Gemini API call failed status:', response.status);
        }
      } catch (geminiErr) {
        console.error('Gemini API connection error:', geminiErr.message);
      }
    }

    // Heuristics fallback if Gemini is missing or failed
    if (!triageResult) {
      console.log('Using local clinical heuristics fallback...');
      const lower = symptoms.toLowerCase();
      
      let severity = 'Low';
      let aiAdvice = 'Symptoms appear mild. Please rest, drink plenty of water, and schedule a routine checkup with a General Physician if symptoms persist.';
      let department = 'General Medicine';

      if (lower.includes('chest pain') || lower.includes('heart') || lower.includes('cardiac') || lower.includes('pressure in chest') || lower.includes('left arm pain')) {
        severity = 'Emergency';
        aiAdvice = 'CRITICAL WARNING: Possible cardiac episode. Go to the nearest Emergency Room immediately or dial emergency services. Do not drive yourself.';
        department = 'Cardiology';
      } else if (lower.includes('breath') || lower.includes('gasp') || lower.includes('suffocat') || lower.includes('asthma') || lower.includes('chok')) {
        severity = 'Emergency';
        aiAdvice = 'CRITICAL WARNING: Severe respiratory distress. Seek immediate emergency medical attention. Sit upright and use any prescribed inhaler while waiting.';
        department = 'Emergency';
      } else if (lower.includes('fracture') || lower.includes('bone') || lower.includes('joint') || lower.includes('sprain') || lower.includes('fall')) {
        severity = 'Medium';
        aiAdvice = 'Possible orthopedic injury. Rest the joint, apply ice, elevate, and consult with an Orthopedics specialist for x-rays.';
        department = 'Orthopedics';
      } else if (lower.includes('child') || lower.includes('baby') || lower.includes('infant') || lower.includes('pediatric')) {
        severity = 'Medium';
        aiAdvice = 'Pediatric check recommended. Monitor child temperature and hydration closely. Consult a pediatrician.';
        department = 'Pediatrics';
      } else if (lower.includes('stomach') || lower.includes('vomit') || lower.includes('diarrhea') || lower.includes('nausea') || lower.includes('abdominal')) {
        severity = 'Medium';
        aiAdvice = 'Gastrointestinal distress. Avoid solid foods, stay hydrated with electrolyte solutions. Schedule general consult if pain worsens.';
        department = 'General Medicine';
      } else if (lower.includes('fever') || lower.includes('cough') || lower.includes('cold') || lower.includes('sore throat') || lower.includes('headache')) {
        severity = 'Low';
        aiAdvice = 'Standard flu-like symptoms. Take paracetamol as needed, rest, stay hydrated. Visit general practitioner if fever exceeds 102°F.';
        department = 'General Medicine';
      }

      triageResult = { severity, aiAdvice, department };
    }

    return NextResponse.json({ success: true, triage: triageResult });
  } catch (err) {
    console.error('Triage API error:', err);
    return NextResponse.json({ error: 'Server error processing triage request' }, { status: 500 });
  }
}
