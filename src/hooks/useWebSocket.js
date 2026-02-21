import { useState, useEffect, useRef } from 'react';
import { getStompClient } from '../services/websocket';
import { toCamelCase } from '../utils/caseConverter';

export default function useWebSocket(topics) {
  const [messages, setMessages] = useState({});
  const subsRef = useRef([]);

  useEffect(() => {
    if (!topics || topics.length === 0) return;

    let cancelled = false;

    async function subscribe() {
      try {
        const client = await getStompClient();
        if (cancelled) return;

        subsRef.current = topics.map((topic) =>
          client.subscribe(topic, (msg) => {
            try {
              const body = JSON.parse(msg.body);
              const camelBody = toCamelCase(body);
              setMessages((prev) => ({ ...prev, [topic]: camelBody }));
            } catch {
              setMessages((prev) => ({ ...prev, [topic]: msg.body }));
            }
          })
        );
      } catch (err) {
        console.error('WebSocket subscription failed:', err);
      }
    }

    subscribe();

    return () => {
      cancelled = true;
      subsRef.current.forEach((sub) => {
        try { sub.unsubscribe(); } catch { /* ignore */ }
      });
      subsRef.current = [];
    };
  }, [topics.join(',')]); // re-subscribe when topics change

  return messages;
}
