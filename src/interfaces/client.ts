export interface IHttpClient {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  sse<T = unknown>(url: string, data?: unknown, config?: RequestConfig): AsyncIterable<T>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number>;
}
