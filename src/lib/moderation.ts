/**
 * Utility to detect and sanitize off-platform contact information
 * to prevent disintermediation before formal trial and escrow execution.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,6}/g;
const TELEGRAM_WHATSAPP_REGEX = /(t\.me|wa\.me|whatsapp\.com|chat\.whatsapp\.com)\/[a-zA-Z0-9_]+/gi;

export interface ModerationResult {
  hasRestrictedContent: boolean;
  cleanText: string;
  violations: string[];
}

export function inspectAndFilterMessage(rawText: string, allowUnrestricted: boolean = false): ModerationResult {
  if (allowUnrestricted) {
    return {
      hasRestrictedContent: false,
      cleanText: rawText,
      violations: [],
    };
  }

  const violations: string[] = [];
  let cleanText = rawText;

  if (EMAIL_REGEX.test(cleanText)) {
    violations.push('Personal Email Address');
    cleanText = cleanText.replace(EMAIL_REGEX, '[CONTACT HIDDEN: USE IN-APP MESSAGING]');
  }

  if (PHONE_REGEX.test(cleanText)) {
    // Basic guard to prevent masking simple short integers
    const matches = cleanText.match(PHONE_REGEX);
    if (matches && matches.some((m) => m.replace(/\D/g, '').length >= 10)) {
      violations.push('Direct Phone Number');
      cleanText = cleanText.replace(PHONE_REGEX, '[PHONE NUMBER MASKED]');
    }
  }

  if (TELEGRAM_WHATSAPP_REGEX.test(cleanText)) {
    violations.push('External Chat Group / Link');
    cleanText = cleanText.replace(TELEGRAM_WHATSAPP_REGEX, '[EXTERNAL LINK MASKED]');
  }

  return {
    hasRestrictedContent: violations.length > 0,
    cleanText,
    violations,
  };
}