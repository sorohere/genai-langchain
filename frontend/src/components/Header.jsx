import React from 'react';
import { Database, Plus, Moon, Sun, Menu } from 'lucide-react';

const Header = ({ toggleTheme, isDark, onNewChat, toggleSidebar }) => {
    return (
        <header className="sticky top-0 z-30 h-14 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 transition-all duration-300">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm">
                    <Database className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                    SQL AI Query Bot
                </h1>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Toggle Theme"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleSidebar}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
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
                    className="hidden lg:block p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Toggle Sidebar"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
