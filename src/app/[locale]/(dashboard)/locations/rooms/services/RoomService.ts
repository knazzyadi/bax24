// src/app/[locale]/(dashboard)/locations/rooms/services/RoomService.ts

import { RoomFormData } from '../types';

const API_BASE = '/api/locations/rooms';

export const RoomService = {
  async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل جلب الغرف');
    }
    return res.json();
  },

  async create(data: RoomFormData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء الغرفة');
    }
    return res.json();
  },

  async update(id: string, data: RoomFormData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث الغرفة');
    }
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف الغرفة');
    }
    return res.json();
  },
};