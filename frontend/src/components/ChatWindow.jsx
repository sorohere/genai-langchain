import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Sparkles, Loader2 } from 'lucide-react';

const ChatWindow = ({ messages, isLoading }) => {
    const bottomRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 opacity-0 animate-fade-in-up">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-indigo-500/20">
                            <Sparkles className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">SQL AI Assistant</h2>
                        <p className="text-gray-400 max-w-md text-lg">
                            Ask questions about your data in plain English. I'll write the SQL and show you the results.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <MessageItem key={idx} role={msg.role} content={msg.content} sqlQuery={msg.sqlQuery} results={msg.results} />
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-gray-800/50 rounded-2xl px-6 py-4 flex items-center gap-3 border border-white/5">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="text-sm text-gray-400">Analyzing data...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatWindow;
