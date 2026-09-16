import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketEvent {
  kind:
    | 'sensor_update'
    | 'alert'
    | 'vehicle_update'
    | 'sos'
    | 'sos_resolved'
    | 'ground_report'
    | 'system_reset'
    | 'route_dispatched'
    | 'route_rerouted';
  data?: any;
  seq_id?: number;
  type?: string;
}

export function useWebSocket(url: string = 'ws://localhost:8000/ws') {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [seqId, setSeqId] = useState<number>(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Live stream connected:', url);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          if (parsed.seq_id) {
            setSeqId(parsed.seq_id);
          }
          setLastEvent(parsed);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Connection closed. Reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        setIsConnected(false);
        console.warn('[WebSocket] Connection error (offline fallback mode active).');
        ws.close();
      };
    } catch (err) {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 4000);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastEvent, seqId };
}
