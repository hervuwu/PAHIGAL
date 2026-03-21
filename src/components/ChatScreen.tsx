import { useState, useEffect, useRef } from "react";
import { Reply, X } from "lucide-react";
import MessageItem from "./MessageItem";
import type { Message, AppStatus } from "../types";

type Props = {
  status: AppStatus;
  messages: Message[];
  partnerName: string;
  isPartnerTyping: boolean;
  input: string;
  setInput: (val: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e?: any) => void;
  disconnectChat: () => void;
  findNewMatch: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  sendReaction: (msgId: string, emoji: string) => void;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
};

export default function ChatScreen({
  status, messages, partnerName, isPartnerTyping, input, handleInputChange,
  handleMessageSubmit, disconnectChat, findNewMatch, darkMode, setDarkMode,
  sendReaction, replyingTo, setReplyingTo
}: Props) {
  
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [visibleTimestampIndex, setVisibleTimestampIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Close reaction menu if clicked outside
  useEffect(() => {
    const handleClickOutside = () => setActiveReactionId(null);
    if (activeReactionId) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeReactionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <span className="brand-name-small" onClick={disconnectChat}>PAHIGAL</span>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>{darkMode ? "☀️" : "🌙"}</button>
          <span className="partner-status">{status === "CHATTING" ? `Chatting with ${partnerName}` : "Disconnected"}</span>
        </div>
        <div className="header-right">
          <button className="new-match-btn" onClick={status === "CHATTING" ? disconnectChat : findNewMatch}>
            {status === "CHATTING" ? "Disconnect" : "New Match"}
          </button>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, index) => (
          <MessageItem 
            key={msg.id || index}
            msg={msg}
            index={index}
            visibleTimestampIndex={visibleTimestampIndex}
            setVisibleTimestampIndex={setVisibleTimestampIndex}
            activeReactionId={activeReactionId}
            setActiveReactionId={setActiveReactionId}
            setReplyingTo={setReplyingTo}
            sendReaction={sendReaction}
          />
        ))}
        {isPartnerTyping && <div className="message received typing-bubble">{partnerName} is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
         <div className="active-reply-banner">
            <div className="reply-info">
              <Reply size={16} />
              <span>Replying to {replyingTo.author || "Stranger"}: {replyingTo.text}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn"><X size={18} /></button>
         </div>
      )}

      <form onSubmit={handleMessageSubmit} className={`message-input ${status === "DISCONNECTED" ? "disabled-input" : ""}`}>
        <input 
          type="text" 
          value={input} 
          onChange={handleInputChange} 
          disabled={status === "DISCONNECTED"} 
          placeholder={status === "CHATTING" ? "Type a message..." : "Chat ended."} 
          autoFocus 
        />
        <button type="submit" disabled={status === "DISCONNECTED" || !input.trim()}>Send</button>
      </form>
    </div>
  );
}