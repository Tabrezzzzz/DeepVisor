export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}
