'use client';
import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { AlertOctagon, X, Volume2 } from 'lucide-react';

export default function AppWrapper({ children }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activeSOS, setActiveSOS] = useState(null);

  // Play browser synthesizer alert sound (does not require external file)
  const playSiren = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Siren wobble effect
      const playTone = (freq, duration, timeOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + timeOffset + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + duration);
      };

      // Play three rapid siren bleeps
      playTone(660, 0.15, 0);
      playTone(880, 0.15, 0.25);
      playTone(1100, 0.25, 0.5);
    } catch (e) {
      console.warn('AudioContext alert failed (blocked by browser autoplay policy):', e);
    }
  };

  // Text-To-Speech Queue Announcer
  const speakTokenCall = (text) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear any ongoing announcements
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Try to select a natural female voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.includes('en-') && v.name.toLowerCase().includes('google')) || 
                             voices.find(v => v.lang.includes('en-'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('TTS speech failed:', e);
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Listen for SOS broadcast
    socket.on('sos_alert', (data) => {
      setActiveSOS(data);
      playSiren();
    });

    // Listen for SOS resolution
    socket.on('sos_dismissed', (data) => {
      if (activeSOS?._id === data.alertId) {
        setActiveSOS(null);
      }
    });

    // Listen for token announcement voice call
    socket.on('voice_call', (data) => {
      const { patientName, tokenNumber, room } = data;
      const announcement = `Token number ${tokenNumber}, patient ${patientName}, please proceed to room ${room}.`;
      speakTokenCall(announcement);
    });

    // Pre-load voices for TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      socket.off('sos_alert');
      socket.off('sos_dismissed');
      socket.off('voice_call');
    };
  }, [socket, activeSOS]);

  const dismissSOS = async () => {
    if (!activeSOS) return;
    try {
      // Patients cannot dismiss, staff calls API
      if (user && user.role !== 'patient') {
        await axios.post(`/api/sos/dismiss/${activeSOS._id}`);
      }
      setActiveSOS(null);
    } catch (err) {
      console.error('Failed to dismiss SOS:', err);
      setActiveSOS(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative">
      {/* SOS Alert Global Screen Overlay */}
      {activeSOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-pulse duration-1000">
          <div className="w-full max-w-lg border-2 border-red-500 bg-white/90 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.4)] backdrop-blur-lg text-center relative overflow-hidden">
            {/* Background Red Flashing Aura */}
            <div className="absolute inset-0 bg-red-600/10 animate-ping duration-1500 pointer-events-none"></div>

            <div className="flex justify-center mb-4 text-red-600 animate-bounce">
              <AlertOctagon size={64} />
            </div>

            <h2 className="text-3xl font-extrabold uppercase tracking-wide text-red-600 mb-2">
              Critical Emergency Alert
            </h2>

            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200 text-left relative z-10">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Patient Name</p>
              <p className="text-lg font-bold text-slate-800 mb-3">{activeSOS.patientName}</p>

              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Ward / Location</p>
              <p className="text-slate-800 font-medium mb-3">{activeSOS.location}</p>

              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Reported Symptoms</p>
              <p className="text-red-600 text-sm font-semibold">{activeSOS.symptoms}</p>
            </div>

            {user && user.role !== 'patient' ? (
              <button
                onClick={dismissSOS}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all text-white font-bold rounded-lg cursor-pointer relative z-10"
              >
                <X size={18} />
                Acknowledge & Dismiss Alert
              </button>
            ) : (
              <p className="text-red-500 text-xs animate-pulse font-medium relative z-10">
                Emergency response unit has been notified automatically.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Children Components */}
      {children}
    </div>
  );
}
