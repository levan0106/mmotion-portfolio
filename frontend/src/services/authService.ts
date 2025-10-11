import { apiService } from './api';
import { userHistoryService } from './userHistoryService';

export interface User {
  userId: string;
  username: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  avatarText?: string;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  isPasswordSet: boolean;
  authState: 'DEMO' | 'PARTIAL' | 'COMPLETE';
}

export interface Account {
  accountId: string;
  name: string;
  email: string;
  baseCurrency: string;
  isInvestor: boolean;
  isMainAccount: boolean;
}

export interface AuthResponse {
  user: User;
  account: Account;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface SetPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

class AuthService {
  /**
   * Login or register user with progressive authentication
   */
  async loginOrRegister(username: string, password?: string): Promise<AuthResponse> {
    const response = await apiService.api.post('/api/v1/auth/login-or-register', {
      username,
      password,
    });
    return response.data;
  }

  /**
   * Check user status by username
   */
  async checkUserStatus(username: string): Promise<{
    exists: boolean;
    requiresPassword: boolean;
    isProfileComplete: boolean;
  }> {
    const response = await apiService.api.get(`/api/v1/auth/check-user/${username}`);
    return response.data;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiService.api.get('/api/v1/auth/profile');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await apiService.api.put('/api/v1/auth/profile', profileData);
    return response.data;
  }

  /**
   * Set password for user
   */
  async setPassword(password: string): Promise<void> {
    await apiService.api.post('/api/v1/auth/set-password', { password });
  }

  /**
   * Change password for user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.api.post('/api/v1/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      // console.error('AuthService changePassword error:', error);
      // console.error('AuthService error response:', error.response);
      // console.error('AuthService error message:', error.response?.data?.message);
      
      // Re-throw error with better context for the UI
      if (error.response?.status === 401) {
        const message = error.response?.data?.message || 'Authentication failed';
        // Preserve the original error structure
        const newError = new Error(message);
        (newError as any).response = error.response;
        throw newError;
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Invalid request data';
        const newError = new Error(message);
        (newError as any).response = error.response;
        throw newError;
      } else if (error.response?.status === 404) {
        const newError = new Error('User not found');
        (newError as any).response = error.response;
        throw newError;
      } else {
        throw error;
      }
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(): Promise<{ token: string }> {
    const response = await apiService.api.post('/api/v1/auth/send-verification-email');
    return response.data;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ user: User }> {
    const response = await apiService.api.post('/api/v1/auth/verify-email', { token });
    return response.data;
  }

  /**
   * Logout user (clear local storage)
   */
  logout(): void {
    localStorage.removeItem('user_session');
    localStorage.removeItem('current_account');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('jwt_token');
  }

  /**
   * Get current user from local storage
   */
  getCurrentUser(): User | null {
    const session = localStorage.getItem('user_session');
    return session ? JSON.parse(session).user : null;
  }

  /**
   * Get current account from local storage
   */
  getCurrentAccount(): Account | null {
    const session = localStorage.getItem('user_session');
    return session ? JSON.parse(session).account : null;
  }

  /**
   * Save user session to local storage
   */
  saveUserSession(authResponse: AuthResponse): void {
    localStorage.setItem('user_session', JSON.stringify(authResponse));
    localStorage.setItem('current_account', JSON.stringify(authResponse.account));
    localStorage.setItem('isAuthenticated', 'true');
    
    // Set JWT token for API requests
    if (authResponse.token) {
      localStorage.setItem('jwt_token', authResponse.token);
    }

    // Add user to login history for quick login
    if (authResponse.user) {
      userHistoryService.addUserToHistory({
        username: authResponse.user.username,
        fullName: authResponse.user.fullName,
        email: authResponse.user.email,
        avatarText: authResponse.user.avatarText,
        isProfileComplete: authResponse.user.isProfileComplete,
      });
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
  }
}

export const authService = new AuthService();
