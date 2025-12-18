export const APP_VERSION = '2.1.0';
export const APP_NAME = 'Tzotzil Bible';

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export const getAnthropicApiKey = (): string | null => {
  if (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  return null;
};
