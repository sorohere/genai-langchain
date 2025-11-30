import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Sparkles, Loader2 } from 'lucide-react';

const ChatWindow = ({ messages, isLoading, isDark }) => {
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
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ring-1 backdrop-blur-sm ${isDark ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 ring-white/10' : 'bg-gradient-to-br from-gray-200/40 to-gray-300/40 ring-gray-400/20'}`}>
                            <Sparkles className={`w-10 h-10 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                        </div>
                        <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>n3nq</h2>
                        <p className={`max-w-md text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Ask questions about your data in plain English. I'll write the SQL and show you the results.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <MessageItem key={idx} role={msg.role} content={msg.content} sqlQuery={msg.sqlQuery} results={msg.results} isDark={isDark} />
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className={`backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 border ${isDark ? 'bg-gray-900/60 border-white/10' : 'bg-gray-100/60 border-gray-300/30'}`}>
                            <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Analyzing data...</span>
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
