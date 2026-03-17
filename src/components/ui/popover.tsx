import * as React from "react"; // استيراد مكتبة React الأساسية
import * as PopoverPrimitive from "@radix-ui/react-popover"; // استيراد مكونات النافذة المنبثقة (Popover) من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

const Popover = PopoverPrimitive.Root; // المكون الجذري للنافذة المنبثقة

const PopoverTrigger = PopoverPrimitive.Trigger; // الزر المشغل لفتح النافذة

// مكون محتوى النافذة المنبثقة (PopoverContent)
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal> {/* عرض النافذة في بوابة (Portal) لضمان ظهورها فوق العناصر */}
    <PopoverPrimitive.Content
      ref={ref}
      align={align} // محاذاة النافذة
      sideOffset={sideOffset} // المسافة المقطوعة عن المشغل
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", // تنسيقات المظهر والحركة (Animations)
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent }; // تصدير مكونات النافذة المنبثقة
