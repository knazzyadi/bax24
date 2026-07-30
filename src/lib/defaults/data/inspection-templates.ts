// src/lib/defaults/data/inspection-templates.ts

export interface DefaultInspectionTemplate {
  code: string; // المفتاح الطبيعي
  sectionCode: string; // مرجع إلى القسم (FMS أو SAF)
  name: string;
  nameAr: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export const defaultInspectionTemplates: DefaultInspectionTemplate[] = [
  {
    code: "FMS-CA",
    sectionCode: "FMS",
    name: "Inspection of Critical Areas",
    nameAr: "فحص المناطق الحرجة",
    description: "- تشمل هذه المناطق: غرف التحكم، غرف الكهرباء والمحولات، مستودعات المواد الكيميائية، الغازية، المختبرات، مناطق تخزين الأغذية الحساسة، غرف الخوادم (السيرفرات)، ومنشآت معالجة المياه\n- These areas include: Control rooms, electrical and transformer rooms, chemical/gas storage warehouses, laboratories, sensitive food storage areas, server rooms, and water treatment facilities",
    sortOrder: 0,
    isActive: true,
  },
  {
    code: "FMS-PA",
    sectionCode: "FMS",
    name: "Inspection of Public Areas",
    nameAr: "فحص المناطق العامة",
    description: "- تشمل هذه المناطق: المداخل، الردهات، الممرات، دورات المياه العامة، المصاعد، مواقف السيارات، والمرافق الترفيهية\n- These areas include: Entrances, lobbies, corridors, public restrooms, elevators, parking lots, and recreational facilities",
    sortOrder: 0,
    isActive: true,
  },
  {
    code: "SAF-PA",
    sectionCode: "SAF",
    name: "Public Areas Safety",
    nameAr: "السلامة بالمناطق العامة",
    description: "قسم مخصص لتأمين الحماية والوقاية من المخاطر في المساحات المشتركة، عبر مراقبة المعايير البيئية والصحية، وإدارة الحشود، والاستجابة للطوارئ لضمان سلامة جميع الزوار.",
    sortOrder: 0,
    isActive: true,
  },
  {
    code: "SAF-CA",
    sectionCode: "SAF",
    name: "Critical Areas Safety",
    nameAr: "السلامة بالمناطق الحرجة",
    description: "قسم متخصص بإدارة المخاطر العالية في البيئات الحساسة (مثل غرف العمليات، العناية المركزة، والمختبرات)، يركز على مكافحة العدوى، سلامة الغازات والكهرباء، والجاهزية الفائقة للطوارئ لحماية الأرواح.",
    sortOrder: 0,
    isActive: true,
  },
];