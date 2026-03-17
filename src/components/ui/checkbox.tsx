import * as React from "react"; // استيراد مكتبة React الأساسية
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"; // استيراد مكونات Checkbox الأساسية من Radix UI
import { Check } from "lucide-react"; // استيراد أيقونة الصح Check

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// إنشاء مكون صندوق الاختيار باستخدام forwardRef
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref} // ربط المرجع بالمكون
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", // تنسيقات CSS الأساسية
      className, // دمج الأصناف الإضافية
    )}
    {...props} // تمرير باقي الخصائص
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" /> {/* عرض أيقونة الصح عند التفعيل */}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName; // تحديد اسم العرض للمكون

export { Checkbox }; // تصدير المكون
