import React, { useState, useRef, useEffect } from 'react'
import {
  Brain,
  Send,
  Loader2,
  X,
  Sparkles,
  MessageCircle,
  Code,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Zap,
  Star
} from 'lucide-react'

function AIPanel({ scanResults, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI code analysis assistant. I can help you understand your codebase, identify potential improvements, and answer questions about your code structure.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('local')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const aiProviders = {
    local: { name: 'Local AI', icon: '🏠', color: 'text-blue-400' },
    openai: { name: 'OpenAI GPT', icon: '🤖', color: 'text-green-400' },
    claude: { name: 'Claude', icon: '🧠', color: 'text-purple-400' }
  }

  const suggestedQuestions = [
    "What are the main architectural patterns in my codebase?",
    "How can I improve the code quality?",
    "What are the potential security issues?",
    "Which files have the highest complexity?",
    "How can I optimize the dependency structure?",
    "What are the best refactoring opportunities?"
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (scanResults && messages.length === 1) {
      // Auto-generate insights when scan results are available
      generateInitialInsights()
    }
  }, [scanResults])

  const generateInitialInsights = async () => {
    if (!scanResults) return

    setIsLoading(true)
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const insights = generateCodeInsights(scanResults)
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: insights,
      timestamp: new Date(),
      isInsight: true
    }])
    
    setIsLoading(false)
  }

  const generateCodeInsights = (data) => {
    const files = data.files || []
    const conflicts = data.conflicts || []
    const totalLines = files.reduce((sum, f) => sum + (f.lines || 0), 0)
    const avgComplexity = files.reduce((sum, f) => sum + (f.complexity || 0), 0) / files.length
    const largeFiles = files.filter(f => (f.lines || 0) > 200)
    const complexFiles = files.filter(f => (f.complexity || 0) > 5)

    let insights = `## 📊 Code Analysis Insights\n\n`
    
    // Overall Health
    const healthScore = Math.max(0, 100 - (conflicts.length * 10) - (complexFiles.length * 5))
    insights += `### 🎯 Overall Health: ${healthScore}%\n`
    
    if (healthScore >= 80) {
      insights += `🎉 **Excellent!** Your codebase is well-structured and maintainable.\n\n`
    } else if (healthScore >= 60) {
      insights += `👍 **Good!** Your codebase has a solid foundation with some areas for improvement.\n\n`
    } else {
      insights += `⚠️ **Needs Attention** There are several areas that could benefit from refactoring.\n\n`
    }

    // Key Metrics
    insights += `### 📈 Key Metrics\n`
    insights += `- **Files Analyzed:** ${files.length}\n`
    insights += `- **Lines of Code:** ${totalLines.toLocaleString()}\n`
    insights += `- **Average Complexity:** ${avgComplexity.toFixed(1)}\n`
    insights += `- **Conflicts Found:** ${conflicts.length}\n\n`

    // Recommendations
    insights += `### 💡 Recommendations\n`
    
    if (complexFiles.length > 0) {
      insights += `🔧 **Complexity:** ${complexFiles.length} files have high complexity. Consider breaking them into smaller, more focused modules.\n\n`
    }
    
    if (largeFiles.length > 0) {
      insights += `📏 **File Size:** ${largeFiles.length} files are quite large (&gt;200 lines). Consider splitting them for better maintainability.\n\n`
    }
    
    if (conflicts.length === 0) {
      insights += `✅ **Dependencies:** No circular dependencies detected - great job!\n\n`
    } else {
      insights += `🔄 **Dependencies:** Found ${conflicts.length} dependency issues that should be addressed.\n\n`
    }

    // File Type Analysis
    const fileTypes = {}
    files.forEach(f => {
      const ext = f.filePath.split('.').pop() || 'unknown'
      fileTypes[ext] = (fileTypes[ext] || 0) + 1
    })
    
    insights += `### 📁 Project Composition\n`
    Object.entries(fileTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([ext, count]) => {
        insights += `- **${ext.toUpperCase()}:** ${count} files\n`
      })

    return insights
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Send to AI API
      const response = await fetch('/api/ai/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          context: scanResults,
          provider: selectedProvider
        })
      })

      const result = await response.json()
      
      if (result.success) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: result.data.response,
          timestamp: new Date(),
          suggestions: result.data.suggestions,
          confidence: result.data.confidence
        }
        
        setMessages(prev => [...prev, aiResponse])
      } else {
        throw new Error(result.message || 'Failed to get AI response')
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I encountered an error: ${error.message}. Please try again or check your connection.`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
    // Could add a toast notification here
  }

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question)
    inputRef.current?.focus()
  }

  const clearConversation = () => {
    setMessages([{
      id: 1,
      type: 'ai',
      content: 'Conversation cleared! How can I help you analyze your code?',
      timestamp: new Date()
    }])
  }

  const MessageBubble = ({ message }) => {
    const isAI = message.type === 'ai'
    const isError = message.type === 'error'
    
    return (
      <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`max-w-[80%] ${isAI ? 'order-2' : 'order-1'}`}>
          {/* Avatar */}
          {isAI && (
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-gray-400">AI Assistant</span>
              {message.confidence && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-gray-400">{Math.round(message.confidence * 100)}%</span>
                </div>
              )}
            </div>
          )}
          
          {/* Message Content */}
          <div className={`p-3 rounded-lg ${
            isError 
              ? 'bg-red-500/10 border border-red-500/30 text-red-200'
              : isAI 
                ? 'bg-gray-800/70 text-gray-100' 
                : 'bg-primary-600 text-white'
          } ${message.isInsight ? 'border border-purple-500/30' : ''}`}>
            {message.isInsight && (
              <div className="flex items-center space-x-1 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">AI Insights</span>
              </div>
            )}
            
            {/* Render markdown-like content */}
            <div className="prose prose-invert prose-sm max-w-none">
              {message.content.split('\n').map((line, index) => {
                if (line.startsWith('### ')) {
                  return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
                } else if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-bold mt-4 mb-3">{line.slice(3)}</h2>
                } else if (line.startsWith('- ')) {
                  return <li key={index} className="ml-4">{line.slice(2)}</li>
                } else if (line.includes('**') && line.includes('**')) {
                  const parts = line.split('**')
                  return (
                    <p key={index} className="mb-2">
                      {parts.map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </p>
                  )
                } else if (line.trim()) {
                  return <p key={index} className="mb-2">{line}</p>
                } else {
                  return <br key={index} />
                }
              })}
            </div>
            
            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600/50">
                <div className="flex items-center space-x-1 mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">Suggestions</span>
                </div>
                <ul className="space-y-1 text-sm">
                  {message.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Message Actions */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {(isAI || isError) && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleCopyMessage(message.content)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-panel flex flex-col transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : 'w-96 h-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="text-xs bg-gray-800 border border-gray-600 text-gray-300 rounded px-2 py-1"
              >
                {Object.entries(aiProviders).map(([key, provider]) => (
                  <option key={key} value={key}>
                    {provider.icon} {provider.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearConversation}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && !isLoading && (
        <div className="p-4 border-t border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>Suggested Questions</span>
          </h4>
          <div className="space-y-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="w-full text-left text-sm text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
              >
                💡 {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your code, request analysis, or get suggestions..."
              className="input-field w-full pr-12 py-3 resize-none"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Code className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-lg transition-all duration-200 ${
              inputMessage.trim() && !isLoading
                ? 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <div className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Powered by AI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIPanel