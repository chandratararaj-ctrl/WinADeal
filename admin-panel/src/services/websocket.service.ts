// Enhanced WebSocket Service with Reconnection Logic

type MessageHandler = (data: any) => void;
type EventType = 'order' | 'delivery' | 'notification' | 'status';

interface WebSocketMessage {
    type: EventType;
    data: any;
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 3000;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private messageHandlers: Map<EventType, Set<MessageHandler>> = new Map();
    private isIntentionallyClosed: boolean = false;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private heartbeatTimeout: number = 30000; // 30 seconds

    constructor(baseUrl: string) {
        // Convert http/https to ws/wss
        this.url = baseUrl.replace(/^http/, 'ws') + '/ws';
    }

    connect(token?: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        this.isIntentionallyClosed = false;
        const wsUrl = token ? `${this.url}?token=${token}` : this.url;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                this.stopHeartbeat();

                if (!this.isIntentionallyClosed) {
                    this.attemptReconnect(token);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.attemptReconnect(token);
        }
    }

    private handleMessage(message: WebSocketMessage) {
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(message.data);
                } catch (error) {
                    console.error(`Error in message handler for ${message.type}:`, error);
                }
            });
        }
    }

    private attemptReconnect(token?: string) {
        if (this.isIntentionallyClosed) return;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

            this.reconnectTimer = setTimeout(() => {
                this.connect(token);
            }, delay);
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, this.heartbeatTimeout);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    on(eventType: EventType, handler: MessageHandler) {
        if (!this.messageHandlers.has(eventType)) {
            this.messageHandlers.set(eventType, new Set());
        }
        this.messageHandlers.get(eventType)!.add(handler);
    }

    off(eventType: EventType, handler: MessageHandler) {
        const handlers = this.messageHandlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    send(type: EventType, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        } else {
            console.warn('WebSocket is not connected. Message not sent.');
        }
    }

    disconnect() {
        this.isIntentionallyClosed = true;
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.messageHandlers.clear();
    }

    getConnectionState(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
        if (!this.ws) return 'CLOSED';

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.OPEN:
                return 'OPEN';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'CLOSED';
            default:
                return 'CLOSED';
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export default WebSocketService;
