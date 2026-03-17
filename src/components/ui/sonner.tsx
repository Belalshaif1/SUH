import { useTheme } from "next-themes"; // استيراد خطاف التحكم في السمة (مظلم/مضيء)
import { Toaster as Sonner, toast } from "sonner"; // استيراد مكتبة Sonner للتنبيهات

type ToasterProps = React.ComponentProps<typeof Sonner>; // تعريف نوع الخصائص بناءً على مكون Sonner

// مكون التوستر الخاص بـ Sonner مع التنسيقات المخصصة
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme(); // استخراج السمة الحالية

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]} // تمرير السمة للمكون
      className="toaster group" // فئة CSS الأساسية
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg", // تنسق التنبيه الفردي
          description: "group-[.toast]:text-muted-foreground", // تنسيق الوصف
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground", // تنسيق زر الإجراء
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground", // تنسيق زر الإلغاء
        },
      }}
      {...props} // تمرير باقي الخصائص
    />
  );
};

export { Toaster, toast }; // تصدير المكون ودالة التنبيه
