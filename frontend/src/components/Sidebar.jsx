import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, X, History } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Sidebar = ({ isOpen, onClose, sessions, currentSessionId, onSelectSession, onClearHistory, dbUri }) => {
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
                        "fixed inset-y-0 right-0 z-50 w-80 bg-gradient-to-b from-gray-950/95 to-black/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col lg:relative lg:translate-x-0 lg:shadow-none lg:z-0 lg:h-full",
                        !isOpen && "hidden lg:flex"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 backdrop-blur-sm">
                        <div className="flex items-center gap-2 font-semibold text-gray-100">
                            <History className="w-4 h-4" />
                            <span>History</span>
                        </div>
                        <button onClick={onClose} className="lg:hidden"><X className="w-5 h-5 text-gray-500" /></button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-2">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        onSelectSession(session.id);
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                    className={clsx(
                                        "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all text-sm group",
                                        currentSessionId === session.id
                                            ? "bg-gray-800/60 text-gray-100 ring-1 ring-white/10 backdrop-blur-sm"
                                            : "text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 backdrop-blur-sm"
                                    )}
                                >
                                    <MessageSquare className={clsx(
                                        "w-4 h-4 shrink-0",
                                        currentSessionId === session.id ? "text-gray-200" : "text-gray-500 group-hover:text-gray-300"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{session.title || "Untitled Chat"}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(session.created_at).toLocaleDateString()}</p>
                                    </div>
                                </button>
                            ))}
                            {sessions.length === 0 && (
                                <div className="text-center text-gray-400 text-sm py-12 flex flex-col items-center gap-2">
                                    <MessageSquare className="w-8 h-8 opacity-20" />
                                    <p>No chat history yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer (Clear History) */}
                    {sessions.length > 0 && (
                        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-sm">
                            <button
                                onClick={onClearHistory}
                                className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 p-2.5 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-red-900/20 hover:border-red-800/40"
                            >
                                <Trash2 className="w-4 h-4" /> Clear History
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
