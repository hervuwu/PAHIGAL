import { useState, useEffect, useRef } from 'react';
import './App.css';

const URL = 'ws://localhost:8080';

type Message = {
  text: string;
  sender: 'me' | 'them';
};

function App() {
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('UNSET'); // UNSET, WAITING, CHATTING
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (status === 'WAITING' && !ws.current) {
      ws.current = new WebSocket(URL);

      ws.current.onopen = () => {
        console.log('connected');
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'waiting') {
          setStatus('WAITING');
        } else if (message.type === 'match') {
          setStatus('CHATTING');
          setMessages((prev) => [...prev, { text: "You've been matched!", sender: 'them' }]);
        } else if (message.type === 'partner-disconnected') {
            setMessages((prev) => [...prev, { text: "Your partner has disconnected.", sender: 'them' }]);
            setStatus('WAITING');
        } else {
            setMessages((prev) => [...prev, { text: message.text, sender: 'them' }]);
        }
      };

      ws.current.onclose = () => {
        console.log('disconnected');
        setStatus('UNSET');
        ws.current = null;
      };
    }
  }, [status]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStatus('WAITING');
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && ws.current) {
      ws.current.send(JSON.stringify({ text: input, username }));
      setMessages((prev) => [...prev, { text: input, sender: 'me' }]);
      setInput('');
    }
  };

  if (status === 'UNSET') {
    return (
      <div className="username-container">
        <h1>Enter your name</h1>
        <form onSubmit={handleUsernameSubmit} className="username-input">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
          />
          <button type="submit">Find a match</button>
        </form>
      </div>
    );
  }

  if (status === 'WAITING') {
    return (
      <div className="username-container">
        <h1>Waiting for a match...</h1>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleMessageSubmit} className="message-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
