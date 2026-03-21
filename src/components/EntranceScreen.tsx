import { Github } from "lucide-react";
import type { AppStatus } from "../types";

type Props = {
  username: string;
  setUsername: (name: string) => void;
  status: AppStatus;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EntranceScreen({ username, setUsername, status, onSubmit }: Props) {
  return (
    <div className="username-container">
      <header className="brand-stack">
        <h1 className="brand-logo">PAHIGAL</h1>
        <p className="brand-tagline">"Talk"🤤🤤 with a random stranger. 😉🍑🍑</p>
      </header>
      <form onSubmit={onSubmit} className="username-input">
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Who are you?" 
          maxLength={15} 
          required 
        />
        <button type="submit" className="primary-btn" disabled={status === "WAITING"}>
          Find Someone
        </button>
      </form>
      <footer className="footer-link">
        <a href="https://github.com/hervuwu/PAHIGAL" target="_blank" rel="noreferrer" className="github-anchor">
          <Github size={16} strokeWidth={2.5} /><span>GitHub</span>
        </a>
      </footer>
    </div>
  );
}