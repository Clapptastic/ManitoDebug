import { useState, useEffect, useRef } from 'react'

function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const ws = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 1000 // Start with 1 second

  const connect = () => {
    try {
      ws.current = new WebSocket(url)
      
      ws.current.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        console.log('WebSocket connected')
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage({ data: event.data, timestamp: Date.now() })
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
          setLastMessage({ data: event.data, timestamp: Date.now() })
        }
      }

      ws.current.onclose = (event) => {
        setIsConnected(false)
        console.log('WebSocket disconnected:', event.code, event.reason)
        
        // Attempt to reconnect unless it was a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current)
          reconnectAttempts.current++
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError(error)
      }
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError(err)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect')
    }
  }

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(typeof message === 'string' ? message : JSON.stringify(message))
      return true
    } else {
      console.warn('WebSocket is not connected')
      return false
    }
  }

  const subscribe = (channels) => {
    return sendMessage({
      type: 'subscribe',
      channels: Array.isArray(channels) ? channels : [channels]
    })
  }

  const ping = () => {
    return sendMessage({ type: 'ping' })
  }

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [url])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    subscribe,
    ping,
    disconnect,
    reconnect: connect
  }
}

export default useWebSocket