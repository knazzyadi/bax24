// src/components/ui/TreeIcons.tsx
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Dot,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

export const TreeIcons = {
  // أيقونات المستويات
  section: (isExpanded: boolean) => 
    isExpanded ? <FolderOpen className="h-4 w-4 text-indigo-600" /> : <Folder className="h-4 w-4 text-indigo-500" />,
  template: <Folder className="h-4 w-4 text-blue-500" />,
  category: <FileText className="h-4 w-4 text-emerald-500" />,
  item: <Dot className="h-4 w-4 text-amber-500" />,
  
  // أيقونات التحكم
  expand: <ChevronDown className="h-3.5 w-3.5 text-slate-500" />,
  collapse: <ChevronRight className="h-3.5 w-3.5 text-slate-500" />,
  add: <Plus className="h-3.5 w-3.5" />,
  edit: <Pencil className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
};