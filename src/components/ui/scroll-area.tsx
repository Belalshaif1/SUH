import * as React from "react"; // استيراد مكتبة React الأساسية
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"; // استيراد مكونات منطقة التمرير من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// إنشاء مكون منطقة التمرير (ScrollArea)
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport> {/* حاوية المحتوى القابل للتمرير */}
    <ScrollBar /> {/* شريط التمرير */}
    <ScrollAreaPrimitive.Corner /> {/* ركن منطقة التمرير عند تقاطع الأشرطة */}
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

// إنشاء مكون شريط التمرير (ScrollBar)
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation} // تحديد اتجاه شريط التمرير (رأسي أو أفقي)
    className={cn(
      "flex touch-none select-none transition-colors", // تنسيقات تفاعل المستخدم
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]", // تنسيق الشريط الرأسي
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]", // تنسيق الشريط الأفقي
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" /> {/* مقبض شريط التمرير */}
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar }; // تصدير المكونات
