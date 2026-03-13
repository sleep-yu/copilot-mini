/**
 * 通用 HTTP 客户端
 * 对应原项目：src/common/clients/http.client.ts
 *
 * 原项目使用 @casstime/node-http-client 封装，集成了 CLS、Apollo 配置、请求日志等
 * 这里基于原生 fetch 实现轻量版，保留相同的接口形状
 */

import logger from "../logger";

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  timeout?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, defaultTimeout = 20_000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  async get<T = unknown>(path: string, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(path, config?.params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config?.timeout ?? this.defaultTimeout);

    try {
      logger.debug(`[HttpClient] GET ${url}`);
      const res = await fetch(url, {
        method: "GET",
        headers: config?.headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async post<T = unknown>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = this.buildUrl(path, config?.params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config?.timeout ?? this.defaultTimeout);

    try {
      logger.debug(`[HttpClient] POST ${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...config?.headers },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * SSE 流式请求
   * 对应原项目中流式 LLM 调用
   */
  async *sse<T = unknown>(path: string, data?: unknown, config?: RequestConfig): AsyncIterable<T> {
    const url = this.buildUrl(path, config?.params);
    logger.debug(`[HttpClient] SSE ${url}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...config?.headers },
      body: JSON.stringify(data),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("[HttpClient] SSE: no response body");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const payload = trimmed.slice(6);
            if (payload !== "[DONE]") {
              yield JSON.parse(payload) as T;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    }
    return url.toString();
  }
}
