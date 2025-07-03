// Cron job configuration
export const CRON_CONFIG = {
  // Rate limiting settings
  RATE_LIMIT: {
    DELAY_BETWEEN_LEADS_MS: 30000, // 30 seconds between leads
    MAX_RETRIES: 3, // Maximum retries for API calls
    BASE_RETRY_DELAY_MS: 5000, // Base delay for exponential backoff (5s, 10s, 20s)
  },
  
  // Processing settings
  PROCESSING: {
    MAX_LEADS_PER_RUN: 50, // Maximum leads to process in one cron run
    SKIP_RECENT_HOURS: 24, // Skip leads analyzed in last 24 hours
    TIMEOUT_MS: 300000, // 5 minutes timeout for entire job
  },
  
  // API settings
  API: {
    OPENROUTER_MODEL: 'deepseek/deepseek-r1:free',
    OPENROUTER_TEMPERATURE: 0.5,
    OPENROUTER_MAX_TOKENS: 1000,
  },
  
  // Logging
  LOGGING: {
    ENABLE_VERBOSE: true,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  }
} as const;

// Helper function to get delay between leads
export function getDelayBetweenLeads(): number {
  return CRON_CONFIG.RATE_LIMIT.DELAY_BETWEEN_LEADS_MS;
}

// Helper function to get retry configuration
export function getRetryConfig() {
  return {
    maxRetries: CRON_CONFIG.RATE_LIMIT.MAX_RETRIES,
    baseDelay: CRON_CONFIG.RATE_LIMIT.BASE_RETRY_DELAY_MS,
  };
}

// Helper function to check if lead should be skipped
export function shouldSkipLead(lastAnalyzedAt: string | null): boolean {
  if (!lastAnalyzedAt) return false;
  
  const lastAnalyzed = new Date(lastAnalyzedAt);
  const hoursSinceAnalysis = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceAnalysis < CRON_CONFIG.PROCESSING.SKIP_RECENT_HOURS;
} 