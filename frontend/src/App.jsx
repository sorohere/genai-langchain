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
    <div className={`min-h-screen h-screen w-screen font-sans overflow-hidden flex items-center justify-center relative pt-[200px] ${isDark ? 'bg-black text-gray-100' : 'bg-white text-gray-900'}`}>

      {/* Background Subtle Blur Effects */}
      <div className={`absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[150px] pointer-events-none ${isDark ? 'bg-gray-900/30' : 'bg-gray-200/40'}`} />
      <div className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[150px] pointer-events-none ${isDark ? 'bg-gray-800/20' : 'bg-gray-300/30'}`} />

      {/* Boxed Layout Container - Glass Morphism with Elevation */}
      <div className={`w-full h-[75vh] max-w-[1400px] max-h-[700px] backdrop-blur-3xl rounded-3xl overflow-hidden flex relative z-10 ${isDark ? 'bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-950/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/10 ring-1 ring-white/10' : 'bg-gradient-to-br from-gray-50/95 via-white/90 to-gray-100/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] border border-gray-300/30 ring-1 ring-gray-200/30'}`}>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative z-0">
          <Header
            toggleTheme={toggleTheme}
            isDark={isDark}
            onNewChat={handleNewChat}
            toggleSidebar={toggleSidebar}
          />

          <main className={`flex-1 flex flex-col relative overflow-hidden border-t ${isDark ? 'bg-gradient-to-b from-gray-950/30 to-black/40 border-white/5' : 'bg-gradient-to-b from-gray-100/30 to-white/40 border-gray-300/20'}`}>
            <ChatWindow messages={messages} isLoading={isLoading} isDark={isDark} />

            <InputArea
              input={input}
              setInput={setInput}
              onSend={handleSendMessage}
              isLoading={isLoading}
              isDark={isDark}
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
          isDark={isDark}
        />
      </div>

    </div>
  );
}

export default App;
