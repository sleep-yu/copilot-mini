/**
 * LLM 客户端
 * 对应原项目：src/clients/llm/index.ts
 * 
 * 重构后：基于 common/clients/http.client.ts 实现
 */

import { HttpClient } from "../../common/clients/http.client";
import { IHttpClient, RequestConfig } from "../../interfaces";

export class LLMClient implements IHttpClient {
  private httpClient: HttpClient;

  constructor(baseUrl: string) {
    this.httpClient = new HttpClient(baseUrl);
  }

  async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.httpClient.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.httpClient.post<T>(url, data, config);
  }

  async *sse<T = unknown>(url: string, data?: unknown, config?: RequestConfig): AsyncIterable<T> {
    yield* this.httpClient.sse<T>(url, data, config);
  }
}
