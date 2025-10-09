/**
 * Service to manage user login history for quick login
 */

export interface UserHistory {
  username: string;
  fullName?: string;
  email?: string;
  avatarText?: string;
  lastLogin: string;
  isProfileComplete: boolean;
}

class UserHistoryService {
  private readonly STORAGE_KEY = 'user_login_history';
  private readonly MAX_HISTORY = 3; // Maximum number of users to keep in history

  /**
   * Add or update user in login history
   */
  addUserToHistory(user: {
    username: string;
    fullName?: string;
    email?: string;
    avatarText?: string;
    isProfileComplete?: boolean;
  }): void {
    try {
      const history = this.getUserHistory();
      
      // Remove existing entry if it exists
      const filteredHistory = history.filter(h => h.username !== user.username);
      
      // Add new entry at the beginning
      const newEntry: UserHistory = {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatarText: user.avatarText,
        lastLogin: new Date().toISOString(),
        isProfileComplete: user.isProfileComplete || false,
      };
      
      const updatedHistory = [newEntry, ...filteredHistory].slice(0, this.MAX_HISTORY);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
      console.log('🔍 UserHistoryService: Added user to history:', user.username);
    } catch (error) {
      console.error('Failed to add user to history:', error);
    }
  }

  /**
   * Get user login history
   */
  getUserHistory(): UserHistory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Failed to get user history:', error);
      return [];
    }
  }

  /**
   * Remove user from history
   */
  removeUserFromHistory(username: string): void {
    try {
      const history = this.getUserHistory();
      const filteredHistory = history.filter(h => h.username !== username);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
      console.log('🔍 UserHistoryService: Removed user from history:', username);
    } catch (error) {
      console.error('Failed to remove user from history:', error);
    }
  }

  /**
   * Clear all user history
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🔍 UserHistoryService: Cleared all user history');
    } catch (error) {
      console.error('Failed to clear user history:', error);
    }
  }

  /**
   * Get user by username from history
   */
  getUserFromHistory(username: string): UserHistory | null {
    const history = this.getUserHistory();
    return history.find(h => h.username === username) || null;
  }
}

export const userHistoryService = new UserHistoryService();
