// Template storage using Supabase with user isolation
// Supports both Authenticated Users and Anonymous Sessions (via x-session-id header)
// Falls back to localStorage ONLY if Supabase is completely unreachable

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../supabaseClient';

const LOCAL_STORAGE_KEY = 'synoxus_templates_local';
const SESSION_ID_KEY = 'synoxus_session_id';

// Default templates (always available)
const DEFAULT_TEMPLATES = [];

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

const getLocalTemplates = () => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveLocalTemplates = (templates) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
        console.error('Error saving templates to localStorage:', e);
    }
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// --- CRUD Operations ---

export const getTemplates = async () => {
    const userId = await getUserId();
    const client = userId ? supabase : getSessionClient();

    let userTemplates = [];

    if (client) {
        const { data, error } = await client
            .from('user_templates')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error && data) {
            userTemplates = data.map(t => ({
                id: t.id,
                label: t.label,
                description: t.description,
                context: t.prompt || t.context,
                referenceImages: t.images || [],
                feedback: t.feedback || [],
                isDefault: t.is_default || false
            }));
        }
    } else {
        userTemplates = getLocalTemplates();
    }

    // Merge with defaults
    const storedMap = new Map(userTemplates.map(t => [t.id, t]));

    const merged = DEFAULT_TEMPLATES.map(def => {
        if (storedMap.has(def.id)) {
            const stored = storedMap.get(def.id);
            storedMap.delete(def.id);
            return { ...def, ...stored, isDefault: true };
        }
        return def;
    });

    // Add user-created templates
    storedMap.forEach(t => merged.push(t));

    return merged;
};

export const saveTemplate = async (templateData) => {
    const userId = await getUserId();
    const sessionId = getSessionId();

    // Determine which client and ID to use
    const client = userId ? supabase : getSessionClient();
    const idField = userId ? { user_id: userId } : { session_id: sessionId };

    // Generate ID if new
    if (!templateData.id) {
        templateData.id = `tpl_${Date.now()}`;
        templateData.isDefault = false;
    }

    if (client) {
        const { data, error } = await client
            .from('user_templates')
            .upsert({
                id: templateData.id,
                label: templateData.label,
                description: templateData.description,
                prompt: templateData.context,
                images: templateData.referenceImages || [],
                feedback: templateData.feedback || [],
                is_default: templateData.isDefault || false,
                updated_at: new Date().toISOString(),
                ...idField // Add user_id or session_id
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving template to Supabase:', error);
            // Fallback to local
            const local = getLocalTemplates();
            const existingIdx = local.findIndex(t => t.id === templateData.id);
            if (existingIdx !== -1) {
                local[existingIdx] = templateData;
            } else {
                local.push(templateData);
            }
            saveLocalTemplates(local);
        } else {
            return data;
        }
    } else {
        const local = getLocalTemplates();
        const existingIdx = local.findIndex(t => t.id === templateData.id);
        if (existingIdx !== -1) {
            local[existingIdx] = templateData;
        } else {
            local.push(templateData);
        }
        saveLocalTemplates(local);
    }

    return templateData;
};

export const deleteTemplate = async (id) => {
    const userId = await getUserId();
    const client = userId ? supabase : getSessionClient();

    if (client) {
        const { error } = await client
            .from('user_templates')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting template from Supabase:', error);
        }
    }

    // Update local storage
    const local = getLocalTemplates();
    const filtered = local.filter(t => t.id !== id);
    saveLocalTemplates(filtered);
};

export const resetTemplate = async (id) => {
    // Only for defaults - removes user customizations
    if (DEFAULT_TEMPLATES.some(t => t.id === id)) {
        await deleteTemplate(id);
    }
};

export const addTemplateFeedback = async (id, comment) => {
    const templates = await getTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) throw new Error("Template not found");

    const newFeedback = [...(template.feedback || []), comment];
    const updatedTemplate = { ...template, feedback: newFeedback };

    await saveTemplate(updatedTemplate);
    return updatedTemplate;
};

export const removeTemplateFeedback = async (id, index) => {
    const templates = await getTemplates();
    const template = templates.find(t => t.id === id);

    if (!template || !template.feedback) return;

    const newFeedback = template.feedback.filter((_, i) => i !== index);
    const updatedTemplate = { ...template, feedback: newFeedback };

    await saveTemplate(updatedTemplate);
    return updatedTemplate;
};

// Export defaults for initial load
export const templates = DEFAULT_TEMPLATES;
