import { useState, useEffect, useRef } from "react";
import "./App.css";

import type { Message, AppStatus } from "./types";
import EntranceScreen from "./components/EntranceScreen";
import WaitingScreen from "./components/WaitingScreen";
import ChatScreen from "./components/ChatScreen";

const URL = import.meta.env.PROD ? "wss://pahigal-backshot.onrender.com" : "ws://localhost:8080";

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem("pahigal_user") || "");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("pahigal_theme") !== "light");
  const [partnerName, setPartnerName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AppStatus>("UNSET");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [countdown, setCountdown] = useState(50);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const isConnecting = useRef(false);
  const statusRef = useRef(status);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { localStorage.setItem("pahigal_user", username); }, [username]);
  useEffect(() => { localStorage.setItem("pahigal_theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => {
    if (error) { const timer = setTimeout(() => setError(null), 4000); return () => clearTimeout(timer); }
  }, [error]);

  const formatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Aesthetics Setup
  useEffect(() => {
    const aestheticPalettes = [
      { name: "Royal", grad: "-45deg, #2b0359, #540d9c, #8b1cd1, #2b0359", sent: "#8b1cd1" },
      { name: "Sapphire", grad: "-45deg, #091353, #16248c, #2a41d6, #091353", sent: "#2a41d6" },
      { name: "Emerald", grad: "-45deg, #023618, #07612f, #10944b, #023618", sent: "#10944b" },
      { name: "Ruby", grad: "-45deg, #4a0016, #800026, #c21543, #4a0016", sent: "#c21543" }
    ];
    const patterns = [
      { css: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", size: "24px 24px" },
      { css: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", size: "16px 16px" },
      { css: "none", size: "auto" },
    ];
    const randPal = aestheticPalettes[Math.floor(Math.random() * aestheticPalettes.length)];
    const randPat = patterns[Math.floor(Math.random() * patterns.length)];

    document.documentElement.style.setProperty("--primary-gradient", `linear-gradient(${randPal.grad})`);
    document.documentElement.style.setProperty("--sent-color", randPal.sent);
    document.documentElement.style.setProperty("--bg-pattern", randPat.css);
    document.documentElement.style.setProperty("--bg-pattern-size", randPat.size);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isServerWaking) {
      setCountdown(50);
      interval = setInterval(() => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [isServerWaking]);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN || isConnecting.current) return;
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
      if (message.type === "error") { setError(message.message); setStatus("UNSET"); return; }
      if (message.type === "typing") { setIsPartnerTyping(message.isTyping); return; }
      if (message.type === "reaction") {
        setMessages((prev) => prev.map((msg) => msg.id === message.messageId ? { ...msg, reactions: [...(msg.reactions || []), message.emoji] } : msg));
        return;
      }
      if (message.type === "waiting") { setStatus("WAITING"); } 
      else if (message.type === "match") {
        setStatus("CHATTING");
        setPartnerName(message.partnerName || "Stranger");
        setMessages([{ id: "sys-1", text: `You've been matched with ${message.partnerName || "Stranger"}!`, sender: "them", timestamp: formatTime(), author: "System" }]);
      } else if (message.type === "partner-disconnected") {
        setMessages((prev) => [...prev, { id: `sys-${Date.now()}`, text: `${partnerName} has disconnected.`, sender: "them", timestamp: formatTime(), author: "System" }]);
        disconnectChat();
      } else if (message.text) {
        setIsPartnerTyping(false);
        setMessages((prev) => [...prev, { id: message.id || Date.now().toString(), text: message.text, sender: "them", timestamp: message.timestamp || formatTime(), author: message.username || partnerName, replyToText: message.replyToText, reactions: message.reactions || [] }]);
      }
    };

    socket.onclose = () => {
      ws.current = null; isConnecting.current = false; setIsPartnerTyping(false);
      if (statusRef.current !== "UNSET" && statusRef.current !== "DISCONNECTED" && reconnectAttempts < 5) {
        const delay = Math.min(1000 * (reconnectAttempts + 1), 5000);
        setTimeout(() => { setReconnectAttempts((prev) => prev + 1); connect(); }, delay);
      } else if (reconnectAttempts >= 5) { setStatus("UNSET"); setError("Failed to connect."); }
    };
    socket.onerror = () => { isConnecting.current = false; };
  };

  useEffect(() => {
    if (status === "WAITING") connect();
    return () => { if (status === "UNSET" && ws.current) ws.current.close(); };
  }, [status]);

  const sendTypingStatus = (typing: boolean) => {
    if (ws.current?.readyState === WebSocket.OPEN && status === "CHATTING") {
      ws.current.send(JSON.stringify({ type: "typing", isTyping: typing, username }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (status === "CHATTING") {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 2000);
    }
  };

  const disconnectChat = () => {
    statusRef.current = "DISCONNECTED"; setStatus("DISCONNECTED"); setIsPartnerTyping(false); setReplyingTo(null);
    if (ws.current) { ws.current.close(); ws.current = null; }
  };

  const handleMessageSubmit = (e?: any) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (status !== "CHATTING" || !input.trim() || ws.current?.readyState !== WebSocket.OPEN) return;
    
    const time = formatTime();
    const newId = Date.now().toString() + Math.random().toString(36).substring(7);
    
    sendTypingStatus(false);
    ws.current.send(JSON.stringify({ id: newId, text: input, username, timestamp: time, replyToText: replyingTo?.text }));
    setMessages((prev) => [...prev, { id: newId, text: input, sender: "me", timestamp: time, author: username, replyToText: replyingTo?.text, reactions: [] }]);
    setInput("");
    setReplyingTo(null);
  };

  const sendReaction = (msgId: string, emoji: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: "reaction", messageId: msgId, emoji }));
    setMessages((prev) => prev.map((msg) => msg.id === msgId ? { ...msg, reactions: [...(msg.reactions || []), emoji] } : msg));
  };

  return (
    <div className={`app-wrapper ${darkMode ? "dark-mode" : ""}`}>
      {error && <div className="toast-notification"><span className="toast-icon">⚠️</span>{error}</div>}
      
      {(status === "UNSET" || status === "WAITING") && (
        <button className="theme-toggle top-right" onClick={() => setDarkMode(!darkMode)}>{darkMode ? "☀️" : "🌙"}</button>
      )}

      {status === "UNSET" && (
        <EntranceScreen 
          username={username} setUsername={setUsername} status={status} 
          onSubmit={(e) => { e.preventDefault(); if (username.trim()) { setReconnectAttempts(0); setStatus("WAITING"); } }} 
        />
      )}

      {status === "WAITING" && (
        <WaitingScreen 
          isServerWaking={isServerWaking} countdown={countdown} 
          onCancel={() => { setStatus("UNSET"); if (ws.current) ws.current.close(); }} 
        />
      )}

      {(status === "CHATTING" || status === "DISCONNECTED") && (
        <ChatScreen 
          status={status} messages={messages} partnerName={partnerName} isPartnerTyping={isPartnerTyping}
          input={input} setInput={setInput} handleInputChange={handleInputChange} handleMessageSubmit={handleMessageSubmit}
          disconnectChat={disconnectChat}
          findNewMatch={() => { setMessages([]); setPartnerName(""); setInput(""); setIsPartnerTyping(false); setReconnectAttempts(0); setReplyingTo(null); setStatus("WAITING"); }}
          darkMode={darkMode} setDarkMode={setDarkMode} sendReaction={sendReaction}
          replyingTo={replyingTo} setReplyingTo={setReplyingTo}
        />
      )}
    </div>
  );
}