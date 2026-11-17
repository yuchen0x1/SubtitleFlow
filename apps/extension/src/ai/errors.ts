export class ProviderUnavailableError extends Error {
  constructor(message = 'AI provider is not configured') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export class ProviderTimeoutError extends Error {
  constructor(message = 'AI provider request timed out') {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}
