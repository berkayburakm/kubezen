import { useCallback, useEffect, useRef, useState } from 'react'

type WebSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export interface UseWebSocketOptions<T> {
  url: string
  reconnect?: boolean
  retryMs?: number
  parse?: (data: MessageEvent) => T
  onMessage?: (payload: T) => void
}

export function useWebSocket<T>({
  url,
  reconnect = true,
  retryMs = 2000,
  parse,
  onMessage,
}: UseWebSocketOptions<T>) {
  const socketRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef = useRef<() => void>(() => {
    throw new Error('WebSocket is not connected yet')
  })
  const [status, setStatus] = useState<WebSocketStatus>('idle')
  const [lastMessage, setLastMessage] = useState<T | null>(null)

  const cleanup = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
    }
    socketRef.current?.close()
    socketRef.current = null
  }, [])

  const connect = useCallback(() => {
    cleanup()
    setStatus('connecting')
    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.onopen = () => setStatus('open')
    ws.onclose = () => {
      setStatus('closed')
      if (reconnect) {
        const reconnectFn = connectRef.current
        retryRef.current = setTimeout(() => reconnectFn(), retryMs)
      }
    }
    ws.onerror = () => setStatus('error')
    ws.onmessage = (event) => {
      const payload = parse ? parse(event) : (event.data as unknown as T)
      setLastMessage(payload)
      onMessage?.(payload)
    }
  }, [cleanup, onMessage, parse, reconnect, retryMs, url])

  const send = useCallback((payload: string | ArrayBuffer | Blob) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(payload)
    }
  }, [])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    connectRef.current()
    return () => cleanup()
  }, [cleanup])

  return { status, lastMessage, send }
}

