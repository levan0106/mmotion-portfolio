import { Injectable, Logger, Inject } from '@nestjs/common';

export interface SanitizationRule {
  pattern: RegExp | string;
  replacement: string;
  caseSensitive?: boolean;
}

export interface SanitizationConfig {
  enablePasswordMasking?: boolean;
  enableTokenRedaction?: boolean;
  enablePIIProtection?: boolean;
  enableCreditCardMasking?: boolean;
  enableSSNMasking?: boolean;
  enableEmailMasking?: boolean;
  customRules?: SanitizationRule[];
  maxStringLength?: number;
  redactionPlaceholder?: string;
}

/**
 * LogSanitizationService provides comprehensive data sanitization for logging.
 * Protects sensitive information like passwords, tokens, PII, and other confidential data
 * from being logged in plain text.
 */
@Injectable()
export class LogSanitizationService {
  private readonly logger = new Logger(LogSanitizationService.name);
  private readonly config: SanitizationConfig;

  // Default sensitive patterns
  private readonly defaultPatterns = {
    password: /(password|passwd|pwd)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
    token: /(token|auth|authorization|bearer)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
    apiKey: /(api[_-]?key|apikey)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
    secret: /(secret|secretkey|secret_key)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    macAddress: /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/g,
    jwt: /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b/g,
  };

  constructor(
    @Inject('SANITIZATION_CONFIG') private readonly injectedConfig?: SanitizationConfig
  ) {
    this.config = {
      enablePasswordMasking: true,
      enableTokenRedaction: true,
      enablePIIProtection: true,
      enableCreditCardMasking: true,
      enableSSNMasking: true,
      enableEmailMasking: false, // Usually safe to log emails
      customRules: [],
      maxStringLength: 10000,
      redactionPlaceholder: '[REDACTED]',
      ...injectedConfig,
    };
  }

  /**
   * Sanitize a string by applying all configured sanitization rules.
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    // Truncate if too long
    let sanitized = this.truncateString(input);

    // Apply default patterns
    sanitized = this.applyDefaultPatterns(sanitized);

    // Apply custom rules
    sanitized = this.applyCustomRules(sanitized);

    return sanitized;
  }

  /**
   * Sanitize an object by recursively sanitizing all string values.
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if key is sensitive and value is a string
        if (this.isSensitiveKey(key) && typeof value === 'string') {
          sanitized[key] = '[REDACTED]';
        } else {
          // Recursively sanitize the value
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize sensitive data in context object.
   * @param context - Context object to sanitize
   * @returns Sanitized context
   */
  sanitizeContext(context: Record<string, any>): Record<string, any> {
    if (!context || typeof context !== 'object') {
      return context;
    }

    return this.sanitizeObject(context);
  }

  /**
   * Check if a key is considered sensitive.
   * @param key - Key to check
   * @returns True if key is sensitive
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'token', 'auth', 'authorization',
      'apiKey', 'api_key', 'apikey', 'secretKey', 'secret_key', 'privateKey',
      'private_key', 'accessToken', 'access_token', 'refreshToken', 'refresh_token',
      'sessionId', 'session_id', 'cookie', 'cookies', 'ssn', 'socialSecurityNumber',
      'creditCard', 'credit_card', 'cardNumber', 'card_number', 'cvv', 'cvc',
      'bankAccount', 'bank_account', 'accountNumber', 'account_number',
    ];

    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey.toLowerCase())
    );
  }

  /**
   * Apply default sanitization patterns.
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  private applyDefaultPatterns(input: string): string {
    let sanitized = input;

    if (this.config.enablePasswordMasking) {
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.password, '$1=[REDACTED]');
    }

    if (this.config.enableTokenRedaction) {
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.token, '$1=[REDACTED]');
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.apiKey, '$1=[REDACTED]');
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.secret, '$1=[REDACTED]');
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.jwt, '[REDACTED]');
    }

    if (this.config.enablePIIProtection) {
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.phone, '[REDACTED]');
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.ipAddress, '[REDACTED]');
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.macAddress, '[REDACTED]');
    }

    if (this.config.enableCreditCardMasking) {
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.creditCard, '[REDACTED]');
    }

    if (this.config.enableSSNMasking) {
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.ssn, '[REDACTED]');
    }

    if (this.config.enableEmailMasking) {
      sanitized = this.applyPattern(sanitized, this.defaultPatterns.email, '[REDACTED]');
    }

    return sanitized;
  }

  /**
   * Apply custom sanitization rules.
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  private applyCustomRules(input: string): string {
    if (!this.config.customRules || this.config.customRules.length === 0) {
      return input;
    }

    let sanitized = input;

    for (const rule of this.config.customRules) {
      sanitized = this.applyPattern(sanitized, rule.pattern, rule.replacement, rule.caseSensitive);
    }

    return sanitized;
  }

  /**
   * Apply a single pattern to the input string.
   * @param input - String to process
   * @param pattern - Pattern to match
   * @param replacement - Replacement string
   * @param caseSensitive - Whether pattern is case sensitive
   * @returns Processed string
   */
  private applyPattern(
    input: string,
    pattern: RegExp | string,
    replacement: string,
    caseSensitive: boolean = false,
  ): string {
    try {
      let regex: RegExp;

      if (pattern instanceof RegExp) {
        regex = pattern;
      } else {
        const flags = caseSensitive ? 'g' : 'gi';
        regex = new RegExp(pattern, flags);
      }

      return input.replace(regex, replacement);
    } catch (error) {
      this.logger.warn(`Failed to apply sanitization pattern: ${pattern}`, error);
      return input;
    }
  }

  /**
   * Truncate string if it exceeds maximum length.
   * @param input - String to truncate
   * @returns Truncated string
   */
  private truncateString(input: string): string {
    if (!this.config.maxStringLength || input.length <= this.config.maxStringLength) {
      return input;
    }

    const truncated = input.substring(0, this.config.maxStringLength);
    return `${truncated}... [TRUNCATED]`;
  }

  /**
   * Create a sanitization rule for a specific pattern.
   * @param pattern - Pattern to match
   * @param replacement - Replacement string
   * @param caseSensitive - Whether pattern is case sensitive
   * @returns Sanitization rule
   */
  createRule(pattern: string | RegExp, replacement: string, caseSensitive: boolean = false): SanitizationRule {
    return {
      pattern,
      replacement,
      caseSensitive,
    };
  }

  /**
   * Add a custom sanitization rule.
   * @param rule - Rule to add
   */
  addCustomRule(rule: SanitizationRule): void {
    if (!this.config.customRules) {
      this.config.customRules = [];
    }
    this.config.customRules.push(rule);
  }

  /**
   * Remove a custom sanitization rule.
   * @param pattern - Pattern to remove
   */
  removeCustomRule(pattern: string | RegExp): void {
    if (!this.config.customRules) {
      return;
    }

    this.config.customRules = this.config.customRules.filter(rule => {
      if (rule.pattern instanceof RegExp && pattern instanceof RegExp) {
        return rule.pattern.toString() !== pattern.toString();
      }
      return rule.pattern !== pattern;
    });
  }

  /**
   * Get current sanitization configuration.
   * @returns Current configuration
   */
  getConfig(): SanitizationConfig {
    return { ...this.config };
  }

  /**
   * Update sanitization configuration.
   * @param newConfig - New configuration to merge
   */
  updateConfig(newConfig: Partial<SanitizationConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Test sanitization with sample data.
   * @param sampleData - Sample data to test
   * @returns Sanitized sample data
   */
  testSanitization(sampleData: any): any {
    this.logger.log('Testing sanitization with sample data');
    return this.sanitizeObject(sampleData);
  }

  /**
   * Get sanitization statistics.
   * @param input - Input to analyze
   * @returns Statistics about sanitization
   */
  getSanitizationStats(input: string): {
    originalLength: number;
    sanitizedLength: number;
    redactionsCount: number;
    patternsMatched: string[];
  } {
    const originalLength = input.length;
    const sanitized = this.sanitizeString(input);
    const sanitizedLength = sanitized.length;
    const redactionsCount = (sanitized.match(/\[REDACTED\]/g) || []).length;

    const patternsMatched: string[] = [];
    for (const [name, pattern] of Object.entries(this.defaultPatterns)) {
      if (pattern.test(input)) {
        patternsMatched.push(name);
      }
    }

    return {
      originalLength,
      sanitizedLength,
      redactionsCount,
      patternsMatched,
    };
  }
}
