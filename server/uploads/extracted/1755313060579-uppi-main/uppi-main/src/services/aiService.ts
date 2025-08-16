
export const getInitialMessage = () => ({
  id: '1',
  text: 'Hello! I\'m your AI startup advisor. How can I help you today?',
  isUser: false,
  timestamp: new Date()
});

export const generateAIResponse = async (input: string): Promise<string> => {
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Thanks for asking: "${input}". This is a mock AI response.`);
    }, 1000);
  });
};
