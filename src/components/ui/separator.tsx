import * as React from "react"; // استيراد مكتبة React الأساسية
import * as SeparatorPrimitive from "@radix-ui/react-separator"; // استيراد مكون الفاصل الأساسي من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// إنشاء مكون الفاصل باستخدام forwardRef
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref} // ربط المرجع
    decorative={decorative} // تحديد ما إذا كان الفاصل للزينة فقط (لإمكانية الوصول)
    orientation={orientation} // تحديد الاتجاه (أفقي أو رأسي)
    className={cn(
      "shrink-0 bg-border", // التنسيقات اللونية الأساسية
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", // تحديد الأبعاد بناءً على الاتجاه
      className, // دمج الأصناف الإضافية
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName; // تحديد اسم العرض للمكون

export { Separator }; // تصدير المكون
