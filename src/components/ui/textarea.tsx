import * as React from "react"; // استيراد مكتبة React الأساسية

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {} // تعريف واجهة الخصائص لمكون مساحة النص

// مكون مساحة النص (Textarea) لإدخال نصوص متعددة الأسطر
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", // تنسيقات المظهر والتركيز والحالة المعطلة
        className,
      )}
      ref={ref} // ربط المرجع بالعنصر
      {...props} // تمرير باقي الخصائص
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea }; // تصدير مكون مساحة النص
