export type RecoveryAction = 'retry' | 'openSettings' | 'none';

export class SummarizerError extends Error {
  userMessage: string;
  recoveryAction: RecoveryAction;
  constructor(message: string, userMessage: string, recoveryAction: RecoveryAction = 'none') {
    super(message);
    this.name = 'SummarizerError';
    this.userMessage = userMessage;
    this.recoveryAction = recoveryAction;
  }
}

export class InvalidUrlError extends SummarizerError {
  constructor() {
    super('Invalid URL', "Couldn't find a YouTube link in that URL");
    this.name = 'InvalidUrlError';
  }
}

export class NetworkError extends SummarizerError {
  constructor() {
    super('Network failure', 'No internet connection. Check and try again.', 'retry');
    this.name = 'NetworkError';
  }
}

export class ApiKeyError extends SummarizerError {
  provider: string;
  constructor(provider: string) {
    super('API key rejected', `Your ${provider} API key isn't working. Update it in Settings.`, 'openSettings');
    this.name = 'ApiKeyError';
    this.provider = provider;
  }
}

export class TranscriptNotFoundError extends SummarizerError {
  constructor() {
    super('No captions', "This video doesn't have captions available.");
    this.name = 'TranscriptNotFoundError';
  }
}

export class RateLimitError extends SummarizerError {
  constructor() {
    super('Rate limited', "You've been rate limited. Wait a moment and try again.", 'retry');
    this.name = 'RateLimitError';
  }
}

export async function apiFetch(url: string, options: RequestInit, providerName: string): Promise<Response> {
  try {
    const resp = await fetch(url, options);
    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) throw new ApiKeyError(providerName);
      if (resp.status === 429) throw new RateLimitError();
      throw new SummarizerError(`${providerName} API error (${resp.status})`, 'Something went wrong. Try again.', 'retry');
    }
    return resp;
  } catch (err: any) {
    if (err instanceof SummarizerError) throw err;
    if (err.message?.includes('Network request failed') || err.message?.includes('fetch')) throw new NetworkError();
    throw new SummarizerError(err.message, 'Something went wrong. Try again.', 'retry');
  }
}
