//src\components\shared\form\LocationSection.tsx
//حاوية الموقع اللوكيشن
"use client";

import { cn } from "@/lib/utils";

interface RoomInfo {
  name: string;
  code?: string;
  fullCode?: string;
}

interface Props {
  title: string;
  children: React.ReactNode;
  room?: RoomInfo | null;
  isRtl?: boolean;
}

export function LocationSection({ title, children, room, isRtl }: Props) {
  return (
    <div className="bg-card border border-border rounded-md p-6 shadow-sm space-y-4">
      
      {/* العنوان */}
      <h3 className="text-foreground font-black text-lg uppercase tracking-widest flex items-center gap-2">
        📍 {title}
      </h3>

      {/* المحتوى (المبنى / الدور / الغرفة) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {children}
      </div>

      {/* بطاقة الغرفة (الجديدة) */}
      {room && (
        <div
          className={cn(
            "mt-4 w-full p-4 rounded-md border shadow-sm transition-all",
            "bg-purple-500/10 border-purple-500/30"
          )}
          style={{
            boxShadow: "0 0 18px rgba(168,85,247,0.35)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            
            <span className="text-sm font-semibold text-foreground">
              {isRtl ? "الغرفة المختارة:" : "Selected Room:"}
            </span>

            <span className="text-sm font-mono font-bold text-purple-400">
              {room.name} ({room.fullCode || room.code})
            </span>

          </div>
        </div>
      )}
    </div>
  );
}