import React from 'react';
import { Database, Plus, Moon, Sun, Menu, BarChart2, MessageSquare } from 'lucide-react';

const Header = ({ toggleTheme, isDark, onNewChat, toggleSidebar, mode, setMode }) => {
    return (
        <header className={`sticky top-0 z-30 h-14 border-b backdrop-blur-xl flex items-center justify-between px-4 md:px-6 transition-all duration-300 ${isDark ? 'border-white/10 bg-gray-900/40' : 'border-gray-400/40 bg-gray-100/40'}`}>
            <div className="flex items-center gap-2.5">
                <Database className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} />
                <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    n3nq
                </h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <button
                    onClick={() => setMode(mode === 'chat' ? 'eda' : 'chat')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow border active:scale-95 backdrop-blur-sm mr-2 ${isDark
                        ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-100 border-white/10 hover:border-white/20'
                        : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-900 border-gray-400/30 hover:border-gray-400/50'
                        }`}
                    title={mode === 'chat' ? "Switch to Data Analysis" : "Switch to SQL Chat"}
                >
                    {mode === 'chat' ? <BarChart2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    <span className="hidden sm:inline">{mode === 'chat' ? "Data Analysis" : "SQL Chat"}</span>
                </button>

                <button
                    onClick={onNewChat}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow border active:scale-95 backdrop-blur-sm ${isDark ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-100 border-white/10 hover:border-white/20' : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-900 border-gray-400/30 hover:border-gray-400/50'}`}
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </button>

                <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-400/30'}`}></div>

                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors backdrop-blur-sm ${isDark ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900'}`}
                    title="Toggle Theme"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
};

export default Header;
