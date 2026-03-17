import * as React from "react"; // استيراد مكتبة React الأساسية
import { cva, type VariantProps } from "class-variance-authority"; // استيراد أداة إدارة المتغيرات cva

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// تعريف متغيرات تصميم التنبيه (Alert Variants)
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground", // النمط الافتراضي
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive", // نمط الخطأ/الحذف
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// إنشاء مكون التنبيه الرئيسي باستخدام forwardRef
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} /> // حاوية التنبيه مع دور الوصول alert
));
Alert.displayName = "Alert";

// إنشاء مكون عنوان التنبيه
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} /> // وسم h5 لتنسيق العنوان
  ),
);
AlertTitle.displayName = "AlertTitle";

// إنشاء مكون وصف التنبيه
const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} /> // حاوية النص الوصفي
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription }; // تصدير مكونات التنبيه
