import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import PackagingTool from './packaging_tool/PackagingTool';
import ChatConfiguration from './ChatConfiguration';
import NoteTaker from './NoteTaker';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Save, LogOut, LayoutGrid, Package, MessageSquare, ArrowLeft, ArrowRight, Database, GraduationCap, Calendar, Tag, Clock, Users, Settings, Edit3, CheckSquare, Rocket, FileText, Video, User, Fingerprint, Briefcase, Globe, Search, Lightbulb, Mic, Image, TrendingUp, BookOpen } from 'lucide-react';

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
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </button>
            </div>
        </div>
    );
};

const InternalPortal = ({ onExit }) => {
    const [columns, setColumns] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState('menu');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [clientKey, setClientKey] = useState('');
    const [userKey, setUserKey] = useState('');
    const [userRole, setUserRole] = useState('employee');
    const [error, setError] = useState(false);

    // New State for ClickUp-like features
    const [isEditMode, setIsEditMode] = useState(false);
    const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', role: '' });

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
                    { id: 'To Do', title: 'To Do', tasks: [] },
                    { id: 'In Progress', title: 'In Progress', tasks: [] },
                    { id: 'Done', title: 'Done', tasks: [] }
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
        const newTask = {
            title: 'New Task',
            description: '',
            status: columnId,
            created_at: new Date().toISOString(),
            created_by: userKey,
            metadata: { subtasks: [], assignee: '' }
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
                    metadata: createdTask.metadata || { subtasks: [], assignee: '' }
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

    const handleLogout = () => {
        setIsAuthenticated(false);
        setClientKey('');
        setUserKey('');
        setUserRole('employee');
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
                        <span onClick={onExit} className="cursor-pointer hover:text-[#ff982b] transition-colors">Synoxus</span> <span className="text-[#52525b] font-light">/ {isAuthenticated ? (view === 'menu' ? 'Portal' : view === 'crm' ? 'CRM' : view === 'packaging' ? 'Thumbnail Generator' : view === 'messaging' ? 'Chat Configuration' : view === 'note_taker' ? 'Note Taker' : view === 'vault' ? 'Growth Vault' : view === 'course' ? 'Course' : view === 'onboarding' ? 'Onboarding' : view === 'brand_sheets' ? 'Brand Sheets' : view === 'masterclass' ? 'Masterclass' : 'Sheet') : 'Login'}</span>
                        {isAuthenticated && <span className="ml-2 text-[10px] font-bold uppercase bg-white/10 px-2 py-0.5 rounded text-[#71717a]">{userRole.replace('_', ' ')}</span>}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181108]">
                        <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></div>
                        <span className="text-xs text-[#fcf0d4] font-medium">System Online</span>
                    </div>
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
                            if (view.startsWith('brand_sheets_') && view !== 'brand_sheets') {
                                setView('brand_sheets');
                            } else {
                                setView('menu');
                            }
                        }}
                        className="absolute top-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_20px_rgba(255,152,43,0.3)] hover:scale-110 transition-transform cursor-pointer group"
                    >
                        <ArrowLeft className="w-6 h-6 text-[#050505]" strokeWidth={2.5} />
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
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Start here. Complete your initial setup and orientation.</p>
                                        </div>

                                    </motion.div>

                                    {/* 2. Brand Sheets */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('brand_sheets')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <FileText className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Brand Sheets</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Define your identity. ICP, Brand Voice, and Competitor Analysis.</p>
                                        </div>

                                    </motion.div>

                                    {/* 3. CRM */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('crm')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <LayoutGrid className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">CRM</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Manage tasks, track progress, and organize your workflow.</p>
                                        </div>

                                    </motion.div>

                                    {/* 4. Messaging Tool */}
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
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Configure chat personas, instructions, and intervals.</p>
                                        </div>

                                    </motion.div>

                                    {/* 5. Note Taker */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('note_taker')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <BookOpen className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Note Taker</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Synthesize YouTube videos into comprehensive notes.</p>
                                        </div>

                                    </motion.div>

                                    {/* 6. Packaging Tool */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('packaging')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <Image className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Thumbnail Generator</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Advanced thumbnail generator and analyzer.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>

                                    </motion.div>

                                    {/* 7. Instagram Masterclass */}
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

                                    {/* 8. Growth Vault */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('vault')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <TrendingUp className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Growth Vault</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Hiring SOPs, Hooks, Training & Systems.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>

                                    </motion.div>

                                    {/* 9. Appointment Setting Course */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setView('course')}
                                        className="bg-[#121212] border border-white/10 p-10 rounded-2xl cursor-pointer transition-all group min-h-[320px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                    >
                                        <div>
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                <GraduationCap className="w-7 h-7 text-black group-hover:text-[#ff982b] transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-black transition-colors">Appointment Setting Course</h3>
                                            <p className="text-[#a1a1aa] text-base leading-relaxed group-hover:text-black/70 transition-colors">Comprehensive training for setting appointments.</p>
                                        </div>
                                        <span className="text-[#ff982b] text-xs font-bold uppercase bg-[#ff982b]/10 px-3 py-1 rounded w-fit group-hover:bg-black/10 group-hover:text-black transition-colors relative z-10">Work in Progress</span>

                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {view === 'brand_sheets' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl w-full p-4">
                                    {[
                                        { id: 'icp', title: 'Dream Follower / ICP', icon: User, desc: 'Define your ideal customer profile.' },
                                        { id: 'brand_id', title: 'Brand Identity', icon: Fingerprint, desc: 'Core values, mission, and vision.' },
                                        { id: 'biz_id', title: 'Business Identity', icon: Briefcase, desc: 'Operational structure and goals.' },
                                        { id: 'industry_id', title: 'Industry Identity', icon: Globe, desc: 'Market positioning and trends.' },
                                        { id: 'competitor', title: 'Competitor Research', icon: Search, desc: 'Analyze market competition.' },
                                        { id: 'opportunity', title: 'New Opportunity', icon: Lightbulb, desc: 'Identify growth areas.' },
                                        { id: 'voice', title: 'Client Voice', icon: Mic, desc: 'Tone, style, and communication.' }
                                    ].map((sheet) => (
                                        <motion.div
                                            key={sheet.id}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setView('sheet_wip')}
                                            className="bg-[#121212] border border-white/10 p-8 rounded-2xl cursor-pointer transition-all group min-h-[250px] flex flex-col justify-between hover:bg-gradient-to-br hover:from-[#ff982b] hover:to-[#ffc972] hover:border-transparent hover:shadow-[0_0_30px_rgba(255,152,43,0.4)]"
                                        >
                                            <div>
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,152,43,0.3)] group-hover:bg-none group-hover:bg-black group-hover:shadow-none transition-all">
                                                    <sheet.icon className="w-6 h-6 text-black group-hover:text-[#ff982b] transition-colors" />
                                                </div>
                                                <h3 className="text-xl font-medium text-white mb-2 group-hover:text-black transition-colors">{sheet.title}</h3>
                                                <p className="text-[#a1a1aa] text-sm leading-relaxed group-hover:text-black/70 transition-colors">{sheet.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {view === 'crm' && (
                            <div className="flex flex-col h-full pt-16">
                                {/* CRM Toolbar */}
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
                        )}
                        {view === 'masterclass' && (
                            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full p-4">
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
                        )}


                        {view === 'messaging' && <ChatConfiguration />}
                        {view === 'note_taker' && <NoteTaker />}

                        {(view === 'vault' || view === 'course' || view === 'onboarding' || view === 'sheet_wip') && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                                    {view === 'messaging' && <MessageSquare className="w-10 h-10 text-[#52525b]" />}
                                    {view === 'vault' && <Database className="w-10 h-10 text-[#52525b]" />}
                                    {view === 'course' && <GraduationCap className="w-10 h-10 text-[#52525b]" />}
                                    {view === 'onboarding' && <Rocket className="w-10 h-10 text-[#52525b]" />}
                                    {view === 'sheet_wip' && <FileText className="w-10 h-10 text-[#52525b]" />}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Work in Progress</h2>
                                <p className="text-[#a1a1aa] max-w-md">This tool is currently under development. Check back soon for updates.</p>
                                <button
                                    onClick={() => setView(view === 'sheet_wip' ? 'brand_sheets' : 'menu')}
                                    className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                                >
                                    Return to {view === 'sheet_wip' ? 'Sheets' : 'Menu'}
                                </button>
                            </div>
                        )}

                        {view === 'packaging' && (
                            <div className="flex-1 h-full overflow-hidden">
                                <PackagingTool />
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
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
                {isManageUsersOpen && (
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
                )}
            </AnimatePresence>
        </div>
    );
};

export default InternalPortal;
