// fix-api-imports.js
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const API_DIR = path.join(PROJECT_ROOT, 'src', 'app', 'api');

// التحويلات المطلوبة
const replacements = [
  // 1. استبدال استيراد auth-helper القديم بالجديد
  {
    from: /from ['"]@\/lib\/auth-helper['"]/g,
    to: "from '@/lib/auth/auth-helper'"
  },
  // 2. استبدال getSession() بـ getAuthSession()
  {
    from: /\bgetSession\(\)/g,
    to: "getAuthSession()"
  },
  // 3. استبدال session.user. بـ session.
  {
    from: /session\.user\./g,
    to: "session."
  },
  // 4. استبدال session?.user بـ session
  {
    from: /session\?\.user/g,
    to: "session"
  },
];

// جلب جميع ملفات route.ts
function getAllRouteFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...getAllRouteFiles(filePath));
    } else if (file === 'route.ts' || file === 'route.tsx') {
      results.push(filePath);
    }
  });
  return results;
}

// تطبيق التعديلات
function applyReplacements() {
  console.log('🔍 Searching for API routes...');
  const apiFiles = getAllRouteFiles(API_DIR);
  console.log(`📁 Found ${apiFiles.length} API route files.`);

  let modifiedCount = 0;

  apiFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
      const newContent = content.replaceAll(from, to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log(`✅ Updated: ${path.relative(PROJECT_ROOT, filePath)}`);
    }
  });

  console.log(`\n🎯 Done! Modified ${modifiedCount} file(s).`);
  console.log('⚠️ Remember to add `requirePermission` to `src/lib/auth/auth-helper.ts` if it\'s missing.');
}

// ✅ التشغيل
if (!fs.existsSync(API_DIR)) {
  console.error('❌ Error: API directory not found!');
  process.exit(1);
}

applyReplacements();