import { useRef } from "react";
import { Smile, Reply } from "lucide-react";
import type { Message } from "../types";

const EMOJIS = ["🤤", "🍑", "🔥", "😂", "❤️", "👀"];

type Props = {
  msg: Message;
  index: number;
  visibleTimestampIndex: number | null;
  setVisibleTimestampIndex: (index: number | null) => void;
  activeReactionId: string | null;
  setActiveReactionId: (id: string | null) => void;
  setReplyingTo: (msg: Message) => void;
  sendReaction: (msgId: string, emoji: string) => void;
};

export default function MessageItem({
  msg, index, visibleTimestampIndex, setVisibleTimestampIndex,
  activeReactionId, setActiveReactionId, setReplyingTo, sendReaction
}: Props) {
  
  // Localized gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    if (diffX > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      setReplyingTo(msg);
      touchStartX.current = null;
    }
  };

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      setActiveReactionId(msg.id);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div
      className={`message-wrapper ${msg.sender === "me" ? "sent-wrapper" : "received-wrapper"}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => { touchStartX.current = null; handlePointerUp(); }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className={`message ${msg.sender === "me" ? "sent" : "received"}`}
        onClick={() => setVisibleTimestampIndex(visibleTimestampIndex === index ? null : index)}
      >
        {msg.replyToText && (
          <div className="reply-preview-bubble">
            <span className="reply-icon">Replying to:</span> {msg.replyToText}
          </div>
        )}
        
        {msg.text}

        {msg.reactions && msg.reactions.length > 0 && (
          <div className="reaction-display">{msg.reactions.join(" ")}</div>
        )}
      </div>

      {msg.author !== "System" && (
        <div className="msg-actions-desktop">
          <button onClick={(e) => { e.stopPropagation(); setActiveReactionId(msg.id); }}><Smile size={18} /></button>
          <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}><Reply size={18} /></button>
        </div>
      )}

      {activeReactionId === msg.id && (
        <div className="reaction-picker" onClick={(e) => e.stopPropagation()}>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={() => sendReaction(msg.id, emoji)}>{emoji}</button>
          ))}
        </div>
      )}
      
      <span className={`timestamp ${visibleTimestampIndex === index ? "show" : ""}`}>
        {msg.author && msg.author !== "System" && (<><strong className="author-tag">{msg.author}</strong> • </>)}
        {msg.timestamp}
      </span>
    </div>
  );
}