import { NextResponse } from 'next/server';
const { verifySession } = require('../../../../server-utils/auth');
const User = require('../../../../models/User');
const { checkInteractions } = require('../../../../server-utils/drugChecker');

export async function POST(req) {
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized. Doctor session required.' }, { status: 403 });
    }

    const { transcript, patientId } = await req.json();
    
    if (!transcript || transcript.trim().length < 5) {
      return NextResponse.json({ error: 'Transcript too short or empty' }, { status: 400 });
    }

    let patientContext = { age: 'Unknown', gender: 'Unknown', allergies: [], currentMeds: [] };
    
    if (patientId) {
      const patient = await User.findById(patientId);
      if (patient) {
        patientContext.allergies = patient.allergies || [];
        patientContext.currentMeds = patient.currentMeds || [];
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let parsed = null;

    if (apiKey && apiKey.trim().length > 10) {
      const prompt = `You are a clinical prescription extraction assistant for an Indian hospital.

PATIENT CONTEXT:
- Age: ${patientContext.age}, Gender: ${patientContext.gender}
- Known allergies: ${patientContext.allergies.join(', ') || 'None'}
- Current medications: ${patientContext.currentMeds.join(', ') || 'None'}

DOCTOR'S DICTATION:
"${transcript}"

Extract a structured prescription from the dictation.
Respond ONLY with valid JSON. No markdown, no explanation, no preamble.

Required format:
{
  "diagnosis": "Full diagnosis name",
  "icd10": "ICD-10 code (best match)",
  "drugs": [
    {
      "name": "Tab./Cap./Syp. Drug Name",
      "dosage": "Xmg/Xml",
      "frequency": "Once/Twice/Three times daily",
      "duration": "X days/weeks",
      "timing": "Before food/After food/At night/Morning",
      "instruction": "Patient instruction in simple English",
      "routeOfAdmin": "Oral/Topical/IV"
    }
  ],
  "generalInstructions": "Rest, diet advice, lifestyle changes",
  "followUp": "When to return"
}

Rules:
- Use generic names if possible.
- If dosage not mentioned, use standard adult dosage for the diagnosis.
- Duration must always be specified.
`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          try {
            parsed = JSON.parse(rawText);
          } catch (err) {
            console.error('Failed to parse Gemini JSON:', rawText);
          }
        }
      } else {
        const txt = await response.text();
        console.error('Gemini API Error:', txt);
      }
    }

    // Fallback parser if Gemini fails or API key is missing
    if (!parsed) {
      console.log('Using local fallback regex extraction for prescription...');
      
      const lowerT = transcript.toLowerCase();
      
      // Extract all text before the first prescription keyword to use as the clinical diagnosis
      let extractedDiagnosis = transcript;
      const prescriptionStart = transcript.toLowerCase().search(/\b(prescribe|give|start on|tab|cap|syp|tablet|syrup|recommend|recognise|recognize|suggest)\b/);
      
      // User requested to keep the FULL sentence in the diagnosis box unconditionally
      // So we no longer truncate it!
      
      // If the extracted text is too short, just use the whole transcript
      if (extractedDiagnosis.length < 5) {
        extractedDiagnosis = transcript;
      }

      parsed = {
        diagnosis: extractedDiagnosis,
        icd10: "Z76.9",
        drugs: [],
        generalInstructions: "Rest and maintain hydration.",
        followUp: "Review after 3 days if symptoms persist"
      };
      
      // Dynamic Medicine Extraction - much broader
      const medRegex = /(?:prescribe|give|start on|tab|cap|syp|tablet|syrup|add|recommend|recognise|recognize|suggest)\s+([a-zA-Z\s0-9]+?)(?:\s+\d+mg|\s+once|\s+twice|\s+thrice|\s+for|\.|and|,|$)/gi;
      let match;
      const foundMeds = new Set();
      
      while ((match = medRegex.exec(lowerT)) !== null) {
        let medName = match[1].trim().replace(/^(a|an|the|some|two|three)\s+/i, '');
        if (medName.length > 2 && medName !== "and" && !foundMeds.has(medName.toLowerCase())) {
          foundMeds.add(medName.toLowerCase());
          parsed.drugs.push({
            name: medName.replace(/\b\w/g, l => l.toUpperCase()),
            dosage: lowerT.includes('500mg') ? "500mg" : (lowerT.includes('650') ? "650mg" : "Standard"),
            frequency: lowerT.includes('twice') ? "1-0-1" : (lowerT.includes('thrice') ? "1-1-1" : "1-0-0"),
            duration: "3 days",
            timing: lowerT.includes('before food') ? "Before food" : "After food",
            instruction: "Complete the course",
            routeOfAdmin: "Oral"
          });
        }
      }

      // Hardcoded common Indian fallback drugs if the regex loop missed them
      const commonDrugs = [
        { key: 'azithromycin', name: 'Azithromycin', dosage: '500mg', freq: '1-0-0' },
        { key: 'amoxicillin', name: 'Amoxicillin', dosage: '500mg', freq: '1-0-1' },
        { key: 'paracetamol', name: 'Paracetamol', dosage: '650mg', freq: '1-0-1' },
        { key: 'crocin', name: 'Crocin', dosage: '650mg', freq: '1-0-1' },
        { key: 'dolo', name: 'Dolo 650', dosage: '650mg', freq: '1-0-1' },
        { key: 'pantoprazole', name: 'Pantoprazole', dosage: '40mg', freq: '1-0-0' },
        { key: 'cetirizine', name: 'Cetirizine', dosage: '10mg', freq: '0-0-1' }
      ];

      for (const cd of commonDrugs) {
        if (lowerT.includes(cd.key) && !foundMeds.has(cd.key)) {
          foundMeds.add(cd.key);
          parsed.drugs.push({
            name: cd.name, dosage: cd.dosage, frequency: cd.freq, duration: "3 days",
            timing: "After food", instruction: "Take as directed", routeOfAdmin: "Oral"
          });
        }
      }
    }

    // Process extracted JSON through Drug Checker
    const checkedDrugs = await checkInteractions(
      parsed.drugs || [], 
      patientContext.allergies, 
      patientContext.currentMeds
    );

    parsed.drugs = checkedDrugs;
    parsed.rawTranscript = transcript; // return transcript so frontend can review it

    return NextResponse.json({ success: true, prescription: parsed });
  } catch (err) {
    console.error('Voice Prescription Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
