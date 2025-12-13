import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, User, MessageSquare, Clock, BookOpen, Settings, Globe, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const DEFAULT_PERSONAS = [
    {
        id: 'max',
        name: 'Max',
        role: 'Client Success',
        type: 'qualification',
        instructions: "You are Max, a Client Success Manager at Synoxus. Your goal is to qualify leads by asking about their current video output, target output, budget, and goals. Be friendly, professional, and concise.",
        knowledge: "Synoxus offers high-ticket lead generation services. We guarantee 30+ leads in 90 days or we work for free. We help with content ideation, packaging (thumbnails/titles), and conversion assets (VSLs).",
        intervalMin: 1500,
        intervalMax: 2500,
        welcomeMessage: "Hey! Max here. Glad you're interested. Before we start, what's your best email or phone number?",
        startTime: "07:00",
        endTime: "19:00"
    },
    {
        id: 'yohan',
        name: 'Yohan',
        role: 'Founder',
        type: 'default',
        instructions: "You are Yohan, the founder of Synoxus. You are busy but helpful. You answer questions directly and encourage people to book a call or check out the case studies.",
        knowledge: "Synoxus scales creators on Skool. We helped Nick Saraev reach #1 on Skool. We focus on 'Psychological Packaging' and 'Conversion Cascades'.",
        intervalMin: 2000,
        intervalMax: 4000,
        welcomeMessage: "Hey, Yohan here. Let me know if you have any questions. If I'm free I'll try to reply as fast as I can.",
        startTime: "09:00",
        endTime: "17:00"
    },
    {
        id: 'laura',
        name: 'Laura',
        role: "Yohan's Assistant",
        type: 'default',
        instructions: "You are Laura, Yohan's assistant. You handle inquiries when Yohan is offline. You are polite, organized, and helpful.",
        knowledge: "Yohan is currently offline. You can take messages or direct people to the calendar.",
        intervalMin: 1000,
        intervalMax: 2000,
        welcomeMessage: "Hi, I'm Laura, Yohan's assistant. Yohan is currently offline. How can I help you today?",
        startTime: "19:00",
        endTime: "07:00"
    }
];

const ChatConfiguration = () => {
    const [personas, setPersonas] = useState([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [universalKnowledge, setUniversalKnowledge] = useState('');
    const [qualifierMethod, setQualifierMethod] = useState('form'); // 'chat' or 'form'

    useEffect(() => {
        const loadData = async () => {
            if (supabase) {
                // Fetch Personas
                const { data: personasData } = await supabase.from('chat_config').select('value').eq('key', 'personas').single();
                if (personasData) setPersonas(personasData.value);
                else setPersonas(DEFAULT_PERSONAS);

                // Fetch Universal Knowledge
                const { data: ukData } = await supabase.from('chat_config').select('value').eq('key', 'universal_knowledge').single();
                if (ukData) setUniversalKnowledge(ukData.value);

                // Fetch Qualifier Method
                const { data: qmData } = await supabase.from('chat_config').select('value').eq('key', 'qualifier_method').single();
                if (qmData) setQualifierMethod(qmData.value);
            } else {
                // Fallback to localStorage
                const savedPersonas = localStorage.getItem('synoxus_chat_personas');
                const savedUniversalKnowledge = localStorage.getItem('synoxus_universal_knowledge');
                const savedQualifierMethod = localStorage.getItem('synoxus_qualifier_method');

                if (savedPersonas) {
                    setPersonas(JSON.parse(savedPersonas));
                } else {
                    setPersonas(DEFAULT_PERSONAS);
                }

                if (savedUniversalKnowledge) {
                    setUniversalKnowledge(savedUniversalKnowledge);
                }

                if (savedQualifierMethod) {
                    setQualifierMethod(savedQualifierMethod);
                }
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (personas.length > 0 && !selectedPersonaId) {
            setSelectedPersonaId(personas[0].id);
        }
    }, [personas]);

    const handleSave = async () => {
        if (supabase) {
            await supabase.from('chat_config').upsert({ key: 'personas', value: personas }, { onConflict: 'key' });
            await supabase.from('chat_config').upsert({ key: 'universal_knowledge', value: universalKnowledge }, { onConflict: 'key' });
            await supabase.from('chat_config').upsert({ key: 'qualifier_method', value: qualifierMethod }, { onConflict: 'key' });
        } else {
            localStorage.setItem('synoxus_chat_personas', JSON.stringify(personas));
            localStorage.setItem('synoxus_universal_knowledge', universalKnowledge);
            localStorage.setItem('synoxus_qualifier_method', qualifierMethod);
        }
        setHasChanges(false);
        alert('Chat configuration saved!');
    };

    const toggleQualifierMethod = () => {
        setQualifierMethod(prev => prev === 'chat' ? 'form' : 'chat');
        setHasChanges(true);
    };

    const handleUpdatePersona = (id, field, value) => {
        setPersonas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
        setHasChanges(true);
    };

    const handleUpdateUniversalKnowledge = (value) => {
        setUniversalKnowledge(value);
        setHasChanges(true);
    };

    const handleAddPersona = () => {
        const newPersona = {
            id: `persona_${Date.now()}`,
            name: 'New Agent',
            role: 'Support',
            type: 'default',
            instructions: '',
            knowledge: '',
            intervalMin: 1000,
            intervalMax: 3000,
            welcomeMessage: ''
        };
        setPersonas([...personas, newPersona]);
        setSelectedPersonaId(newPersona.id);
        setHasChanges(true);
    };

    const handleMovePersona = (index, direction) => {
        const newPersonas = [...personas];
        if (direction === 'up' && index > 0) {
            [newPersonas[index], newPersonas[index - 1]] = [newPersonas[index - 1], newPersonas[index]];
        } else if (direction === 'down' && index < newPersonas.length - 1) {
            [newPersonas[index], newPersonas[index + 1]] = [newPersonas[index + 1], newPersonas[index]];
        }
        setPersonas(newPersonas);
        setHasChanges(true);
    };

    const handleDeletePersona = (id) => {
        if (confirm('Are you sure you want to delete this persona?')) {
            const newPersonas = personas.filter(p => p.id !== id);
            setPersonas(newPersonas);
            if (selectedPersonaId === id && newPersonas.length > 0) {
                setSelectedPersonaId(newPersonas[0].id);
            } else if (newPersonas.length === 0) {
                setSelectedPersonaId(null);
            }
            setHasChanges(true);
        }
    };

    const selectedPersona = personas.find(p => p.id === selectedPersonaId);

    return (
        <div className="flex h-full bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10">
            {/* Sidebar - Persona List */}
            <div className="w-64 bg-[#121212] border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-[#ff982b]" />
                        Personas
                    </h3>
                    <button
                        onClick={handleAddPersona}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-[#a1a1aa] hover:text-white transition-colors"
                        title="Add Persona"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {personas.map((persona, index) => (
                        <div key={persona.id} className="flex items-center gap-1 group/item">
                            <div className="flex flex-col opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMovePersona(index, 'up'); }}
                                    disabled={index === 0}
                                    className="p-0.5 hover:text-white text-[#52525b] disabled:opacity-30"
                                >
                                    <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMovePersona(index, 'down'); }}
                                    disabled={index === personas.length - 1}
                                    className="p-0.5 hover:text-white text-[#52525b] disabled:opacity-30"
                                >
                                    <ArrowDown className="w-3 h-3" />
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedPersonaId(persona.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${selectedPersonaId === persona.id
                                    ? 'bg-[#ff982b]/10 text-[#ff982b] border border-[#ff982b]/20'
                                    : 'text-[#a1a1aa] hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <span className="font-medium truncate">{persona.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${persona.type === 'qualification' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {persona.type === 'qualification' ? 'Qual' : 'Def'}
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-white/10">
                    <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2 block">Global Settings</label>
                    <div className="flex items-center justify-between bg-[#050505] p-3 rounded-lg border border-white/5">
                        <span className="text-sm text-[#a1a1aa]">Qualifier Method</span>
                        <button
                            onClick={toggleQualifierMethod}
                            className={`relative w-12 h-6 rounded-full transition-colors ${qualifierMethod === 'chat' ? 'bg-[#ff982b]' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${qualifierMethod === 'chat' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <p className="text-[10px] text-[#52525b] mt-2 text-center">
                        {qualifierMethod === 'chat' ? 'Using AI Chat Persona' : 'Using Application Form'}
                    </p>
                </div>
            </div>

            {/* Main Content - Editor */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedPersona ? (
                    <>
                        {/* Header */}
                        <div className="h-24 border-b border-white/10 flex items-center justify-between px-6 bg-[#121212]/50 backdrop-blur-sm pl-20">
                            <div className="flex items-center gap-4 w-full max-w-2xl">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
                                    {selectedPersona.name.charAt(0)}
                                </div>
                                <div className="flex-1 flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-[#52525b] uppercase font-bold tracking-wider mb-1 block">Name</label>
                                        <input
                                            type="text"
                                            value={selectedPersona.name}
                                            onChange={(e) => handleUpdatePersona(selectedPersona.id, 'name', e.target.value)}
                                            className="bg-transparent text-white font-medium focus:outline-none focus:border-b border-[#ff982b] w-full text-lg"
                                            placeholder="Persona Name"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-[#52525b] uppercase font-bold tracking-wider mb-1 block">Role / Tag</label>
                                        <input
                                            type="text"
                                            value={selectedPersona.role}
                                            onChange={(e) => handleUpdatePersona(selectedPersona.id, 'role', e.target.value)}
                                            className="bg-transparent text-white font-medium focus:outline-none focus:border-b border-[#ff982b] w-full text-lg"
                                            placeholder="Role (e.g. Support)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                <button
                                    onClick={() => handleDeletePersona(selectedPersona.id)}
                                    className="p-2 hover:bg-red-500/10 text-[#71717a] hover:text-red-500 rounded-lg transition-colors"
                                    title="Delete Persona"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasChanges
                                        ? 'bg-[#ff982b] text-black hover:bg-[#ffc972] shadow-[0_0_15px_rgba(255,152,43,0.3)]'
                                        : 'bg-white/5 text-[#a1a1aa] cursor-not-allowed'
                                        }`}
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Form */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Basic Settings */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                        <Settings className="w-4 h-4 text-[#ff982b]" />
                                        Type
                                    </label>
                                    <select
                                        value={selectedPersona.type}
                                        onChange={(e) => handleUpdatePersona(selectedPersona.id, 'type', e.target.value)}
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b]"
                                    >
                                        <option value="default">Default (General Chat)</option>
                                        <option value="qualification">Qualification (Work with Us)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                        <Clock className="w-4 h-4 text-[#ff982b]" />
                                        Response Interval (ms)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={selectedPersona.intervalMin}
                                            onChange={(e) => handleUpdatePersona(selectedPersona.id, 'intervalMin', parseInt(e.target.value))}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b]"
                                            placeholder="Min"
                                        />
                                        <span className="self-center text-[#71717a]">-</span>
                                        <input
                                            type="number"
                                            value={selectedPersona.intervalMax}
                                            onChange={(e) => handleUpdatePersona(selectedPersona.id, 'intervalMax', parseInt(e.target.value))}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b]"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Active Times */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                    <Clock className="w-4 h-4 text-[#ff982b]" />
                                    Active Hours (24h Format)
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[#52525b] uppercase">Start Time</label>
                                        <input
                                            type="time"
                                            value={selectedPersona.startTime || ''}
                                            onChange={(e) => handleUpdatePersona(selectedPersona.id, 'startTime', e.target.value)}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[#52525b] uppercase">End Time</label>
                                        <input
                                            type="time"
                                            value={selectedPersona.endTime || ''}
                                            onChange={(e) => handleUpdatePersona(selectedPersona.id, 'endTime', e.target.value)}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b]"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-[#52525b]">Topmost active persona will be selected.</p>
                            </div>

                            {/* Welcome Message */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                    <MessageSquare className="w-4 h-4 text-[#ff982b]" />
                                    Welcome Message
                                </label>
                                <textarea
                                    value={selectedPersona.welcomeMessage}
                                    onChange={(e) => handleUpdatePersona(selectedPersona.id, 'welcomeMessage', e.target.value)}
                                    className="w-full h-24 bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] resize-none"
                                    placeholder="Initial message sent to user..."
                                />
                            </div>

                            {/* Instructions */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                    <BookOpen className="w-4 h-4 text-[#ff982b]" />
                                    System Instructions
                                </label>
                                <textarea
                                    value={selectedPersona.instructions}
                                    onChange={(e) => handleUpdatePersona(selectedPersona.id, 'instructions', e.target.value)}
                                    className="w-full h-40 bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] font-mono text-sm leading-relaxed"
                                    placeholder="How should this agent behave?"
                                />
                            </div>

                            {/* Persona Knowledge Base */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                    <Brain className="w-4 h-4 text-[#ff982b]" />
                                    Persona Knowledge Base
                                </label>
                                <textarea
                                    value={selectedPersona.knowledge}
                                    onChange={(e) => handleUpdatePersona(selectedPersona.id, 'knowledge', e.target.value)}
                                    className="w-full h-40 bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] font-mono text-sm leading-relaxed"
                                    placeholder="Facts and context specific to this agent..."
                                />
                            </div>

                            {/* Universal Knowledge Base */}
                            <div className="space-y-2 pt-6 border-t border-white/10">
                                <label className="flex items-center gap-2 text-sm font-medium text-[#fcf0d4]">
                                    <Globe className="w-4 h-4 text-[#ff982b]" />
                                    Universal Knowledge Base (Shared)
                                </label>
                                <p className="text-xs text-[#71717a] mb-2">This knowledge is accessible to ALL personas.</p>
                                <textarea
                                    value={universalKnowledge}
                                    onChange={(e) => handleUpdateUniversalKnowledge(e.target.value)}
                                    className="w-full h-40 bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] font-mono text-sm leading-relaxed"
                                    placeholder="Company info, pricing, FAQs, etc. shared across all agents..."
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[#71717a]">
                        Select a persona to edit
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper icon component since Brain is not imported in the main file but used here
const Brain = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>
);

export default ChatConfiguration;
