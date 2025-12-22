import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'signup') {
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
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            {/* Background gradient effect */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff982b]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffc972]/10 rounded-full blur-[150px]" />
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
                        <span className="text-2xl font-bold text-black">S</span>
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
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-2xl">
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
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#52525b] focus:outline-none focus:border-[#ff982b] transition-colors"
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
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#52525b] focus:outline-none focus:border-[#ff982b] transition-colors"
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
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-[#52525b] focus:outline-none focus:border-[#ff982b] transition-colors"
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
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#52525b]" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#52525b] focus:outline-none focus:border-[#ff982b] transition-colors"
                                        />
                                    </div>
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full py-4 flex items-center justify-center gap-2 text-sm font-bold text-black bg-gradient-to-r from-[#ff982b] to-[#ffc972] rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,152,43,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </motion.div>
        </div>
    );
};

export default AuthPage;
