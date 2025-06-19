import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(0); // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef([]);

  const {
    reconnectLimit = 5,
    reconnectInterval = 3000,
    onOpen,
    onMessage,
    onClose,
    onError,
    shouldReconnect = true
  } = options;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = (event) => {
        console.log('WebSocket connected');
        setReadyState(1);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          ws.send(message);
        }
        
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        try {
          // Check if the message is a Blob
          if (event.data instanceof Blob) {
            // Handle Blob data - read as text then try to parse
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const jsonData = JSON.parse(reader.result);
                setLastMessage(jsonData);
                if (onMessage) onMessage(jsonData);
              } catch (err) {
                // If parsing fails, just send the text data
                console.log('Received non-JSON blob data');
                setLastMessage(reader.result);
                if (onMessage) onMessage(reader.result);
              }
            };
            reader.readAsText(event.data);
            return;
          }
          
          // Handle string data
          if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);
              setLastMessage(data);
              if (onMessage) onMessage(data);
            } catch (err) {
              // If not valid JSON, use as-is
              console.log('Received non-JSON string data');
              setLastMessage(event.data);
              if (onMessage) onMessage(event.data);
            }
            return;
          }
          
          // For other types, just use the data as-is
          console.log('Received data of type:', typeof event.data);
          setLastMessage(event.data);
          if (onMessage) onMessage(event.data);
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
          setLastMessage(event.data);
          if (onMessage) onMessage(event.data);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setReadyState(3);
        setSocket(null);
        
        if (onClose) onClose(event);
        
        // Attempt to reconnect if enabled and within limits
        if (shouldReconnect && reconnectAttemptsRef.current < reconnectLimit) {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${reconnectLimit})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReadyState(0);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        if (onError) onError(event);
      };

      setSocket(ws);
      setReadyState(0);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err);
    }
  }, [url, onOpen, onMessage, onClose, onError, shouldReconnect, reconnectLimit, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    
    setSocket(null);
    setReadyState(3);
  }, [socket]);

  const sendMessage = useCallback((message) => {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(messageStr);
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(messageStr);
      
      // If not connected, try to connect
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connect();
      }
    }
  }, [socket, connect]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    lastMessage,
    readyState,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

export default useWebSocket; 