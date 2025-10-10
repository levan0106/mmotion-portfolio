/**
 * WebSocket service for real-time updates
 */

import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (_reason) => {
      this.handleReconnect();
    });

    this.socket.on('connectError', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('portfolioUpdate', (data: WebSocketMessage) => {
      this.handlePortfolioUpdate(data);
    });

    this.socket.on('priceUpdate', (data: WebSocketMessage) => {
      this.handlePriceUpdate(data);
    });

    this.socket.on('tradeUpdate', (data: WebSocketMessage) => {
      this.handleTradeUpdate(data);
    });

    this.socket.on('error', (error: WebSocketMessage) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handlePortfolioUpdate(data: WebSocketMessage): void {
    // Emit custom event for portfolio updates
    window.dispatchEvent(new CustomEvent('portfolio-update', { detail: data }));
  }

  private handlePriceUpdate(data: WebSocketMessage): void {
    // Emit custom event for price updates
    window.dispatchEvent(new CustomEvent('price-update', { detail: data }));
  }

  private handleTradeUpdate(data: WebSocketMessage): void {
    // Emit custom event for trade updates
    window.dispatchEvent(new CustomEvent('trade-update', { detail: data }));
  }

  // Subscribe to specific portfolio updates
  subscribeToPortfolio(portfolioId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribePortfolio', portfolioId);
    }
  }

  // Unsubscribe from portfolio updates
  unsubscribeFromPortfolio(portfolioId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribePortfolio', portfolioId);
    }
  }

  // Subscribe to price updates for specific assets
  subscribeToPrices(assetIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribePrices', assetIds);
    }
  }

  // Unsubscribe from price updates
  unsubscribeFromPrices(assetIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribePrices', assetIds);
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get connection status
  getConnectionStatus(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Create and export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
