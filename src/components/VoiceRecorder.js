import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, FileAudio, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function VoiceRecorder({ patientId, onExtractionComplete }) {
  const [state, setState] = useState('idle'); // idle, listening, processing, error
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  const startRecording = () => {
    setErrorMsg('');
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMsg('Your browser does not support Speech Recognition. Please use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Set language based on doctor preference if needed, defaulting to English
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const fullTranscript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');
      setTranscript(fullTranscript);
    };

    recognition.onerror = (e) => {
      // console.error removed to prevent Next.js dev overlay from capturing handled errors
      if (e.error !== 'no-speech') {
        setErrorMsg(`Microphone error: ${e.error}. Please try the 'Simulate' button below instead.`);
        setState('idle');
      }
    };

    recognition.onend = () => {
      // If we stopped it manually, process it
      if (state === 'listening') {
        processTranscript();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState('listening');
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    processTranscript();
  };

  const simulateDictation = () => {
    const demoText = "The patient presents with acute pharyngitis. I am prescribing Tab Azithromycin 500mg once daily for 3 days after food. They should also do warm salt water gargles. Follow up after 3 days.";
    setTranscript(demoText);
    processTranscript(demoText); // Instantly process it!
  };

  const processTranscript = async (textToProcess = transcript) => {
    if (!textToProcess.trim()) {
      setState('idle');
      return;
    }
    
    setState('processing');
    try {
      const res = await axios.post('/api/doctor/voice-prescription', {
        transcript: textToProcess,
        patientId
      });

      if (res.data.success) {
        onExtractionComplete(res.data.prescription);
        setState('idle');
        setTranscript(''); // Clear for next use
      } else {
        throw new Error(res.data.error || 'Failed to extract');
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Error processing voice');
      setState('error');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {state === 'idle' || state === 'error' ? (
            <button
              onClick={startRecording}
              className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Start Dictation"
            >
              <Mic size={24} />
            </button>
          ) : state === 'listening' ? (
            <button
              onClick={stopRecording}
              className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 animate-pulse"
              title="Stop Recording"
            >
              <Square size={20} className="fill-current" />
            </button>
          ) : (
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
          
          {state === 'idle' && (
            <button
              onClick={simulateDictation}
              className="mt-2 text-[10px] font-medium text-slate-500 hover:text-blue-600 flex items-center justify-center w-full"
              title="Test without mic"
            >
              Simulate
            </button>
          )}
        </div>

        <div className="flex-grow">
          <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
            AI Voice Prescription
            {state === 'listening' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Listening...
              </span>
            )}
            {state === 'processing' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <Loader2 size={12} className="animate-spin" />
                Extracting clinical data...
              </span>
            )}
          </h3>
          
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={state === 'listening' || state === 'processing'}
              placeholder="Click the microphone and dictate the prescription. e.g., 'Patient has acute pharyngitis. Prescribe Azithromycin 500mg tablet once daily for 3 days after food. Also recommend warm salt water gargles.'"
              className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 resize-none"
            />
            {transcript.trim() && state === 'idle' && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => processTranscript(transcript)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Sparkles size={16} />
                  Extract AI Prescription
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-2 text-xs text-red-600 flex items-start gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
