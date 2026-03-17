import * as React from "react"; // استيراد مكتبة React الأساسية
import * as LabelPrimitive from "@radix-ui/react-label"; // استيراد مكونات Label الأساسية من Radix UI
import { cva, type VariantProps } from "class-variance-authority"; // استيراد أداة إدارة المتغيرات cva

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// تعريف متغيرات تصميم العنوان (Label Variants)
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

// إنشاء مكون العنوان باستخدام forwardRef
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} /> // إرجاع مكون الجذر مع التنسيقات
));
Label.displayName = LabelPrimitive.Root.displayName; // تحديد اسم العرض للمكون

export { Label }; // تصدير المكون
