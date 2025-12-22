// Character storage using Supabase with user isolation
// Supports both Authenticated Users and Anonymous Sessions (via x-session-id header)
// Falls back to localStorage ONLY if Supabase is completely unreachable

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../supabaseClient';

const LOCAL_STORAGE_KEY = 'synoxus_characters_local';
const SESSION_ID_KEY = 'synoxus_session_id';

// --- Session Management ---

const getSessionId = () => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
};

// Create a specific client for anonymous access that includes the session header
const getSessionClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const sessionId = getSessionId();

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                'x-session-id': sessionId
            }
        }
    });
};

// --- Helper Functions ---

const getUserId = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

const getLocalCharacters = () => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveLocalCharacters = (characters) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
    } catch (e) {
        console.error('Error saving characters to localStorage:', e);
        throw e;
    }
};

// --- CRUD Operations ---

export const saveCharacter = async (name, images, colors = {}) => {
    const userId = await getUserId();
    const sessionId = getSessionId();

    // Determine which client and ID to use
    const client = userId ? supabase : getSessionClient();
    const idField = userId ? { user_id: userId } : { session_id: sessionId };

    const character = {
        id: crypto.randomUUID(),
        name,
        images,
        colors,
        created_at: new Date().toISOString(),
        ...idField // Add user_id or session_id
    };

    if (client) {
        const { data, error } = await client
            .from('user_characters')
            .insert(character)
            .select()
            .single();

        if (error) {
            console.error('Error saving character to Supabase:', error);
            // Fallback to local if cloud fails
            try {
                const local = getLocalCharacters();
                local.push(character);
                saveLocalCharacters(local);
            } catch (localError) {
                throw new Error("Failed to save to cloud (API Error) and local storage is full. Please delete some characters.");
            }
        } else {
            return data;
        }
    } else {
        // No Supabase config, save locally
        const local = getLocalCharacters();
        local.push(character);
        saveLocalCharacters(local);
    }

    return character;
};

export const getCharacters = async () => {
    const userId = await getUserId();
    const client = userId ? supabase : getSessionClient();

    if (client) {
        // The RLS policy handles filtering based on user_id OR x-session-id header
        // We just need to make the query.
        const { data, error } = await client
            .from('user_characters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching characters from Supabase:', error);
            return getLocalCharacters();
        }

        return data.map(char => ({
            id: char.id,
            name: char.name,
            images: char.images || [],
            colors: char.colors || {},
            createdAt: new Date(char.created_at).getTime()
        })).filter(char =>
            char &&
            typeof char.name === 'string' &&
            Array.isArray(char.images) &&
            char.images.length > 0
        );
    }

    return getLocalCharacters();
};

export const deleteCharacter = async (id) => {
    const userId = await getUserId();
    const client = userId ? supabase : getSessionClient();

    if (client) {
        const { error } = await client
            .from('user_characters')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting character from Supabase:', error);
        }
    }

    // Also remove from local storage (sync)
    const local = getLocalCharacters();
    const filtered = local.filter(c => c.id !== id);
    saveLocalCharacters(filtered);
};

export const updateCharacter = async (id, updates) => {
    const userId = await getUserId();
    const client = userId ? supabase : getSessionClient();

    if (client) {
        const { data, error } = await client
            .from('user_characters')
            .update({
                name: updates.name,
                images: updates.images,
                colors: updates.colors,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating character:', error);
        } else {
            return data;
        }
    }

    // Update local storage
    const local = getLocalCharacters();
    const index = local.findIndex(c => c.id === id);
    if (index !== -1) {
        local[index] = { ...local[index], ...updates };
        saveLocalCharacters(local);
        return local[index];
    }

    return null;
};

export const clearAllCharacters = async () => {
    const userId = await getUserId();
    const client = userId ? supabase : getSessionClient();

    if (client) {
        // RLS will ensure we only delete our own rows
        const { error } = await client
            .from('user_characters')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows matching RLS

        if (error) {
            console.error('Error clearing characters from Supabase:', error);
        }
    }

    saveLocalCharacters([]);
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const MAX_WIDTH = 1500;
                const MAX_HEIGHT = 1500;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width > height) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    } else {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.85 (High Quality)
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = error => reject(error);
    });
};
