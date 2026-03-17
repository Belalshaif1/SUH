import * as React from "react"; // استيراد مكتبة React الأساسية
import * as SliderPrimitive from "@radix-ui/react-slider"; // استيراد مكونات المنزلق (Slider) من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// مكون المنزلق (Slider) لاختيار القيم ضمن نطاق
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)} // حاوية المنزلق مع تعطيل التفاعلات الافتراضية للمس
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"> {/* مسار المنزلق */}
      <SliderPrimitive.Range className="absolute h-full bg-primary" /> {/* الجزء المملوء من المسار */}
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" /> {/* المقبض المتحرك */}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider }; // تصدير مكون المنزلق
