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
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/10 backdrop-blur-sm">
                            <Sparkles className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">n3nq</h2>
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
                        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 border border-white/10">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-400">Analyzing data...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                {/* Spacer to allow scrolling above floating input */}
                <div className="h-20" aria-hidden="true"></div>
            </div>
        </div>
    );
};

export default ChatWindow;
