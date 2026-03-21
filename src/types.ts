export type Message = {
  id: string; 
  text: string;
  sender: "me" | "them";
  timestamp: string;
  author?: string;
  reactions?: string[];
  replyToText?: string;
};

export type AppStatus = "UNSET" | "WAITING" | "CHATTING" | "DISCONNECTED";