import * as React from "react"; // استيراد مكتبة React الأساسية
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"; // استيراد مكونات مجموعة التبديل (Toggle Group) من Radix UI
import { type VariantProps } from "class-variance-authority"; // استيراد أنواع متغيرات التنسيق

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn
import { toggleVariants } from "@/components/ui/toggle"; // استيراد متغيرات تنسيق التبديل المنفرد

// إنشاء سياق (Context) لمشاركة الحجم والشكل داخل مجموعة التبديل
const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

// مكون مجموعة التبديل (ToggleGroup)
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props}>
    {/* توفير قيم الشكل والحجم للعناصر الأبناء عبر السياق */}
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

// مكون عنصر مجموعة التبديل (ToggleGroupItem)
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext); // الوصول إلى التنسيقات الممررة من المجموعة الأب

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant, // استخدام تنسيق المجموعة أو التنسيق المنفرد
          size: context.size || size, // استخدام حجم المجموعة أو الحجم المنفرد
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem }; // تصدير المكونات
