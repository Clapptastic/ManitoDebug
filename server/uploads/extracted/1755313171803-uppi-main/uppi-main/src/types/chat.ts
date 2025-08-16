
export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface MessageProps {
  message: Message;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}
