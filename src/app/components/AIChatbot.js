'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bot, Sparkles, X, Send, User, ChevronDown } from 'lucide-react';

export default function AIChatbot() {
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
    
    const aiMsgId = Date.now() + 1;
    // Optimistic UI update for both patient and an empty AI bubble
    setMessages(prev => [...prev, newMsg, {
      id: aiMsgId,
      sender: 'ai',
      content: '',
      timestamp: new Date().toISOString()
    }]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/patient/simulated-phone/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg.content })
      });
      
      setIsTyping(false); // Hide typing indicator once stream starts
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiFullResponse = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkText = decoder.decode(value);
          const lines = chunkText.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                aiFullResponse += data.response;
                setMessages(prev => {
                  const newArr = [...prev];
                  const lastMsg = newArr[newArr.length - 1];
                  if (lastMsg.id === aiMsgId) {
                    lastMsg.content = aiFullResponse;
                  }
                  return newArr;
                });
              }
            } catch(e) {
              // Ignore incomplete JSON chunks, next read will resolve it if we used a buffer,
              // but Ollama's stream sends distinct newline-separated JSON objects.
            }
          }
        }
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all z-50 animate-bounce-slow border-2 border-white"
      >
        <Bot size={28} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* AI Chatbot UI Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md sm:items-end sm:justify-end sm:p-6">
          <div className="bg-slate-50 w-full h-full sm:w-[380px] sm:h-[650px] sm:rounded-2xl shadow-2xl flex flex-col relative overflow-hidden border border-slate-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4 flex items-center gap-3 shrink-0 relative z-10 shadow-md">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner backdrop-blur-sm">
                <Sparkles size={20} className="text-blue-100" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate tracking-wide flex items-center gap-2">
                  SmartCare AI
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                </h3>
                <p className="text-[11px] text-blue-100 truncate font-medium">Your Personal Medical Assistant</p>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full items-center justify-center flex transition-colors cursor-pointer">
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 relative scroll-smooth">
              <div className="text-center my-4">
                <div className="inline-block bg-blue-100/50 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium">
                  Today
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 mt-10">
                  <Bot size={48} className="text-slate-300 opacity-50" />
                  <p className="text-sm font-medium">How can I help you today?</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isPatient = msg.sender === 'patient';
                  return (
                    <div key={msg.id || idx} className={`flex gap-3 animate-fadeIn ${isPatient ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPatient ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm'}`}>
                        {isPatient ? <User size={14} /> : <Sparkles size={14} />}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div className={`p-3.5 shadow-sm relative text-[14px] leading-relaxed ${isPatient ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'}`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-fadeIn flex-row">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
                    <Sparkles size={14} />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 shrink-0">
              <div className="flex items-end gap-2 bg-slate-100 rounded-2xl p-1.5 pr-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a medical question..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-700 focus:outline-none resize-none max-h-32 min-h-[40px]"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${inputText.trim() ? 'bg-indigo-600 cursor-pointer hover:bg-indigo-700 hover:shadow-md' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  <Send size={16} className={`transform ml-0.5 ${inputText.trim() ? 'text-white' : 'text-slate-100'}`} />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-400 font-medium">SmartCare AI can make mistakes. Check important info.</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
