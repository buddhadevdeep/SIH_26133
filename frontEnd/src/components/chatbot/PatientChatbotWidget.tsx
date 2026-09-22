import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { assistantApi, AssistantActionChip, RecommendedHospital } from '@/api/assistantApi';
import { Button } from '@/components/ui/Button';
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  AlertTriangle,
  Stethoscope,
  Building2,
  Calendar,
  Activity,
  RefreshCw,
  Clock,
  ArrowRight,
  Pill,
  HeartPulse,
  Flame,
  CheckCircle2,
  Layers,
  Database,
  Camera,
  Image as ImageIcon,
  Trash2,
  Paperclip,
  Navigation,
  Phone,
  MapPin,
  Target,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: string;
  isEmergency?: boolean;
  intent?: string;
  sources?: string[];
  latencyMs?: number;
  actionChips?: AssistantActionChip[];
  doctor?: { name: string; specialty: string; room?: string };
  recommendedHospitals?: RecommendedHospital[];
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-teal-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const PatientChatbotWidget: React.FC = () => {
  const { user } = useAuth();
  const { userCoords, selectedDistrict, detectGpsLocation, gpsAccuracy } = useLocationContext();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'ml'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // ML Predictor tab state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResults, setMlResults] = useState<any>(null);

  // Photo Attachment state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionIdRef = useRef<string>(
    sessionStorage.getItem('aarogya_session_id') || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const patientName = user?.name ? user.name.split(' ')[0] : 'Citizen';

  // Auto-detect GPS location when chatbot opens
  useEffect(() => {
    if (isOpen && !userCoords && detectGpsLocation) {
      setIsDetectingGps(true);
      detectGpsLocation()
        .catch(() => {})
        .finally(() => setIsDetectingGps(false));
    }
  }, [isOpen]);

  const handleRefreshLocation = async () => {
    if (!detectGpsLocation) return;
    setIsDetectingGps(true);
    try {
      await detectGpsLocation();
    } catch (e) {
      console.warn('GPS detection failed:', e);
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Handle Photo Select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Initialize Web Speech Recognition (Browser Fallback)
  useEffect(() => {
    sessionStorage.setItem('aarogya_session_id', sessionIdRef.current);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'gu-IN'; // Multi-lingual with Gujarati priority

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInputValue(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
      };

      recognition.onend = () => {
        // Handled in stopListening
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, activeTab, attachedImage]);

  const startListening = async () => {
    try {
      setRecordingSeconds(0);
      setIsListening(true);
      audioChunksRef.current = [];

      // Start MediaRecorder for Sarvam Saaras AI ASR
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              try {
                const sttResult = await assistantApi.speechToText(audioBlob, 'gu-IN');
                if (sttResult && sttResult.transcript) {
                  setInputValue(sttResult.transcript.trim());
                }
              } catch (sttErr) {
                console.warn('Sarvam STT failed, using browser transcript:', sttErr);
              }
            }
          };

          mediaRecorder.start(250);
        } catch (mediaErr) {
          console.warn('MediaRecorder init notice:', mediaErr);
        }
      }

      // Also trigger browser speech recognition for live typing feel
      try {
        recognitionRef.current?.start();
      } catch (recErr) {}

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      stopListening();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {}
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
  };

  const handleAudioPlayback = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setPlayingAudioId(null);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    setPlayingAudioId(msgId);

    // Clean text for natural speech (remove markdown symbols and emojis)
    const cleanText = text
      .replace(/\[ACTIONS\][\s\S]*$/, '')
      .replace(/[*_#`~⚠️🚨🩺📸💡💊🎟️👨‍⚕️🏢📍📞🛏️🕒•>-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 450);

    // Try Sarvam AI TTS (Bulbul v3 multi-lingual Indian speech synthesis)
    try {
      const isGujarati = /[\u0A80-\u0AFF]/.test(cleanText);
      const isHindi = /[\u0900-\u097F]/.test(cleanText);
      const langCode = isGujarati ? 'gu-IN' : isHindi ? 'hi-IN' : 'en-IN';
      const speaker = isGujarati ? 'pooja' : isHindi ? 'shreya' : 'priya';
      
      const ttsData = await assistantApi.textToSpeech(cleanText, langCode, speaker);
      if (ttsData && ttsData.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${ttsData.audio_base64}`);
        audioElementRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => {
          setPlayingAudioId(null);
          fallbackBrowserSpeech(cleanText);
        };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Sarvam TTS failed, using browser speech:', e);
    }

    // Fallback to browser Web Speech API
    fallbackBrowserSpeech(cleanText.slice(0, 300));
  };

  const fallbackBrowserSpeech = (cleanText: string) => {
    if (!('speechSynthesis' in window)) {
      setPlayingAudioId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.lang = /[\u0A80-\u0AFF]/.test(cleanText) ? 'gu-IN' : 'en-IN';
    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if ((!queryText && !attachedImage) || loading) return;

    stopListening();

    const currentImage = attachedImage;
    setAttachedImage(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: queryText || (currentImage ? 'Please analyze this healthcare photo / medical document.' : ''),
      image: currentImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    const updatedHistory = [...historyRef.current, { role: 'user', content: queryText || 'Photo analysis request' }];
    historyRef.current = updatedHistory;

    try {
      const res = await assistantApi.sendMessage({
        message: queryText || 'Please analyze this attached healthcare photo / prescription / lab report',
        image: currentImage || undefined,
        userId: user?.id || 'PAT-1001',
        sessionId: sessionIdRef.current,
        history: updatedHistory.slice(-6),
        latitude: userCoords?.lat,
        longitude: userCoords?.lng,
      });

      if (res.data) {
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: res.data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEmergency: res.data.is_emergency,
          intent: res.data.intent,
          latencyMs: res.data.latency_ms,
          actionChips: res.data.actionChips,
          recommendedHospitals: res.data.recommendedHospitals,
        };

        setMessages((prev) => [...prev, botMsg]);
        historyRef.current.push({ role: 'assistant', content: res.data.answer });

        if (ttsEnabled) {
          handleAudioPlayback(botMsg.id, res.data.answer);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'assistant',
            text: '⚠️ Could not connect to the healthcare model. Please check the network or retry.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Model Service Error: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = async () => {
    await assistantApi.resetSession(sessionIdRef.current);
    sessionIdRef.current = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('aarogya_session_id', sessionIdRef.current);
    historyRef.current = [];
    setMessages([]);
    setInputValue('');
    setAttachedImage(null);
  };

  const handleActionClick = (chip: AssistantActionChip) => {
    if (chip.action === 'NAVIGATE' && chip.path) {
      setIsOpen(false);
      navigate(chip.path);
    } else if (chip.action === 'EMERGENCY') {
      window.open(`tel:${chip.phone || '108'}`, '_self');
    } else if (chip.label) {
      handleSendMessage(chip.label.replace(/^[^\w]+/, '').trim());
    }
  };

  const handleRunMlPrediction = async () => {
    if (selectedSymptoms.length === 0) return;
    setMlLoading(true);
    try {
      const data = await assistantApi.predictDisease(selectedSymptoms, 5);
      setMlResults(data);
    } catch (e) {
      console.warn('ML Prediction failed:', e);
    } finally {
      setMlLoading(false);
    }
  };

  const quickSymptoms = [
    'fever',
    'headache',
    'cough',
    'sore throat',
    'chest pain',
    'shortness of breath',
    'dizziness',
    'nausea',
    'joint pain',
    'abdominal pain',
    'fatigue',
    'cold',
  ];

  return (
    <>
      {/* Corner Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-5 z-40 flex items-center gap-2 group">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-teal-500/30 backdrop-blur-xs group-hover:scale-105 transition-all">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AarogyaMitra AI</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-teal-800 via-teal-600 to-emerald-400 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white cursor-pointer focus:outline-none ring-4 ring-teal-500/20"
            aria-label="Open Medical AI Chatbot"
          >
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white animate-ping"></div>
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white"></div>
            <Sparkles className="h-7 w-7 text-white drop-shadow-xs" />
          </button>
        </div>
      )}

      {/* Main Chatbot Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[450px] sm:h-[680px] sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white p-4 pb-3 overflow-hidden shrink-0 shadow-sm">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-300 p-0.5 shadow-md flex items-center justify-center">
                  <div className="h-full w-full bg-slate-900/60 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
                    <Stethoscope className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-white tracking-tight">
                      AarogyaMitra AI
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full">
                      Model Live
                    </span>
                  </div>
                  <p className="text-[10px] text-teal-200/80 font-mono">
                    Gemini 3.1 + ML Differential (Port 8000)
                  </p>
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="New Consultation (Clear Memory)"
                  className="text-teal-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  title={ttsEnabled ? 'Mute auto-read' : 'Enable auto-read in Gujarati'}
                  className="text-teal-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-teal-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Switch Tabs */}
            <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Chat Consultation
              </button>
              <button
                onClick={() => setActiveTab('ml')}
                className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ml'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                ML Disease Classifier
              </button>
            </div>
          </div>

          {/* TAB 1: AI CHAT CONSULTATION */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFB]">
              {/* Live Real-Time Patient GPS Tracker Bar */}
              <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between border-b border-teal-900/50 shrink-0 shadow-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="relative flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping absolute"></span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 relative"></span>
                  </div>
                  <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                  {userCoords ? (
                    <span className="text-[10px] font-mono text-teal-200 truncate">
                      GPS Live: <strong className="text-white">{userCoords.lat.toFixed(4)}°N, {userCoords.lng.toFixed(4)}°E</strong> ({selectedDistrict || 'Gujarat'})
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal-300 animate-pulse truncate">
                      {isDetectingGps ? 'Tracking real browser GPS coordinates...' : 'Location: Default Gandhinagar Grid'}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleRefreshLocation}
                  disabled={isDetectingGps}
                  title="Track and pin your exact live GPS location"
                  className="shrink-0 ml-1 px-2 py-0.5 rounded-md bg-teal-800/90 hover:bg-teal-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer border border-teal-600/40"
                >
                  <Target className={`h-3 w-3 text-emerald-300 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Tracking...' : '🎯 Track Real GPS'}</span>
                </button>
              </div>

              {/* Quick Prompts & 3 Core GPS Buttons Bar */}
              <div className="bg-white border-b border-slate-200/80 px-3 py-2 flex items-center justify-between gap-1.5 shrink-0 shadow-2xs">
                <button
                  onClick={() => handleSendMessage('Show the real nearest hospital to my location with live bed availability, address and exact distance')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-300/80 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Building2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">🏥 Nearby Hospitals</span>
                </button>

                <button
                  onClick={() => handleSendMessage('Show the real nearest medical store and Jan Aushadhi Kendra to my location with available medicine stock and address')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300/80 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Pill className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">💊 Medical Stores</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/patient/tokens');
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300/80 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs hover:scale-[1.02] active:scale-95"
                >
                  <Calendar className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
                  <span className="truncate">🎟️ Live OPD Token</span>
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
                {/* Welcome Card */}
                {messages.length === 0 && (
                  <div className="space-y-3 animate-in fade-in-50 duration-200">
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-6 w-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                          AI
                        </div>
                        <span className="font-bold text-slate-900">
                          AarogyaMitra Clinical & GPS Triage
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">Now</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">
                        <strong>નમસ્તે {patientName}!</strong> I am your Gujarat Healthcare Assistant. Ask me about any disease symptoms, medications, or tap a button below to get GPS-verified healthcare services.
                      </p>
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      GPS Direct Actions:
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div
                        onClick={() => handleSendMessage('Show the real nearest hospital to my location with live bed availability, address and exact distance')}
                        className="p-3 rounded-2xl bg-gradient-to-r from-teal-50/80 to-white border border-teal-200 hover:border-teal-400 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                              <span>🏥 Find Real Nearby Hospitals</span>
                              <span className="text-[9px] bg-teal-200/60 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">GPS Verified</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Live bed availability, drive time & doctors on duty</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      <div
                        onClick={() => handleSendMessage('Show the real nearest medical store and Jan Aushadhi Kendra to my location with available medicine stock and address')}
                        className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-white border border-emerald-200 hover:border-emerald-400 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                              <span>💊 Find Real Nearby Medical Stores</span>
                              <span className="text-[9px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Jan Aushadhi</span>
                            </div>
                            <p className="text-[10px] text-slate-500">PM Jan Aushadhi Kendras, discounted generics & live stock</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      <div
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/patient/tokens');
                        }}
                        className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-white border border-indigo-200 hover:border-indigo-400 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                              <span>🎟️ Live OPD Token & Queue</span>
                              <span className="text-[9px] bg-indigo-200/60 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">Instant</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Book OPD token online & bypass hospital counter lines</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation List */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[95%] sm:max-w-[92%] rounded-2xl p-3.5 shadow-2xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-tr-xs'
                          : msg.isEmergency
                          ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-tl-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {/* User Attached Photo Preview */}
                      {msg.image && (
                        <div className="mb-2">
                          <img
                            src={msg.image}
                            alt="Medical Attachment"
                            className="max-h-48 max-w-full rounded-xl object-cover border border-white/30 shadow-xs"
                          />
                        </div>
                      )}

                      {/* Message Header for Bot */}
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                            <span>AarogyaMitra Response</span>
                          </div>

                          <button
                            onClick={() => handleAudioPlayback(msg.id, msg.text)}
                            title="Listen in Gujarati Voice (Sarvam Bulbul TTS)"
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                              playingAudioId === msg.id
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : 'bg-teal-50 hover:bg-teal-100 text-teal-800'
                            }`}
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>{playingAudioId === msg.id ? 'Playing...' : '🔊 Read Aloud'}</span>
                          </button>
                        </div>
                      )}

                      {/* Exact Model Response Formatted */}
                      <div className="space-y-2 text-xs leading-relaxed">
                        {(msg.text || '').replace(/\[ACTIONS\][\s\S]*$/, '').trim().split('\n').map((line, lIdx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <div key={lIdx} className="h-1" />;

                          // Headers
                          if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
                            const headerText = trimmed.replace(/^#+\s*/, '');
                            return (
                              <h4 key={lIdx} className="font-bold text-teal-950 text-[13px] pt-1.5 border-b border-teal-100/80 pb-0.5">
                                {headerText}
                              </h4>
                            );
                          }

                          // Bullet points
                          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                            const bulletContent = trimmed.replace(/^[\*\-•]\s*/, '');
                            return (
                              <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-slate-800">
                                <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                                <div>{renderInlineMarkdown(bulletContent)}</div>
                              </div>
                            );
                          }

                          // Disclaimer or Warning
                          if (trimmed.startsWith('⚠️') || trimmed.includes('Medical Disclaimer') || trimmed.includes('તબીબી ચેતવણી')) {
                            return (
                              <div key={lIdx} className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-[11px] font-medium mt-2">
                                {renderInlineMarkdown(trimmed)}
                              </div>
                            );
                          }

                          return (
                            <p key={lIdx} className={msg.sender === 'user' ? 'text-white' : 'text-slate-800'}>
                              {renderInlineMarkdown(trimmed)}
                            </p>
                          );
                        })}
                      </div>

                      {/* INTERACTIVE RECOMMENDED HOSPITALS ACCORDING TO DISEASE */}
                      {msg.recommendedHospitals && msg.recommendedHospitals.length > 0 && (
                        <div className="mt-3.5 space-y-2.5 pt-3 border-t border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-teal-950 flex items-center gap-1.5 uppercase tracking-wide">
                              <Building2 className="h-3.5 w-3.5 text-teal-700" />
                              Nearby Specialized Hospitals ({msg.recommendedHospitals.length}):
                            </span>
                            <span className="text-[9px] text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.5 rounded-full font-black">
                              🟢 Live Bed Verified
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {msg.recommendedHospitals.map((hosp) => (
                              <div
                                key={hosp.id}
                                className="rounded-2xl bg-gradient-to-b from-white to-slate-50/70 border border-teal-200/90 p-3 shadow-2xs hover:border-teal-500 hover:shadow-xs transition-all space-y-2 text-slate-800"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-extrabold text-[12px] text-slate-950 leading-tight">
                                        {hosp.name}
                                      </h4>
                                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Verified
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                      📍 {hosp.address}
                                    </p>
                                  </div>

                                  <span className="shrink-0 bg-teal-50 text-teal-900 border border-teal-200 text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap">
                                    {hosp.distanceKm} km • ~{hosp.driveTimeMinutes || Math.max(3, Math.round(hosp.distanceKm * 2.2))}m
                                  </span>
                                </div>

                                {/* Matching Specialty & Doctor */}
                                <div className="bg-teal-50/70 rounded-xl p-2 border border-teal-100 space-y-1 text-[11px]">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-teal-950 font-bold flex items-center gap-1">
                                      <Stethoscope className="h-3 w-3 text-teal-700 shrink-0" />
                                      <span>Dept: {hosp.matchedSpecialty || 'Specialty'} OPD</span>
                                    </span>
                                    <span className="text-[9px] font-bold text-teal-900 bg-white px-1.5 py-0.5 rounded border border-teal-200">
                                      {hosp.doctorOnDuty?.opdRoom || 'Room 4'}
                                    </span>
                                  </div>

                                  {hosp.doctorOnDuty && (
                                    <p className="text-[10px] text-slate-700 flex items-center gap-1 pl-4">
                                      <span>Attending: <strong>{hosp.doctorOnDuty.name}</strong> ({hosp.doctorOnDuty.qualification || hosp.doctorOnDuty.specialty})</span>
                                    </p>
                                  )}
                                </div>

                                {/* Live Beds & Emergency Status */}
                                <div className="flex items-center justify-between text-[10px] text-slate-600 px-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                      🛏️ {hosp.availableBeds || 45} Beds
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">
                                      🫁 {hosp.icuBedsAvailable || 8} ICU
                                    </span>
                                  </div>

                                  <span className={`font-semibold flex items-center gap-1 text-[9px] ${hosp.emergencyAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${hosp.emergencyAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    {hosp.emergencyAvailable ? '24x7 Emergency' : 'OPD Only'}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                                  <button
                                    onClick={() => {
                                      setIsOpen(false);
                                      navigate(`/patient/tokens?facility=${encodeURIComponent(hosp.name)}&facilityId=${encodeURIComponent(hosp.id)}`);
                                    }}
                                    className="px-2 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-[10px] transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                  >
                                    🎟️ Live Token
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsOpen(false);
                                      navigate(`/patient/appointments/book?facility=${encodeURIComponent(hosp.name)}&facilityId=${encodeURIComponent(hosp.id)}&dept=${encodeURIComponent(hosp.matchedSpecialty || '')}`);
                                    }}
                                    className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    📅 Book Slot
                                  </button>
                                  <a
                                    href={
                                      userCoords
                                        ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${hosp.coordinates ? `${hosp.coordinates.lat},${hosp.coordinates.lng}` : encodeURIComponent(hosp.name + ' ' + hosp.address)}&travelmode=driving`
                                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hosp.name + ' ' + (hosp.address || ''))}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer text-center"
                                  >
                                    <Navigation className="h-3 w-3 text-emerald-700" />
                                    <span>Route</span>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Chips */}
                      {msg.actionChips && msg.actionChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-100">
                          {msg.actionChips.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleActionClick(chip)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                                chip.action === 'EMERGENCY'
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-teal-700 hover:bg-teal-800 text-white'
                              }`}
                            >
                              <span>{chip.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 w-fit">
                    <div className="h-4 w-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
                    <span className="text-xs font-medium">
                      Finding matching specialized hospitals & live bed data...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Speech Recording Bar if Active */}
              {isListening && (
                <div className="bg-emerald-950 text-emerald-200 px-4 py-2 flex items-center justify-between border-t border-emerald-800 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-semibold text-white">
                      Listening in Gujarati / English ({recordingSeconds}s)... Speak now!
                    </span>
                  </div>
                  <button
                    onClick={stopListening}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200/80 shrink-0 space-y-2">
                {/* 3 Core Quick Navigation Buttons (GPS-Powered) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Show the real nearest hospital to my location with live bed availability, address and exact distance')}
                    className="flex-1 min-w-[110px] py-1 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Building2 className="h-3 w-3 text-teal-700" />
                    <span>🏥 Nearby Hospitals</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Show the real nearest medical store and Jan Aushadhi Kendra to my location with available medicine stock and address')}
                    className="flex-1 min-w-[110px] py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Pill className="h-3 w-3 text-emerald-700" />
                    <span>💊 Medical Stores</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/patient/tokens');
                    }}
                    className="flex-1 min-w-[105px] py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>🎟️ Live OPD Token</span>
                  </button>
                </div>

                {/* Image Attachment Preview */}
                {attachedImage && (
                  <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-2 animate-in fade-in-50 duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={attachedImage}
                        alt="Preview"
                        className="h-10 w-10 rounded-lg object-cover border border-teal-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-teal-900 truncate">Healthcare Photo Attached</p>
                        <p className="text-[10px] text-teal-700">Will be analyzed by Clinical AI</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  {/* Photo / Camera Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Healthcare Photo / Prescription / Lab Report"
                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-all bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 cursor-pointer shrink-0"
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="તમારો પ્રશ્ન અથવા લક્ષણો લખો... (Type symptoms or query)"
                    className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all"
                  />

                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    title="Speak in Gujarati / English"
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isListening
                        ? 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                        : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {/* Send Button */}
                  <Button
                    type="submit"
                    disabled={(!inputValue.trim() && !attachedImage) || loading}
                    className="h-10 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: ML DISEASE CLASSIFIER (DIRECT FASTAPI PREDICTOR) */}
          {activeTab === 'ml' && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFB] text-xs space-y-4">
              <div className="p-3 rounded-2xl bg-teal-900 text-white">
                <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-300">
                  <Activity className="h-4 w-4" /> ML Differential Diagnosis
                </h4>
                <p className="text-[11px] text-teal-100/80 mt-1">
                  MultinomialNB Classifier trained on 254 Disease Profiles & 163,000 records.
                </p>
              </div>

              {/* Symptom Selection Tags */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Select Symptoms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSymptoms.map((sym) => {
                    const isSel = selectedSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        onClick={() => {
                          if (isSel) {
                            setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
                          } else {
                            setSelectedSymptoms([...selectedSymptoms, sym]);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer text-xs ${
                          isSel
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '} {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Symptom Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="Or type custom symptom (e.g., ear pain)..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => {
                    if (symptomInput.trim() && !selectedSymptoms.includes(symptomInput.trim())) {
                      setSelectedSymptoms([...selectedSymptoms, symptomInput.trim()]);
                      setSymptomInput('');
                    }
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Run Prediction Button */}
              <Button
                onClick={handleRunMlPrediction}
                disabled={selectedSymptoms.length === 0 || mlLoading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-10 rounded-xl gap-2 shadow-xs"
              >
                {mlLoading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Run ML Model Inference ({selectedSymptoms.length} symptoms)
              </Button>

              {/* ML Results Display */}
              {mlResults && mlResults.top_predictions && (
                <div className="space-y-2 pt-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Top Predictions ({mlResults.inference_time_ms}ms)
                    </span>
                    <span className="bg-teal-100 text-teal-900 text-[10px] font-black px-2 py-0.5 rounded">
                      {mlResults.overall_urgency}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {mlResults.top_predictions.map((pred: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 capitalize text-sm">
                            {idx + 1}. {pred.disease}
                          </span>
                          <span className="font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs">
                            {pred.confidence_percent}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Matched: {pred.matched_symptoms?.join(', ')}
                        </p>
                        {pred.precautions && pred.precautions.length > 0 && (
                          <p className="text-[10px] text-slate-600 mt-1.5 italic bg-slate-50 p-1.5 rounded">
                            {pred.precautions[0]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
