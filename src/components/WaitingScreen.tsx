type Props = {
  isServerWaking: boolean;
  countdown: number;
  onCancel: () => void;
};

export default function WaitingScreen({ isServerWaking, countdown, onCancel }: Props) {
  return (
    <div className="username-container">
      <h1 className="brand-logo" style={{ fontSize: "2rem" }}>
        {isServerWaking ? "Waking up Server..." : "Searching..."}
      </h1>
      <p>
        {isServerWaking 
          ? `The free server was taking a nap. Give it ${countdown}s to wake up! 🥵🍑` 
          : "Looking for someone to match your freak... 👀🔥"}
      </p>
      <button className="new-match-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}