// src/lib/services/locations/branches.service.ts
import { BranchFormData } from '@/app/[locale]/(super-admin)/super-admin/branches/types';

const API_BASE = '/api/locations/branches';

export const BranchService = {
  /**
   * جلب جميع الفروع
   */
  async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'فشل جلب الفروع');
    }
    return res.json();
  },

  /**
   * إنشاء فرع جديد
   */
  async create(data: BranchFormData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء الفرع');
    }
    return res.json();
  },

  /**
   * تحديث فرع
   */
  async update(id: string, data: BranchFormData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تحديث الفرع');
    }
    return res.json();
  },

  /**
   * حذف فرع
   */
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف الفرع');
    }
    return res.json();
  },
};