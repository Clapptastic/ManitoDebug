
import { MessageListProps } from "@/types/chat";
import Message from "./Message";

const MessageList = ({ messages = [] }: MessageListProps) => {
  // Ensure messages is always an array even if it's undefined
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  return (
    <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4">
      {safeMessages.length > 0 ? (
        safeMessages.map((message, index) => (
          <Message key={index} message={message} />
        ))
      ) : (
        <div className="text-center text-muted-foreground p-4">
          No messages to display
        </div>
      )}
    </div>
  );
};

export default MessageList;
