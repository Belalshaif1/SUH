import * as React from "react"; // استيراد مكتبة React الأساسية
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"; // استيراد مكونات مجموعة أزرار الخيار من Radix UI
import { Circle } from "lucide-react"; // استيراد أيقونة الدائرة

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// المكون الجذري لمجموعة أزرار الخيار (RadioGroup)
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />; // حاوية العناصر مع تباعد شبكي
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

// مكون زر الخيار الفردي (RadioGroupItem)
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", // تنسيقات الزر الدائري وحالات التركيز والتعطيل
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center"> {/* مؤشر الاختيار */}
        <Circle className="h-2.5 w-2.5 fill-current text-current" /> {/* دائرة صغيرة تظهر عند الاختيار */}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem }; // تصدير مكونات مجموعة أزرار الخيار
