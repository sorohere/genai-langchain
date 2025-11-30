import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const MessageItem = ({ role, content, sqlQuery, results }) => {
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
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
            )}

            <div className={clsx(
                "flex flex-col max-w-[85%] md:max-w-[75%]",
                isUser ? "items-end" : "items-start"
            )}>
                {/* Message Bubble / Card */}
                <div className={clsx(
                    "relative px-5 py-3.5 shadow-sm",
                    isUser
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-sm w-full"
                )}>

                    {/* SQL Query Block (Only for Assistant) */}
                    {!isUser && sqlQuery && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-900">
                            <div className="px-3 py-1.5 flex justify-between items-center border-b border-gray-800 bg-gray-950/50">
                                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                    <Terminal className="w-3 h-3" /> SQL
                                </div>
                                <button
                                    onClick={() => handleCopy(sqlQuery)}
                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                    title="Copy SQL"
                                >
                                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
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
                        <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                        <tr>
                                            {Object.keys(results[0]).map((key) => (
                                                <th key={key} className="px-4 py-2 whitespace-nowrap">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {results.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                                                {Object.values(row).map((val, i) => (
                                                    <td key={i} className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 font-mono text-xs">
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
                        isUser ? "prose-invert text-white" : "dark:prose-invert text-gray-800 dark:text-gray-200"
                    )}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>

                {/* Timestamp (Optional/Mock) */}
                <span className="text-[10px] text-gray-400 mt-1 px-1">
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
