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
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
                <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] focus-within:ring-2 focus-within:ring-gray-700/50 focus-within:border-white/30 transition-all duration-300 backdrop-blur-xl">
                    <form onSubmit={onSend} className="flex items-end gap-2 p-3">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about your data..."
                            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-[200px] min-h-[24px] py-2 px-2 text-gray-100 placeholder-gray-500 text-base leading-relaxed"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-gray-800/90 hover:bg-gray-700/90 text-gray-100 rounded-xl disabled:opacity-50 disabled:hover:bg-gray-800/90 transition-all shadow-sm hover:shadow-md active:scale-95 mb-0.5 border border-white/10 backdrop-blur-sm"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-500 font-medium">
                        Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InputArea;
