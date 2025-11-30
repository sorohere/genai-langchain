import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';

function App() {
  // Theme State
  const [isDark, setIsDark] = useState(true);

  // Sidebar State (Right Sidebar)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data States
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Settings
  const dbUri = ''; // Uses backend .env default

  // Initial Load
  useEffect(() => {
    // Force dark mode class on mount
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/sessions');
      setSessions(response.data.sessions);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    }
  };

  const fetchMessages = async (sessionId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/sessions/${sessionId}/messages`);
      const formattedMessages = response.data.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/sessions', {
        title: `New Chat ${new Date().toLocaleTimeString()}`
      });
      setSessions([response.data, ...sessions]);
      setCurrentSessionId(response.data.session_id);
      // On mobile, close sidebar after creating new chat
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    } catch (error) {
      console.error("Failed to create session", error);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to delete all chat history? This cannot be undone.")) return;

    try {
      await axios.delete('http://localhost:8000/api/sessions');
      setSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error("Failed to clear history", error);
      alert("Failed to clear history");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      try {
        const response = await axios.post('http://localhost:8000/api/sessions', {
          title: input.substring(0, 30) + "..."
        });
        setSessions([response.data, ...sessions]);
        activeSessionId = response.data.session_id;
        setCurrentSessionId(activeSessionId);
      } catch (error) {
        console.error("Failed to create session", error);
        return;
      }
    }

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: userMsg.content,
        chatId: String(activeSessionId)
      });

      const aiMsg = {
        role: 'assistant',
        content: response.data.answer,
        sqlQuery: response.data.sqlQuery,
        results: response.data.results
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300 items-center justify-center p-4 md:p-8 lg:p-12">

      {/* Boxed Layout Container */}
      <div className="w-full h-full max-w-[1400px] max-h-[900px] bg-white dark:bg-gray-950 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex relative border border-gray-200 dark:border-gray-800 ring-1 ring-black/5 dark:ring-white/10">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative z-0">
          <Header
            toggleTheme={toggleTheme}
            isDark={isDark}
            onNewChat={handleNewChat}
            toggleSidebar={toggleSidebar}
          />

          <main className="flex-1 flex flex-col relative overflow-hidden bg-white/50 dark:bg-gray-950/50">
            <ChatWindow messages={messages} isLoading={isLoading} />

            <InputArea
              input={input}
              setInput={setInput}
              onSend={handleSendMessage}
              isLoading={isLoading}
            />
          </main>
        </div>

        {/* Right Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onClearHistory={handleClearHistory}
          dbUri={dbUri}
        />
      </div>

    </div>
  );
}

export default App;
