// src/lib/api/api-client.ts
export class ApiClient {
  private static async request<T>(
    url: string,
    options: RequestInit & { signal?: AbortSignal }
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  static async get<T>(url: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(url, { method: 'GET', signal });
  }

  static async post<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  static async put<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  static async delete<T>(url: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', signal });
  }
}