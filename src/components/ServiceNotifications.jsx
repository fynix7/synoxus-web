import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Image, Rocket, X, MessageSquare, ArrowRight, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

const services = [
    {
        name: "Infinite Ideation",
        icon: Brain,
        description: "Unlimited viral content ideas on demand."
    },
    {
        name: "Psychological Packaging",
        icon: Image,
        description: "Titles & Thumbnails designed to drive clicks."
    },
    {
        name: "Conversion Cascade",
        icon: Rocket,
        description: "DFY VSL & Landing Page engineered to print cash."
    }
];

const QUICK_REPLIES = {
    revenue: ["<$10k/mo", "$10k - $50k/mo", "$50k - $100k/mo", "$100k+/mo"],
    bottleneck: ["Traffic/Leads", "Conversion/Sales", "Fulfillment/Delivery", "Hiring/Team"],
};

const ServiceNotifications = ({ isOpen, setIsOpen, mode = 'default' }) => {
    const [status, setStatus] = React.useState('online');
    const [timeSinceOffline, setTimeSinceOffline] = React.useState('');
    const [inputValue, setInputValue] = React.useState('');
    const [avatar, setAvatar] = React.useState({ name: 'Yohan', initial: 'Y', role: null });
    const [messages, setMessages] = React.useState([]);
    const [showResetConfirm, setShowResetConfirm] = React.useState(false);
    const [isTyping, setIsTyping] = React.useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const [sessionId, setSessionId] = React.useState(null);

    // Initialize Session & Load History
    React.useEffect(() => {
        const initSession = async () => {
            const storageKey = mode === 'qualification' ? 'synoxus_session_id_qual' : 'synoxus_session_id_default';
            let sid = localStorage.getItem(storageKey);
            if (!sid) {
                sid = crypto.randomUUID();
                localStorage.setItem(storageKey, sid);
            }
            setSessionId(sid);

            // Clear messages first to avoid flicker
            setMessages([]);

            if (supabase) {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('session_id', sid)
                    .order('created_at', { ascending: true });

                if (data && data.length > 0) {
                    setMessages(data);
                } else {
                    // Fallback to local storage
                    const historyKey = mode === 'qualification' ? 'synoxus_chat_history_qual' : 'synoxus_chat_history_default';
                    const savedMessages = localStorage.getItem(historyKey);
                    if (savedMessages) {
                        setMessages(JSON.parse(savedMessages));
                    }
                }
            } else {
                const historyKey = mode === 'qualification' ? 'synoxus_chat_history_qual' : 'synoxus_chat_history_default';
                const savedMessages = localStorage.getItem(historyKey);
                if (savedMessages) {
                    setMessages(JSON.parse(savedMessages));
                }
            }
        };
        initSession();
    }, [mode]);

    // Save chat history to LocalStorage (backup)
    React.useEffect(() => {
        if (messages.length > 0) {
            const historyKey = mode === 'qualification' ? 'synoxus_chat_history_qual' : 'synoxus_chat_history_default';
            localStorage.setItem(historyKey, JSON.stringify(messages));
        }
    }, [messages, mode]);

    const saveMessageToSupabase = async (msg) => {
        if (!supabase || !sessionId) return;
        await supabase.from('messages').insert([{
            text: msg.text,
            sender: msg.sender,
            session_id: sessionId,
            created_at: new Date().toISOString()
        }]);
    };

    // Auto-open chat after 8 seconds (only if not already opened via other means)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setIsOpen(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    // Avatar & Status Logic
    React.useEffect(() => {
        const determineAvatar = () => {
            const now = new Date();
            const mstString = now.toLocaleString("en-US", { timeZone: "America/Denver" });
            const mstDate = new Date(mstString);
            const hour = mstDate.getHours();

            let persona = {};

            if (mode === 'qualification') {
                // Read custom settings for qualification mode
                const savedPersonas = localStorage.getItem('synoxus_chat_personas');
                const personas = savedPersonas ? JSON.parse(savedPersonas) : [];
                const qualPersona = personas.find(p => p.type === 'qualification') || {
                    name: 'Max',
                    role: 'Client Success',
                    welcomeMessage: "Hey! Max here. Glad you're interested. Before we start, what's your best email or phone number?"
                };

                persona = {
                    name: qualPersona.name,
                    initial: qualPersona.name.charAt(0),
                    role: qualPersona.role,
                    welcome: qualPersona.welcomeMessage
                };
            } else {
                // Default Persona (Yohan/Laura) - Dynamic
                const savedPersonas = localStorage.getItem('synoxus_chat_personas');
                const personas = savedPersonas ? JSON.parse(savedPersonas) : [];

                // Fallback defaults if no config
                const defaultYohan = {
                    name: 'Yohan',
                    role: null,
                    welcomeMessage: "Hey, Yohan here. Let me know if you have any questions. If I'm free I'll try to reply as fast as I can."
                };
                const defaultLaura = {
                    name: 'Laura',
                    role: "Yohan's Assistant",
                    welcomeMessage: "Hi, I'm Laura, Yohan's assistant. Yohan is currently offline. How can I help you today?"
                };

                // Find configured personas or use defaults
                const yohanPersona = personas.find(p => p.name === 'Yohan') || defaultYohan;
                const lauraPersona = personas.find(p => p.name === 'Laura') || defaultLaura;

                if (hour >= 7 && hour < 23) {
                    persona = {
                        name: yohanPersona.name,
                        initial: yohanPersona.name.charAt(0),
                        role: yohanPersona.role,
                        welcome: yohanPersona.welcomeMessage
                    };
                } else {
                    persona = {
                        name: lauraPersona.name,
                        initial: lauraPersona.name.charAt(0),
                        role: lauraPersona.role,
                        welcome: lauraPersona.welcomeMessage
                    };
                }
            }

            return persona;
        };

        const currentAvatar = determineAvatar();
        setAvatar(currentAvatar);

        // Only set initial message if history is empty
        // We need to wait for the session load to confirm it's empty, but this runs after mode change too.
        // A small timeout helps ensure we don't overwrite loaded messages, or we check messages state length.
        // However, messages might be empty initially.
        // Better approach: The initSession sets messages. If after init it's empty, we add welcome.
        // But initSession is async.
        // Let's use a separate effect for welcome message or handle it in initSession?
        // For now, we'll just check if messages is empty after a short delay or rely on the fact that setMessages([]) was called in initSession.

        // Actually, we can just check if we need to add the welcome message inside the initSession logic? 
        // No, because avatar is determined here.

        // Let's just set it here but be careful not to overwrite.
        // We'll rely on the fact that if messages are empty, we should show welcome.
        // But we need to make sure we don't show it before loading.

    }, [mode, isOpen]);

    // Effect to ensure welcome message is added if chat is empty after loading
    React.useEffect(() => {
        if (sessionId && messages.length === 0 && avatar.welcome) {
            setMessages([{ id: Date.now(), text: avatar.welcome, sender: 'agent' }]);
        }
    }, [sessionId, avatar]); // When session is ready and avatar is ready

    // Status Logic
    React.useEffect(() => {
        setStatus('online');
        const toOfflineTimer = setTimeout(() => {
            const offlineMinutes = Math.floor(Math.random() * 3) + 2;
            const offlineDuration = offlineMinutes * 60 * 1000;
            setStatus(Date.now());
            const toOnlineTimer = setTimeout(() => {
                setStatus('online');
            }, offlineDuration);
            return () => clearTimeout(toOnlineTimer);
        }, 20000);

        return () => clearTimeout(toOfflineTimer);
    }, [mode, isOpen]);

    // Update "Last online" timer
    React.useEffect(() => {
        let intervalId;
        if (status !== 'online') {
            const updateTimer = () => {
                const diff = Math.floor((Date.now() - status) / 1000);
                if (diff < 60) {
                    setTimeSinceOffline(`${diff}s ago`);
                } else {
                    const mins = Math.floor(diff / 60);
                    const secs = diff % 60;
                    setTimeSinceOffline(`${mins}m ${secs}s ago`);
                }
            };
            updateTimer();
            intervalId = setInterval(updateTimer, 1000);
        }
        return () => clearInterval(intervalId);
    }, [status]);

    // Chat Response Logic
    React.useEffect(() => {
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender === 'user') {
            setIsTyping(true);

            const savedPersonas = localStorage.getItem('synoxus_chat_personas');
            const personas = savedPersonas ? JSON.parse(savedPersonas) : [];

            let currentPersonaConfig = null;
            if (mode === 'qualification') {
                currentPersonaConfig = personas.find(p => p.type === 'qualification');
            } else {
                currentPersonaConfig = personas.find(p => p.name === avatar.name);
            }

            const minDelay = currentPersonaConfig?.intervalMin || 1500;
            const maxDelay = currentPersonaConfig?.intervalMax || 2500;
            const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

            const timeout = setTimeout(async () => {
                let responseText = "";

                if (mode === 'qualification') {
                    // Qualification Flow Logic
                    const history = messages.filter(m => m.sender === 'agent').map(m => m.text);
                    const lastAgentText = history[history.length - 1] || "";

                    if (lastAgentText.includes("email") || lastAgentText.includes("phone")) {
                        responseText = "Thanks! To start, how many videos/mo do you currently post?";
                    } else if (lastAgentText.includes("currently post")) {
                        responseText = "Got it. How many do you WANT to post?";
                    } else if (lastAgentText.includes("WANT to post")) {
                        responseText = "Understood. What's your monthly budget for this?";
                    } else if (lastAgentText.includes("monthly budget")) {
                        responseText = "Thanks. What's your channel link?";
                    } else if (lastAgentText.includes("channel link")) {
                        responseText = "Perfect. What are your main goals? (e.g. 100k subs)";
                    } else if (lastAgentText.includes("main goals")) {
                        responseText = "Thanks! Received. We'll reach out shortly.";
                    } else {
                        if (history.length === 1) {
                            responseText = "Thanks! To start, how many videos/mo do you currently post?";
                        } else {
                            responseText = "Anything else to add?";
                        }
                    }
                } else {
                    // Default / General Chat Logic
                    responseText = `Thanks for reaching out! I've notified ${avatar.name}. We usually reply within a few hours. In the meantime, feel free to check out our case studies above.`;
                }

                const newAgentMsg = {
                    id: Date.now(),
                    text: responseText,
                    sender: 'agent'
                };
                setMessages(prev => [...prev, newAgentMsg]);
                setIsTyping(false);
                await saveMessageToSupabase(newAgentMsg);

            }, delay);

            return () => clearTimeout(timeout);
        }
    }, [messages, mode, avatar.name]);

    const handleSend = async (e, textOverride = null) => {
        e.preventDefault();
        const textToSend = textOverride || inputValue;

        if (!textToSend.trim()) return;

        const newUserMsg = {
            id: Date.now(),
            text: textToSend,
            sender: 'user'
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setStatus('online');
        await saveMessageToSupabase(newUserMsg);
    };

    const handleResetChat = async () => {
        localStorage.removeItem('synoxus_chat_history');
        setMessages([{ id: Date.now(), text: avatar.welcome, sender: 'agent' }]);
        setShowResetConfirm(false);

        if (supabase && sessionId) {
            await supabase
                .from('messages')
                .delete()
                .eq('session_id', sessionId);
        }
    };

    return (
        <>
            {/* Notifications - Fixed Left Below Header */}
            <div className="fixed top-40 left-4 z-[40] flex flex-col gap-4 pointer-events-none">
                {services.map((service, index) => {
                    const Icon = service.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                opacity: { delay: 3.0 + (index * 0.2), duration: 0.3 },
                                x: { delay: 3.0 + (index * 0.2), duration: 0.3, type: "spring" }
                            }}
                            whileHover={{
                                scale: 1.05,
                                transition: { duration: 0.4, ease: "easeOut", delay: 0 }
                            }}
                            className="group relative flex items-center gap-5 p-5 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl w-[28rem] pointer-events-auto cursor-default overflow-hidden bg-[#121212]/80"
                        >
                            <div className="absolute top-3 right-3 text-xs font-light text-white/80">
                                now
                            </div>

                            <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-b from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_15px_rgba(255,152,43,0.4)] relative z-10">
                                <Icon className="w-7 h-7 text-[#050505]" strokeWidth={2} />
                            </div>
                            <div className="flex-1 pr-4">
                                <h3 className="font-medium text-lg mb-0 text-white">{service.name}</h3>
                                <p className="text-sm text-[#fcf0d4] leading-relaxed">{service.description}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chat Interface */}
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <>
                        {/* Backdrop for Qualification Mode */}
                        {mode === 'qualification' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm"
                                onClick={() => setIsOpen(false)}
                            />
                        )}

                        <motion.div
                            initial={mode === 'qualification'
                                ? { opacity: 0, scale: 0.9, y: 20, x: "-50%", y: "-50%" }
                                : { opacity: 0, scale: 0.9, y: 20 }}
                            animate={mode === 'qualification'
                                ? { opacity: 1, scale: 1, y: "-50%", x: "-50%" }
                                : { opacity: 1, scale: 1, y: 0 }}
                            exit={mode === 'qualification'
                                ? { opacity: 0, scale: 0.9, y: "-40%", x: "-50%" }
                                : { opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={mode === 'qualification'
                                ? "fixed top-1/2 left-1/2 z-[60] w-[90vw] max-w-2xl h-[80vh] max-h-[800px] bg-[#050505] border border-white/10 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                                : "fixed bottom-4 right-4 z-[60] w-[24rem] h-[32rem] bg-[#050505] border border-white/10 rounded-2xl shadow-2xl flex flex-col pointer-events-auto"
                            }
                        >
                            {/* Chat Header */}
                            <div className="relative p-4 bg-[#121212] border-b border-white/5 flex items-center justify-between rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center">
                                        <span className="font-bold text-black text-xs">{avatar.initial}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white text-sm flex items-center gap-2">
                                            {avatar.name}
                                            {avatar.role && <span className="text-[10px] font-normal text-white/50 bg-white/10 px-1.5 py-0.5 rounded">{avatar.role}</span>}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                            <span className="text-xs text-[#a1a1aa]">{status === 'online' ? 'Online' : `Last online ${timeSinceOffline}`}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Reset Button */}
                                    <button
                                        onClick={() => setShowResetConfirm(true)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center cursor-pointer transition-colors group/reset"
                                        title="Reset Chat"
                                    >
                                        <Trash2 className="w-4 h-4 text-[#71717a] group-hover/reset:text-red-500 transition-colors" />
                                    </button>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="group absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(255,152,43,0.3)] z-50 border-2 border-[#050505] overflow-hidden hover:scale-110 hover:saturate-[1.25] transition-all duration-300"
                                    >
                                        <X className="w-4 h-4 text-black relative z-10" strokeWidth={3} />
                                        {/* Shine Effect */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-500 bg-gradient-to-r from-transparent via-white/60 to-transparent z-0" />
                                    </button>
                                </div>
                            </div>

                            {/* Reset Confirmation Overlay */}
                            <AnimatePresence>
                                {showResetConfirm && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center rounded-2xl p-6"
                                    >
                                        <div className="text-center">
                                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                                <AlertCircle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <h4 className="text-white font-medium mb-2">Reset Chat History?</h4>
                                            <p className="text-sm text-[#a1a1aa] mb-6">This will permanently delete your conversation history.</p>
                                            <div className="flex gap-3 justify-center">
                                                <button
                                                    onClick={() => setShowResetConfirm(false)}
                                                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleResetChat}
                                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Chat Body */}
                            <div className="flex-1 bg-[#0a0a0a] p-4 flex flex-col gap-4 overflow-y-auto">
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.18, delay: index * 0.1 }} // Stagger initial messages if any
                                        className={`self-${msg.sender === 'user' ? 'end' : 'start'} bg-${msg.sender === 'user' ? '[#ff982b]' : '[#1a1a1a]'} ${msg.sender === 'user' ? 'text-black' : 'text-[#d4d4d8] border border-white/5'} rounded-2xl ${msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'} p-3 max-w-[85%]`}
                                    >
                                        <p className="text-sm">{msg.text}</p>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="self-start bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-tl-none p-4"
                                    >
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-[#71717a] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-[#71717a] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-[#71717a] rounded-full animate-bounce" />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input Area (Includes Quick Replies) */}
                            <div className="bg-[#121212] border-t border-white/5 rounded-b-2xl">
                                {/* Quick Replies */}
                                <AnimatePresence>
                                    {mode === 'qualification' && messages.length > 0 && messages[messages.length - 1].sender === 'agent' && !isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: 10, height: 0 }}
                                            className="px-4 pt-4 flex flex-wrap gap-2 justify-end"
                                        >
                                            {/* Current Videos Question */}
                                            {messages[messages.length - 1].text.includes("currently post") && ["0 vids", "1-4 vids", "4-8 vids", "8+ vids"].map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={(e) => {
                                                        setInputValue(option);
                                                        handleSend(e, option);
                                                    }}
                                                    className="text-sm font-medium bg-[#27272a] border border-white/10 text-white px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#ff982b] hover:to-[#ffc972] hover:text-black hover:border-transparent hover:scale-105 shadow-lg cursor-pointer"
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                            {/* Target Videos Question */}
                                            {messages[messages.length - 1].text.includes("WANT to post") && ["4-8 vids", "8-12 vids", "12-16 vids", "16+ vids"].map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={(e) => {
                                                        setInputValue(option);
                                                        handleSend(e, option);
                                                    }}
                                                    className="text-sm font-medium bg-[#27272a] border border-white/10 text-white px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#ff982b] hover:to-[#ffc972] hover:text-black hover:border-transparent hover:scale-105 shadow-lg cursor-pointer"
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                            {/* Investment Question */}
                                            {messages[messages.length - 1].text.includes("monthly budget") && ["$1k-$3k", "$3k-$5k", "$5k-$10k", "$10k+"].map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={(e) => {
                                                        setInputValue(option);
                                                        handleSend(e, option);
                                                    }}
                                                    className="text-sm font-medium bg-[#27272a] border border-white/10 text-white px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#ff982b] hover:to-[#ffc972] hover:text-black hover:border-transparent hover:scale-105 shadow-lg cursor-pointer"
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Input Form */}
                                <form onSubmit={handleSend} className="p-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff982b] transition-colors pr-10"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputValue.trim()}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center transition-transform ${!inputValue.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 shadow-[0_0_10px_rgba(255,152,43,0.3)]'}`}
                                        >
                                            <ArrowRight className="w-4 h-4 text-black" strokeWidth={3} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 4.1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-4 right-4 z-[60] w-16 h-16 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_20px_rgba(255,152,43,0.4)] cursor-pointer pointer-events-auto"
                    >
                        <MessageSquare className="w-8 h-8 text-black" strokeWidth={2.5} />
                        {status === 'online' && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#050505] rounded-full animate-pulse" />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
};

export default ServiceNotifications;
