import * as React from "react"; // استيراد مكتبة React الأساسية
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"; // استيراد مكونات بطاقة الحوم (Hover Card) من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

const HoverCard = HoverCardPrimitive.Root; // المكون الجذري لبطاقة الحوم

const HoverCardTrigger = HoverCardPrimitive.Trigger; // المنطقة التي تظهر البطاقة عند المرور فوقها

// مكون محتوى بطاقة الحوم (HoverCardContent)
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align} // محاذاة البطاقة بالنسبة للمشغل
    sideOffset={sideOffset} // المسافة بين البطاقة والمشغل
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", // تنسيقات المظهر وحركات الظهور والاختفاء
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent }; // تصدير المكونات
