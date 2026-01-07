# Code Duplication Analysis Report

**Date:** 2026-01-06  
**Codebase:** ndx_try_aws_scenarios  
**Focus:** JavaScript modules, TypeScript CDK constructs, and templates

## Executive Summary

Analysis revealed **significant code duplication** across the JavaScript module layer, particularly in:
1. **LocalStorage management patterns** (5 different implementations)
2. **Clipboard/copy-to-clipboard functionality** (4 implementations)
3. **URL sanitization** (2 identical implementations)
4. **Error handling in try-catch blocks** (inconsistent patterns)
5. **Security group creation in CDK** (repetitive structure)

**Impact:** ~15-20% code duplication, increased maintenance burden, inconsistent error handling.

---

## 1. CRITICAL: LocalStorage Management Duplication

### Pattern Identified
**5 different modules** implement nearly identical localStorage availability checking and data persistence:

#### Files Affected:
- `src/assets/js/progress-tracker.js` (lines 44-53)
- `src/assets/js/experiment-tracker.js` (lines 28-37)
- `src/assets/js/exploration-state.js` (lines 11-20)
- `src/assets/js/phase-state.js` (lines 64-73)
- `src/assets/js/deploy-url.js` (uses sessionStorage but similar pattern)

#### Duplicated Code Example:
```javascript
// Repeated in 5 files with minor variations
function isLocalStorageAvailable() {
  try {
    const test = '__ndx_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
```

### Root Cause
**Why:** No shared storage utility module. Each feature implemented its own storage wrapper independently.

**Business Impact:** 
- High maintenance cost when storage logic needs updates
- Inconsistent behavior across features
- Harder to add features like encryption or migration

### Solution: Create Unified Storage Module

```javascript
// src/assets/js/utils/storage.js
/**
 * Unified Storage Manager
 * Provides consistent localStorage/sessionStorage access with:
 * - Availability detection
 * - Error handling
 * - Type safety
 * - Namespace management
 */
const StorageManager = {
  /**
   * Storage types
   */
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',

  /**
   * Check if storage is available
   */
  isAvailable(storageType = 'localStorage') {
    try {
      const storage = window[storageType];
      const test = '__ndx_storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      console.warn(`[StorageManager] ${storageType} unavailable:`, e.message);
      return false;
    }
  },

  /**
   * Get item with JSON parsing
   */
  getItem(key, storageType = 'localStorage', defaultValue = null) {
    if (!this.isAvailable(storageType)) {
      return defaultValue;
    }

    try {
      const storage = window[storageType];
      const data = storage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn(`[StorageManager] Error reading ${key}:`, e.message);
      return defaultValue;
    }
  },

  /**
   * Set item with JSON serialization
   */
  setItem(key, value, storageType = 'localStorage') {
    if (!this.isAvailable(storageType)) {
      return false;
    }

    try {
      const storage = window[storageType];
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Error saving ${key}:`, e.message);
      return false;
    }
  },

  /**
   * Remove item
   */
  removeItem(key, storageType = 'localStorage') {
    if (!this.isAvailable(storageType)) {
      return false;
    }

    try {
      const storage = window[storageType];
      storage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Error removing ${key}:`, e.message);
      return false;
    }
  },

  /**
   * Clear all items with prefix
   */
  clearByPrefix(prefix, storageType = 'localStorage') {
    if (!this.isAvailable(storageType)) {
      return false;
    }

    try {
      const storage = window[storageType];
      const keys = Object.keys(storage).filter(k => k.startsWith(prefix));
      keys.forEach(k => storage.removeItem(k));
      return true;
    } catch (e) {
      console.warn(`[StorageManager] Error clearing prefix ${prefix}:`, e.message);
      return false;
    }
  }
};

// Export globally
window.NDXStorage = StorageManager;

// Example usage in refactored modules:
// const progress = window.NDXStorage.getItem('ndx_walkthrough_progress', 'localStorage', {});
// window.NDXStorage.setItem('ndx_walkthrough_progress', progress);
```

**Migration Path:**
1. Create `src/assets/js/utils/storage.js`
2. Load before other scripts in base layout
3. Refactor one module at a time (start with `progress-tracker.js`)
4. Remove duplicate `isLocalStorageAvailable()` functions
5. Update to use `window.NDXStorage.getItem()` and `setItem()`

**Estimated Effort:** 4-6 hours  
**Lines Saved:** ~150 lines across 5 files

---

## 2. HIGH: Clipboard Copy-to-Clipboard Duplication

### Pattern Identified
**4 different implementations** of copy-to-clipboard with fallback:

#### Files Affected:
- `src/assets/js/walkthrough.js` (lines 39-101)
- `src/assets/js/credentials-card.js` (lines 67-109)
- `src/assets/js/experiment-tracker.js` (lines 262-300)
- Simplified version in other modules

#### Duplicated Pattern:
```javascript
// Pattern repeated 4 times
async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) resolve();
      else reject(new Error('Copy failed'));
    } catch (err) {
      reject(err);
    }
  });
}
```

### Root Cause
**Why:** No shared clipboard utility. Each component that needs copy functionality implemented its own.

**Business Impact:**
- Browser compatibility fixes need to be applied 4 times
- Inconsistent user feedback across features
- Accessibility improvements duplicated

### Solution: Create Unified Clipboard Utility

```javascript
// src/assets/js/utils/clipboard.js
/**
 * Unified Clipboard Manager
 * Handles copy-to-clipboard with fallback and visual feedback
 */
const ClipboardManager = {
  /**
   * Copy text to clipboard with modern API and fallback
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyText(text) {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('[ClipboardManager] Invalid text to copy');
      return false;
    }

    // Try modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn('[ClipboardManager] Clipboard API failed, trying fallback:', error.message);
        // Fall through to fallback
      }
    }

    // Fallback for older browsers
    return this._fallbackCopy(text);
  },

  /**
   * Fallback copy using document.execCommand
   * @private
   */
  _fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '0';
      textarea.setAttribute('aria-hidden', 'true');
      textarea.setAttribute('readonly', '');
      
      document.body.appendChild(textarea);
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      return success;
    } catch (error) {
      console.error('[ClipboardManager] Fallback copy failed:', error);
      return false;
    }
  },

  /**
   * Copy with visual feedback on button
   * @param {string} text - Text to copy
   * @param {HTMLElement} button - Button element to show feedback on
   * @param {Object} options - Customization options
   */
  async copyWithFeedback(text, button, options = {}) {
    const defaults = {
      successText: 'Copied!',
      successClass: 'ndx-copy-btn--success',
      duration: 2000,
      textSelector: '.ndx-copy-btn__text'
    };
    
    const config = { ...defaults, ...options };
    
    const success = await this.copyText(text);
    
    if (success && button) {
      const textSpan = button.querySelector(config.textSelector);
      if (textSpan) {
        const originalText = textSpan.textContent;
        textSpan.textContent = config.successText;
        button.classList.add(config.successClass);
        
        setTimeout(() => {
          textSpan.textContent = originalText;
          button.classList.remove(config.successClass);
        }, config.duration);
      }
    }
    
    return success;
  },

  /**
   * Copy with screen reader announcement
   */
  async copyWithAnnouncement(text, ariaLiveElement, message) {
    const success = await this.copyText(text);
    
    if (success && ariaLiveElement) {
      ariaLiveElement.textContent = message || 'Copied to clipboard';
      setTimeout(() => {
        ariaLiveElement.textContent = '';
      }, 1000);
    }
    
    return success;
  }
};

// Export globally
window.NDXClipboard = ClipboardManager;

// Example usage in refactored modules:
// button.addEventListener('click', async () => {
//   await window.NDXClipboard.copyWithFeedback(text, button);
// });
```

**Migration Path:**
1. Create `src/assets/js/utils/clipboard.js`
2. Load in base layout
3. Refactor `credentials-card.js` first (most complex)
4. Refactor `walkthrough.js` and `experiment-tracker.js`
5. Remove duplicate implementations

**Estimated Effort:** 3-4 hours  
**Lines Saved:** ~120 lines across 4 files

---

## 3. HIGH: URL Sanitization Duplication

### Pattern Identified
**Identical implementation** in 2 files:

#### Files Affected:
- `src/assets/js/explore-page.js` (lines 50-63)
- `src/assets/js/experiment-tracker.js` (lines 193-204)

#### Duplicated Code:
```javascript
function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '#';
    }
    return parsed.href;
  } catch (e) {
    return '#';
  }
}
```

### Root Cause
**Why:** No shared validation utilities. URL sanitization is a security concern that should be centralized.

**Business Impact:**
- Security fixes need to be applied in multiple places
- Risk of inconsistent validation
- Missing validation in other modules that should have it

### Solution: Create Security Utilities Module

```javascript
// src/assets/js/utils/security.js
/**
 * Security and Validation Utilities
 * Centralized security functions to prevent XSS and injection
 */
const SecurityUtils = {
  /**
   * Sanitize URL to prevent XSS
   * @param {string} url - URL to sanitize
   * @param {Object} options - Validation options
   * @returns {string} Sanitized URL or fallback
   */
  sanitizeUrl(url, options = {}) {
    const defaults = {
      allowedProtocols: ['http:', 'https:'],
      fallback: '#',
      allowedDomains: null // null = allow all, or array of allowed domains
    };
    
    const config = { ...defaults, ...options };
    
    // Type check
    if (!url || typeof url !== 'string') {
      console.warn('[SecurityUtils] Invalid URL type');
      return config.fallback;
    }
    
    try {
      const parsed = new URL(url);
      
      // Protocol validation
      if (!config.allowedProtocols.includes(parsed.protocol)) {
        console.warn('[SecurityUtils] Disallowed protocol:', parsed.protocol);
        return config.fallback;
      }
      
      // Domain allowlist (if specified)
      if (config.allowedDomains && !config.allowedDomains.includes(parsed.hostname)) {
        console.warn('[SecurityUtils] Domain not in allowlist:', parsed.hostname);
        return config.fallback;
      }
      
      return parsed.href;
    } catch (e) {
      console.warn('[SecurityUtils] Invalid URL:', e.message);
      return config.fallback;
    }
  },

  /**
   * Escape HTML to prevent XSS in text content
   */
  escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Validate AWS Console URL (used in deployment flow)
   */
  isValidAWSConsoleUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsed = new URL(url);
      return parsed.hostname.endsWith('.console.aws.amazon.com') &&
             parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  },

  /**
   * Validate return URL against allowlist
   */
  isAllowedReturnUrl(url, allowedDomains) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsed = new URL(url);
      return allowedDomains.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
      );
    } catch (e) {
      return false;
    }
  }
};

// Export globally
window.NDXSecurity = SecurityUtils;

// Example usage:
// const safeUrl = window.NDXSecurity.sanitizeUrl(userInput);
// const escapedText = window.NDXSecurity.escapeHtml(userComment);
```

**Migration Path:**
1. Create `src/assets/js/utils/security.js`
2. Replace `sanitizeUrl()` in `explore-page.js`
3. Replace `sanitizeUrl()` in `experiment-tracker.js`
4. Add to `deploy-url.js` for consistency
5. Audit other modules for missing URL validation

**Estimated Effort:** 2-3 hours  
**Lines Saved:** ~20 lines, but improved security posture

---

## 4. MEDIUM: Inconsistent Error Handling

### Pattern Identified
**Try-catch blocks** used 40+ times with inconsistent error handling:

#### Anti-Patterns Found:
1. **Silent failures** (empty catch blocks)
2. **Inconsistent logging** (console.error vs console.warn vs no logging)
3. **Missing error context** (what operation failed?)
4. **No error recovery strategies**

#### Examples:

**Pattern 1: Silent Catch**
```javascript
// explore-page.js:39
try {
  const parsed = JSON.parse(stored);
  // ...
} catch (e) {
  // Silent - no logging, just returns null
  return null;
}
```

**Pattern 2: Minimal Context**
```javascript
// progress-tracker.js:65
try {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
} catch (e) {
  console.warn('Failed to read progress data:', e);
  return {};
}
```

**Pattern 3: Verbose**
```javascript
// walkthrough.js:196
try {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  return JSON.parse(stored);
} catch (error) {
  console.error('Error loading progress from localStorage:', error);
  return null;
}
```

### Root Cause
**Why:** No standardized error handling strategy or utility functions.

**Business Impact:**
- Difficult to debug production issues
- Inconsistent user experience when errors occur
- Missing error metrics/monitoring

### Solution: Error Handling Utility

```javascript
// src/assets/js/utils/errors.js
/**
 * Centralized Error Handling
 * Provides consistent error logging, recovery, and user feedback
 */
const ErrorHandler = {
  /**
   * Error severity levels
   */
  LEVEL: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal'
  },

  /**
   * Log error with context
   */
  log(level, operation, error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      level,
      operation,
      message: error?.message || String(error),
      context
    };

    // Console output
    const consoleMethod = level === 'error' || level === 'fatal' ? 'error' : 'warn';
    console[consoleMethod](`[NDX ${level.toUpperCase()}] ${operation}:`, error, context);

    // Send to analytics (if available)
    if (window.NDXAnalytics && (level === 'error' || level === 'fatal')) {
      window.NDXAnalytics.track('error_occurred', errorData);
    }

    // Store for debugging (keep last 50 errors)
    this._storeError(errorData);
  },

  /**
   * Store errors in sessionStorage for debugging
   * @private
   */
  _storeError(errorData) {
    try {
      const key = 'ndx_error_log';
      const stored = sessionStorage.getItem(key);
      const log = stored ? JSON.parse(stored) : [];
      log.push(errorData);
      // Keep only last 50
      if (log.length > 50) log.shift();
      sessionStorage.setItem(key, JSON.stringify(log));
    } catch (e) {
      // Ignore if sessionStorage unavailable
    }
  },

  /**
   * Safe JSON parse with error handling
   */
  parseJSON(jsonString, operation, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      this.log(this.LEVEL.WARN, `parseJSON: ${operation}`, error, {
        dataLength: jsonString?.length || 0
      });
      return defaultValue;
    }
  },

  /**
   * Safe localStorage operation
   */
  safeStorage(operation, storageType, key, value = undefined) {
    try {
      const storage = window[storageType];
      if (operation === 'get') {
        return storage.getItem(key);
      } else if (operation === 'set') {
        storage.setItem(key, value);
        return true;
      } else if (operation === 'remove') {
        storage.removeItem(key);
        return true;
      }
    } catch (error) {
      this.log(this.LEVEL.WARN, `${storageType}.${operation}`, error, { key });
      return operation === 'get' ? null : false;
    }
  },

  /**
   * Wrap async operations with error handling
   */
  async wrap(asyncFn, operation, fallbackValue = null) {
    try {
      return await asyncFn();
    } catch (error) {
      this.log(this.LEVEL.ERROR, operation, error);
      return fallbackValue;
    }
  },

  /**
   * Get error log for debugging
   */
  getLog() {
    try {
      const stored = sessionStorage.getItem('ndx_error_log');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Clear error log
   */
  clearLog() {
    try {
      sessionStorage.removeItem('ndx_error_log');
    } catch (e) {
      // Ignore
    }
  }
};

// Export globally
window.NDXErrors = ErrorHandler;

// Example usage:
// const data = window.NDXErrors.parseJSON(jsonString, 'LoadProgress', {});
// const stored = window.NDXErrors.safeStorage('get', 'localStorage', 'key');
// const result = await window.NDXErrors.wrap(asyncFn, 'API Call');
```

**Migration Path:**
1. Create `src/assets/js/utils/errors.js`
2. Update one module at a time
3. Replace try-catch blocks with utility functions
4. Add operation context to all error logs

**Estimated Effort:** 6-8 hours for full migration  
**Lines Changed:** ~80-100 try-catch blocks

---

## 5. MEDIUM: CDK Security Group Pattern Duplication

### Pattern Identified
**Repetitive security group creation** in `networking.ts`:

#### Code Pattern (repeated 5 times):
```typescript
this.someSecurityGroup = new ec2.SecurityGroup(this, 'Name', {
  vpc: this.vpc,
  securityGroupName: `${prefix}-Something-SG`,
  description: `Description for Something (${deploymentMode})`,
  allowAllOutbound: boolean,
});

this.someSecurityGroup.addIngressRule(
  source,
  ec2.Port.tcp(port),
  'Description'
);
```

### Root Cause
**Why:** AWS CDK L2 constructs are verbose by design. No higher-level abstraction created.

**Business Impact:**
- Verbose code (168 lines for 5 security groups)
- Error-prone when adding new security groups
- Harder to enforce consistent naming conventions

### Solution: Security Group Factory Method

```typescript
// cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/networking.ts
/**
 * Factory method for creating security groups with consistent naming
 * @private
 */
private createSecurityGroup(
  id: string,
  name: string,
  description: string,
  allowAllOutbound: boolean,
  ingressRules: Array<{ source: ec2.IPeer | ec2.ISecurityGroup; port: ec2.Port; description: string }> = []
): ec2.SecurityGroup {
  const sg = new ec2.SecurityGroup(this, id, {
    vpc: this.vpc,
    securityGroupName: `${this.prefix}-${name}-SG`,
    description: `${description} (${this.deploymentMode})`,
    allowAllOutbound,
  });

  // Add all ingress rules
  ingressRules.forEach(rule => {
    sg.addIngressRule(rule.source, rule.port, rule.description);
  });

  return sg;
}

// Usage:
this.albSecurityGroup = this.createSecurityGroup(
  'AlbSecurityGroup',
  'ALB',
  'ALB security group for LocalGov Drupal',
  false,
  [
    { source: ec2.Peer.anyIpv4(), port: ec2.Port.tcp(443), description: 'Allow HTTPS from internet' },
    { source: ec2.Peer.anyIpv4(), port: ec2.Port.tcp(80), description: 'Allow HTTP from internet (redirect)' }
  ]
);

this.fargateSecurityGroup = this.createSecurityGroup(
  'FargateSecurityGroup',
  'Fargate',
  'Fargate task security group for LocalGov Drupal',
  true,
  [] // Ingress rules added separately due to circular dependency with ALB
);

// Circular dependency handled separately
this.fargateSecurityGroup.addIngressRule(
  this.albSecurityGroup,
  ec2.Port.tcp(80),
  'Allow HTTP from ALB'
);

this.auroraSecurityGroup = this.createSecurityGroup(
  'AuroraSecurityGroup',
  'Aurora',
  'Aurora MySQL security group for LocalGov Drupal',
  false,
  [
    { source: this.fargateSecurityGroup, port: ec2.Port.tcp(3306), description: 'Allow MySQL from Fargate' }
  ]
);

this.efsSecurityGroup = this.createSecurityGroup(
  'EfsSecurityGroup',
  'EFS',
  'EFS security group for LocalGov Drupal',
  false,
  [
    { source: this.fargateSecurityGroup, port: ec2.Port.tcp(2049), description: 'Allow NFS from Fargate' }
  ]
);
```

**Migration Path:**
1. Add factory method to `NetworkingConstruct` class
2. Refactor one security group at a time
3. Test CloudFormation synthesis after each change
4. Update egress rules separately for complex cases

**Estimated Effort:** 2-3 hours  
**Lines Saved:** ~40 lines in `networking.ts`

---

## 6. LOW: Repeated Global Namespace Exports

### Pattern Identified
**Every module** exports to global window namespace:

#### Files:
- `window.NDXProgress` (progress-tracker.js)
- `window.NDXExperiments` (experiment-tracker.js)
- `window.ExplorationState` (exploration-state.js)
- `window.PhaseState` (phase-state.js)
- `window.NDXAnalytics` (analytics.js)
- `window.NDXRecommendations` (recommendations.js)
- `window.NDXClipboard` (proposed)
- `window.NDXStorage` (proposed)
- `window.NDXSecurity` (proposed)
- `window.NDXErrors` (proposed)

### Root Cause
**Why:** Vanilla JavaScript architecture without module bundler. Global exports are the pattern.

**Business Impact:**
- Namespace pollution
- Risk of naming collisions
- Hard to track dependencies between modules

### Solution: Organize Under Single Namespace

```javascript
// src/assets/js/utils/namespace.js
/**
 * NDX Global Namespace
 * Organizes all NDX utilities and modules under window.NDX
 */
(function() {
  'use strict';

  // Initialize root namespace
  window.NDX = window.NDX || {
    utils: {},
    modules: {},
    version: '1.0.0'
  };

  // Freeze structure to prevent accidental overwrites
  Object.freeze(window.NDX);
  
  console.log('[NDX] Global namespace initialized v' + window.NDX.version);
})();

// Then in each utility module:
// window.NDX.utils.Storage = StorageManager;
// window.NDX.utils.Clipboard = ClipboardManager;
// window.NDX.utils.Security = SecurityUtils;
// window.NDX.utils.Errors = ErrorHandler;

// And in feature modules:
// window.NDX.modules.Progress = { getProgress, setProgress, ... };
// window.NDX.modules.Experiments = { getExperimentData, ... };
// window.NDX.modules.Analytics = { track, ... };
```

**Migration Path:**
1. Create namespace initializer
2. Load as first script
3. Gradually migrate modules to use `window.NDX.*` instead of `window.NDX*`
4. Update all callers
5. Add deprecation warnings for old names

**Estimated Effort:** 4-5 hours  
**Benefit:** Better organization, less namespace pollution

---

## Summary of Recommendations

| Priority | Issue | Files Affected | Lines Saved | Effort | Impact |
|----------|-------|----------------|-------------|---------|--------|
| CRITICAL | LocalStorage duplication | 5 JS files | ~150 | 4-6h | High maintenance cost |
| HIGH | Clipboard duplication | 4 JS files | ~120 | 3-4h | Browser compat fixes |
| HIGH | URL sanitization | 2 JS files | ~20 | 2-3h | Security consistency |
| MEDIUM | Error handling | 20+ JS files | ~100 | 6-8h | Debugging, monitoring |
| MEDIUM | CDK security groups | 1 TS file | ~40 | 2-3h | Code clarity |
| LOW | Global namespace | All JS | ~0 | 4-5h | Organization |

**Total Estimated Effort:** 21-29 hours  
**Total Lines Saved:** ~430 lines  
**Code Quality Improvement:** Significant

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Create `src/assets/js/utils/` directory
2. Implement `storage.js` utility
3. Implement `clipboard.js` utility
4. Implement `security.js` utility
5. Load in base layout before other scripts

### Phase 2: Migration (Week 2)
6. Refactor `progress-tracker.js` to use new utilities
7. Refactor `experiment-tracker.js`
8. Refactor `exploration-state.js`
9. Refactor `phase-state.js`
10. Refactor clipboard implementations

### Phase 3: Quality (Week 3)
11. Implement `errors.js` utility
12. Update error handling in all modules
13. Add CDK security group factory
14. Testing and validation

### Phase 4: Polish (Week 4)
15. Implement namespace organization
16. Documentation updates
17. Code review
18. Final testing

---

## Testing Strategy

### Unit Tests (New Utilities)
```javascript
// tests/unit/storage.test.js
describe('StorageManager', () => {
  it('should detect localStorage availability', () => {
    expect(StorageManager.isAvailable('localStorage')).toBe(true);
  });

  it('should handle JSON serialization errors gracefully', () => {
    const circular = {};
    circular.self = circular;
    expect(StorageManager.setItem('test', circular)).toBe(false);
  });
});

// tests/unit/clipboard.test.js
describe('ClipboardManager', () => {
  it('should copy text to clipboard', async () => {
    const success = await ClipboardManager.copyText('test');
    expect(success).toBe(true);
  });

  it('should fall back when Clipboard API unavailable', async () => {
    // Mock missing API
    const success = await ClipboardManager.copyText('test');
    expect(success).toBe(true); // Fallback should work
  });
});
```

### Integration Tests
- Test refactored modules still work correctly
- Verify localStorage persistence across page reloads
- Check clipboard in different browsers
- Validate error logging integrates with analytics

### Browser Compatibility Testing
- Chrome/Edge (modern Clipboard API)
- Firefox (modern Clipboard API)
- Safari (may need fallback)
- IE11 (fallback only) - **Note:** Check browser support policy

---

## Long-Term Benefits

1. **Maintainability**: Single source of truth for common patterns
2. **Consistency**: Uniform behavior across features
3. **Testability**: Centralized utilities are easier to unit test
4. **Onboarding**: New developers have clear patterns to follow
5. **Security**: Centralized validation reduces XSS risk
6. **Monitoring**: Consistent error handling enables better analytics
7. **Performance**: Future optimization in one place benefits all features

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes during refactor | High | Medium | Incremental migration, thorough testing |
| Browser compatibility issues | Medium | Low | Comprehensive fallback mechanisms |
| Performance regression | Low | Low | Utilities are thin wrappers, minimal overhead |
| Team adoption resistance | Medium | Low | Clear documentation, code review |

---

## Conclusion

The codebase exhibits **moderate to high duplication** primarily in JavaScript utility functions. The recommended refactoring would:

- Reduce codebase by ~430 lines
- Improve maintainability significantly
- Establish consistent patterns for future development
- Enhance security posture
- Enable better error monitoring

**Recommendation:** Proceed with Phase 1 and Phase 2 immediately (utilities + migration). Phase 3 and Phase 4 can be scheduled based on team capacity.

---

**Report Author:** Code Review Agent  
**Review Date:** 2026-01-06  
**Next Review:** After Phase 2 completion
