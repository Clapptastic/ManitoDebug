
import { Bot, User } from "lucide-react";
import { MessageProps } from "@/types/chat";

const Message = ({ message }: MessageProps) => {
  return (
    <div className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-2 max-w-[80%] ${
          message.isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {message.isUser ? (
            <User className="w-4 h-4 text-primary" />
          ) : (
            <Bot className="w-4 h-4 text-primary" />
          )}
        </div>
        <div
          className={`p-3 rounded-lg whitespace-pre-wrap ${
            message.isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};

export default Message;
