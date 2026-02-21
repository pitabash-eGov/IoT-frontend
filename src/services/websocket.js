import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

let client = null;
let connectPromise = null;

export function getStompClient() {
  if (client?.connected) return Promise.resolve(client);
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    client = new Client({
      webSocketFactory: () => new SockJS('/api/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => resolve(client),
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers.message);
        reject(new Error(frame.headers.message));
      },
      onWebSocketClose: () => {
        connectPromise = null;
      },
    });

    client.activate();
  });

  return connectPromise;
}

export function disconnectStomp() {
  if (client) {
    client.deactivate();
    client = null;
    connectPromise = null;
  }
}
