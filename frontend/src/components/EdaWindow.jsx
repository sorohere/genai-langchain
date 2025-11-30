import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, BarChart2, Code, Terminal, Image as ImageIcon, X } from 'lucide-react';
import FileUpload from './FileUpload';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

const EdaWindow = ({ isDark }) => {
    const [fileData, setFileData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleUpload = async (file) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload_csv', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setFileData(data);
            setMessages([{
                role: 'assistant',
                content: `I've loaded **${data.original_filename}** successfully! \n\nIt has **${data.row_count} rows** and **${data.columns.length} columns**. \n\nYou can ask me to analyze this data, create visualizations, or perform statistical tests.`
            }]);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

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
                    history: messages.map(m => ({ role: m.role, content: m.content }))
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
            {/* Data Preview Header */}
            <div className={`flex-none p-4 border-b backdrop-blur-md z-10 ${isDark ? 'bg-gray-900/60 border-white/10' : 'bg-white/60 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <FileText className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {fileData.original_filename}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            {fileData.row_count} rows
                        </span>
                    </div>
                    <button
                        onClick={() => setFileData(null)}
                        className={`text-xs hover:underline ${isDark ? 'text-red-400' : 'text-red-600'}`}
                    >
                        Close File
                    </button>
                </div>

                {/* Mini Table Preview */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className={`w-full text-xs text-left ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <thead className={`text-xs uppercase ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                            <tr>
                                {fileData.columns.slice(0, 8).map((col) => (
                                    <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">{col}</th>
                                ))}
                                {fileData.columns.length > 8 && <th className="px-3 py-2">...</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {fileData.preview.map((row, i) => (
                                <tr key={i} className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    {fileData.columns.slice(0, 8).map((col) => (
                                        <td key={`${i}-${col}`} className="px-3 py-1.5 whitespace-nowrap max-w-[150px] truncate">
                                            {String(row[col])}
                                        </td>
                                    ))}
                                    {fileData.columns.length > 8 && <td className="px-3 py-1.5">...</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                            <div className={`p-4 rounded-2xl prose prose-sm max-w-none dark:prose-invert ${msg.role === 'user'
                                ? isDark ? 'bg-blue-600/20 text-blue-100' : 'bg-blue-50 text-blue-900'
                                : isDark ? 'bg-gray-800/60 text-gray-100' : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                }`}>
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>

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
                    <div className={`relative border rounded-3xl focus-within:ring-2 transition-all duration-300 backdrop-blur-xl ${isDark ? 'bg-gray-900/90 border-white/20 shadow-lg focus-within:ring-blue-500/50' : 'bg-white/90 border-gray-300 shadow-lg focus-within:ring-blue-400/50'}`}>
                        <form onSubmit={handleSend} className="flex items-center gap-2 p-2 pl-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about your data..."
                                className={`flex-1 bg-transparent border-none focus:ring-0 text-sm ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={`p-2 rounded-full transition-all ${!input.trim() || isLoading
                                    ? isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                                    : isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EdaWindow;
