import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const WorkWithUsModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        currentVideos: '',
        targetVideos: '',
        investment: '',
        channelLink: '',
        primaryGoal: '',
        contactMethods: [],
        contactDetails: {
            Phone: '',
            Email: '',
            Discord: ''
        }
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleContactMethodToggle = (method) => {
        setFormData(prev => {
            const methods = prev.contactMethods.includes(method)
                ? prev.contactMethods.filter(m => m !== method)
                : [...prev.contactMethods, method];
            return { ...prev, contactMethods: methods };
        });
    };

    const handleContactDetailChange = (method, value) => {
        setFormData(prev => ({
            ...prev,
            contactDetails: { ...prev.contactDetails, [method]: value }
        }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = (e) => {
        e.preventDefault();

        const subject = "New Work With Us Application";
        const body = `
New Application Details:

1. Current Videos: ${formData.currentVideos}
2. Target Videos: ${formData.targetVideos}
3. Investment: ${formData.investment}
4. Channel: ${formData.channelLink}
5. Primary Goal: ${formData.primaryGoal}

Contact Methods:
${formData.contactMethods.map(method => `${method}: ${formData.contactDetails[method]}`).join('\n')}
        `.trim();

        window.location.href = `mailto:iyohanthomas7@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl bg-[#121212]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-light text-white">Work with Us</h2>
                        </div>
                        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors cursor-pointer">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 overflow-y-auto flex-1">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[#fcf0d4] text-sm font-medium">1. How many videos per month do you currently post?</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#ff982b] focus:outline-none transition-colors placeholder:text-white/20"
                                        placeholder="e.g. 4 videos"
                                        value={formData.currentVideos}
                                        onChange={(e) => handleInputChange('currentVideos', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[#fcf0d4] text-sm font-medium">2. How many videos per month do you want to post?</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#ff982b] focus:outline-none transition-colors placeholder:text-white/20"
                                        placeholder="e.g. 8-12 videos"
                                        value={formData.targetVideos}
                                        onChange={(e) => handleInputChange('targetVideos', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[#fcf0d4] text-sm font-medium">3. How much are you willing to invest in your YouTube growth?</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#ff982b] focus:outline-none transition-colors [&>option]:bg-[#121212]"
                                        value={formData.investment}
                                        onChange={(e) => handleInputChange('investment', e.target.value)}
                                    >
                                        <option value="">Select a range</option>
                                        <option value="$1k-$3k">$1,000 - $3,000 / month</option>
                                        <option value="$3k-$5k">$3,000 - $5,000 / month</option>
                                        <option value="$5k-$10k">$5,000 - $10,000 / month</option>
                                        <option value="$10k+">$10,000+ / month</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[#fcf0d4] text-sm font-medium">4. What is your channel? (Please provide link)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#ff982b] focus:outline-none transition-colors placeholder:text-white/20"
                                        placeholder="https://youtube.com/@yourchannel"
                                        value={formData.channelLink}
                                        onChange={(e) => handleInputChange('channelLink', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[#fcf0d4] text-sm font-medium">5. What is your primary goal with this channel?</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#ff982b] focus:outline-none transition-colors min-h-[100px] placeholder:text-white/20"
                                        placeholder="e.g. Lead generation, Brand awareness, Ad revenue..."
                                        value={formData.primaryGoal}
                                        onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[#fcf0d4] text-sm font-medium">6. How can we contact you? (Select at least one)</label>
                                    <div className="flex gap-4">
                                        {['Phone', 'Email', 'Discord'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => handleContactMethodToggle(method)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${formData.contactMethods.includes(method)
                                                    ? 'bg-[#ff982b]/10 border-[#ff982b] text-[#ff982b]'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                                                    }`}
                                            >
                                                {formData.contactMethods.includes(method) && <Check className="w-4 h-4" />}
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.contactMethods.map(method => (
                                    <motion.div
                                        key={method}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-2"
                                    >
                                        <label className="text-[#fcf0d4] text-sm font-medium">Your {method}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#ff982b] focus:outline-none transition-colors placeholder:text-white/20"
                                            placeholder={`Enter your ${method}`}
                                            value={formData.contactDetails[method]}
                                            onChange={(e) => handleContactDetailChange(method, e.target.value)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-white/50">Step {step} of 3</p>
                            {step > 1 && (
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                            )}
                        </div>

                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                className="group relative overflow-hidden flex items-center gap-2 bg-gradient-to-b from-[#ff982b] to-[#ffc972] text-[#050505] px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,152,43,0.3)] cursor-pointer"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Next <ChevronRight className="w-4 h-4" />
                                </span>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={formData.contactMethods.length === 0}
                                className="group relative overflow-hidden flex items-center gap-2 bg-gradient-to-b from-[#ff982b] to-[#ffc972] text-[#050505] px-8 py-2 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,152,43,0.3)] cursor-pointer"
                            >
                                <span className="relative z-10">Submit Application</span>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WorkWithUsModal;
