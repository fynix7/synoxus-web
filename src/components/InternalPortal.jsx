import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PackagingTool from './packaging_tool/PackagingTool';
import ShortFormScribe from './ShortFormScribe';
import ChatConfiguration from './ChatConfiguration';
import NoteTaker from './NoteTaker';
import OutlierScout from './outlier_scout/OutlierScout';
import SkoolTrackingSetup from './SkoolTrackingSetup';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Save, LogOut, LayoutGrid, Package, MessageSquare, ArrowLeft, ArrowRight, Database, GraduationCap, Calendar, Tag, Clock, Users, Settings, Edit3, CheckSquare, Rocket, FileText, Video, User, Fingerprint, Briefcase, Globe, Search, Lightbulb, Mic, Image, TrendingUp, BookOpen, Palette, Type, Upload, LayoutTemplate, Target, Eye, Heart, Zap, Swords } from 'lucide-react';
import { HexColorPicker } from "react-colorful";

const PRIORITY_TAGS = {
    'Urgent': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'High': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Low': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const MASTER_KEY = 'synoxus2004';
const CLIENT_ADMIN_KEY = 'admin';

const Column = ({ title, id, tasks, onAdd, onDelete, onMove, onEdit, userRole, currentUserKey, onDeleteColumn, isEditMode, onMoveColumn, index, totalColumns }) => {
    const canDeleteOrEdit = (task) => {
        if (userRole === 'master_admin' || userRole === 'admin') return true;
        const isOwner = task.createdBy === currentUserKey;
        const isRecent = (Date.now() - new Date(task.createdAt).getTime()) < 24 * 60 * 60 * 1000;
        return isOwner && isRecent;
    };

    const isAdmin = userRole === 'master_admin' || userRole === 'admin';

    return (
        <div className="flex-1 min-w-[320px] bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col h-full max-h-full overflow-hidden shadow-2xl relative group/col">
            {/* Column Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#121212] group-hover/col:bg-[#1a1a1a] transition-colors">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${title === 'To Do' ? 'bg-red-500' : title === 'In Progress' ? 'bg-yellow-500' : title === 'Done' ? 'bg-green-500' : 'bg-blue-500'} shadow-[0_0_8px_currentColor]`} />
                    <h3 className="font-medium text-white tracking-wide text-sm uppercase">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#050505] bg-white/20 px-2 py-0.5 rounded-full">{tasks.length}</span>
                    {isEditMode && isAdmin && (
                        <div className="flex items-center gap-1 ml-2">
                            <button
                                onClick={() => onMoveColumn(id, 'left')}
                                disabled={index === 0}
                                className="p-1 hover:bg-white/10 text-[#71717a] hover:text-white rounded disabled:opacity-30"
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => onMoveColumn(id, 'right')}
                                disabled={index === totalColumns - 1}
                                className="p-1 hover:bg-white/10 text-[#71717a] hover:text-white rounded disabled:opacity-30"
                            >
                                <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => onDeleteColumn(id)}
                                className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-all ml-1"
                                title="Delete Column"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#050505]">
                <AnimatePresence mode='popLayout'>
                    {tasks.map((task) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            key={task.id}
                            className={`group bg-[#121212] border border-white/5 p-4 rounded-2xl transition-all relative shadow-sm 
                                ${canDeleteOrEdit(task) ? 'cursor-pointer hover:bg-gradient-to-r hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_20px_rgba(255,152,43,0.3)]' : ''}`}
                            onClick={() => canDeleteOrEdit(task) && onEdit(task)}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <h4 className="text-white font-medium pr-6 text-sm leading-snug group-hover:text-black transition-colors">{task.title}</h4>
                                {task.metadata?.assignee && (
                                    <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white group-hover:bg-black/20 group-hover:text-black group-hover:border-black/10 transition-colors" title={`Assigned to ${task.metadata.assignee}`}>
                                        {task.metadata.assignee.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {task.description && (
                                <p className="text-xs text-[#71717a] line-clamp-2 leading-relaxed mb-3 group-hover:text-black/70 transition-colors">{task.description}</p>
                            )}

                            {/* Subtasks Progress */}
                            {task.metadata?.subtasks && task.metadata.subtasks.length > 0 && (
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 text-[10px] text-[#71717a] group-hover:text-black/60 mb-1 transition-colors">
                                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden group-hover:bg-black/10">
                                            <div
                                                className="h-full bg-[#ff982b] group-hover:bg-black"
                                                style={{ width: `${(task.metadata.subtasks.filter(st => st.completed).length / task.metadata.subtasks.length) * 100}%` }}
                                            />
                                        </div>
                                        <span>{task.metadata.subtasks.filter(st => st.completed).length}/{task.metadata.subtasks.length}</span>
                                    </div>
                                </div>
                            )}

                            {/* Tags & Meta */}
                            <div className="flex flex-wrap gap-2">
                                {task.metadata?.tag && (
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${task.metadata.tag === 'Long Form' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-pink-500/20 text-pink-400 border-pink-500/30'} group-hover:bg-black/10 group-hover:text-black group-hover:border-black/20`}>
                                        {task.metadata.tag}
                                    </span>
                                )}
                                {task.priority && (
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${PRIORITY_TAGS[task.priority] || 'bg-white/10 text-white border-white/20'} group-hover:bg-black/10 group-hover:text-black group-hover:border-black/20`}>
                                        {task.priority}
                                    </span>
                                )}
                                {task.dueDate && (
                                    <div className="flex items-center gap-1 text-[10px] text-[#71717a] bg-white/5 px-2 py-0.5 rounded border border-white/10 group-hover:text-black/70 group-hover:border-black/10 group-hover:bg-black/5 transition-colors">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            {/* Hover Actions */}
                            {canDeleteOrEdit(task) && (
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(id, task.id); }}
                                        className="p-2 bg-white/10 hover:bg-red-500 text-white hover:text-white rounded-lg transition-colors backdrop-blur-sm shadow-sm"
                                        title="Delete Task"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Quick Move Actions */}
                            <div className="flex justify-between mt-3 pt-3 border-t border-white/5 group-hover:border-black/10 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, task.id, 'left'); }}
                                    className="p-2 bg-white/5 hover:bg-black/20 text-[#71717a] group-hover:text-black/60 hover:!text-black rounded-lg transition-colors backdrop-blur-sm"
                                    title="Move Left"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onMove(id, task.id, 'right'); }}
                                    className="p-2 bg-white/5 hover:bg-black/20 text-[#71717a] group-hover:text-black/60 hover:!text-black rounded-lg transition-colors backdrop-blur-sm"
                                    title="Move Right"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Button */}
            <div className="p-4 border-t border-white/5 bg-[#121212]">
                <button
                    onClick={() => onAdd(id)}
                    className="group relative w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-[#050505] bg-gradient-to-r from-[#ff982b] to-[#ffc972] rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,152,43,0.4)] hover:saturate-[1.15] cursor-pointer"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Add Task
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </button>
            </div>
        </div>
    );
};

const InternalPortal = ({ onExit, initialView = 'menu', siteSettings = { landingEnabled: false }, onUpdateSiteSettings, settingsPassword = '', user }) => {
    const { signOut } = useAuth();
    const [columns, setColumns] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState(initialView);
    const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for now
    const [clientKey, setClientKey] = useState('synoxus'); // Default to synoxus
    const [userKey, setUserKey] = useState('');
    const [userRole, setUserRole] = useState('admin'); // Default to admin
    const [error, setError] = useState(false);

    // New State for ClickUp-like features
    const [isEditMode, setIsEditMode] = useState(false);
    const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', role: '' });
    const [isChatEnabled, setIsChatEnabled] = useState(() => {
        const saved = localStorage.getItem('synoxus_chat_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Site Settings Modal State
    const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false);
    const [siteSettingsPassword, setSiteSettingsPassword] = useState('');
    const [isSiteSettingsUnlocked, setIsSiteSettingsUnlocked] = useState(false);
    const [siteSettingsError, setSiteSettingsError] = useState(false);

    useEffect(() => {
        localStorage.setItem('synoxus_chat_enabled', JSON.stringify(isChatEnabled));
    }, [isChatEnabled]);

    // Sync view with initialView prop
    useEffect(() => {
        setView(initialView);
    }, [initialView]);

    // Sync URL with view
    useEffect(() => {
        let path = '/portal';
        switch (view) {
            case 'packaging': path = '/thumbnail-generator'; break;
            case 'outlier_scout': path = '/outlier-scout'; break;
            case 'note_taker': path = '/note-taker'; break;
            case 'short_form_scribe': path = '/short-form-scribe'; break;
            case 'messaging': path = '/chat-config'; break;
            case 'vsl': path = '/vsl'; break;
            case 'title_generator': path = '/title-generator'; break;
            case 'landing_page': path = '/landing-page'; break;
            case 'masterclass': path = '/masterclass'; break;
            case 'skool_tracking': path = '/skool-tracking'; break;
            case 'menu': path = '/portal'; break;
            default: path = '/portal';
        }
        if (window.location.pathname !== path) {
            window.history.pushState({}, '', path);
        }
    }, [view]);

    // Brand Identity State
    const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem('brandPrimaryColor') || '#ff982b');
    const [activeColorPicker, setActiveColorPicker] = useState(false);
    const [headerFontName, setHeaderFontName] = useState('');
    const [contentFontName, setContentFontName] = useState('');
    const [headerFontFile, setHeaderFontFile] = useState(null);
    const [contentFontFile, setContentFontFile] = useState(null);

    // Sync Brand Color
    useEffect(() => {
        localStorage.setItem('brandPrimaryColor', primaryColor);
    }, [primaryColor]);

    const handleFontUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'header') setHeaderFontFile(file.name);
            else setContentFontFile(file.name);
        }
    };

    // Fetch Columns, Tasks & Users
    useEffect(() => {
        const fetchData = async () => {
            if (!supabase) {
                // Fallback Data
                setColumns([
                    { id: 'todo', title: 'To Do', tasks: [] },
                    { id: 'inProgress', title: 'In Progress', tasks: [] },
                    { id: 'done', title: 'Done', tasks: [] }
                ]);
                setAvailableUsers([
                    { id: 1, name: 'John Doe', role: 'Developer' },
                    { id: 2, name: 'Jane Smith', role: 'Designer' }
                ]);
                return;
            }

            // 1. Fetch Columns
            const { data: colsData } = await supabase
                .from('crm_columns')
                .select('*')
                .order('position', { ascending: true });

            let initialColumns = [];
            if (colsData && colsData.length > 0) {
                initialColumns = colsData.map(c => ({ id: c.title, title: c.title, tasks: [] }));
            } else {
                initialColumns = [
                    { id: 'Ideation', title: 'Ideation', tasks: [] },
                    { id: 'Scripting', title: 'Scripting', tasks: [] },
                    { id: 'Filming', title: 'Filming', tasks: [] },
                    { id: 'Editing', title: 'Editing', tasks: [] },
                    { id: 'Packaging', title: 'Packaging', tasks: [] },
                    { id: 'Posted', title: 'Posted', tasks: [] }
                ];
            }




            // 2. Fetch Tasks
            const { data: tasksData } = await supabase
                .from('crm_tasks')
                .select('*');

            if (tasksData) {
                const updatedColumns = initialColumns.map(col => ({
                    ...col,
                    tasks: tasksData
                        .filter(t => t.status === col.id)
                        .map(t => ({
                            ...t,
                            dueDate: t.due_date,
                            createdBy: t.created_by,
                            createdAt: t.created_at,
                            columnId: t.status,
                            metadata: t.metadata || {}
                        }))
                }));
                setColumns(updatedColumns);
            } else {
                setColumns(initialColumns);
            }

            // 3. Fetch Users
            const { data: usersData } = await supabase.from('crm_users').select('*');
            if (usersData) setAvailableUsers(usersData);
        };
        fetchData();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.name) return;

        if (supabase) {
            const { data } = await supabase.from('crm_users').insert([newUser]).select();
            if (data) setAvailableUsers([...availableUsers, data[0]]);
        } else {
            setAvailableUsers([...availableUsers, { ...newUser, id: Date.now() }]);
        }
        setNewUser({ name: '', role: '' });
    };

    const handleDeleteUser = async (id) => {
        if (supabase) await supabase.from('crm_users').delete().eq('id', id);
        setAvailableUsers(availableUsers.filter(u => u.id !== id));
    };

    const handleAddColumn = async () => {
        const title = prompt("Enter column name:");
        if (!title) return;

        const newCol = { id: title, title: title, tasks: [] };
        setColumns(prev => [...prev, newCol]);

        if (supabase) {
            await supabase.from('crm_columns').insert([{
                title: title,
                position: columns.length
            }]);
        }
    };

    const handleMoveColumn = async (colId, direction) => {
        const idx = columns.findIndex(c => c.id === colId);
        if (idx === -1) return;

        const newIdx = direction === 'right' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= columns.length) return;

        const newCols = [...columns];
        const [movedCol] = newCols.splice(idx, 1);
        newCols.splice(newIdx, 0, movedCol);

        setColumns(newCols);

        // Update position in DB (simplified for now)
        if (supabase) {
            for (let i = 0; i < newCols.length; i++) {
                await supabase.from('crm_columns').update({ position: i }).eq('title', newCols[i].id);
            }
        }
    };

    const handleDeleteColumn = async (colId) => {
        if (!confirm("Delete this column and all its tasks?")) return;

        setColumns(prev => prev.filter(c => c.id !== colId));

        if (supabase) {
            await supabase.from('crm_columns').delete().eq('title', colId);
            await supabase.from('crm_tasks').delete().eq('status', colId);
        }
    };

    const handleAddTask = async (columnId) => {
        const tag = prompt("Enter tag (Long Form / Short Form):", "Long Form");
        const newTask = {
            title: 'New Task',
            description: '',
            status: columnId,
            created_at: new Date().toISOString(),
            created_by: userKey,
            metadata: { subtasks: [], assignee: '', tag: tag || 'Long Form' }
        };

        if (supabase) {
            const { data, error } = await supabase
                .from('crm_tasks')
                .insert([newTask])
                .select();

            if (data && data[0]) {
                const createdTask = data[0];
                const localTask = {
                    ...createdTask,
                    dueDate: createdTask.due_date,
                    createdBy: createdTask.created_by,
                    createdAt: createdTask.created_at,
                    columnId: createdTask.status,
                    metadata: createdTask.metadata || { subtasks: [], assignee: '', tag: tag || 'Long Form' }
                };
                setColumns(prev => prev.map(col =>
                    col.id === columnId
                        ? { ...col, tasks: [...col.tasks, localTask] }
                        : col
                ));
                setEditingTask({ ...localTask, columnId });
                setIsModalOpen(true);
            }
        } else {
            // Fallback
            const localTask = {
                ...newTask,
                id: Date.now().toString(),
                createdAt: newTask.created_at,
                createdBy: newTask.created_by,
                columnId
            };
            setColumns(prev => prev.map(col =>
                col.id === columnId
                    ? { ...col, tasks: [...col.tasks, localTask] }
                    : col
            ));
            setEditingTask(localTask);
            setIsModalOpen(true);
        }
    };

    const handleDeleteTask = async (columnId, taskId) => {
        if (supabase) {
            await supabase.from('crm_tasks').delete().eq('id', taskId);
        }
        setColumns(prev => prev.map(col =>
            col.id === columnId
                ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
                : col
        ));
    };

    const handleMoveTask = async (fromColId, taskId, direction) => {
        const colIndex = columns.findIndex(c => c.id === fromColId);
        if (colIndex === -1) return;

        const newIndex = direction === 'right' ? colIndex + 1 : colIndex - 1;
        if (newIndex < 0 || newIndex >= columns.length) return;

        const toColId = columns[newIndex].id;
        const task = columns[colIndex].tasks.find(t => t.id === taskId);

        // Optimistic update
        setColumns(prev => prev.map(col => {
            if (col.id === fromColId) {
                return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
            }
            if (col.id === toColId) {
                return { ...col, tasks: [...col.tasks, { ...task, status: toColId }] };
            }
            return col;
        }));

        if (supabase) {
            await supabase
                .from('crm_tasks')
                .update({ status: toColId })
                .eq('id', taskId);
        }
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!editingTask) return;

        // Optimistic update
        setColumns(prev => prev.map(col =>
            col.id === editingTask.columnId
                ? { ...col, tasks: col.tasks.map(t => t.id === editingTask.id ? { ...t, ...editingTask } : t) }
                : col
        ));

        if (supabase) {
            await supabase
                .from('crm_tasks')
                .update({
                    title: editingTask.title,
                    description: editingTask.description,
                    priority: editingTask.priority,
                    due_date: editingTask.dueDate,
                    metadata: editingTask.metadata
                })
                .eq('id', editingTask.id);
        }

        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleLogin = (e) => {
        e.preventDefault();

        // Master Key Override
        if (userKey === MASTER_KEY) {
            setIsAuthenticated(true);
            setUserRole('master_admin');
            setError(false);
            return;
        }

        // Standard Client Auth
        // In a real app, you'd validate clientKey against a DB
        if (clientKey.toLowerCase() === 'synoxus') {
            setIsAuthenticated(true);
            if (userKey === CLIENT_ADMIN_KEY) {
                setUserRole('admin');
            } else {
                setUserRole('employee');
            }
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 1000);
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    const openEditModal = (task, columnId) => {
        // Find which column this task belongs to if not provided
        let colId = columnId;
        if (!colId) {
            Object.keys(columns).forEach(key => {
                if (columns[key].find(t => t.id === task.id)) colId = key;
            });
        }
        setEditingTask({ ...task, columnId: colId });
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-3">

                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center">
                        <span className="font-bold text-black text-xs">S</span>
                    </div>
                    <h1 className="font-medium text-lg tracking-tight">
                        <span onClick={() => { setView('menu'); window.history.pushState({}, '', '/portal'); }} className="cursor-pointer hover:text-[#ff982b] transition-colors">Synoxus</span> <span className="text-[#52525b] font-light">/ {view === 'menu' ? 'Portal' : view === 'crm' ? 'Pipeline' : view === 'packaging' ? 'Thumbnail Generator' : view === 'messaging' ? 'Chat Configuration' : view === 'note_taker' ? 'Note Taker' : view === 'vault' ? 'Short Form' : view === 'long_form' ? 'Long Form' : view === 'funnel' ? 'Funnel' : view === 'course' ? 'Course' : view === 'onboarding' ? 'Onboarding' : view === 'brand_identity' ? 'Brand Identity' : view === 'strategic_identity' ? 'Strategic Identity' : view === 'masterclass' ? 'Masterclass' : view === 'youtube_masterclass' ? 'YouTube Masterclass' : view === 'short_form_scribe' ? 'ShortForm Scribe' : view === 'vsl' ? 'VSL' : view === 'title_generator' ? 'Title Generator' : view === 'landing_page' ? 'Landing Page' : view === 'sheet_wip' ? 'Work in Progress' : view === 'mission_statement' ? 'Mission Statement' : view === 'vision_statement' ? 'Vision Statement' : view === 'core_values' ? 'Core Values' : view === 'target_audience' ? 'Target Audience' : view === 'usp' ? 'USP' : view === 'key_competitors' ? 'Competitors' : view === 'resources' ? 'Resources' : view === 'sops' ? 'SOPs' : view === 'skool_tracking' ? 'Skool Tracking' : view === 'outlier_scout' ? 'Outlier Scout' : view.startsWith('brand_sheets') ? 'Brand Sheet' : 'Portal'}</span>
                        {user && <span className="ml-2 text-[10px] font-medium bg-white/10 px-2 py-0.5 rounded text-[#a1a1aa]">{user.user_metadata?.display_name || user.email?.split('@')[0]}</span>}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181108]">
                        <div className="w-2 h-2 rounded-full bg-[#ffc175] animate-pulse"></div>
                        <span className="text-xs text-[#fcf0d4] font-medium">System Online</span>
                    </div>
                    <button
                        onClick={() => setIsSiteSettingsOpen(true)}
                        className="p-2 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-[#ff982b] transition-colors cursor-pointer"
                        title="Site Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={isAuthenticated ? handleLogout : onExit}
                        className="p-2 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                        title={isAuthenticated ? "Log Out" : "Exit Portal"}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>
            {/* Main Content Area */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col relative">
                {view !== 'menu' && isAuthenticated && (
                    <button
                        onClick={() => {
                            if (['brand_identity', 'strategic_identity', 'mission_statement', 'vision_statement', 'core_values', 'target_audience', 'usp', 'key_competitors'].includes(view)) {
                                setView('onboarding');
                            } else if (['course', 'masterclass', 'short_form_scribe', 'hooks', 'dm_setter', 'stories', 'appointment_setter'].includes(view)) {
                                setView('vault');
                            } else if (['note_taker', 'packaging', 'youtube_masterclass', 'title_generator', 'profile', 'cashcade', 'outlier_scout'].includes(view)) {
                                setView('long_form');
                            } else if (['messaging', 'landing_page', 'vsl'].includes(view)) {
                                setView('funnel');
                            } else if (view === 'sops') {
                                setView('resources');
                            } else if (view === 'skool_tracking') {
                                setView('sops');
                            } else if (view.startsWith('brand_sheets_') && view !== 'brand_sheets') {
                                setView('brand_sheets');
                            } else {
                                setView('menu');
                            }
                        }}
                        className="absolute top-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_20px_rgba(255,152,43,0.3)] hover:scale-110 transition-transform cursor-pointer group overflow-hidden"
                    >
                        <ArrowLeft className="w-6 h-6 text-[#050505] relative z-10" strokeWidth={2.5} />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </button>
                )}

                {!isAuthenticated ? (
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[#121212] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-light text-white mb-6 text-center">Internal Access</h3>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-1 block">Client Key</label>
                                    <input
                                        type="text"
                                        value={clientKey}
                                        onChange={(e) => setClientKey(e.target.value)}
                                        placeholder="Enter client key..."
                                        className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-1 block">User Key</label>
                                    <input
                                        type="password"
                                        value={userKey}
                                        onChange={(e) => setUserKey(e.target.value)}
                                        placeholder="Enter user key..."
                                        className={`w-full bg-[#050505] border ${error ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors`}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="group relative w-full py-4 flex items-center justify-center gap-2 text-sm font-bold text-[#050505] bg-gradient-to-r from-[#ff982b] to-[#ffc972] rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,152,43,0.4)] hover:saturate-[1.15] cursor-pointer"
                                >
                                    <span className="relative z-10 flex items-center gap-2 uppercase tracking-wide">
                                        Login
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                                    </span>
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {view === 'menu' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                    {/* 1. Onboarding */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('onboarding')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Rocket className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Onboarding</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Start here. Setup your Brand, Business, and Industry identity.</p>
                                        </div>
                                    </motion.div>

                                    {/* 2. Pipeline */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('crm')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <LayoutGrid className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Pipeline</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Manage tasks, track progress, and organize your workflow.</p>
                                        </div>
                                    </motion.div>

                                    {/* 3. Short Form */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('vault')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Zap className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Short Form</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">ShortForm Scribe, Instagram Masterclass, and more.</p>
                                        </div>
                                    </motion.div>

                                    {/* 4. Long Form */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('long_form')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Video className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Long Form</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Note Taker, Thumbnail Generator, and YouTube Masterclass.</p>
                                        </div>
                                    </motion.div>

                                    {/* 5. Funnel */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('funnel')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Target className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Funnel</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Chat Config, Landing Page, and VSL.</p>
                                        </div>
                                    </motion.div>

                                    {/* 6. Resources */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('resources')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <BookOpen className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Resources</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">SOPs, Guides, and Tracking Setup.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {view === 'resources' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('sops')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <FileText className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">SOPs</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Standard Operating Procedures.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {view === 'sops' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('skool_tracking')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <TrendingUp className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Skool Tracking Setup</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Guide to setting up conversion tracking.</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {view === 'skool_tracking' && (
                            <SkoolTrackingSetup />
                        )}

                        {view === 'onboarding' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                    {[
                                        { id: 'brand_identity', title: 'Brand Identity', icon: Fingerprint, desc: 'Colors, Fonts, and Visual Language.' },
                                        { id: 'mission_statement', title: 'Mission Statement', icon: Target, desc: 'Why does your business exist?' },
                                        { id: 'vision_statement', title: 'Vision Statement', icon: Eye, desc: 'Where are you going?' },
                                        { id: 'core_values', title: 'Core Values', icon: Heart, desc: 'What do you stand for?' },
                                        { id: 'target_audience', title: 'Target Audience', icon: Users, desc: 'Who are you serving?' },
                                        { id: 'usp', title: 'Unique Selling Proposition', icon: Zap, desc: 'What makes you different?' },
                                        { id: 'key_competitors', title: 'Key Competitors', icon: Swords, desc: 'Who are you up against?' }
                                    ].map((item) => (
                                        <motion.div
                                            key={item.id}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setView(item.id)}
                                            className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                        >
                                            <div>
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                    <item.icon className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                                </div>
                                                <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">{item.title}</h3>
                                                <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {
                            view === 'vault' && (
                                <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                        {/* ShortForm Scribe */}
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setView('short_form_scribe')}
                                            className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                        >
                                            <div>
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                    <Edit3 className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                                </div>
                                                <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">ShortForm Scribe</h3>
                                                <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Optimize scripts with power words, hooks, and value density.</p>
                                            </div>
                                            <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                        </motion.div>

                                        {/* Instagram Masterclass */}
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setView('masterclass')}
                                            className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                        >
                                            <div>
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                    <Video className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                                </div>
                                                <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Instagram Masterclass</h3>
                                                <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Master the algorithm and grow your presence.</p>
                                            </div>
                                            <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                        </motion.div>

                                        {[
                                            { id: 'hooks', title: 'Winning Hooks Library', icon: Lightbulb, desc: 'Curated collection of high-performing hooks.' },
                                            { id: 'dm_setter', title: 'AI DM Setter', icon: MessageSquare, desc: 'Automated DM outreach and appointment setting.' },
                                            { id: 'stories', title: 'Story Sequences', icon: Image, desc: 'Templates for engaging story arcs.' },
                                            { id: 'appointment_setter', title: 'Appointment Setter Training', icon: Users, desc: 'Train your team to book more calls.' }
                                        ].map((item) => (
                                            <motion.div
                                                key={item.id}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() => setView('sheet_wip')}
                                                className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                            >
                                                <div>
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                        <item.icon className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                                    </div>
                                                    <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">{item.title}</h3>
                                                    <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">{item.desc}</p>
                                                </div>
                                                {(item.id === 'dm_setter' || item.id === 'stories' || item.id === 'appointment_setter') && (
                                                    <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }

                        {view === 'long_form' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                    {/* Note Taker */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('note_taker')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Mic className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Note Taker</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Transcribe and analyze YouTube videos.</p>
                                        </div>
                                    </motion.div>

                                    {/* Thumbnail Generator */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('packaging')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Package className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Thumbnail Generator</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Create high-converting thumbnails.</p>
                                        </div>
                                    </motion.div>

                                    {/* Outlier Scout */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('outlier_scout')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Search className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Outlier Scout</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Find viral videos and analyze patterns.</p>
                                        </div>
                                    </motion.div>

                                    {/* YouTube Masterclass */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('youtube_masterclass')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Video className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">YouTube Masterclass</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Complete guide to growing and monetizing your channel.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                    </motion.div>

                                    {/* Title Generator */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('title_generator')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Type className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Title Generator</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Generate viral titles for your videos.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                    </motion.div>

                                    {/* Profile Optimization (Moved from Short Form) */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('sheet_wip')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <User className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Profile Optimization</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Audit and improve your bio and highlights.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                    </motion.div>

                                    {/* Cashcade */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('sheet_wip')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <TrendingUp className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Cashcade</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Maximize revenue from every viewer.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {view === 'funnel' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                    {/* Chat Configuration */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('messaging')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <MessageSquare className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Chat Configuration</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Configure your chat settings and auto-responses.</p>
                                        </div>
                                    </motion.div>

                                    {/* Landing Page */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('landing_page')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <LayoutTemplate className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Landing Page</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Build high-converting landing pages.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                    </motion.div>

                                    {/* VSL */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('vsl')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Video className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">VSL</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Video Sales Letter configuration.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {
                            view === 'brand_identity' && (
                                <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8">
                                    <div className="flex flex-col gap-2 mb-4">
                                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                            <Palette className="text-[#ff982b]" />
                                            Brand Identity
                                        </h2>
                                        <p className="text-[#a1a1aa]">Define your visual language: colors and typography.</p>
                                    </div>

                                    {/* Colors Section */}
                                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
                                        <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                                            <Palette className="w-5 h-5 text-[#ff982b]" />
                                            Brand Colors
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Color Picker */}
                                            <div className="space-y-4">
                                                <label className="text-sm text-[#a1a1aa]">Primary Brand Color</label>
                                                <div className="flex items-center gap-4 relative">
                                                    <button
                                                        className="w-16 h-16 rounded-xl cursor-pointer border-0 transition-transform hover:scale-105 shadow-lg"
                                                        style={{ backgroundColor: primaryColor }}
                                                        onClick={() => setActiveColorPicker(!activeColorPicker)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-mono uppercase">{primaryColor}</span>
                                                        <span className="text-xs text-[#52525b]">Click swatch to change</span>
                                                    </div>

                                                    {activeColorPicker && (
                                                        <div className="absolute top-full left-0 mt-2 z-50">
                                                            <div className="fixed inset-0" onClick={() => setActiveColorPicker(false)} />
                                                            <div className="relative bg-[#1a1a1a] p-3 rounded-xl border border-white/10 shadow-2xl">
                                                                <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                                                                <div className="mt-3 flex items-center gap-2 bg-[#050505] p-2 rounded-lg border border-white/5">
                                                                    <span className="text-[#52525b] text-xs">#</span>
                                                                    <input
                                                                        type="text"
                                                                        value={primaryColor.replace('#', '')}
                                                                        onChange={(e) => setPrimaryColor(`#${e.target.value}`)}
                                                                        className="bg-transparent border-none text-white text-xs focus:outline-none w-full font-mono uppercase"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Color Psychology Table */}
                                            <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-white/5 text-[#a1a1aa]">
                                                        <tr>
                                                            <th className="p-3 font-medium">Color</th>
                                                            <th className="p-3 font-medium">Psychological Association</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-[#d4d4d8]">
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Blue</td>
                                                            <td className="p-3">Trust, Security, Calm, Professionalism</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Red</td>
                                                            <td className="p-3">Energy, Urgency, Passion, Excitement</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Yellow</td>
                                                            <td className="p-3">Optimism, Clarity, Warmth, Caution</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> Green</td>
                                                            <td className="p-3">Growth, Health, Money, Balance</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> Purple</td>
                                                            <td className="p-3">Creativity, Luxury, Wisdom, Mystery</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Orange</td>
                                                            <td className="p-3">Friendly, Cheerful, Confidence</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-black border border-white/20" /> Black</td>
                                                            <td className="p-3">Power, Elegance, Sophistication</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Typography Section */}
                                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
                                        <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                                            <Type className="w-5 h-5 text-[#ff982b]" />
                                            Typography
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Header Font */}
                                            <div className="space-y-4">
                                                <label className="text-sm text-[#a1a1aa]">Header Font (Bold/Display)</label>
                                                <div className="flex flex-col gap-3">
                                                    <input
                                                        type="text"
                                                        value={headerFontName}
                                                        onChange={(e) => setHeaderFontName(e.target.value)}
                                                        placeholder="Enter font name..."
                                                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <label className="flex-1 cursor-pointer group">
                                                            <input type="file" accept=".ttf,.otf" className="hidden" onChange={(e) => handleFontUpload(e, 'header')} />
                                                            <div className="flex items-center justify-center gap-2 bg-[#050505] border border-white/10 border-dashed rounded-xl px-4 py-3 text-[#71717a] group-hover:text-white group-hover:border-[#ff982b]/50 transition-all">
                                                                <Upload className="w-4 h-4" />
                                                                <span className="text-sm truncate">{headerFontFile || 'Upload .ttf / .otf'}</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-[#050505] rounded-xl border border-white/5">
                                                    <p className="text-2xl font-bold text-white">The Quick Brown Fox Jumps Over The Lazy Dog</p>
                                                </div>
                                            </div>

                                            {/* Content Font */}
                                            <div className="space-y-4">
                                                <label className="text-sm text-[#a1a1aa]">Content Font (Body/Text)</label>
                                                <div className="flex flex-col gap-3">
                                                    <input
                                                        type="text"
                                                        value={contentFontName}
                                                        onChange={(e) => setContentFontName(e.target.value)}
                                                        placeholder="Enter font name..."
                                                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <label className="flex-1 cursor-pointer group">
                                                            <input type="file" accept=".ttf,.otf" className="hidden" onChange={(e) => handleFontUpload(e, 'content')} />
                                                            <div className="flex items-center justify-center gap-2 bg-[#050505] border border-white/10 border-dashed rounded-xl px-4 py-3 text-[#71717a] group-hover:text-white group-hover:border-[#ff982b]/50 transition-all">
                                                                <Upload className="w-4 h-4" />
                                                                <span className="text-sm truncate">{contentFontFile || 'Upload .ttf / .otf'}</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-[#050505] rounded-xl border border-white/5">
                                                    <p className="text-base text-[#d4d4d8] leading-relaxed">
                                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {
                            view === 'business_identity' && (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <Briefcase className="w-16 h-16 text-[#ff982b] mx-auto mb-4 opacity-50" />
                                        <h2 className="text-2xl font-bold text-white mb-2">Business Identity</h2>
                                        <p className="text-[#a1a1aa]">Mission, Vision, and Values configuration coming soon.</p>
                                    </div>
                                </div>
                            )
                        }

                        {
                            view === 'industry_identity' && (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <Globe className="w-16 h-16 text-[#ff982b] mx-auto mb-4 opacity-50" />
                                        <h2 className="text-2xl font-bold text-white mb-2">Industry Identity</h2>
                                        <p className="text-[#a1a1aa]">Market positioning tools coming soon.</p>
                                    </div>
                                </div>
                            )
                        }

                        {
                            view === 'crm' && (
                                <div className="flex flex-col h-full pt-16">
                                    {/* Pipeline Toolbar */}
                                    {(userRole === 'master_admin' || userRole === 'admin') && (
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setIsEditMode(!isEditMode)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black hover:shadow-[0_0_15px_rgba(255,152,43,0.3)] hover:scale-105 transition-all"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    {isEditMode ? 'Done Editing' : 'Edit Board'}
                                                </button>
                                                <button
                                                    onClick={() => setIsManageUsersOpen(true)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black hover:shadow-[0_0_15px_rgba(255,152,43,0.3)] hover:scale-105 transition-all"
                                                >
                                                    <Users className="w-3.5 h-3.5" />
                                                    Manage Users
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-6 h-full min-w-fit overflow-x-auto pb-2">
                                        {columns.map((col, idx) => (
                                            <Column
                                                key={col.id}
                                                title={col.title}
                                                id={col.id}
                                                tasks={col.tasks}
                                                onAdd={handleAddTask}
                                                onDelete={handleDeleteTask}
                                                onMove={handleMoveTask}
                                                onEdit={(t) => openEditModal(t, col.id)}
                                                userRole={userRole}
                                                currentUserKey={userKey}
                                                onDeleteColumn={handleDeleteColumn}
                                                isEditMode={isEditMode}
                                                onMoveColumn={handleMoveColumn}
                                                index={idx}
                                                totalColumns={columns.length}
                                            />
                                        ))}
                                        {isEditMode && (userRole === 'master_admin' || userRole === 'admin') && (
                                            <button
                                                onClick={handleAddColumn}
                                                className="min-w-[320px] h-16 rounded-3xl border border-dashed border-white/10 flex items-center justify-center text-[#71717a] hover:text-white hover:border-white/30 transition-all bg-[#0a0a0a]/50 hover:bg-[#0a0a0a]"
                                            >
                                                <Plus className="w-5 h-5 mr-2" />
                                                Add Column
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                        {
                            view === 'masterclass' && (
                                <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full p-4">
                                        {[
                                            { id: 'hooks', title: 'Winning Hooks Library', icon: Lightbulb, desc: 'Curated collection of high-performing hooks.' },
                                            { id: 'dm_setter', title: 'AI DM Setter', icon: MessageSquare, desc: 'Automated DM outreach and appointment setting.' },
                                            { id: 'stories', title: 'Story Sequences', icon: Image, desc: 'Templates for engaging story arcs.' },
                                            { id: 'profile', title: 'Profile Optimization', icon: User, desc: 'Audit and improve your bio and highlights.' }
                                        ].map((item) => (
                                            <motion.div
                                                key={item.id}
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() => setView('sheet_wip')}
                                                className="bg-[#121212] border border-white/10 p-8 rounded-2xl cursor-pointer transition-all group min-h-[200px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                            >
                                                <div>
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                        <item.icon className="w-6 h-6 text-black group-hover:text-[#ff982b] transition-colors" />
                                                    </div>
                                                    <h3 className="text-xl font-medium text-white mb-2 group-hover:text-black transition-colors">{item.title}</h3>
                                                    <p className="text-[#a1a1aa] text-sm leading-relaxed group-hover:text-black/70 transition-colors">{item.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }


                        {
                            view === 'short_form_scribe' && (
                                <ShortFormScribe />
                            )
                        }

                        {view === 'messaging' && <ChatConfiguration />}
                        {view === 'note_taker' && <NoteTaker />}

                        {
                            (view === 'sheet_wip') && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                        <FileText className="w-10 h-10 text-[#52525b]" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Work in Progress</h2>
                                    <p className="text-[#a1a1aa] max-w-md">This tool is currently under development. Check back soon for updates.</p>
                                    <button
                                        onClick={() => setView('menu')}
                                        className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                                    >
                                        Return to Menu
                                    </button>
                                </div>
                            )
                        }

                        {
                            (view === 'course' || view === 'masterclass' || view === 'youtube_masterclass') && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                        {view === 'course' && <GraduationCap className="w-10 h-10 text-[#52525b]" />}
                                        {(view === 'masterclass' || view === 'youtube_masterclass') && <Video className="w-10 h-10 text-[#52525b]" />}
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Work in Progress</h2>
                                    <p className="text-[#a1a1aa] max-w-md">This tool is currently under development. Check back soon for updates.</p>
                                    <button
                                        onClick={() => setView('vault')}
                                        className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                                    >
                                        Return to Vault
                                    </button>
                                </div>
                            )
                        }

                        {
                            view === 'packaging' && (
                                <div className="flex-1 h-full overflow-hidden">
                                    <PackagingTool />
                                </div>
                            )
                        }

                        {
                            view === 'outlier_scout' && (
                                <div className="flex-1 h-full overflow-y-auto">
                                    <OutlierScout />
                                </div>
                            )
                        }

                        {view === 'vsl' && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                <div className="w-full max-w-xl space-y-6">
                                    <div className="text-center">
                                        <Video className="w-16 h-16 text-[#ff982b] mx-auto mb-4" />
                                        <h2 className="text-3xl font-bold text-white mb-2">Video Sales Letter</h2>
                                        <p className="text-[#a1a1aa]">Enter your VSL YouTube link below.</p>
                                    </div>
                                    <div className="bg-[#121212] border border-white/10 p-6 rounded-2xl">
                                        <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2 block">YouTube URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                                            />
                                            <button className="px-6 py-3 bg-[#ff982b] text-black font-bold rounded-xl hover:bg-[#ffc972] transition-colors">
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'title_generator' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                    <Type className="w-10 h-10 text-[#52525b]" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Title Generator</h2>
                                <p className="text-[#a1a1aa] max-w-md">AI-powered viral title generation coming soon.</p>
                                <button
                                    onClick={() => setView('long_form')}
                                    className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                                >
                                    Return to Long Form
                                </button>
                            </div>
                        )}

                        {view === 'landing_page' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                    <LayoutTemplate className="w-10 h-10 text-[#52525b]" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Landing Page Builder</h2>
                                <p className="text-[#a1a1aa] max-w-md">High-converting landing page templates coming soon.</p>
                                <button
                                    onClick={() => setView('funnel')}
                                    className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                                >
                                    Return to Funnel
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main >

            {/* Edit Modal */}
            < AnimatePresence >
                {isModalOpen && editingTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#121212] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <form onSubmit={handleSaveTask}>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-light text-[#fcf0d4]">Edit Task</h3>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#52525b] hover:text-white">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider">Title</label>
                                        <input
                                            type="text"
                                            value={editingTask.title}
                                            onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider">Description</label>
                                        <textarea
                                            value={editingTask.description}
                                            onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors min-h-[150px] resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> Priority
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.keys(PRIORITY_TAGS).map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => setEditingTask({ ...editingTask, priority: editingTask.priority === tag ? null : tag })}
                                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${editingTask.priority === tag ? PRIORITY_TAGS[tag] + ' ring-1 ring-white/20' : 'bg-[#0a0a0a] border-white/10 text-[#71717a] hover:border-white/30'}`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Due Date
                                            </label>
                                            <input
                                                type="date"
                                                value={editingTask.dueDate || ''}
                                                onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#ff982b] transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Assignee Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider flex items-center gap-1">
                                            <Users className="w-3 h-3" /> Assignee
                                        </label>
                                        <select
                                            value={editingTask.metadata?.assignee || ''}
                                            onChange={e => setEditingTask({ ...editingTask, metadata: { ...editingTask.metadata, assignee: e.target.value } })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#ff982b] transition-colors appearance-none"
                                        >
                                            <option value="">Unassigned</option>
                                            {availableUsers.map(user => (
                                                <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#1a1a1a] border-t border-white/5 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="group relative px-6 py-2 flex items-center justify-center gap-2 text-sm font-semibold text-[#050505] bg-gradient-to-r from-[#ff982b] to-[#ffc972] rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,152,43,0.4)] hover:saturate-[1.15] cursor-pointer"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <Save className="w-4 h-4" strokeWidth={2.5} />
                                            Save Changes
                                        </span>
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Manage Users Modal */}
                {
                    isManageUsersOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setIsManageUsersOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                    <h3 className="text-lg font-light text-white">Manage Team</h3>
                                    <button onClick={() => setIsManageUsersOpen(false)} className="text-[#52525b] hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Add User Form */}
                                    <form onSubmit={handleAddUser} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={newUser.name}
                                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff982b] outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Role"
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#ff982b] outline-none"
                                        />
                                        <button type="submit" className="bg-white/10 hover:bg-[#ff982b] hover:text-black text-white p-2 rounded-lg transition-colors">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </form>

                                    {/* User List */}
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {availableUsers.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center text-black font-bold text-xs">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                                        <div className="text-xs text-[#71717a]">{user.role}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-[#71717a] hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {availableUsers.length === 0 && (
                                            <p className="text-center text-[#52525b] text-sm py-4">No team members yet.</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Site Settings Modal */}
            <AnimatePresence>
                {isSiteSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setIsSiteSettingsOpen(false);
                            setIsSiteSettingsUnlocked(false);
                            setSiteSettingsPassword('');
                            setSiteSettingsError(false);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-[#ff982b]" />
                                    Site Settings
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsSiteSettingsOpen(false);
                                        setIsSiteSettingsUnlocked(false);
                                        setSiteSettingsPassword('');
                                        setSiteSettingsError(false);
                                    }}
                                    className="text-[#52525b] hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {!isSiteSettingsUnlocked ? (
                                <div className="space-y-4">
                                    <p className="text-[#a1a1aa] text-sm">
                                        Enter the admin password to access site settings.
                                    </p>
                                    <div>
                                        <input
                                            type="password"
                                            value={siteSettingsPassword}
                                            onChange={(e) => setSiteSettingsPassword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (siteSettingsPassword === settingsPassword) {
                                                        setIsSiteSettingsUnlocked(true);
                                                        setSiteSettingsError(false);
                                                    } else {
                                                        setSiteSettingsError(true);
                                                        setTimeout(() => setSiteSettingsError(false), 2000);
                                                    }
                                                }
                                            }}
                                            placeholder="Enter admin password..."
                                            className={`w-full bg-[#0a0a0a] border ${siteSettingsError ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors`}
                                        />
                                        {siteSettingsError && (
                                            <p className="text-red-500 text-xs mt-2">Incorrect password</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (siteSettingsPassword === settingsPassword) {
                                                setIsSiteSettingsUnlocked(true);
                                                setSiteSettingsError(false);
                                            } else {
                                                setSiteSettingsError(true);
                                                setTimeout(() => setSiteSettingsError(false), 2000);
                                            }
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:opacity-90 transition-all"
                                    >
                                        Unlock Settings
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-white font-medium">Landing Page</h3>
                                                <p className="text-[#71717a] text-sm mt-1">
                                                    {siteSettings?.landingEnabled
                                                        ? 'Visitors see the marketing landing page'
                                                        : 'Visitors are redirected to the portal'
                                                    }
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newSettings = {
                                                        ...siteSettings,
                                                        landingEnabled: !siteSettings?.landingEnabled
                                                    };
                                                    if (onUpdateSiteSettings) {
                                                        onUpdateSiteSettings(newSettings);
                                                    }
                                                }}
                                                className={`relative w-14 h-8 rounded-full transition-colors ${siteSettings?.landingEnabled ? 'bg-[#ff982b]' : 'bg-[#3a3a3c]'}`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${siteSettings?.landingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-xs text-[#52525b] text-center">
                                            {siteSettings?.landingEnabled
                                                ? '✓ Landing page is enabled for all visitors'
                                                : '✓ All visitors are redirected to the portal'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default InternalPortal;
