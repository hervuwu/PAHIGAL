import { useState, useEffect, useRef } from "react";
import "./App.css";

const URL = "ws://localhost:8080";

type Message = {
  text: string;
  sender: "me" | "them";
  timestamp: string;
  author?: string; // Add this field
};

function App() {
  // 1. STATE DECLARATIONS
  const [username, setUsername] = useState(
    localStorage.getItem("pahigal_user") || "",
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("pahigal_theme") !== "light",
  );

  const [partnerName, setPartnerName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("UNSET");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [visibleTimestampIndex, setVisibleTimestampIndex] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null); // State for Toast

  const ws = useRef<WebSocket | null>(null);
  const [isServerWaking, setIsServerWaking] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 2. PERSISTENCE & UTILITY EFFECTS
  useEffect(() => {
    localStorage.setItem("pahigal_user", username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem("pahigal_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Auto-hide Toast Error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // 3. LOGIC FUNCTIONS
  const sendTypingStatus = (typing: boolean) => {
    if (ws.current?.readyState === WebSocket.OPEN && status === "CHATTING") {
      ws.current.send(
        JSON.stringify({ type: "typing", isTyping: typing, username }),
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (status === "CHATTING") {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    }
  };

  const disconnectChat = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setStatus("DISCONNECTED");
    setIsPartnerTyping(false);
  };

  const findNewMatch = () => {
    setMessages([]);
    setPartnerName("");
    setInput("");
    setIsPartnerTyping(false);
    setStatus("WAITING");
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setStatus("WAITING");
  };

  const handleMessageSubmit = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (status !== "CHATTING") return;

    if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const time = formatTime();
      sendTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // 1. Send to server (includes your username)
      ws.current.send(
        JSON.stringify({ text: input, username, timestamp: time }),
      );

      // 2. Update local UI (includes your username as 'author')
      setMessages((prev: Message[]) => [
        ...prev,
        { text: input, sender: "me", timestamp: time, author: username },
      ]);
      setInput("");
    }
  };
  // 4. WEB SOCKET EFFECT
  useEffect(() => {
    if (status === "WAITING" && !ws.current) {
     const socket = new WebSocket(URL);
    ws.current = socket;

    // Timer: If no 'open' event in 2 seconds, the server is likely sleeping
    const wakeTimer = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        setIsServerWaking(true);
      }
    }, 2000);

    socket.onopen = () => {
      clearTimeout(wakeTimer);
      setIsServerWaking(false);
      socket.send(JSON.stringify({ username }));
    };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "error") {
          setError(message.message);
          setStatus("UNSET");
          return;
        }

        if (message.type === "typing") {
          setIsPartnerTyping(message.isTyping);
          return;
        }

        if (message.type === "waiting") {
          setStatus("WAITING");
        } else if (message.type === "match") {
          setStatus("CHATTING");
          const name = message.partnerName || "Stranger";
          setPartnerName(name);
          setMessages([
            {
              text: `You've been matched with ${name}!`,
              sender: "them",
              timestamp: formatTime(),
              author: "System", // Added author
            },
          ]);
        } else if (message.type === "partner-disconnected") {
          const name = partnerName || message.partnerName || "Stranger";
          setMessages((prev: Message[]) => [
            ...prev,
            {
              text: `${name} has disconnected.`,
              sender: "them",
              timestamp: formatTime(),
              author: "System", // Added author
            },
          ]);
          disconnectChat();
        } else if (message.text) {
          setIsPartnerTyping(false);
          setMessages((prev: Message[]) => [
            ...prev,
            {
              text: message.text,
              sender: "them",
              timestamp: message.timestamp || formatTime(),
              author: message.username || partnerName,
            },
          ]);
        }
      };

      socket.onclose = () => {
        setIsPartnerTyping(false);
        if (status !== "WAITING" && status !== "DISCONNECTED")
          setStatus("UNSET");
        ws.current = null;
      };
    }
  }, [status, username, partnerName]);

  // 5. UI RENDER
  return (
    <div className={`app-wrapper ${darkMode ? "dark-mode" : ""}`}>
      {/* Toast Notification Container */}
      {error && (
        <div className="toast-notification">
          <span className="toast-icon">⚠️</span>
          {error}
        </div>
      )}

      <button
        className="theme-toggle top-right"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>

      {status === "UNSET" && (
        <div className="username-container">
          <header className="brand-stack">
            <h1 className="brand-logo">PAHIGAL</h1>
            <p className="brand-tagline">
              "Talk"🤤🤤 with a random stranger. 😉🍑🍑
            </p>
          </header>
          <form onSubmit={handleUsernameSubmit} className="username-input">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Who are you?"
              maxLength={15}
              required
            />
            <button type="submit" className="primary-btn">
              Find Someone
            </button>
          </form>
        </div>
      )}

      {status === "WAITING" && (
  <div className="username-container">
    {/* Use isServerWaking to change the heading */}
    <h1 className="brand-logo" style={{ fontSize: "2rem" }}>
      {isServerWaking ? "Waking up Server..." : "Searching..."}
    </h1>
    
    {/* Inform the user about Render's cold start */}
    <p>
      {isServerWaking 
        ? "Render's free tier is spinning up. This can take up to 50 seconds. Thanks for your patience! 🍑" 
        : "Looking for a Pahigal for you."}
    </p>

    <button
      className="new-match-btn"
      onClick={() => {
        ws.current?.close();
        setStatus("UNSET");
        setIsServerWaking(false); // Reset waking status on cancel
      }}
    >
      Cancel
    </button>
  </div>
)}

      {(status === "CHATTING" || status === "DISCONNECTED") && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="header-left">
              {/* 1. Brand Logo */}
              <span
                className="brand-name-small"
                onClick={() => {
                  ws.current?.close();
                  setStatus("UNSET");
                }}
              >
                PAHIGAL
              </span>

              {/* 2. Integrated Theme Toggle (Added here) */}
              <button
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* 3. Status Text */}
              <span className="partner-status">
                {status === "CHATTING"
                  ? `Chatting with ${partnerName}`
                  : "Disconnected"}
              </span>
            </div>

            <div className="header-right">
              <button
                className="new-match-btn"
                onClick={status === "CHATTING" ? disconnectChat : findNewMatch}
              >
                {status === "CHATTING" ? "Disconnect" : "New Match"}
              </button>
            </div>
          </div>

          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-wrapper ${msg.sender === "me" ? "sent-wrapper" : "received-wrapper"}`}
                onClick={() =>
                  setVisibleTimestampIndex(
                    visibleTimestampIndex === index ? null : index,
                  )
                }
              >
                {/* 1. THE CHAT BUBBLE */}
                <div
                  className={`message ${msg.sender === "me" ? "sent" : "received"}`}
                >
                  {msg.text}
                </div>

                {/* 2. THE GHOST DATA (Username and Time) */}
                <span
                  className={`timestamp ${visibleTimestampIndex === index ? "show" : ""}`}
                >
                  {/* Only show the author tag if it's a real user, not the System */}
                  {msg.author && msg.author !== "System" && (
                    <>
                      <strong className="author-tag">{msg.author}</strong>
                      {" • "}
                    </>
                  )}
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isPartnerTyping && (
              <div className="message received typing-bubble">
                Stranger is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleMessageSubmit}
            className={`message-input ${status === "DISCONNECTED" ? "disabled-input" : ""}`}
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={status === "DISCONNECTED"}
              placeholder={
                status === "CHATTING" ? "Type a message..." : "Chat ended."
              }
              autoFocus
            />
            <button
              type="submit"
              disabled={status === "DISCONNECTED" || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
