import React from 'react';
import { Database, Plus, Moon, Sun, Menu } from 'lucide-react';

const Header = ({ toggleTheme, isDark, onNewChat, toggleSidebar }) => {
    return (
        <header className="sticky top-0 z-30 h-14 border-b border-white/10 bg-gray-900/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 transition-all duration-300">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm ring-1 ring-white/10">
                    <Database className="w-5 h-5 text-gray-300" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white">
                    n3nq
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700/80 text-gray-100 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow border border-white/10 hover:border-white/20 active:scale-95 backdrop-blur-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1"></div>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 rounded-lg transition-colors backdrop-blur-sm"
                    title="Toggle Theme"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleSidebar}
                    className="p-2 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 rounded-lg transition-colors lg:hidden backdrop-blur-sm"
                    title="Toggle Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Desktop Sidebar Toggle (Optional, maybe always show sidebar on desktop?) 
                    The user said "Right sidebar (collapsible)". 
                    Let's add a toggle for desktop too if they want to hide it.
                */}
                <button
                    onClick={toggleSidebar}
                    className="hidden lg:block p-2 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 rounded-lg transition-colors backdrop-blur-sm"
                    title="Toggle Sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
