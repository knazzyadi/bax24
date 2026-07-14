// src/lib/api/users.api.ts
import { ApiClient } from './api-client';
import type { SharedUser, SharedUserFilters, SharedPaginatedResponse } from '@/lib/shared/types/user';
import type { UserFormData } from '@/app/[locale]/(dashboard)/users/types';

export class UsersApi {
  static async getUsers(
    filters?: SharedUserFilters,
    signal?: AbortSignal
  ): Promise<SharedPaginatedResponse<SharedUser>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.roleId) params.set('roleId', filters.roleId);
    if (filters?.status !== undefined) params.set('status', String(filters.status));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const url = `/api/company/users${params.toString() ? `?${params.toString()}` : ''}`;
    return ApiClient.get<SharedPaginatedResponse<SharedUser>>(url, signal);
  }

  static async createUser(data: UserFormData, signal?: AbortSignal) {
    return ApiClient.post<SharedUser>('/api/company/users', data, signal);
  }

  static async updateUser(id: string, data: Partial<UserFormData>, signal?: AbortSignal) {
    return ApiClient.put<SharedUser>(`/api/company/users/${id}`, data, signal);
  }

  static async deleteUser(id: string, signal?: AbortSignal) {
    return ApiClient.delete<{ success: boolean }>(`/api/company/users/${id}`, signal);
  }

  static async toggleUserStatus(id: string, signal?: AbortSignal) {
    return ApiClient.post<SharedUser>(`/api/company/users/toggle-status/${id}`, undefined, signal);
  }

  static async resendInvite(id: string, signal?: AbortSignal) {
    return ApiClient.post<{ success: boolean }>(`/api/company/users/invite/${id}`, undefined, signal);
  }
}