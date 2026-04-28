// src/lib/constants/priorities.ts

export interface Priority {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  color: string;
  glowColor: string;
}

export const PRIORITIES: Priority[] = [
  {
    id: 'critical',
    name: 'CRITICAL',
    nameAr: 'عاجل جداً',
    level: 1,
    color: '#ef4444', // red-500
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'high',
    name: 'HIGH',
    nameAr: 'عالي',
    level: 2,
    color: '#f97316', // orange-500
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'medium',
    name: 'MEDIUM',
    nameAr: 'متوسط',
    level: 3,
    color: '#eab308', // yellow-500
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'low',
    name: 'LOW',
    nameAr: 'منخفض',
    level: 4,
    color: '#10b981', // emerald-500
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
];

export function getPriorityById(id: string): Priority | undefined {
  return PRIORITIES.find(p => p.id === id);
}

export function getPriorityByName(name: string): Priority | undefined {
  return PRIORITIES.find(p => p.name === name || p.nameAr === name);
}