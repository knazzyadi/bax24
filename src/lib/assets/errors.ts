// src/lib/assets/errors.ts

// ============================================================
// أخطاء مخصصة للأصول
// ============================================================

export class AssetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetError';
  }
}

export class AssetNotFoundError extends AssetError {
  constructor(message = 'الأصل غير موجود') {
    super(message);
    this.name = 'AssetNotFoundError';
  }
}

export class AssetDuplicateError extends AssetError {
  constructor(message = 'الأصل مكرر') {
    super(message);
    this.name = 'AssetDuplicateError';
  }
}

export class AssetValidationError extends AssetError {
  constructor(message = 'بيانات الأصل غير صحيحة') {
    super(message);
    this.name = 'AssetValidationError';
  }
}

export class AssetBusinessError extends AssetError {
  constructor(message = 'خطأ في منطق الأعمال') {
    super(message);
    this.name = 'AssetBusinessError';
  }
}

export class AssetPermissionError extends AssetError {
  constructor(message = 'لا تملك الصلاحية المطلوبة') {
    super(message);
    this.name = 'AssetPermissionError';
  }
}

// ============================================================
// معالج الأخطاء للـ API
// ============================================================

export function handlePrismaError(error: unknown): never {
  if (error instanceof AssetError) throw error;
  console.error('Prisma/Asset error:', error);
  throw new AssetError('حدث خطأ في قاعدة البيانات');
}

export function getErrorResponse(error: unknown) {
  if (error instanceof AssetError) {
    return {
      body: { error: error.message },
      status: error instanceof AssetNotFoundError ? 404 : 400,
    };
  }
  console.error('Unexpected error:', error);
  return {
    body: { error: 'حدث خطأ غير متوقع' },
    status: 500,
  };
}

export function getErrorResponseStatus(error: unknown): { body: { error: string }; status: number } {
  return getErrorResponse(error);
}