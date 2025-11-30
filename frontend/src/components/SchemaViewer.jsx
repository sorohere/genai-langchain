import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, ChevronRight, ChevronDown, Database, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const SchemaViewer = ({ isOpen, onClose, dbUri }) => {
    const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedTables, setExpandedTables] = useState({});

    useEffect(() => {
        if (isOpen && !schema) {
            fetchSchema();
        }
    }, [isOpen]);

    const fetchSchema = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/schema', {
                params: { db_uri: dbUri || undefined }
            });
            setSchema(response.data);
        } catch (error) {
            console.error("Failed to fetch schema", error);
        } finally {
            setLoading(false);
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
            {isOpen && (
                <motion.div
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    exit={{ x: 300 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-y-0 right-0 z-40 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col"
                >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Database className="w-4 h-4" /> Database Schema
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        ) : schema ? (
                            <div className="space-y-2">
                                {schema.tables.map((table) => (
                                    <div key={table.name} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleTable(table.name)}
                                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                                                <Table className="w-4 h-4 text-indigo-500" />
                                                {table.name}
                                            </div>
                                            {expandedTables[table.name] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>

                                        {expandedTables[table.name] && (
                                            <div className="bg-white dark:bg-gray-900 p-2 space-y-1">
                                                {table.columns.map((col) => (
                                                    <div key={col.name} className="flex justify-between text-xs px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                                        <span className="text-gray-600 dark:text-gray-400 font-mono">{col.name}</span>
                                                        <span className="text-gray-400 dark:text-gray-500">{col.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 text-sm">Failed to load schema.</p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SchemaViewer;
