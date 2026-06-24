import { NextResponse } from 'next/server';
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const { connectDB } = require('../../../../../server-utils/db');
const { getCollection } = require('../../../../../server-utils/jsonDb');
const { verifySession } = require('../../../../../server-utils/auth');

export async function POST(req) {
  await connectDB();
  try {
    const session = await verifySession(req);
    if (!session || session.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { message } = body;
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const logsDb = getCollection('log');
    const usersDb = getCollection('user');

    const patient = await usersDb.findById(session._id);

    // Fast-path for simple conversational greetings and emergencies (bypassing the AI model for instant latency)
    const lowerMsg = message.toLowerCase().trim().replace(/[.,!?'"]/g, '');
    let instantReply = null;
    
    if (['hi', 'hello', 'hey', 'hii', 'hi there'].includes(lowerMsg)) {
      instantReply = `Hello ${patient.name}! How can I help you with your health today?`;
    } else if (['ok', 'okay', 'thanks', 'thank you', 'got it', 'alright', 'cool', 'fine'].includes(lowerMsg)) {
      instantReply = "You're welcome! Let me know if you need anything else.";
    }

    // Save Patient's Message
    await logsDb.create({
      userId: session._id,
      action: 'SYSTEM_REMINDER_SENT', // Use the same action so it fetches correctly
      details: JSON.stringify({ sender: 'patient', text: message }),
      timestamp: new Date().toISOString()
    });

    // If we have an instant reply, return it immediately as a stream to bypass the Llama 3 generation time
    if (instantReply) {
      await logsDb.create({
        userId: session._id,
        action: 'SYSTEM_REMINDER_SENT',
        details: JSON.stringify({ sender: 'ai', text: instantReply }),
        timestamp: new Date().toISOString()
      });
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(JSON.stringify({ response: instantReply, done: true }) + '\n'));
          controller.close();
        }
      });
      return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
    }

    // Retrieve recent conversation history for Gemini Context
    const allLogs = await logsDb.find({ userId: session._id, action: 'SYSTEM_REMINDER_SENT' });
    const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get last 10 messages
    const recentLogs = sortedLogs.slice(-10).map(log => {
      let sender = 'ai';
      let content = log.details;
      try {
        const p = JSON.parse(log.details);
        sender = p.sender;
        content = p.text;
      } catch(e) {
        const match = log.details.match(/via (.*?): "(.*)"/s);
        if (match) {
          content = match[2];
        }
      }
      return `${sender === 'ai' ? 'SmartCare AI' : 'Patient'}: ${content}`;
    });

    // Generate AI Reply
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
    let aiReply = "I am the SmartCare Mock AI. Please ensure Ollama is running for full intelligence!";

    // Read Medical Knowledge Base and use Fuse.js to find relevant facts
    let relevantFacts = [];
    try {
      const kbPath = path.join(process.cwd(), 'src', 'server-utils', 'medical_database.json');
      const kbData = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
      
      const fuse = new Fuse(kbData, {
        keys: ['keywords', 'fact'],
        threshold: 0.4
      });
      
      const results = fuse.search(message);
      relevantFacts = results.slice(0, 2).map(res => res.item.fact);
      
      if (relevantFacts.length === 0) {
        relevantFacts = ["No specific medical protocol found for this query. Advise patient to consult a doctor."];
      }
    } catch (e) {
      console.warn('Could not read medical database', e.message);
      relevantFacts = ["Ensure standard hospital care protocols."];
    }

    const systemPrompt = `You are an empathetic, highly intelligent, and conversational medical AI assistant for SmartCare Hospital, designed to be as helpful, comprehensive, and friendly as ChatGPT.
Patient Name: ${patient.name}

HOSPITAL PROTOCOLS (Prioritize these if relevant to the query):
${relevantFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}

Role & Rules:
1. Converse naturally, empathetically, and comprehensively with the patient.
2. Provide detailed, well-structured medical explanations and advice. Use bullet points or short paragraphs if necessary to make complex information easy to understand, exactly how ChatGPT does.
3. You may use your vast general medical knowledge to provide helpful context, advice, and comprehensive answers. You are NOT restricted to only the Hospital Protocols, but you should prioritize them if they apply.
4. Always maintain a warm, caring, and professional bedside manner. Address the patient by name when appropriate.
5. End with a helpful, supportive closing or ask if they need further clarification.
6. IMPORTANT: Always remind the patient to consult their doctor or visit the hospital for a definitive diagnosis or if symptoms worsen.

Recent Conversation History:
${recentLogs.join('\n')}

Patient's latest message: "${message}"

Your Comprehensive Response:`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: systemPrompt,
          stream: true
        })
      });

      if (response.ok) {
        const transformStream = new TransformStream({
          start() { this.fullText = ''; },
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            const lines = text.split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.response) this.fullText += data.response;
              } catch(e) {}
            }
            controller.enqueue(chunk);
          },
          async flush() {
            // Stream finished, save this.fullText
            try {
              await logsDb.create({
                userId: session._id,
                action: 'SYSTEM_REMINDER_SENT',
                details: JSON.stringify({ sender: 'ai', text: this.fullText.trim() }),
                timestamp: new Date().toISOString()
              });
            } catch(e) {
              console.error('Failed to save streamed response to DB', e);
            }
          }
        });

        return new Response(response.body.pipeThrough(transformStream), { 
          headers: { 'Content-Type': 'application/x-ndjson' } 
        });
      } else {
        console.error('Ollama error:', response.status);
      }
    } catch (err) {
      console.error('Ollama fetch error. Falling back to Mock AI.', err.message);
      // Mock Intelligence Simulation when Ollama is unreachable
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('headache') || lowerMsg.includes('pain')) {
        aiReply = `I understand you're experiencing some discomfort, ${patient.name}. Please ensure you are taking your prescribed medication as directed by your doctor. If the pain persists, let us know.`;
      } else if (lowerMsg.includes('yes') || lowerMsg.includes('yeah') || lowerMsg.includes('taking') || lowerMsg.includes('took')) {
        aiReply = "That's wonderful to hear! Consistency with your medication is the best way to ensure a speedy recovery. Let me know if you need anything else.";
      } else if (lowerMsg.includes('no') || lowerMsg.includes('forgot')) {
        aiReply = "Please try to stick to your medication schedule. Missing doses can delay your recovery. Would you like me to set a reminder for you?";
      } else if (lowerMsg.includes('tired') || lowerMsg.includes('tried') || lowerMsg.includes('fatigue')) {
        aiReply = "Feeling tired after taking medication can be normal as your body heals. Please make sure to get plenty of rest, stay hydrated, and avoid heavy activities for today.";
      } else if (lowerMsg.includes('thank')) {
        aiReply = "You're very welcome! We are always here to help you at SmartCare Hospital. Have a wonderful day!";
      } else {
        aiReply = "I understand. Please continue to monitor your symptoms, get plenty of rest, and stay hydrated. If you experience any severe changes, please contact the front desk immediately.";
      }
      
      // Save Mock AI's Reply
      await logsDb.create({
        userId: session._id,
        action: 'SYSTEM_REMINDER_SENT',
        details: JSON.stringify({ sender: 'ai', text: aiReply }),
        timestamp: new Date().toISOString()
      });
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(JSON.stringify({ response: aiReply, done: true }) + '\n'));
          controller.close();
        }
      });
      return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
    }
  } catch (err) {
    console.error('Error handling chat reply:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
