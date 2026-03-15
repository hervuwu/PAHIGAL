import { useState, useEffect, useRef } from 'react';
import './App.css';

const URL = 'ws://localhost:8080';

type Message = {
  text: string;
  sender: 'me' | 'them';
};

function App() {
  // 1. STATE DECLARATIONS
  const [username, setUsername] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('UNSET'); // UNSET, WAITING, CHATTING, DISCONNECTED
  const [darkMode, setDarkMode] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  
  const lastSend = useRef(0);

  // 2. LOGIC FUNCTIONS

  // NEW: Simply kills the connection but keeps you on the chat screen
  const disconnectChat = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setStatus('DISCONNECTED');
  };

  // Resets everything to find a new person
  const findNewMatch = () => {
    setMessages([]);
    setPartnerName('');
    setInput('');
    setStatus('WAITING');
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStatus('WAITING');
    }
  };

  const handleMessageSubmit = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Only allow sending if status is CHATTING
    if (status !== 'CHATTING') return;

    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      lastSend.current = Date.now();
      ws.current.send(JSON.stringify({ text: input, username }));
      setMessages((prev) => [...prev, { text: input, sender: 'me' }]);
      setInput('');
    }
  };

  // 3. EFFECTS
  useEffect(() => {
    if (status === 'WAITING' && !ws.current) {
      const socket = new WebSocket(URL);
      ws.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ username }));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'waiting') {
          setStatus('WAITING');
        } else if (message.type === 'match') {
          setStatus('CHATTING');
          const name = message.partnerName || 'Stranger';
          setPartnerName(name);
          setMessages([{ text: `You've been matched with ${name}!`, sender: 'them' }]);
        } else if (message.type === 'partner-disconnected') {
          setMessages((prev) => [...prev, { text: `${partnerName || 'Stranger'} has disconnected.`, sender: 'them' }]);
          disconnectChat(); // Swap to disconnected state when partner leaves
        } else {
          setMessages((prev) => [...prev, { text: message.text, sender: 'them' }]);
        }
      };

      socket.onclose = () => {
        // If the server closes the connection and we aren't intentionally waiting/disconnected
        if (status !== 'WAITING' && status !== 'DISCONNECTED') {
          setStatus('UNSET');
        }
        ws.current = null;
      };
    }
  }, [status, username, partnerName]);

  // 4. UI RETURNS

  if (status === 'UNSET') {
    return (
      <div className={`app-wrapper ${darkMode ? 'dark-mode' : ''}`}>
        <button className="theme-toggle top-right" onClick={() => setDarkMode(!darkMode)}>
          <span className="toggle-icon">{darkMode ? '☀️' : '🌙'}</span>
          <span className="toggle-text">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="username-container">
          <header className="brand-stack">
            <h1 className="brand-logo">PAHIGAL</h1>
            <p className="brand-tagline">"Talk"🤤🤤 with a random stranger. 😉🍑🍑</p>
          </header>
          <form onSubmit={handleUsernameSubmit} className="username-input">
            <div className="input-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Who are you?"
                maxLength={15}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="primary-btn">Find Someone</button>
          </form>
        </div>
      </div>
    );
  }

  if (status === 'WAITING') {
    return (
      <div className={`app-wrapper ${!darkMode ? 'light-mode' : ''}`}>
        <button className="theme-toggle top-right" onClick={() => setDarkMode(!darkMode)}>
          <span className="toggle-icon">{darkMode ? '☀️' : '🌙'}</span>
          <span className="toggle-text">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="username-container">
          <h1 className="brand-logo" style={{ fontSize: '2rem' }}>Searching...</h1>
          <p>Looking for a Pahigal for you.</p>
          <button 
            type="button" 
            className="new-match-btn" 
            onClick={() => { ws.current?.close(); setStatus('UNSET'); }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // SCREEN: CHATTING & DISCONNECTED
  return (
    <div className={`app-wrapper ${darkMode ? 'dark-mode' : ''}`}>
      <div className="chat-container">
        
       <div className="chat-header">
  <div className="header-left">
    <button type="button" className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? '☀️' : '🌙'}
    </button>
    <div className="brand-header">
      <div className="brand-wrapper">
        <span 
  className="brand-name-small" 
  onClick={() => {
    // 1. Properly close the connection before leaving
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    // 2. Reset the app state to the login screen
    setStatus('UNSET');
    // 3. Clear data from the previous session
    setMessages([]);
    setPartnerName('');
  }}
>
  PAHIGAL
</span>
        {/* Added a spacer/separator for the gap you requested */}
        <span className="brand-spacer"></span> 
      </div>
      <span className="partner-status">
        {status === 'CHATTING' ? `Chatting with ${partnerName}` : 'Disconnected'}
      </span>
    </div>
  </div>

  <div className="header-right"> 
    {status === 'CHATTING' ? (
      <button 
        type="button" 
        className="new-match-btn disconnect-btn" 
        onClick={disconnectChat}
      >
        Disconnect
      </button>
    ) : (
      <button 
        type="button" 
        className="new-match-btn" 
        onClick={findNewMatch}
      >
        New Match
      </button>
    )}
  </div>
</div>

        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        
        <form 
          onSubmit={handleMessageSubmit} 
          className={`message-input ${status === 'DISCONNECTED' ? 'disabled-input' : ''}`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status === 'DISCONNECTED'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                handleMessageSubmit(e);
              }
            }}
            placeholder={status === 'CHATTING' ? "Type a message..." : "Chat ended."}
            autoFocus 
          />
          <button type="submit" disabled={status === 'DISCONNECTED'}>Send</button>
        </form>

      </div>
    </div>
  );
}

export default App;