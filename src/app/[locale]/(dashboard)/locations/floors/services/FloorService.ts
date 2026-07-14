// src/app/[locale]/(dashboard)/locations/floors/services/FloorService.ts

import { FloorFormData } from '../types';

const API_BASE = '/api/locations/floors';

export const FloorService = {
  async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل جلب الأدوار');
    }
    return res.json();
  },

  async create(data: FloorFormData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء الدور');
    }
    return res.json();
  },

  async update(id: string, data: FloorFormData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث الدور');
    }
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف الدور');
    }
    return res.json();
  },
};