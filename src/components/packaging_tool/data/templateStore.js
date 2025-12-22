// Template storage using Supabase with user isolation
// Falls back to localStorage for offline/unauthenticated use

import { supabase } from '../../../supabaseClient';

const LOCAL_STORAGE_KEY = 'synoxus_templates_local';

// Default templates (always available)
const DEFAULT_TEMPLATES = [];

// Get current user ID
const getUserId = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

// LocalStorage fallback
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

export const getTemplates = async () => {
    const userId = await getUserId();

    let userTemplates = [];

    if (supabase && userId) {
        const { data, error } = await supabase
            .from('user_templates')
            .select('*')
            .eq('user_id', userId)
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

    // Generate ID if new
    if (!templateData.id) {
        templateData.id = `tpl_${Date.now()}`;
        templateData.isDefault = false;
    }

    if (supabase && userId) {
        const { data, error } = await supabase
            .from('user_templates')
            .upsert({
                id: templateData.id,
                user_id: userId,
                label: templateData.label,
                description: templateData.description,
                prompt: templateData.context,
                images: templateData.referenceImages || [],
                feedback: templateData.feedback || [],
                is_default: templateData.isDefault || false,
                updated_at: new Date().toISOString()
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
    const isDefault = DEFAULT_TEMPLATES.some(t => t.id === id);

    if (supabase && userId) {
        const { error } = await supabase
            .from('user_templates')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

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
