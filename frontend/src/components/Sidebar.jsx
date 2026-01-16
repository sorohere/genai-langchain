import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, X, History, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Sidebar = ({ isOpen, onClose, sessions, currentSessionId, onSelectSession, onClearHistory, dbUri, isDark }) => {
    const [activeTab, setActiveTab] = useState('history'); // 'history' | 'schema'
    const [schema, setSchema] = useState(null);
    const [loadingSchema, setLoadingSchema] = useState(false);
    const [expandedTables, setExpandedTables] = useState({});

    // Fetch schema when tab is switched to schema
    useEffect(() => {
        if (activeTab === 'schema' && !schema) {
            fetchSchema();
        }
    }, [activeTab]);

    const fetchSchema = async () => {
        setLoadingSchema(true);
        try {
            const response = await axios.get('http://localhost:8000/api/schema', {
                params: { db_uri: dbUri || undefined }
            });
            setSchema(response.data);
        } catch (error) {
            console.error("Failed to fetch schema", error);
        } finally {
            setLoadingSchema(false);
        }
    };

    const toggleTable = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    return (
        <AnimatePresence>
            {(isOpen || window.innerWidth >= 1024) && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={clsx(
                        "fixed inset-y-0 right-0 z-50 w-80 backdrop-blur-2xl border-l shadow-2xl flex flex-col lg:relative lg:translate-x-0 lg:shadow-none lg:z-0 lg:h-full",
                        isDark ? 'bg-gradient-to-b from-gray-950/95 to-black/95 border-white/10' : 'bg-gradient-to-b from-gray-50/95 to-white/95 border-gray-400/40',
                        !isOpen && "hidden lg:flex"
                    )}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-4 border-b backdrop-blur-sm ${isDark ? 'border-white/5 bg-black/40' : 'border-gray-400/30 bg-gray-100/40'}`}>
                        <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            <History className="w-4 h-4" />
                            <span>History</span>
                        </div>
                        <button onClick={onClose} className="lg:hidden"><X className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`} /></button>
                    </div>

                    {/* Content Area - Wrapper for content and floating button */}
                    <div className="flex-1 relative flex flex-col min-h-0">
                        {/* Scrollable Sessions */}
                        <div className="flex-1 overflow-y-auto p-4 pb-14 custom-scrollbar min-h-0">
                            <div className="space-y-2">
                                {sessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => {
                                            onSelectSession(session);
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className={clsx(
                                            "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm group",
                                            currentSessionId === session.id
                                                ? isDark
                                                    ? "bg-gray-800/60 text-gray-100 ring-1 ring-white/10 backdrop-blur-sm"
                                                    : "bg-gray-200/60 text-gray-900 ring-1 ring-gray-400/30 backdrop-blur-sm"
                                                : isDark
                                                    ? "text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 backdrop-blur-sm"
                                                    : "text-gray-600 hover:bg-gray-100/60 hover:text-gray-900 backdrop-blur-sm"
                                        )}
                                    >
                                        {session.session_type === 'eda' ? (
                                            <BarChart2 className={clsx(
                                                "w-4 h-4 shrink-0",
                                                currentSessionId === session.id
                                                    ? isDark ? "text-purple-400" : "text-purple-600"
                                                    : isDark ? "text-gray-500 group-hover:text-purple-400" : "text-gray-500 group-hover:text-purple-600"
                                            )} />
                                        ) : (
                                            <MessageSquare className={clsx(
                                                "w-4 h-4 shrink-0",
                                                currentSessionId === session.id
                                                    ? isDark ? "text-gray-200" : "text-gray-700"
                                                    : isDark ? "text-gray-500 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-700"
                                            )} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-medium">{session.title || "Untitled Chat"}</p>
                                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(session.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </button>
                                ))}
                                {sessions.length === 0 && (
                                    <div className={`text-center text-sm py-12 flex flex-col items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <MessageSquare className="w-8 h-8 opacity-20" />
                                        <p>No chat history yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floating Clear History Button - Content scrolls behind it */}
                        {sessions.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 pb-4 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <button
                                        onClick={onClearHistory}
                                        className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur-xl border shadow-lg ${isDark ? 'bg-black/95 text-red-400 hover:bg-red-900/80 hover:text-red-300 border-red-900/30 hover:border-red-800/50' : 'bg-gray-100/95 text-red-600 hover:bg-red-50/95 hover:text-red-700 border-red-300/40 hover:border-red-400/60'}`}
                                    >
                                        <Trash2 className="w-4 h-4" /> Clear History
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
