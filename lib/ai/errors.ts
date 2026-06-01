export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly rawResponse?: string
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class AISchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
    public readonly rawText?: string
  ) {
    super(message);
    this.name = "AISchemaValidationError";
  }
}

export class AIJsonParseError extends Error {
  constructor(message: string, public readonly rawText: string) {
    super(message);
    this.name = "AIJsonParseError";
  }
}
