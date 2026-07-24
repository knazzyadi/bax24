// src/lib/services/locations/buildings.service.ts
import { BuildingFormData } from '@/app/[locale]/(dashboard)/locations/buildings/types';

const API_BASE = '/api/locations/buildings';

export const BuildingService = {
  async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل جلب المباني');
    }
    return res.json();
  },

  async create(data: BuildingFormData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء المبنى');
    }
    return res.json();
  },

  async update(id: string, data: BuildingFormData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث المبنى');
    }
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف المبنى');
    }
    return res.json();
  },
};