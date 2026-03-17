import * as React from "react"; // استيراد مكتبة React الأساسية
import * as ProgressPrimitive from "@radix-ui/react-progress"; // استيراد مكونات شريط التقدم من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// مكون شريط التقدم (Progress)
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)} // تنسيق الحاوية الخلفية للشريط
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all" // تنسيق مؤشر التقدم الملون مع تأثير الحركة
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }} // تحديد نسبة التقدم عبر التحريك الأفقي
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress }; // تصدير مكون شريط التقدم
