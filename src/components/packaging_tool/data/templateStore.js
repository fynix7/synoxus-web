import { openDB } from 'idb';
import { initDB } from '../services/db';

const DB_NAME = 'ThumbnailGeneratorDB';
const STORE_NAME = 'templates';

// Default templates definition
const DEFAULT_TEMPLATES = [
    {
        id: 'money',
        label: 'Make Money Online',
        description: 'High CTR thumbnails for finance and side hustles.',
        context: 'Focus on clear outcomes (money, graphs), surprised or serious expressions, and high contrast text. Key elements: Green/Red arrows, currency symbols, "Before/After" splits.',
        referenceImages: [],
        isDefault: true
    },
    {
        id: 'explainer',
        label: 'Explainer / Video Essay',
        description: 'Clean, intriguing visuals for deep dives.',
        context: 'Use a central subject with a mysterious or contrasting background. Minimal text (1-3 words). Focus on the "Curiosity Gap".',
        referenceImages: [],
        isDefault: true
    },
];

// Helper to convert file to base64 (reused from characterStore logic if needed, but good to have here)
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

export const getTemplates = async () => {
    try {
        const db = await initDB();
        const storedTemplates = await db.getAll(STORE_NAME);

        // Create a map of stored templates for easy lookup
        const storedMap = new Map(storedTemplates.map(t => [t.id, t]));

        // Merge defaults with stored overrides/new templates
        // 1. Start with defaults. If a stored version exists (same ID), use that (it contains overrides).
        const merged = DEFAULT_TEMPLATES.map(def => {
            if (storedMap.has(def.id)) {
                const stored = storedMap.get(def.id);
                storedMap.delete(def.id); // Remove from map so we don't duplicate later
                return { ...def, ...stored, isDefault: true }; // Keep isDefault flag
            }
            return def;
        });

        // 2. Add remaining stored templates (user created ones)
        storedMap.forEach(t => merged.push(t));

        return merged;
    } catch (error) {
        console.error("Failed to load templates from DB, returning defaults:", error);
        return DEFAULT_TEMPLATES;
    }
};

export const saveTemplate = async (templateData) => {
    const db = await initDB();
    // If it's a new template (no ID), generate one
    if (!templateData.id) {
        templateData.id = `tpl_${Date.now()}`;
        templateData.isDefault = false;
    }

    await db.put(STORE_NAME, templateData);
    return templateData;
};

export const deleteTemplate = async (id) => {
    const db = await initDB();
    // Check if it is a default template
    const isDefault = DEFAULT_TEMPLATES.some(t => t.id === id);

    if (isDefault) {
        // "Deleting" a default template actually just resets it (removes the override from DB)
        // But the user UI might expect "delete" to mean "hide"? 
        // The requirement says "default 5 templates should be able to add new image references to them and delete exisitng ones BUT the 5 each have reset button".
        // It doesn't explicitly say we can DELETE the default templates entirely. 
        // Usually "delete" on a default means "reset to factory".
        // But for clarity, I'll implement a specific `resetTemplate` function.
        // If `deleteTemplate` is called on a default, we should probably throw or handle it as a reset.
        // Let's assume user created templates are deleted, defaults are just reset.
        await db.delete(STORE_NAME, id);
    } else {
        await db.delete(STORE_NAME, id);
    }
};

export const resetTemplate = async (id) => {
    const db = await initDB();
    // Only valid for default templates. Removing it from DB restores the hardcoded default.
    if (DEFAULT_TEMPLATES.some(t => t.id === id)) {
        await db.delete(STORE_NAME, id);
    }
};

export const addTemplateFeedback = async (id, comment) => {
    const db = await initDB();
    const templates = await getTemplates();
    const template = templates.find(t => t.id === id);

    if (!template) throw new Error("Template not found");

    const newFeedback = [...(template.feedback || []), comment];
    const updatedTemplate = { ...template, feedback: newFeedback };

    // If it was a default template not yet in DB, we are now creating a DB entry for it (override)
    // If it was already in DB, we are updating it.
    // saveTemplate handles both (uses put).
    await saveTemplate(updatedTemplate);
    return updatedTemplate;
};

export const removeTemplateFeedback = async (id, index) => {
    const db = await initDB();
    const templates = await getTemplates();
    const template = templates.find(t => t.id === id);

    if (!template || !template.feedback) return;

    const newFeedback = template.feedback.filter((_, i) => i !== index);
    const updatedTemplate = { ...template, feedback: newFeedback };

    await saveTemplate(updatedTemplate);
    return updatedTemplate;
};

// Export the array for initial load if needed, but prefer getTemplates async
export const templates = DEFAULT_TEMPLATES; 
