import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, BarChart2, Code, Terminal, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import FileUpload from './FileUpload';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

const EdaWindow = ({ isDark, session, initialMessages = [], onSessionCreate }) => {
    console.log("EdaWindow received session:", session);
    const [fileData, setFileData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Sync messages from props
    useEffect(() => {
        if (session && initialMessages) {
            setMessages(initialMessages);
        } else if (!session) {
            setMessages([]);
        }
    }, [session, initialMessages]);

    // Sync fileData from session
    useEffect(() => {
        if (session && session.filename) {
            // Restore minimal fileData if not already set or if different
            if (!fileData || fileData.filename !== session.filename) {
                setFileData({
                    filename: session.filename,
                    original_filename: session.filename, // We might want to store original name separately in DB if needed
                    row_count: 'Unknown', // We don't have this in session meta yet
                    columns: []
                });
            }
        } else if (!session) {
            setFileData(null);
        }
    }, [session]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea on input change
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleUpload = async (file) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload_csv', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            setFileData(data);

            // Create a new session for this file
            try {
                const sessionRes = await fetch('http://localhost:8000/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `Analysis: ${data.original_filename}`,
                        session_type: 'eda',
                        filename: data.filename
                    })
                });
                const newSession = await sessionRes.json();

                if (onSessionCreate) {
                    onSessionCreate(newSession);
                }

                // Initial message
                const welcomeMsg = {
                    role: 'assistant',
                    content: `I've loaded **${data.original_filename}** successfully! \n\nIt has **${data.row_count} rows** and **${data.columns.length} columns**. \n\nYou can ask me to analyze this data, create visualizations, or perform statistical tests.`
                };

                // Add welcome message to DB (optional, but good for history)
                // Note: We don't have add_message endpoint exposed directly, but we could use /api/eda_chat with special flag or just rely on local state until user types?
                // Better: The user didn't type anything yet. Let's just set local state. 
                // Actual persistence will start when user sends a message.
                // OR: We can just let the Welcome message be ephemeral ? 
                // Let's keep it ephemeral locally for now.
                setMessages([welcomeMsg]);

            } catch (err) {
                console.error("Failed to create session", err);
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert(`Failed to upload file: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/eda_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    filename: fileData.filename,
                    session_id: session ? session.session_id : (session ? session.id : null), // Handle both id and session_id format
                    history: messages.filter(m => !m.type).map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            const aiMessage = {
                role: 'assistant',
                content: data.answer,
                code: data.code,
                stdout: data.stdout,
                plots: data.plots,
                error: data.error
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!fileData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-center mb-8">
                    <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Exploratory Data Analysis
                    </h2>
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Upload a CSV file to start analyzing your data with AI.
                    </p>
                </div>
                <FileUpload onUpload={handleUpload} isDark={isDark} isLoading={isLoading} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full relative">
            {/* Header with Close Button Only */}
            <div className={`flex-none p-4 border-b backdrop-blur-md z-10 flex justify-end ${isDark ? 'bg-gray-900/60 border-white/10' : 'bg-white/60 border-gray-200'}`}>
                <button
                    onClick={() => setFileData(null)}
                    className={`text-xs hover:underline flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}
                >
                    <X className="w-3 h-3" /> Close File
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                            ? isDark ? 'bg-blue-600' : 'bg-blue-500'
                            : isDark ? 'bg-purple-600' : 'bg-purple-500'
                            }`}>
                            {msg.role === 'user' ? <span className="text-xs text-white">U</span> : <BarChart2 className="w-4 h-4 text-white" />}
                        </div>

                        {/* Message Content */}
                        <div className={`flex flex-col max-w-[85%] gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* File Card (if message type is 'file') */}
                            {msg.type === 'file' ? (
                                <div className={`p-3 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'}`}>
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {msg.fileData.original_filename}
                                        </span>
                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {msg.fileData.row_count} rows • {msg.fileData.columns.length} columns
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Text Message */
                                <div className={`p-4 rounded-2xl prose prose-sm max-w-none dark:prose-invert ${msg.role === 'user'
                                    ? isDark ? 'bg-blue-600/20 text-blue-100' : 'bg-blue-50 text-blue-900'
                                    : isDark ? 'bg-gray-800/60 text-gray-100' : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                    }`}>
                                    <ReactMarkdown>
                                        {Array.isArray(msg.content) ? msg.content.join('') : String(msg.content || '')}
                                    </ReactMarkdown>
                                </div>
                            )}

                            {/* Code & Plots (Assistant only) */}
                            {msg.role === 'assistant' && (
                                <div className="w-full space-y-3">
                                    {/* Collapsible Analysis Details (Code & Output) */}
                                    {(msg.code || msg.stdout || msg.error) && (
                                        <details className={`group rounded-xl border overflow-hidden transition-all ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                            <summary className={`flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer select-none ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
                                                <Terminal className="w-3 h-3" />
                                                <span>View Analysis Details</span>
                                                <span className="ml-auto text-[10px] opacity-0 group-open:opacity-100 transition-opacity">
                                                    (Code & Output)
                                                </span>
                                            </summary>

                                            <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                                {/* Code Block */}
                                                {msg.code && (
                                                    <div className="relative">
                                                        <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-mono opacity-50 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Python</div>
                                                        <SyntaxHighlighter
                                                            language="python"
                                                            style={isDark ? vscDarkPlus : coy}
                                                            customStyle={{ margin: 0, padding: '1rem', fontSize: '0.75rem', background: 'transparent' }}
                                                        >
                                                            {msg.code}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                )}

                                                {/* Stdout/Error */}
                                                {(msg.stdout || msg.error) && (
                                                    <div className={`border-t p-3 font-mono text-xs whitespace-pre-wrap ${isDark ? 'border-white/10 text-gray-300 bg-black/20' : 'border-gray-200 text-gray-700 bg-white/50'}`}>
                                                        {msg.stdout}
                                                        {msg.error && <span className="text-red-400 block mt-2">{msg.error}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    )}

                                    {/* Compact Plot Cards */}
                                    {msg.plots && msg.plots.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {msg.plots.map((plot, i) => (
                                                <div key={i} className={`group relative flex items-center gap-3 p-2 pr-4 rounded-xl border transition-all hover:shadow-md ${isDark ? 'bg-gray-800/50 border-white/10 hover:bg-gray-800' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                                    {/* Thumbnail */}
                                                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                                        <img
                                                            src={`http://localhost:8000${plot}`}
                                                            alt="Plot Thumbnail"
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                        />
                                                    </div>

                                                    {/* Info & Action */}
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                            Generated Plot #{i + 1}
                                                        </span>
                                                        <a
                                                            href={`http://localhost:8000${plot}`}
                                                            download={`plot-${i}.png`}
                                                            className={`text-xs flex items-center gap-1 mt-1 hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                                                        >
                                                            <ImageIcon className="w-3 h-3" /> Download Image
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-purple-600' : 'bg-purple-500'}`}>
                            <BarChart2 className="w-4 h-4 text-white" />
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/60' : 'bg-white shadow-sm border border-gray-100'}`}>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Analyzing data...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    <div className={`relative border rounded-3xl focus-within:ring-2 transition-all duration-300 backdrop-blur-xl ${isDark ? 'bg-gradient-to-br from-gray-900/90 to-black/90 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] focus-within:ring-gray-700/50 focus-within:border-white/30' : 'bg-gradient-to-br from-white/90 to-gray-100/90 border-gray-400/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)] focus-within:ring-gray-500/40 focus-within:border-gray-500/60'}`}>
                        <form onSubmit={handleSend} className="flex items-end gap-2 p-3">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Ask a question about your data..."
                                className={`w-full bg-transparent border-none focus:ring-0 resize-none max-h-[200px] min-h-[24px] py-2 px-2 text-base leading-relaxed ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                                rows={1}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={`p-2 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 mb-0.5 border backdrop-blur-sm ${isDark ? 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-100 disabled:opacity-50 disabled:hover:bg-gray-800/90 border-white/10' : 'bg-gray-200/90 hover:bg-gray-300/90 text-gray-900 disabled:opacity-50 disabled:hover:bg-gray-200/90 border-gray-400/30'}`}
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                    <div className="text-center mt-2">
                        <p className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Enter to send • Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EdaWindow;
