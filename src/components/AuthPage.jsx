import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TypeformSignup from './TypeformSignup';

const AuthPage = () => {
    const { signIn, signUp, resetPassword, error: authError } = useAuth();
    const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [agreeToEmails, setAgreeToEmails] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (!agreeToEmails) {
                    setError('You must agree to receive email communications');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                const result = await signUp(email, password, displayName);
                if (!result.success) {
                    setError(result.error);
                } else if (result.message) {
                    setSuccess(result.message);
                }
            } else if (mode === 'signin') {
                const result = await signIn(email, password);
                if (!result.success) {
                    setError(result.error);
                }
            } else if (mode === 'forgot') {
                const result = await resetPassword(email);
                if (!result.success) {
                    setError(result.error);
                } else {
                    setSuccess(result.message);
                }
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
        setAgreeToEmails(false);
    };

    // Show TypeformSignup for signup mode
    if (mode === 'signup') {
        return <TypeformSignup onSwitchToSignIn={() => switchMode('signin')} />;
    }

    return (
        <div className="min-h-screen bg-[#080705] flex items-center justify-center p-4 overflow-hidden">
            {/* Background gradient effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-[#ff982b]/8 rounded-full blur-[180px]" />
                <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-[#ffc972]/8 rounded-full blur-[180px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] mb-4 shadow-[0_0_40px_rgba(255,152,43,0.4)]">
                        {/* Custom single sparkle icon */}
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="black">
                            <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                    </h1>
                    <p className="text-[#71717a]">
                        {mode === 'signin'
                            ? 'Sign in to access your portal'
                            : mode === 'signup'
                                ? 'Join Synoxus to get started'
                                : 'Enter your email to reset your password'
                        }
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-[#141311] border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Display Name (signup only) */}
                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                        Display Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b] pointer-events-none z-10" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b] pointer-events-none z-10" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <AnimatePresence mode="wait">
                            {mode !== 'forgot' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b] pointer-events-none z-10" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Confirm Password (signup only) */}
                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wider mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b] pointer-events-none z-10" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full bg-[#0c0b09] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#ff982b] transition-colors"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Agreement Checkbox (signup only) */}
                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="pt-2"
                                >
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex-shrink-0 mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={agreeToEmails}
                                                onChange={(e) => setAgreeToEmails(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreeToEmails
                                                ? 'bg-gradient-to-br from-[#ff982b] to-[#ffc972] border-transparent'
                                                : 'border-white/20 group-hover:border-[#ff982b]'
                                                }`}>
                                                {agreeToEmails && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                        </div>
                                        <span className="text-sm text-[#a1a1aa]">
                                            I agree to receive email communications from Synoxus including tips and promotional content. <span className="text-[#ff982b]">*</span>
                                        </span>
                                    </label>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Forgot Password Link */}
                        {mode === 'signin' && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => switchMode('forgot')}
                                    className="text-sm text-[#ff982b] hover:text-[#ffc972] transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Error Message */}
                        <AnimatePresence>
                            {(error || authError) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error || authError}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Success Message */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm"
                                >
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{success}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button - No glow, shine only on hover (left-to-right only) */}
                        <button
                            type="submit"
                            disabled={loading}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="group relative w-full py-4 flex items-center justify-center gap-2 text-sm font-bold text-black bg-gradient-to-r from-[#ff982b] to-[#ffc972] rounded-xl overflow-hidden transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="relative z-10 uppercase tracking-wide">
                                        {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                                    </span>
                                    <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                            {/* Shine effect - only animates when hovering */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-none ${isHovering ? 'animate-shine' : 'opacity-0'
                                    }`}
                                style={{
                                    transform: isHovering ? undefined : 'translateX(-100%)',
                                }}
                            />
                        </button>
                    </form>

                    {/* Mode Switch */}
                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        {mode === 'signin' ? (
                            <p className="text-[#71717a]">
                                Don't have an account?{' '}
                                <button
                                    onClick={() => switchMode('signup')}
                                    className="text-[#ff982b] hover:text-[#ffc972] font-medium transition-colors"
                                >
                                    Create one
                                </button>
                            </p>
                        ) : (
                            <p className="text-[#71717a]">
                                Already have an account?{' '}
                                <button
                                    onClick={() => switchMode('signin')}
                                    className="text-[#ff982b] hover:text-[#ffc972] font-medium transition-colors"
                                >
                                    Sign in
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[#52525b] text-xs mt-6">
                    By signing in, you agree to our{' '}
                    <a href="/terms" className="text-[#ff982b] hover:text-[#ffc972] underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-[#ff982b] hover:text-[#ffc972] underline">Privacy Policy</a>
                </p>
            </motion.div>

            {/* Custom animation keyframes */}
            <style>{`
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shine {
                    animation: shine 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
