import { useState, useEffect, useRef } from "react";
import { Github } from "lucide-react";
import "./App.css";

const URL = "wss://pahigal-backshot.onrender.com";
// const URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

type Message = {
  text: string;
  sender: "me" | "them";
  timestamp: string;
  author?: string;
};

type AppStatus = "UNSET" | "WAITING" | "CHATTING" | "DISCONNECTED";

function App() {
  const [username, setUsername] = useState(
    localStorage.getItem("pahigal_user") || "",
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("pahigal_theme") !== "light",
  );
  const [partnerName, setPartnerName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AppStatus>("UNSET");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [visibleTimestampIndex, setVisibleTimestampIndex] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const ws = useRef<WebSocket | null>(null);
  const isConnecting = useRef(false);
  const statusRef = useRef(status);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    localStorage.setItem("pahigal_user", username);
  }, [username]);
  useEffect(() => {
    localStorage.setItem("pahigal_theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    const aestheticPalettes = [
      {
        name: "Royal Amethyst",
        grad: "-45deg, #2b0359, #540d9c, #8b1cd1, #2b0359",
        sent: "#8b1cd1",
      },
      {
        name: "Sapphire Abyss",
        grad: "-45deg, #091353, #16248c, #2a41d6, #091353",
        sent: "#2a41d6",
      },
      {
        name: "Emerald Canopy",
        grad: "-45deg, #023618, #07612f, #10944b, #023618",
        sent: "#10944b",
      },
      {
        name: "Ruby Flare",
        grad: "-45deg, #4a0016, #800026, #c21543, #4a0016",
        sent: "#c21543",
      },
      {
        name: "Oceanic Bioluminescence",
        grad: "-45deg, #04103a, #0b346e, #1377a5, #04103a",
        sent: "#1377a5",
      },
      {
        name: "Ember Glow",
        grad: "-45deg, #3d0c02, #781d04, #c43c08, #3d0c02",
        sent: "#c43c08",
      },
    ];

    const patterns = [
      {
        css: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        size: "24px 24px",
      },
      {
        css: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
        size: "16px 16px",
      },
      {
        css: "repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 6px)",
        size: "100% 100%",
      },
      {
        css: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 80%, transparent 80%, transparent), radial-gradient(circle, transparent 20%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 80%, transparent 80%, transparent) 25px 25px, linear-gradient(rgba(255,255,255,0.02) 2px, transparent 2px) 0 -1px, linear-gradient(90deg, rgba(255,255,255,0.02) 2px, transparent 2px) -1px 0",
        size: "50px 50px",
      },
      { css: "none", size: "auto" },
    ];

    const randomPalette =
      aestheticPalettes[Math.floor(Math.random() * aestheticPalettes.length)];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];

    document.documentElement.style.setProperty(
      "--primary-gradient",
      `linear-gradient(${randomPalette.grad})`,
    );
    document.documentElement.style.setProperty(
      "--sent-color",
      randomPalette.sent,
    );
    document.documentElement.style.setProperty(
      "--bg-pattern",
      randomPattern.css,
    );
    document.documentElement.style.setProperty(
      "--bg-pattern-size",
      randomPattern.size,
    );
  }, []);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN || isConnecting.current)
      return;
    isConnecting.current = true;
    const socket = new WebSocket(URL);
    ws.current = socket;

    const wakeTimer = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) setIsServerWaking(true);
    }, 2000);

    socket.onopen = () => {
      isConnecting.current = false;
      clearTimeout(wakeTimer);
      setIsServerWaking(false);
      setReconnectAttempts(0);
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
            author: "System",
          },
        ]);
      } else if (message.type === "partner-disconnected") {
        setMessages((prev) => [
          ...prev,
          {
            text: `${partnerName} has disconnected.`,
            sender: "them",
            timestamp: formatTime(),
            author: "System",
          },
        ]);
        disconnectChat();
      } else if (message.text) {
        setIsPartnerTyping(false);
        setMessages((prev) => [
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
      ws.current = null;
      isConnecting.current = false;
      setIsPartnerTyping(false);

      if (
        statusRef.current !== "UNSET" &&
        statusRef.current !== "DISCONNECTED" &&
        reconnectAttempts < 5
      ) {
        const delay = Math.min(1000 * (reconnectAttempts + 1), 5000);
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      } else if (reconnectAttempts >= 5) {
        setStatus("UNSET");
        setError("Failed to connect to the server.");
      }
    };

    socket.onerror = () => {
      isConnecting.current = false;
    };
  };

  useEffect(() => {
    if (status === "WAITING") connect();
    return () => {
      if (status === "UNSET" && ws.current) {
        ws.current.close();
      }
    };
  }, [status]);

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
      typingTimeoutRef.current = setTimeout(
        () => sendTypingStatus(false),
        2000,
      );
    }
  };

  const disconnectChat = () => {
    statusRef.current = "DISCONNECTED";
    setStatus("DISCONNECTED");
    setIsPartnerTyping(false);
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  const findNewMatch = () => {
    if (status === "WAITING") return;
    setMessages([]);
    setPartnerName("");
    setInput("");
    setIsPartnerTyping(false);
    setReconnectAttempts(0);
    setStatus("WAITING");
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && status !== "WAITING") {
      setReconnectAttempts(0);
      setStatus("WAITING");
    }
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
      ws.current.send(
        JSON.stringify({ text: input, username, timestamp: time }),
      );
      setMessages((prev) => [
        ...prev,
        { text: input, sender: "me", timestamp: time, author: username },
      ]);
      setInput("");
    }
  };

  return (
    <div className={`app-wrapper ${darkMode ? "dark-mode" : ""}`}>
      {error && (
        <div className="toast-notification">
          <span className="toast-icon">⚠️</span>
          {error}
        </div>
      )}

      {reconnectAttempts > 0 && reconnectAttempts < 5 && (
        <div
          className="toast-notification"
          style={{ background: "var(--sent-color)" }}
        >
          <span className="toast-icon">🔄</span> Reconnecting... (
          {reconnectAttempts}/5)
        </div>
      )}

      {/* FIXED: Toggle button only shows when not in a chat screen */}
      {(status === "UNSET" || status === "WAITING") && (
        <button
          className="theme-toggle top-right"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      )}

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
            <button
              type="submit"
              className="primary-btn"
              disabled={status === "WAITING"}
            >
              Find Someone
            </button>
          </form>
          {/* Footer Repo Link */}
          <footer className="footer-link">
            <a
              href="https://github.com/hervuwu/PAHIGAL"
              target="_blank"
              rel="noreferrer"
              className="github-anchor"
            >
              <Github size={16} strokeWidth={2.5} />
              <span>GitHub</span>
            </a>
          </footer>
        </div>
      )}

      {status === "WAITING" && (
        <div className="username-container">
          <h1 className="brand-logo" style={{ fontSize: "2rem" }}>
            {isServerWaking ? "Waking up Server..." : "Searching..."}
          </h1>
          <p>
            {isServerWaking
              ? "Render's free tier is spinning up. This can take up to 50 seconds. Hang tight! 🍑"
              : "Looking for a Pahigal for you."}
          </p>
          <button
            className="new-match-btn"
            onClick={() => {
              statusRef.current = "UNSET";
              setStatus("UNSET");
              setIsServerWaking(false);
              if (ws.current) {
                ws.current.close();
                ws.current = null;
              }
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
              <span
                className="brand-name-small"
                onClick={() => {
                  statusRef.current = "UNSET";
                  setStatus("UNSET");
                  if (ws.current) {
                    ws.current.close();
                    ws.current = null;
                  }
                }}
              >
                PAHIGAL
              </span>
              <button
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
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
                <div
                  className={`message ${msg.sender === "me" ? "sent" : "received"}`}
                >
                  {msg.text}
                </div>
                <span
                  className={`timestamp ${visibleTimestampIndex === index ? "show" : ""}`}
                >
                  {msg.author && msg.author !== "System" && (
                    <>
                      <strong className="author-tag">{msg.author}</strong>{" "}
                      •{" "}
                    </>
                  )}
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isPartnerTyping && (
              <div className="message received typing-bubble">
                {partnerName} is typing...
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