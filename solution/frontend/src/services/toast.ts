import { toastService } from '../utils/toast';

export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export class ToastService {
  /**
   * Show success toast
   */
  static success(message: string, options?: ToastOptions) {
    return toastService.show(message, 'success', options?.duration || 3000);
  }

  /**
   * Show error toast
   */
  static error(message: string, options?: ToastOptions) {
    return toastService.show(message, 'error', options?.duration || 5000);
  }

  /**
   * Show warning toast
   */
  static warning(message: string, options?: ToastOptions) {
    return toastService.show(message, 'warning', options?.duration || 4000);
  }

  /**
   * Show info toast (using success type since info is not available)
   */
  static info(message: string, options?: ToastOptions) {
    return toastService.show(message, 'success', options?.duration || 3000);
  }

  /**
   * Show custom toast
   */
  static custom(message: string, options?: ToastOptions) {
    return toastService.show(message, 'success', options?.duration || 3000);
  }

  /**
   * Hide toast
   */
  static hide() {
    return toastService.hide();
  }

  /**
   * Clear all toasts
   */
  static clear() {
    return toastService.hide();
  }
}
