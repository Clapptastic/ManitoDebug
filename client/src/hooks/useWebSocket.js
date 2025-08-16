import { useState, useEffect, useRef } from 'react'
import dynamicPortConfig from '../utils/portConfig.js'

export default function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = async () => {
    try {
      // Ensure port configuration is loaded
      await dynamicPortConfig.initialize();
      const wsUrl = dynamicPortConfig.getWebSocketUrl();
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setMessages(prev => [...prev, data])
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect after maximum attempts')
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setError('WebSocket connection error')
      }
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket connection:', error)
      setError('Failed to initialize WebSocket connection')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setError(null)
  }

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    messages,
    error,
    sendMessage,
    connect,
    disconnect
  }
}