import { useToast } from "@/hooks/use-toast"; // استيراد الخطاف المخصص لإدارة التنبيهات
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"; // استيراد مكونات التنبيه

// مكون التوستر (Toaster) المسؤول عن عرض كافة التنبيهات النشطة
export function Toaster() {
  const { toasts } = useToast(); // استخراج قائمة التنبيهات من الخطاف

  return (
    <ToastProvider> {/* مزود سياق التنبيهات */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}> {/* مكون التنبيه الفردي */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>} {/* عرض العنوان إذا وجد */}
              {description && <ToastDescription>{description}</ToastDescription>} {/* عرض الوصف إذا وجد */}
            </div>
            {action} {/* عرض الإجراء الإضافي إن وجد */}
            <ToastClose /> {/* زر الإغلاق */}
          </Toast>
        );
      })}
      <ToastViewport /> {/* منطقة عرض التنبيهات على الشاشة */}
    </ToastProvider>
  );
}
