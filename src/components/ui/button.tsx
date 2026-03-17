import * as React from "react"; // استيراد مكتبة React الأساسية
import { Slot } from "@radix-ui/react-slot"; // استيراد مكون Slot لدعم خاصية asChild
import { cva, type VariantProps } from "class-variance-authority"; // استيراد أداة إدارة المتغيرات cva

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// تعريف متغيرات تصميم الزر (Variants) باستخدام cva
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90", // النمط الافتراضي
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90", // نمط الحذف
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground", // نمط الإطار
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", // النمط الثانوي
        ghost: "hover:bg-accent hover:text-accent-foreground", // النمط الشفاف
        link: "text-primary underline-offset-4 hover:underline", // نمط الرابط
      },
      size: {
        default: "h-10 px-4 py-2", // الحجم الافتراضي
        sm: "h-9 rounded-md px-3", // الحجم الصغير
        lg: "h-11 rounded-md px-8", // الحجم الكبير
        icon: "h-10 w-10", // حجم الأيقونة
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// تعريف واجهة الخصائص لمكون الزر
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean; // خاصية تتيح تغيير عنصر HTML الأساسي
}

// إنشاء مكون الزر باستخدام forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"; // تحديد العنصر المستخدم (button أو Slot)
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />; // إرجاع العنصر مع التنسيقات
  },
);
Button.displayName = "Button"; // تحديد اسم العرض للمكون

export { Button, buttonVariants }; // تصدير المكون ومتغيرات التصميم
