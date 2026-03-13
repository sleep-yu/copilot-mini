import { IHttpClient, RequestConfig } from '../../interfaces';

export class LLMClient implements IHttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(url, config?.params), {
      method: 'GET',
      headers: config?.headers,
    });
    return response.json() as Promise<T>;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await fetch(this.buildUrl(url, config?.params), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<T>;
  }

  async *sse<T = unknown>(url: string, data?: unknown, config?: RequestConfig): AsyncIterable<T> {
    const response = await fetch(this.buildUrl(url, config?.params), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      body: JSON.stringify(data),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data !== '[DONE]') {
            yield JSON.parse(data) as T;
          }
        }
      }
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }
}
