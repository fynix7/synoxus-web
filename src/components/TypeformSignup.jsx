import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Sparkles, Check, Youtube, Instagram, Target, DollarSign, Users, Zap, XCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Shiny button component with one-way shine effect
const ShinyButton = ({ children, onClick, className, disabled }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`relative overflow-hidden ${className}`}
        >
            {children}
            <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none ${isHovering ? 'animate-shine' : 'opacity-0'}`}
                style={{ transform: isHovering ? undefined : 'translateX(-100%)' }}
            />
        </button>
    );
};

const TypeformSignup = ({ onSwitchToSignIn }) => {
    const { signUp, error: authError } = useAuth();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [isWaitlisted, setIsWaitlisted] = useState(false);
    const [emailVerificationPending, setEmailVerificationPending] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        hasYouTube: null,
        youtubeChannel: '',
        instagramHandle: '',
        businessType: '',
        primaryGoal: '',
        audienceSize: '',
        monthlyRevenue: '',
        interestedInAudit: null,
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToEmails: false,
        // For non-creator path
        interestedInCoaching: null,
        coachingDetails: ''
    });

    const [showPassword, setShowPassword] = useState(false);

    const updateFormData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => Math.max(0, s - 1));

    // Send form data via email
    const sendFormEmail = async (status) => {
        try {
            await fetch('/api/form-submission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status, // 'qualified', 'waitlisted', 'disqualified'
                    submittedAt: new Date().toISOString()
                })
            });
        } catch (err) {
            console.error('Error sending form email:', err);
        }
    };

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        if (!formData.agreeToEmails) {
            setError('You must agree to receive email communications');
            setLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            // Send email notification
            await sendFormEmail('qualified');

            const result = await signUp(formData.email, formData.password, formData.displayName);
            if (!result.success) {
                setError(result.error);
            } else if (result.message) {
                // Email verification required
                setEmailVerificationPending(true);
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleWaitlistSubmit = async () => {
        setLoading(true);
        await sendFormEmail('waitlisted');
        setIsWaitlisted(true);
        setLoading(false);
    };

    const handleDisqualify = async () => {
        await sendFormEmail('disqualified');
        setIsDisqualified(true);
    };

    // Validation helpers
    const isValidYouTubeLink = (input) => {
        const trimmed = input.trim();
        if (!trimmed) return false;
        // Accept YouTube URLs or @handles
        const youtubePatterns = [
            /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i,
            /^(www\.)?youtube\.com/i,
            /^@[\w.-]+$/  // @handle format
        ];
        return youtubePatterns.some(pattern => pattern.test(trimmed));
    };

    const canProceedFromYouTube = () => {
        if (formData.hasYouTube === true) {
            return isValidYouTubeLink(formData.youtubeChannel);
        }
        return true;
    };

    const canProceedFromInstagram = () => {
        // If they have YouTube, Instagram is optional but encouraged
        // If they don't have YouTube, Instagram is required to proceed normally
        if (!formData.hasYouTube && formData.instagramHandle.trim().length === 0) {
            return false;
        }
        return true;
    };

    // Question components
    const questions = [
        // Step 0: YouTube question
        {
            id: 'hasYouTube',
            render: () => (
                <div className="text-center">
                    <Youtube className="w-16 h-16 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Do you have a YouTube channel?</h2>
                    <p className="text-[#71717a] mb-8">We'd love to check out your content and offer free value</p>
                    <div className="flex gap-4 justify-center">
                        <ShinyButton
                            onClick={() => { updateFormData('hasYouTube', true); nextStep(); }}
                            className="px-8 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Yes, I do
                        </ShinyButton>
                        <button
                            onClick={() => { updateFormData('hasYouTube', false); setStep(2); }}
                            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                        >
                            Not yet
                        </button>
                    </div>
                </div>
            )
        },
        // Step 1: YouTube link (required if they said yes)
        {
            id: 'youtubeChannel',
            render: () => (
                <div className="max-w-md mx-auto">
                    <Youtube className="w-12 h-12 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Link your YouTube channel</h2>
                    <p className="text-[#71717a] mb-6 text-center">Paste your channel URL or handle</p>
                    <input
                        type="text"
                        value={formData.youtubeChannel}
                        onChange={(e) => updateFormData('youtubeChannel', e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                        className="w-full bg-[#0c0b09] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors mb-2"
                    />
                    {!canProceedFromYouTube() && formData.youtubeChannel.trim().length > 0 && (
                        <p className="text-red-400 text-sm mb-4">Please enter a valid YouTube URL or @handle</p>
                    )}
                    {!canProceedFromYouTube() && formData.youtubeChannel.trim().length === 0 && (
                        <p className="text-[#71717a] text-sm mb-4">Enter your YouTube channel link to continue</p>
                    )}
                    <div className="flex gap-3 mt-4">
                        <button onClick={prevStep} className="px-6 py-3 text-[#71717a] hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => canProceedFromYouTube() && nextStep()}
                            disabled={!canProceedFromYouTube()}
                            className="flex-1 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )
        },
        // Step 2: Instagram (always asked - required to continue)
        {
            id: 'instagram',
            render: () => {
                const hasInstagram = formData.instagramHandle.trim().length > 0;
                return (
                    <div className="max-w-md mx-auto">
                        <Instagram className="w-12 h-12 text-[#ff982b] mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">
                            What's your Instagram handle?
                        </h2>
                        <p className="text-[#71717a] mb-6 text-center">
                            We'd love to connect with you there
                        </p>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]">@</span>
                            <input
                                type="text"
                                value={formData.instagramHandle}
                                onChange={(e) => updateFormData('instagramHandle', e.target.value)}
                                placeholder="yourhandle"
                                className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pr-4 py-4 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors mb-2"
                                style={{ paddingLeft: '3.5rem' }}
                            />
                        </div>
                        {!hasInstagram && !formData.hasYouTube && (
                            <p className="text-[#71717a] text-sm mb-4">Enter your Instagram handle to continue</p>
                        )}
                        {!hasInstagram && formData.hasYouTube && (
                            <p className="text-[#71717a] text-sm mb-4">Optional - you can skip if you don't have Instagram</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => formData.hasYouTube ? setStep(1) : setStep(0)} className="px-6 py-3 text-[#71717a] hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            {hasInstagram ? (
                                // Has Instagram - can proceed
                                <ShinyButton
                                    onClick={() => setStep(4)}
                                    className="flex-1 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </ShinyButton>
                            ) : formData.hasYouTube ? (
                                // Has YouTube, no Instagram - can skip
                                <button
                                    onClick={() => setStep(4)}
                                    className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    Skip <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                // No YouTube, no Instagram - go to coaching question
                                <button
                                    onClick={() => setStep(3)}
                                    className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    I don't have Instagram
                                </button>
                            )}
                        </div>
                    </div>
                );
            }
        },
        // Step 3: Coaching/Consulting interest (for those without YT or IG)
        {
            id: 'coachingInterest',
            render: () => (
                <div className="text-center max-w-md mx-auto">
                    <MessageSquare className="w-16 h-16 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Are you interested in coaching or consulting?</h2>
                    <p className="text-[#71717a] mb-8">We work with coaches, consultants, and course creators</p>
                    <div className="flex gap-4 justify-center">
                        <ShinyButton
                            onClick={() => { updateFormData('interestedInCoaching', true); nextStep(); }}
                            className="px-8 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Yes, I am
                        </ShinyButton>
                        <button
                            onClick={handleDisqualify}
                            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                        >
                            No, I'm not
                        </button>
                    </div>
                    <button onClick={() => setStep(2)} className="mt-6 text-[#52525b] hover:text-white text-sm">
                        ← Go back
                    </button>
                </div>
            )
        },
        // Step 4: Coaching details (freeform) OR Business type (for qualified users)
        {
            id: 'coachingDetailsOrBusinessType',
            render: () => {
                // If they're on the coaching path (no accounts)
                if (formData.interestedInCoaching === true && !formData.hasYouTube && !formData.instagramHandle.trim()) {
                    return (
                        <div className="max-w-md mx-auto">
                            <MessageSquare className="w-12 h-12 text-[#ff982b] mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2 text-center">Tell us about your coaching or consulting</h2>
                            <p className="text-[#71717a] mb-6 text-center">What do you help people with? What's your expertise?</p>
                            <textarea
                                value={formData.coachingDetails}
                                onChange={(e) => updateFormData('coachingDetails', e.target.value)}
                                placeholder="I help entrepreneurs scale their businesses through..."
                                rows={4}
                                className="w-full bg-[#0c0b09] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors mb-4 resize-none"
                            />
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                    Your Email (so we can reach you)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateFormData('email', e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-[#0c0b09] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={prevStep} className="px-6 py-3 text-[#71717a] hover:text-white transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleWaitlistSubmit}
                                    disabled={loading || !formData.coachingDetails.trim() || !formData.email.trim()}
                                    className="flex-1 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </div>
                    );
                }

                // Normal path - Business type
                return (
                    <div className="text-center">
                        <Target className="w-16 h-16 text-[#ff982b] mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-4">What best describes you?</h2>
                        <p className="text-[#71717a] mb-8">This helps us personalize your experience</p>
                        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                            {[
                                { value: 'creator', label: 'Content Creator', icon: Youtube },
                                { value: 'coach', label: 'Coach / Consultant', icon: Users },
                                { value: 'educator', label: 'Course Creator / Educator', icon: Zap },
                                { value: 'agency', label: 'Agency Owner', icon: Target },
                                { value: 'other', label: 'Other', icon: Sparkles }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => { updateFormData('businessType', option.value); nextStep(); }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${formData.businessType === option.value
                                        ? 'bg-[#ff982b]/20 border-[#ff982b]'
                                        : 'bg-white/5 border-white/10 hover:border-[#ff982b]/50'
                                        }`}
                                >
                                    <option.icon className="w-6 h-6 text-[#ff982b]" />
                                    <span className="text-white font-medium">{option.label}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)} className="mt-6 text-[#52525b] hover:text-white text-sm">
                            ← Go back
                        </button>
                    </div>
                );
            }
        },
        // Step 5: Primary goal
        {
            id: 'primaryGoal',
            render: () => (
                <div className="text-center">
                    <DollarSign className="w-16 h-16 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">What's your primary goal?</h2>
                    <p className="text-[#71717a] mb-8">We'll tailor our tools to help you achieve it</p>
                    <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                        {[
                            { value: 'revenue', label: 'Increase Revenue', desc: 'Monetize content & convert viewers' },
                            { value: 'growth', label: 'Grow My Audience', desc: 'Get more views & subscribers' },
                            { value: 'systems', label: 'Build Better Systems', desc: 'Streamline my content workflow' },
                            { value: 'launch', label: 'Launch My Channel', desc: 'Start creating content' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => { updateFormData('primaryGoal', option.value); nextStep(); }}
                                className={`text-left p-4 rounded-xl border transition-all ${formData.primaryGoal === option.value
                                    ? 'bg-[#ff982b]/20 border-[#ff982b]'
                                    : 'bg-white/5 border-white/10 hover:border-[#ff982b]/50'
                                    }`}
                            >
                                <span className="text-white font-medium block">{option.label}</span>
                                <span className="text-[#71717a] text-sm">{option.desc}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={prevStep} className="mt-6 text-[#52525b] hover:text-white text-sm">
                        ← Go back
                    </button>
                </div>
            )
        },
        // Step 6: Audience size
        {
            id: 'audienceSize',
            render: () => (
                <div className="text-center">
                    <Users className="w-16 h-16 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">What's your current audience size?</h2>
                    <p className="text-[#71717a] mb-8">Total followers across all platforms</p>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        {[
                            { value: '0-1k', label: '0 - 1K' },
                            { value: '1k-10k', label: '1K - 10K' },
                            { value: '10k-50k', label: '10K - 50K' },
                            { value: '50k-100k', label: '50K - 100K' },
                            { value: '100k-500k', label: '100K - 500K' },
                            { value: '500k+', label: '500K+' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => { updateFormData('audienceSize', option.value); nextStep(); }}
                                className={`p-4 rounded-xl border transition-all ${formData.audienceSize === option.value
                                    ? 'bg-[#ff982b]/20 border-[#ff982b]'
                                    : 'bg-white/5 border-white/10 hover:border-[#ff982b]/50'
                                    }`}
                            >
                                <span className="text-white font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={prevStep} className="mt-6 text-[#52525b] hover:text-white text-sm">
                        ← Go back
                    </button>
                </div>
            )
        },
        // Step 7: Monthly Revenue
        {
            id: 'monthlyRevenue',
            render: () => (
                <div className="text-center">
                    <DollarSign className="w-16 h-16 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">What's your current monthly revenue?</h2>
                    <p className="text-[#71717a] mb-8">From your content, courses, or services</p>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        {[
                            { value: '0-1k', label: '$0 - $1K' },
                            { value: '1k-5k', label: '$1K - $5K' },
                            { value: '5k-10k', label: '$5K - $10K' },
                            { value: '10k-25k', label: '$10K - $25K' },
                            { value: '25k-50k', label: '$25K - $50K' },
                            { value: '50k-100k', label: '$50K - $100K' },
                            { value: '100k+', label: '$100K+' },
                            { value: 'prefer-not-to-say', label: 'Prefer Not to Say' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => { updateFormData('monthlyRevenue', option.value); nextStep(); }}
                                className={`p-4 rounded-xl border transition-all ${formData.monthlyRevenue === option.value
                                    ? 'bg-[#ff982b]/20 border-[#ff982b]'
                                    : 'bg-white/5 border-white/10 hover:border-[#ff982b]/50'
                                    } ${option.value === 'prefer-not-to-say' ? 'col-span-2' : ''}`}
                            >
                                <span className="text-white font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={prevStep} className="mt-6 text-[#52525b] hover:text-white text-sm">
                        ← Go back
                    </button>
                </div>
            )
        },
        // Step 8: Free Audit Interest
        {
            id: 'interestedInAudit',
            render: () => (
                <div className="text-center max-w-lg mx-auto">
                    <svg className="w-16 h-16 text-[#ff982b] mx-auto mb-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                    <h2 className="text-3xl font-bold text-white mb-4">Would you like a free content audit?</h2>
                    <p className="text-[#a1a1aa] mb-8">
                        Get a personalized strategy call where we'll review your content and share actionable insights to help you grow.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <ShinyButton
                            onClick={() => { updateFormData('interestedInAudit', true); nextStep(); }}
                            className="px-8 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Yes, I'm interested!
                        </ShinyButton>
                        <button
                            onClick={() => { updateFormData('interestedInAudit', false); nextStep(); }}
                            className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                    <button onClick={prevStep} className="mt-6 text-[#52525b] hover:text-white text-sm">
                        ← Go back
                    </button>
                </div>
            )
        },
        // Step 9: Account details
        {
            id: 'accountDetails',
            render: () => (
                <div className="max-w-md mx-auto">
                    <svg className="w-12 h-12 text-[#ff982b] mx-auto mb-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Create your account</h2>
                    <p className="text-[#71717a] mb-6 text-center">Almost there! Just a few more details.</p>

                    <div className="space-y-4">
                        {/* Display Name */}
                        <div>
                            <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                Display Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => updateFormData('displayName', e.target.value)}
                                    placeholder="Your name"
                                    className="w-full bg-[#0c0b09] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateFormData('email', e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pl-14 pr-4 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => updateFormData('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pl-14 pr-14 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pl-14 pr-4 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Email Agreement */}
                        <label className="flex items-start gap-3 cursor-pointer group pt-2">
                            <div className="relative flex-shrink-0 mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={formData.agreeToEmails}
                                    onChange={(e) => updateFormData('agreeToEmails', e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.agreeToEmails
                                    ? 'bg-gradient-to-br from-[#ff982b] to-[#ffc972] border-transparent'
                                    : 'border-white/20 group-hover:border-[#ff982b]'
                                    }`}>
                                    {formData.agreeToEmails && <Check className="w-3 h-3 text-black" />}
                                </div>
                            </div>
                            <span className="text-sm text-[#a1a1aa]">
                                I agree to receive email communications from Synoxus <span className="text-[#ff982b]">*</span>
                            </span>
                        </label>

                        {/* Error Message */}
                        {(error || authError) && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error || authError}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={prevStep} className="px-6 py-3 text-[#71717a] hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Terms */}
                    <p className="text-center text-[#52525b] text-xs mt-6">
                        By signing up, you agree to our{' '}
                        <a href="/terms" className="text-[#ff982b] hover:text-[#ffc972] underline">Terms</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-[#ff982b] hover:text-[#ffc972] underline">Privacy Policy</a>
                    </p>
                </div>
            )
        }
    ];

    // Show disqualified screen
    if (isDisqualified) {
        return (
            <div className="min-h-screen bg-[#080705] flex items-center justify-center p-6">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff982b]/10 rounded-full blur-[150px]" />
                </div>
                <div className="text-center max-w-md relative">
                    <XCircle className="w-20 h-20 text-[#52525b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Sorry</h2>
                    <p className="text-[#a1a1aa] text-lg mb-8">
                        This tool is only for existing creators, coaches, and consultants.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // Show waitlisted screen
    if (isWaitlisted) {
        return (
            <div className="min-h-screen bg-[#080705] flex items-center justify-center p-6">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff982b]/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffc972]/10 rounded-full blur-[150px]" />
                </div>
                <div className="text-center max-w-md relative">
                    <CheckCircle className="w-20 h-20 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
                    <p className="text-[#a1a1aa] text-lg mb-4">
                        We've received your application.
                    </p>
                    <p className="text-[#71717a] mb-8">
                        We'll review your information and reach out to <span className="text-white">{formData.email}</span> if you qualify to use the tool.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-8 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // Show email verification pending screen
    if (emailVerificationPending) {
        return (
            <div className="min-h-screen bg-[#080705] flex items-center justify-center p-6">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff982b]/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffc972]/10 rounded-full blur-[150px]" />
                </div>
                <div className="text-center max-w-md relative">
                    <Mail className="w-20 h-20 text-[#ff982b] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Check Your Email</h2>
                    <p className="text-[#a1a1aa] text-lg mb-4">
                        We've sent a verification link to:
                    </p>
                    <p className="text-white font-medium text-lg mb-6">{formData.email}</p>
                    <p className="text-[#71717a] mb-8">
                        Click the link in your email to verify your account and get started.
                    </p>
                    <button
                        onClick={onSwitchToSignIn}
                        className="px-8 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    // Progress bar
    const totalSteps = 10;
    const progress = ((step + 1) / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-[#080705] flex flex-col">
            {/* Progress bar */}
            <div className="h-1 bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#ff982b] to-[#ffc972]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff982b]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffc972]/10 rounded-full blur-[150px]" />
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-2xl"
                    >
                        {questions[step]?.render()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 text-center">
                <p className="text-[#52525b] text-sm">
                    Already have an account?{' '}
                    <button onClick={onSwitchToSignIn} className="text-[#ff982b] hover:text-[#ffc972] font-medium">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default TypeformSignup;
