// src/lib/defaults/data/inspection-sections.ts

export interface DefaultInspectionSection {
  code: string; // المفتاح الطبيعي
  name: string;
  nameAr: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export const defaultInspectionSections: DefaultInspectionSection[] = [
  {
    code: "FMS",
    name: "Facilities Management",
    nameAr: "إدارة المرافق",
    description: "- إن مسؤولية إدارة المرافق هي استدامة تشغيل المجمع الطبي بكفاءة عالية، وحماية أصوله الفنية، لضمان بيئة رعاية صحية آمنة ومستمرة للمرضى\n- The responsibility of facilities management is to sustainably operate the medical complex with high efficiency and protect its technical assets to ensure a safe, continuous healthcare environment for patients",
    sortOrder: 0,
    isActive: true,
  },
  {
    code: "SAF",
    name: "Safety Management",
    nameAr: "إدارة السلامة",
    description: "- إن مسؤولية إدارة السلامة هي حماية الأرواح والممتلكات بالمجمع الطبي، والحد من المخاطر، عبر تطبيق معايير السلامة المهنية والدفاع المدني بصرامة\n- The responsibility of the safety management is to protect lives and property in the medical complex and mitigate risks through strict application of occupational safety and civil defense standards",
    sortOrder: 0,
    isActive: true,
  },
];