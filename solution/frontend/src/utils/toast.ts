// Simple toast service
interface ToastMessage {
  message: string;
  type: 'success' | 'warning' | 'error';
  duration?: number;
}

class ToastService {
  private static instance: ToastService;
  private listeners: ((toast: ToastMessage | null) => void)[] = [];

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  subscribe(listener: (toast: ToastMessage | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message: string, type: 'success' | 'warning' | 'error' = 'success', duration: number = 3000) {
    const toast: ToastMessage = { message, type, duration };
    this.listeners.forEach(listener => listener(toast));
    
    // Auto hide after duration
    setTimeout(() => {
      this.listeners.forEach(listener => listener(null));
    }, duration);
  }

  hide() {
    this.listeners.forEach(listener => listener(null));
  }
}

export const toastService = ToastService.getInstance();
