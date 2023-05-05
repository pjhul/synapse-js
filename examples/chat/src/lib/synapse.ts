
export class SynapseClient {
  socket: WebSocket;

  constructor(url: string) {
    this.socket = new WebSocket(url);
  }

  async connect(): Promise<SynapseClient> {
    return new Promise((resolve, reject) => {
      this.socket.addEventListener('open', () => {
        resolve(this);
      });
    })
  }

  join(channels: string | string[]) {
    channels = Array.isArray(channels) ? channels : [channels];

    channels.forEach(channel => this.socket.send(JSON.stringify({ type: 'join', channel })));
  }

  leave(channels: string | string[]) {
    channels = Array.isArray(channels) ? channels : [channels];

    channels.forEach(channel => this.socket.send(JSON.stringify({ type: 'leave', channel })));
  }

  broadcast(channel: string, message: any) {
    this.socket.send(JSON.stringify({ type: 'broadcast', channel, body: message }));
  }

  on(channel: string, callback: (data: any) => void) {
    this.socket.addEventListener('message', (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.channel === channel && data.type === 'broadcast') {
        callback(data.body);
      }
    });
  }

  presence(channel: string, callback: (data: any) => void) {
    this.socket.addEventListener('message', (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.channel === channel && data.type === 'presence') {
        callback(data.connections);
      }
    });
  }
}
