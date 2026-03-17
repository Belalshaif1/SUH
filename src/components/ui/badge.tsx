import * as React from "react"; // استيراد مكتبة React الأساسية
import { cva, type VariantProps } from "class-variance-authority"; // استيراد أداة إدارة المتغيرات cva

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// تعريف متغيرات تصميم الشارة (Badge Variants)
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80", // النمط الافتراضي
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80", // النمط الثانوي
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80", // نمط الحذف
        outline: "text-foreground", // نمط الإطار
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// تعريف واجهة الخصائص لمكون الشارة
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

// تعريف مكون الشارة الوظيفي
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />; // إرجاع العنصر مع التنسيقات
}

export { Badge, badgeVariants }; // تصدير المكون ومتغيرات التصميم
