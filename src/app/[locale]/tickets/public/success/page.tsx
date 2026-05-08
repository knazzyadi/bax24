export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800">تم إرسال البلاغ بنجاح</h1>
        <p className="text-gray-600 mt-2">سيتواصل معكم فريق الدعم في أقرب وقت.</p>
        <button
          onClick={() => window.close()}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full"
        >
          إغلاق النافذة
        </button>
      </div>
    </div>
  );
}