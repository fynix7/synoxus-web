import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Download, Copy, Eye, Save, ArrowUp, ArrowDown, Type, Image, Layout, Star, MessageSquare, Zap, X, Check, Code, FileDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Section Types
const SECTION_TYPES = [
    { id: 'hero', label: 'Hero', icon: Layout, description: 'Large header with title and CTA' },
    { id: 'features', label: 'Features', icon: Star, description: 'Feature grid or list' },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, description: 'Customer reviews' },
    { id: 'cta', label: 'Call to Action', icon: Zap, description: 'Conversion section' },
    { id: 'text', label: 'Text Block', icon: Type, description: 'Rich text content' },
    { id: 'image', label: 'Image', icon: Image, description: 'Full-width image' },
];

// Default section templates
const DEFAULT_SECTION_CONTENT = {
    hero: {
        title: 'Welcome to Your Landing Page',
        subtitle: 'A compelling subtitle that explains your value proposition',
        ctaText: 'Get Started',
        ctaUrl: '#',
        backgroundColor: '#0a0a0a',
        textColor: '#ffffff'
    },
    features: {
        title: 'Features',
        items: [
            { title: 'Feature 1', description: 'Description of feature 1', icon: '🚀' },
            { title: 'Feature 2', description: 'Description of feature 2', icon: '⚡' },
            { title: 'Feature 3', description: 'Description of feature 3', icon: '🎯' },
        ],
        backgroundColor: '#121212',
        textColor: '#ffffff'
    },
    testimonials: {
        title: 'What People Say',
        items: [
            { name: 'John Doe', role: 'CEO', quote: 'This product changed everything!', avatar: '' },
        ],
        backgroundColor: '#0a0a0a',
        textColor: '#ffffff'
    },
    cta: {
        title: 'Ready to Get Started?',
        subtitle: 'Join thousands of satisfied customers',
        ctaText: 'Sign Up Now',
        ctaUrl: '#',
        backgroundColor: '#ff982b',
        textColor: '#000000'
    },
    text: {
        content: 'Add your content here. You can write anything you want.',
        backgroundColor: '#121212',
        textColor: '#ffffff'
    },
    image: {
        src: '',
        alt: 'Image description',
        backgroundColor: '#0a0a0a'
    }
};

const LandingPageBuilder = () => {
    const { user } = useAuth();
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(null);
    const [sections, setSections] = useState([]);
    const [pageName, setPageName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showAddSection, setShowAddSection] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');

    // Load user's landing pages
    useEffect(() => {
        loadPages();
    }, [user]);

    const loadPages = async () => {
        if (!supabase || !user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const { data, error } = await supabase
            .from('user_landing_pages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPages(data);
            if (data.length > 0 && !currentPage) {
                loadPage(data[0]);
            }
        }
        setIsLoading(false);
    };

    const loadPage = (page) => {
        setCurrentPage(page);
        setPageName(page.name);
        setSections(page.sections || []);
    };

    const createNewPage = async () => {
        const newPage = {
            name: 'Untitled Landing Page',
            sections: [],
            styles: {}
        };

        if (supabase && user) {
            const { data, error } = await supabase
                .from('user_landing_pages')
                .insert({
                    user_id: user.id,
                    ...newPage
                })
                .select()
                .single();

            if (!error && data) {
                setPages([data, ...pages]);
                loadPage(data);
            }
        }
    };

    const savePage = async () => {
        if (!currentPage || !supabase || !user) return;

        setIsSaving(true);
        setSaveStatus('Saving...');

        const { error } = await supabase
            .from('user_landing_pages')
            .update({
                name: pageName,
                sections: sections,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentPage.id)
            .eq('user_id', user.id);

        if (!error) {
            setSaveStatus('Saved!');
            setTimeout(() => setSaveStatus(''), 2000);
        } else {
            setSaveStatus('Error saving');
        }
        setIsSaving(false);
    };

    const deletePage = async (pageId) => {
        if (!confirm('Are you sure you want to delete this page?')) return;

        if (supabase && user) {
            await supabase
                .from('user_landing_pages')
                .delete()
                .eq('id', pageId)
                .eq('user_id', user.id);

            const remaining = pages.filter(p => p.id !== pageId);
            setPages(remaining);

            if (currentPage?.id === pageId) {
                if (remaining.length > 0) {
                    loadPage(remaining[0]);
                } else {
                    setCurrentPage(null);
                    setSections([]);
                    setPageName('');
                }
            }
        }
    };

    const addSection = (type) => {
        const newSection = {
            id: `section_${Date.now()}`,
            type,
            content: { ...DEFAULT_SECTION_CONTENT[type] }
        };
        setSections([...sections, newSection]);
        setShowAddSection(false);
    };

    const removeSection = (sectionId) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const moveSection = (index, direction) => {
        const newSections = [...sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        setSections(newSections);
    };

    const updateSectionContent = (sectionId, updates) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, content: { ...s.content, ...updates } }
                : s
        ));
    };

    // Generate HTML for export
    const generateHTML = () => {
        const sectionsHTML = sections.map(section => {
            const { type, content } = section;

            switch (type) {
                case 'hero':
                    return `
    <section style="background-color: ${content.backgroundColor}; color: ${content.textColor}; padding: 80px 20px; text-align: center;">
        <h1 style="font-size: 48px; margin-bottom: 20px; font-weight: bold;">${content.title}</h1>
        <p style="font-size: 20px; margin-bottom: 40px; opacity: 0.8;">${content.subtitle}</p>
        <a href="${content.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff982b, #ffc972); color: #000; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px;">${content.ctaText}</a>
    </section>`;

                case 'features':
                    return `
    <section style="background-color: ${content.backgroundColor}; color: ${content.textColor}; padding: 60px 20px;">
        <h2 style="text-align: center; font-size: 36px; margin-bottom: 40px;">${content.title}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
            ${(content.items || []).map(item => `
            <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 15px;">${item.icon}</div>
                <h3 style="font-size: 20px; margin-bottom: 10px;">${item.title}</h3>
                <p style="opacity: 0.7;">${item.description}</p>
            </div>
            `).join('')}
        </div>
    </section>`;

                case 'testimonials':
                    return `
    <section style="background-color: ${content.backgroundColor}; color: ${content.textColor}; padding: 60px 20px;">
        <h2 style="text-align: center; font-size: 36px; margin-bottom: 40px;">${content.title}</h2>
        <div style="max-width: 800px; margin: 0 auto;">
            ${(content.items || []).map(item => `
            <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
                <p style="font-size: 18px; font-style: italic; margin-bottom: 15px;">"${item.quote}"</p>
                <p style="font-weight: bold;">${item.name}</p>
                <p style="opacity: 0.6; font-size: 14px;">${item.role}</p>
            </div>
            `).join('')}
        </div>
    </section>`;

                case 'cta':
                    return `
    <section style="background-color: ${content.backgroundColor}; color: ${content.textColor}; padding: 80px 20px; text-align: center;">
        <h2 style="font-size: 36px; margin-bottom: 15px;">${content.title}</h2>
        <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.8;">${content.subtitle}</p>
        <a href="${content.ctaUrl}" style="display: inline-block; background: ${content.textColor}; color: ${content.backgroundColor}; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px;">${content.ctaText}</a>
    </section>`;

                case 'text':
                    return `
    <section style="background-color: ${content.backgroundColor}; color: ${content.textColor}; padding: 60px 20px;">
        <div style="max-width: 800px; margin: 0 auto; font-size: 18px; line-height: 1.8;">
            ${content.content}
        </div>
    </section>`;

                case 'image':
                    return content.src ? `
    <section style="background-color: ${content.backgroundColor}; padding: 0;">
        <img src="${content.src}" alt="${content.alt}" style="width: 100%; height: auto; display: block;">
    </section>` : '';

                default:
                    return '';
            }
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
${sectionsHTML}
</body>
</html>`;
    };

    const downloadHTML = () => {
        const html = generateHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageName.replace(/\s+/g, '-').toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyHTML = () => {
        navigator.clipboard.writeText(generateHTML());
        setSaveStatus('HTML copied!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    // Section Editor Component
    const SectionEditor = ({ section, onClose }) => {
        const [content, setContent] = useState(section.content);

        const handleSave = () => {
            updateSectionContent(section.id, content);
            onClose();
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Edit {SECTION_TYPES.find(t => t.id === section.type)?.label}</h3>
                        <button onClick={onClose} className="text-[#52525b] hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {section.type === 'hero' && (
                            <>
                                <div>
                                    <label className="block text-sm text-[#71717a] mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={content.title}
                                        onChange={e => setContent({ ...content, title: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#71717a] mb-2">Subtitle</label>
                                    <textarea
                                        value={content.subtitle}
                                        onChange={e => setContent({ ...content, subtitle: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[#71717a] mb-2">Button Text</label>
                                        <input
                                            type="text"
                                            value={content.ctaText}
                                            onChange={e => setContent({ ...content, ctaText: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#71717a] mb-2">Button URL</label>
                                        <input
                                            type="text"
                                            value={content.ctaUrl}
                                            onChange={e => setContent({ ...content, ctaUrl: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {section.type === 'text' && (
                            <div>
                                <label className="block text-sm text-[#71717a] mb-2">Content</label>
                                <textarea
                                    value={content.content}
                                    onChange={e => setContent({ ...content, content: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                    rows={6}
                                />
                            </div>
                        )}

                        {section.type === 'cta' && (
                            <>
                                <div>
                                    <label className="block text-sm text-[#71717a] mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={content.title}
                                        onChange={e => setContent({ ...content, title: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#71717a] mb-2">Subtitle</label>
                                    <input
                                        type="text"
                                        value={content.subtitle}
                                        onChange={e => setContent({ ...content, subtitle: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[#71717a] mb-2">Button Text</label>
                                        <input
                                            type="text"
                                            value={content.ctaText}
                                            onChange={e => setContent({ ...content, ctaText: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#71717a] mb-2">Button URL</label>
                                        <input
                                            type="text"
                                            value={content.ctaUrl}
                                            onChange={e => setContent({ ...content, ctaUrl: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[#71717a] mb-2">Background Color</label>
                                <input
                                    type="color"
                                    value={content.backgroundColor}
                                    onChange={e => setContent({ ...content, backgroundColor: e.target.value })}
                                    className="w-full h-12 rounded-lg cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#71717a] mb-2">Text Color</label>
                                <input
                                    type="color"
                                    value={content.textColor || '#ffffff'}
                                    onChange={e => setContent({ ...content, textColor: e.target.value })}
                                    className="w-full h-12 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[#71717a] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-lg"
                        >
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-[#71717a]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Pages List */}
            <div className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <button
                        onClick={createNewPage}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        New Page
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {pages.map(page => (
                        <div
                            key={page.id}
                            onClick={() => loadPage(page)}
                            className={`p-3 rounded-lg cursor-pointer mb-1 flex items-center justify-between group ${currentPage?.id === page.id
                                    ? 'bg-[#ff982b]/20 border border-[#ff982b]/30'
                                    : 'hover:bg-white/5'
                                }`}
                        >
                            <span className="text-sm text-white truncate">{page.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {pages.length === 0 && (
                        <p className="text-center text-[#52525b] text-sm py-8">No pages yet</p>
                    )}
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {currentPage ? (
                    <>
                        {/* Toolbar */}
                        <div className="h-14 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4">
                            <input
                                type="text"
                                value={pageName}
                                onChange={e => setPageName(e.target.value)}
                                className="bg-transparent text-white font-medium text-lg focus:outline-none"
                                placeholder="Page Name"
                            />
                            <div className="flex items-center gap-2">
                                {saveStatus && (
                                    <span className="text-sm text-[#ff982b]">{saveStatus}</span>
                                )}
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white"
                                    title="Preview"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowExport(true)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white"
                                    title="Export"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={savePage}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-lg disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Sections Editor */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-3xl mx-auto space-y-4">
                                {sections.map((section, index) => (
                                    <div
                                        key={section.id}
                                        className="bg-[#121212] border border-white/10 rounded-xl p-4 group"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-[#52525b] cursor-grab" />
                                                <span className="text-sm font-medium text-white">
                                                    {SECTION_TYPES.find(t => t.id === section.type)?.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveSection(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1.5 hover:bg-white/5 rounded text-[#52525b] hover:text-white disabled:opacity-30"
                                                >
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveSection(index, 'down')}
                                                    disabled={index === sections.length - 1}
                                                    className="p-1.5 hover:bg-white/5 rounded text-[#52525b] hover:text-white disabled:opacity-30"
                                                >
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingSection(section)}
                                                    className="p-1.5 hover:bg-white/5 rounded text-[#52525b] hover:text-white"
                                                >
                                                    <Type className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeSection(section.id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded text-[#52525b] hover:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            className="rounded-lg p-4 text-sm"
                                            style={{
                                                backgroundColor: section.content.backgroundColor,
                                                color: section.content.textColor
                                            }}
                                        >
                                            {section.type === 'hero' && (
                                                <div className="text-center">
                                                    <div className="text-xl font-bold mb-1">{section.content.title}</div>
                                                    <div className="opacity-70 text-sm">{section.content.subtitle}</div>
                                                </div>
                                            )}
                                            {section.type === 'cta' && (
                                                <div className="text-center">
                                                    <div className="font-bold mb-1">{section.content.title}</div>
                                                    <div className="opacity-70 text-xs">{section.content.subtitle}</div>
                                                </div>
                                            )}
                                            {section.type === 'text' && (
                                                <div className="line-clamp-2">{section.content.content}</div>
                                            )}
                                            {section.type === 'features' && (
                                                <div className="font-bold">{section.content.title} ({section.content.items?.length || 0} items)</div>
                                            )}
                                            {section.type === 'testimonials' && (
                                                <div className="font-bold">{section.content.title} ({section.content.items?.length || 0} testimonials)</div>
                                            )}
                                            {section.type === 'image' && (
                                                <div className="text-center opacity-70">[Image: {section.content.alt}]</div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add Section Button */}
                                <button
                                    onClick={() => setShowAddSection(true)}
                                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-[#52525b] hover:border-[#ff982b] hover:text-[#ff982b] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Section
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Layout className="w-16 h-16 text-[#52525b] mx-auto mb-4" />
                            <p className="text-[#71717a] mb-4">Create a new landing page to get started</p>
                            <button
                                onClick={createNewPage}
                                className="px-6 py-3 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl"
                            >
                                Create Landing Page
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Section Modal */}
            <AnimatePresence>
                {showAddSection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddSection(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Add Section</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {SECTION_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => addSection(type.id)}
                                        className="p-4 bg-[#0a0a0a] border border-white/10 rounded-xl hover:border-[#ff982b] transition-colors text-left group"
                                    >
                                        <type.icon className="w-6 h-6 text-[#ff982b] mb-2" />
                                        <div className="text-white font-medium text-sm">{type.label}</div>
                                        <div className="text-[#52525b] text-xs">{type.description}</div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Editor Modal */}
            <AnimatePresence>
                {editingSection && (
                    <SectionEditor
                        section={editingSection}
                        onClose={() => setEditingSection(null)}
                    />
                )}
            </AnimatePresence>

            {/* Export Modal */}
            <AnimatePresence>
                {showExport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowExport(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Export Landing Page</h3>
                            <p className="text-[#71717a] text-sm mb-6">
                                Export your landing page as a standalone HTML file that can be hosted anywhere.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { downloadHTML(); setShowExport(false); }}
                                    className="w-full flex items-center gap-3 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl hover:border-[#ff982b] transition-colors"
                                >
                                    <FileDown className="w-6 h-6 text-[#ff982b]" />
                                    <div className="text-left">
                                        <div className="text-white font-medium">Download HTML File</div>
                                        <div className="text-[#52525b] text-sm">Save as .html file</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { copyHTML(); setShowExport(false); }}
                                    className="w-full flex items-center gap-3 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl hover:border-[#ff982b] transition-colors"
                                >
                                    <Code className="w-6 h-6 text-[#ff982b]" />
                                    <div className="text-left">
                                        <div className="text-white font-medium">Copy HTML Code</div>
                                        <div className="text-[#52525b] text-sm">Copy to clipboard</div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-50 flex flex-col"
                    >
                        <div className="h-14 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4">
                            <span className="text-white font-medium">Preview: {pageName}</span>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-white/5 rounded-lg text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-white">
                            <iframe
                                srcDoc={generateHTML()}
                                className="w-full h-full border-0"
                                title="Preview"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPageBuilder;
