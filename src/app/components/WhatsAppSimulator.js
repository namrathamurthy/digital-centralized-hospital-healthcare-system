'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, X, Phone, Video, MoreVertical, Check, CheckCheck, Send } from 'lucide-react';

export default function WhatsAppSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get('/api/patient/simulated-phone');
      if (res.data.success) {
        const newMessages = res.data.messages;
        if (newMessages.length > messages.length && !isOpen) {
          setUnreadCount(prev => prev + (newMessages.length - messages.length));
        }
        setMessages(newMessages);
      }
    } catch (err) {
      console.error('Error fetching simulated messages:', err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: 'patient',
      content: inputText,
      timestamp: new Date().toISOString()
    };
    
    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await axios.post('/api/patient/simulated-phone/reply', { message: newMsg.content });
      if (res.data.success) {
        // We can just fetch messages to get the AI reply and sync DB
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:bg-green-600 transition-all z-50 animate-bounce-slow"
      >
        <MessageCircle size={28} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* WhatsApp UI Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm sm:items-end sm:justify-end sm:p-6">
          <div className="bg-[#efeae2] w-full h-full sm:w-[350px] sm:h-[600px] sm:rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden border-4 border-slate-800">
            
            {/* Header */}
            <div className="bg-[#00a884] text-white px-4 py-3 flex items-center gap-3 shrink-0 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                SC
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">SmartCare Hospital</h3>
                <p className="text-[10px] text-white/80 truncate">Official Business Account</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Video size={18} className="opacity-80" />
                <Phone size={18} className="opacity-80" />
                <MoreVertical size={18} className="opacity-80" />
              </div>
              <button onClick={() => setIsOpen(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full items-center justify-center flex hover:bg-slate-700 sm:flex hidden cursor-pointer">
                <X size={14} />
              </button>
            </div>
            {/* Mobile close button inside header for small screens */}
            <button onClick={() => setIsOpen(false)} className="sm:hidden absolute top-4 right-4 text-white p-1">
                <X size={20} />
            </button>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 relative">
              <div className="bg-[#ffeecd] text-slate-600 text-[10px] text-center p-2 rounded-lg mx-auto w-fit shadow-sm max-w-[90%]">
                <span className="font-bold">Message from SmartCare Hospital</span><br/>
                This is a simulated conversation. Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
              </div>

              {messages.length === 0 ? (
                <div className="text-center text-xs text-slate-500 mt-10 bg-white/60 p-2 rounded-lg w-fit mx-auto backdrop-blur-sm shadow-sm">
                  Waiting for messages...
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`flex flex-col animate-fadeIn ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg p-2.5 max-w-[85%] shadow-sm relative group ${msg.sender === 'patient' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                      <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === 'patient' && <CheckCheck size={12} className="text-blue-500" />}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex flex-col items-start animate-fadeIn">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] px-2 py-2 flex items-center gap-2 shrink-0">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message"
                className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${inputText.trim() ? 'bg-[#00a884] cursor-pointer hover:bg-green-600' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                <Send size={18} className={`transform ml-1 ${inputText.trim() ? 'text-white' : 'text-slate-500'}`} />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
