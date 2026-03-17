import * as React from "react"; // استيراد مكتبة React الأساسية
import * as TooltipPrimitive from "@radix-ui/react-tooltip"; // استيراد مكونات تلميح الأدوات (Tooltip) من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

const TooltipProvider = TooltipPrimitive.Provider; // مزود سياق تلميح الأدوات (يحيط بالتطبيق أو المنطقة)

const Tooltip = TooltipPrimitive.Root; // المكون الجذري للتلميح الفردي

const TooltipTrigger = TooltipPrimitive.Trigger; // العنصر الذي يظهر التلميح عند الحوم فوقه

// مكون محتوى تلميح الأدوات (TooltipContent)
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset} // المسافة بين التلميح والعنصر المشغل
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", // تنسيقات وحركات التلميح
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }; // تصدير المكونات
