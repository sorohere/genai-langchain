import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

const InputArea = ({ input, setInput, onSend, isLoading }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend(e);
        }
    };

    return (
        <div className="p-4 bg-gray-950/80 backdrop-blur-md border-t border-white/5">
            <div className="max-w-3xl mx-auto">
                <div className="relative bg-gray-900/50 border border-white/10 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all duration-300">
                    <form onSubmit={onSend} className="flex items-end gap-2 p-3">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about your data..."
                            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-[200px] min-h-[24px] py-2 px-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-base leading-relaxed"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95 mb-0.5"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-3 space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InputArea;
