// Character storage using Supabase with user isolation
// Falls back to localStorage for offline/unauthenticated use

import { supabase } from '../../../supabaseClient';

const LOCAL_STORAGE_KEY = 'synoxus_characters_local';

// Get current user ID from Supabase auth
const getUserId = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

// Fallback to localStorage
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
    }
};

export const saveCharacter = async (name, images, colors = {}) => {
    const userId = await getUserId();

    const character = {
        id: crypto.randomUUID(),
        name,
        images,
        colors,
        created_at: new Date().toISOString()
    };

    // If we have Supabase and a user, save to cloud
    if (supabase && userId) {
        const { data, error } = await supabase
            .from('user_characters')
            .insert({
                id: character.id,
                user_id: userId,
                name: character.name,
                images: character.images,
                colors: character.colors
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving character to Supabase:', error);
            // Fallback to local
            const local = getLocalCharacters();
            local.push(character);
            saveLocalCharacters(local);
        } else {
            return data;
        }
    } else {
        // No auth, save locally
        const local = getLocalCharacters();
        local.push(character);
        saveLocalCharacters(local);
    }

    return character;
};

export const getCharacters = async () => {
    const userId = await getUserId();

    // If we have Supabase and a user, fetch from cloud
    if (supabase && userId) {
        const { data, error } = await supabase
            .from('user_characters')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching characters from Supabase:', error);
            return getLocalCharacters();
        }

        // Transform to match expected format
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

    // Fallback to local storage
    return getLocalCharacters().filter(char =>
        char &&
        typeof char.name === 'string' &&
        Array.isArray(char.images) &&
        char.images.length > 0
    );
};

export const deleteCharacter = async (id) => {
    const userId = await getUserId();

    if (supabase && userId) {
        const { error } = await supabase
            .from('user_characters')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting character from Supabase:', error);
        }
    }

    // Also remove from local storage
    const local = getLocalCharacters();
    const filtered = local.filter(c => c.id !== id);
    saveLocalCharacters(filtered);
};

export const updateCharacter = async (id, updates) => {
    const userId = await getUserId();

    if (supabase && userId) {
        const { data, error } = await supabase
            .from('user_characters')
            .update({
                name: updates.name,
                images: updates.images,
                colors: updates.colors,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
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

    if (supabase && userId) {
        const { error } = await supabase
            .from('user_characters')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error clearing characters from Supabase:', error);
        }
    }

    // Clear local storage
    saveLocalCharacters([]);
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};
