const fs = require('fs');
const path = require('path');

// المسار الجذر لملفات API
const apiDir = path.join(__dirname, 'src', 'app', 'api');

// دوال مساعدة
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('route.ts') || file.endsWith('route.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// الحصول على جميع ملفات route.ts
const allFiles = getAllFiles(apiDir);
console.log(`✅ تم العثور على ${allFiles.length} ملف route.ts`);

let modifiedCount = 0;

allFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. حذف استيرادات getSession و requirePermission القديمة
  content = content.replace(/import\s*\{\s*getSession\s*,\s*requirePermission\s*\}\s*from\s*['"]@\/lib\/auth-helper['"]\s*;?/g, '');
  content = content.replace(/import\s*\{\s*getSession\s*\}\s*from\s*['"]@\/lib\/auth-helper['"]\s*;?/g, '');
  content = content.replace(/import\s*\{\s*requirePermission\s*\}\s*from\s*['"]@\/lib\/auth-helper['"]\s*;?/g, '');
  content = content.replace(/import\s*\{\s*getSession\s*,\s*requirePermission\s*\}\s*from\s*['"]@\/lib\/permissions['"]\s*;?/g, '');
  content = content.replace(/import\s*\{\s*requirePermission\s*\}\s*from\s*['"]@\/lib\/permissions['"]\s*;?/g, '');

  // 2. حذف دالة getAuthAndPermissions إذا وجدت
  content = content.replace(/async function getAuthAndPermissions\(\)\s*\{[\s\S]*?\n\}/g, '');

  // 3. إضافة استيراد الدوال الجديدة (إذا كان الملف يستخدم auth)
  const usesSession = original.includes('await getSession()') || 
                      original.includes('await requirePermission') ||
                      original.includes('const session = await getSession()') ||
                      original.includes('session = await getSession()');

  if (usesSession) {
    // حذف أي استيراد قديم لـ auth-helper و إضافة الاستيراد الجديد
    const importRegex = /(import\s+[^;]+;\s*)/;
    const match = content.match(importRegex);
    const helperImport = "import { getAuthenticatedSession, checkPermission } from '@/lib/auth-helper';\n";
    
    // تأكد من عدم وجود استيراد مكرر
    if (!content.includes("import { getAuthenticatedSession, checkPermission } from '@/lib/auth-helper'")) {
      if (match) {
        content = content.replace(match[0], match[0] + helperImport);
      } else {
        content = helperImport + content;
      }
    }

    // 4. استبدال await getSession() بـ await getAuthenticatedSession()
    content = content.replace(/await\s+getSession\(\)/g, 'await getAuthenticatedSession()');

    // 5. استبدال const session = await getSession() بـ const session = await getAuthenticatedSession()
    content = content.replace(/const\s+session\s*=\s*await\s+getSession\(\)/g, 'const session = await getAuthenticatedSession()');
    content = content.replace(/let\s+session\s*=\s*await\s+getSession\(\)/g, 'let session = await getAuthenticatedSession()');

    // 6. استبدال await requirePermission(...) بـ await checkPermission(...)
    content = content.replace(/await\s+requirePermission\(\s*([^,)]+)\s*\)/g, 'await checkPermission($1)');

    // 7. استبدال await requirePermission(..., session) بـ await checkPermission(...)
    content = content.replace(/await\s+requirePermission\(\s*([^,]+)\s*,\s*session\s*\)/g, 'await checkPermission($1)');
    content = content.replace(/await\s+requirePermission\(\s*([^,]+)\s*,\s*session\.user\.id\s*\)/g, 'await checkPermission($1)');
  }

  // إذا تغير المحتوى، احفظ الملف
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`✅ تم تعديل: ${path.relative(__dirname, filePath)}`);
  }
});

console.log(`\n✅ تم تعديل ${modifiedCount} ملف API بنجاح.`);