import * as React from "react"; // استيراد مكتبة React الأساسية

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// إنشاء مكون حقل الإدخال باستخدام forwardRef
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type} // تحديد نوع حقل الإدخال
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", // تنسيقات CSS الأساسية
          className, // دمج الأصناف الإضافية الممررة
        )}
        ref={ref} // ربط المرجع بالعنصر
        {...props} // تمرير باقي الخصائص
      />
    );
  },
);
Input.displayName = "Input"; // تحديد اسم العرض للمكون

export { Input }; // تصدير المكون
