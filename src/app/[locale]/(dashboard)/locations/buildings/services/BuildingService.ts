// src/app/[locale]/(dashboard)/locations/buildings/services/BuildingService.ts

import { BuildingFormData } from '../types';

const API_BASE = '/api/locations/buildings';

export const BuildingService = {
  /**
   * جلب جميع المباني
   */
  async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل جلب المباني');
    }
    return res.json();
  },

  /**
   * إنشاء مبنى جديد
   */
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

  /**
   * تحديث مبنى
   */
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

  /**
   * حذف مبنى
   */
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