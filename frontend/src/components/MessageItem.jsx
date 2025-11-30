import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const MessageItem = ({ role, content, sqlQuery, results, isDark }) => {
    const isUser = role === 'user';
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx(
                "flex gap-4 w-full",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {/* AI Avatar (Left) */}
            {!isUser && (
                <div className={`w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center shrink-0 mt-1 ring-1 ${isDark ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 ring-white/10' : 'bg-gradient-to-br from-gray-200/60 to-gray-300/60 ring-gray-400/20'}`}>
                    <Bot className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                </div>
            )}

            <div className={clsx(
                "flex flex-col max-w-[85%] md:max-w-[75%]",
                isUser ? "items-end" : "items-start"
            )}>
                {/* Message Bubble / Card */}
                <div className={clsx(
                    "relative px-5 py-3.5 shadow-sm backdrop-blur-sm",
                    isUser
                        ? isDark
                            ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100 rounded-2xl rounded-tr-sm border border-white/10"
                            : "bg-gradient-to-br from-gray-200/90 to-gray-300/90 text-gray-900 rounded-2xl rounded-tr-sm border border-gray-400/30"
                        : isDark
                            ? "bg-gradient-to-br from-gray-950/80 to-black/80 border border-white/5 rounded-2xl rounded-tl-sm w-full"
                            : "bg-gradient-to-br from-gray-50/80 to-gray-100/80 border border-gray-300/20 rounded-2xl rounded-tl-sm w-full"
                )}>

                    {/* SQL Query Block (Only for Assistant) */}
                    {!isUser && sqlQuery && (
                        <div className={`mb-4 rounded-lg overflow-hidden border backdrop-blur-sm ${isDark ? 'border-white/10 bg-black/60' : 'border-gray-300/30 bg-gray-100/60'}`}>
                            <div className={`px-3 py-1.5 flex justify-between items-center border-b ${isDark ? 'border-white/10 bg-gray-950/50' : 'border-gray-300/30 bg-gray-200/50'}`}>
                                <div className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <Terminal className="w-3 h-3" /> SQL
                                </div>
                                <button
                                    onClick={() => handleCopy(sqlQuery)}
                                    className={`transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                                    title="Copy SQL"
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                            <SyntaxHighlighter
                                language="sql"
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.85rem' }}
                                wrapLongLines={true}
                            >
                                {sqlQuery}
                            </SyntaxHighlighter>
                        </div>
                    )}

                    {/* Results Table (Only for Assistant) */}
                    {!isUser && results && results.length > 0 && (
                        <div className={`mb-4 overflow-hidden rounded-lg border backdrop-blur-sm ${isDark ? 'border-white/10 bg-black/40' : 'border-gray-300/30 bg-gray-50/40'}`}>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className={`text-xs uppercase font-semibold backdrop-blur-sm ${isDark ? 'bg-gray-900/60 text-gray-400' : 'bg-gray-200/60 text-gray-700'}`}>
                                        <tr>
                                            {Object.keys(results[0]).map((key) => (
                                                <th key={key} className="px-4 py-2 whitespace-nowrap">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-gray-300/20'}>
                                        {results.map((row, idx) => (
                                            <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-gray-900/40' : 'hover:bg-gray-200/40'}`}>
                                                {Object.values(row).map((val, i) => (
                                                    <td key={i} className={`px-4 py-2 whitespace-nowrap font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Markdown Answer */}
                    <div className={clsx(
                        "prose prose-sm max-w-none leading-relaxed",
                        isUser
                            ? isDark ? "prose-invert text-gray-100" : "text-gray-900"
                            : isDark ? "prose-invert text-gray-200" : "text-gray-800"
                    )}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>

                {/* Timestamp (Optional/Mock) */}
                <span className={`text-[10px] mt-1 px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* User Avatar (Right) - Optional, usually standard chat apps don't show user avatar next to bubble if it's right aligned, but let's keep it minimal or remove it. 
                The prompt said "User messages: Right-aligned bubble... AI messages: Left-aligned in a card: Small 'AI' avatar/icon." 
                It didn't explicitly ask for User avatar. I'll remove User avatar to be cleaner like iMessage/WhatsApp/ChatGPT.
            */}
        </motion.div>
    );
};

export default MessageItem;
