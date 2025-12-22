import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for existing session on mount
        const checkSession = async () => {
            try {
                if (!supabase) {
                    setLoading(false);
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (err) {
                console.error('Error checking session:', err);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    setUser(session?.user ?? null);

                    if (event === 'SIGNED_OUT') {
                        setError(null);
                    }
                }
            );

            return () => {
                subscription?.unsubscribe();
            };
        }
    }, []);

    const signUp = async (email, password, displayName = '') => {
        setError(null);
        try {
            if (!supabase) {
                throw new Error('Supabase not configured');
            }

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName || email.split('@')[0]
                    }
                }
            });

            if (signUpError) throw signUpError;

            // Auto sign-in after signup (if email confirmation is disabled)
            if (data.user && !data.user.confirmed_at) {
                return { success: true, message: 'Check your email for confirmation link' };
            }

            return { success: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const signIn = async (email, password) => {
        setError(null);
        try {
            if (!supabase) {
                throw new Error('Supabase not configured');
            }

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;

            return { success: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const signOut = async () => {
        try {
            if (!supabase) return;

            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;

            setUser(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const resetPassword = async (email) => {
        try {
            if (!supabase) {
                throw new Error('Supabase not configured');
            }

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (resetError) throw resetError;

            return { success: true, message: 'Check your email for password reset link' };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const value = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
