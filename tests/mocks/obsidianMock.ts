// Lightweight test-only mock for the Obsidian API pieces we use.
// This avoids bundler resolution issues with the real 'obsidian' package inside Vitest.

export interface RequestUrlParam {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface RequestUrlResponse {
  status: number;
  json: unknown;
  text?: string;
}

export async function requestUrl(_params: RequestUrlParam): Promise<RequestUrlResponse> {
  // Return minimal shape expected by transformation.ts
  return {
    status: 200,
    json: {},
    text: ''
  };
}
