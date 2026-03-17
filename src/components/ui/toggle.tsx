import * as React from "react"; // استيراد مكتبة React الأساسية
import * as TogglePrimitive from "@radix-ui/react-toggle"; // استيراد مكون التبديل (Toggle) من Radix UI
import { cva, type VariantProps } from "class-variance-authority"; // استيراد أداة إدارة المتغيرات cva

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// تعريف متغيرات التنسيق لمكون التبديل (toggleVariants)
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground", // التنسيقات الأساسية وحالات التركيز والتعطيل والتنشيط
  {
    variants: {
      variant: {
        default: "bg-transparent", // التنسيق الافتراضي (شفاف)
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground", // تنسيق بحدود خارجية
      },
      size: {
        default: "h-10 px-3", // الحجم الافتراضي
        sm: "h-9 px-2.5", // حجم صغير
        lg: "h-11 px-5", // حجم كبير
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// مكون التبديل (Toggle)
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} /> // دمج التنسيقات مع الخصائص
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants }; // تصدير المكون ومتغيرات التنسيق
