/**
 * Device Fingerprint Service
 * Generates unique device fingerprints for device trust system
 */

class DeviceFingerprintService {
  /**
   * Generate device fingerprint using multiple techniques
   */
  generateDeviceFingerprint(): string {
    // Check if in incognito/private mode
    const isIncognito = this.detectIncognitoMode();
    if (isIncognito) {
      // Generate random fingerprint for incognito mode
      // This ensures incognito sessions are never trusted
      return this.hashFingerprint(`incognito_${Date.now()}_${Math.random()}`);
    }

    const canvas = this.getCanvasFingerprint();
    const webgl = this.getWebGLFingerprint();
    const audio = this.getAudioFingerprint();
    const screen = this.getScreenFingerprint();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    
    const fingerprint = {
      canvas,
      webgl,
      audio,
      screen,
      timezone,
      language,
      platform,
      userAgent,
      hardwareConcurrency,
      maxTouchPoints
      // Removed timestamp to ensure stable fingerprint
    };
    
    return this.hashFingerprint(JSON.stringify(fingerprint));
  }
  
  /**
   * Detect if browser is in incognito/private mode
   */
  private detectIncognitoMode(): boolean {
    try {
      // Method 1: Check if localStorage is available
      if (!window.localStorage) {
        return true;
      }

      // Method 2: Try to write to localStorage
      const testKey = 'incognito_test';
      try {
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (e) {
        return true;
      }

      // Method 3: Check if indexedDB is available
      if (!window.indexedDB) {
        return true;
      }

      // Method 4: Check if webkitRequestFileSystem is available (Chrome)
      if ((navigator as any).webkitTemporaryStorage && !(navigator as any).webkitTemporaryStorage.queryUsageAndQuota) {
        return true;
      }

      // Method 5: Check if navigator.connection is limited
      if ((navigator as any).connection && (navigator as any).connection.effectiveType === 'slow-2g') {
        return true;
      }

      return false;
    } catch (error) {
      // If any error occurs, assume incognito mode
      return true;
    }
  }

  /**
   * Get canvas fingerprint
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device fingerprint', 4, 17);
      
      return canvas.toDataURL();
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Get WebGL fingerprint
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';
      
      // Type assertion to access WebGL-specific methods
      const webgl = gl as WebGLRenderingContext;
      const vendor = webgl.getParameter(webgl.VENDOR) || '';
      const renderer = webgl.getParameter(webgl.RENDERER) || '';
      const version = webgl.getParameter(webgl.VERSION) || '';
      const shadingLanguageVersion = webgl.getParameter(webgl.SHADING_LANGUAGE_VERSION) || '';
      
      return `${vendor}|${renderer}|${version}|${shadingLanguageVersion}`;
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Get audio fingerprint
   */
  private getAudioFingerprint(): string {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1000;
      oscillator.start();
      
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      oscillator.stop();
      
      return Array.from(data).join('');
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Get screen fingerprint
   */
  private getScreenFingerprint(): string {
    return `${screen.width}x${screen.height}x${screen.colorDepth}x${screen.pixelDepth}`;
  }
  
  /**
   * Hash fingerprint string
   */
  private hashFingerprint(fingerprint: string): string {
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();
