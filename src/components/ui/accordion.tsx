import * as React from "react"; // استيراد مكتبة React الأساسية
import * as AccordionPrimitive from "@radix-ui/react-accordion"; // استيراد مكونات الأكورديون الأساسية من Radix UI
import { ChevronDown } from "lucide-react"; // استيراد أيقونة السهم لأسفل

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

const Accordion = AccordionPrimitive.Root; // تعيين المكون الجذري للأكورديون

// إنشاء مكون لفقرة الأكورديون (Item)
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} /> // حاوية بمحدد أسفل
));
AccordionItem.displayName = "AccordionItem"; // تحديد اسم العرض

// إنشاء مكون مفتاح الأكورديون (Trigger)
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", // تنسيقات المفتاح وتأثير التدوير على الأيقونة
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" /> {/* أيقونة السهم مع تأثير الحركة */}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

// إنشاء مكون محتوى الأكورديون (Content)
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" // تأثيرات الحركة للظهور والاختفاء
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div> {/* حاوية المحتوى الداخلية مع هوامش */}
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }; // تصدير مكونات الأكورديون
