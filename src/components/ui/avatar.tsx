import * as React from "react"; // استيراد مكتبة React الأساسية
import * as AvatarPrimitive from "@radix-ui/react-avatar"; // استيراد مكونات الصورة الرمزية من Radix UI

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// المكون الجذري للصورة الرمزية (Avatar)
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} // تنسيق الحاوية الدائرية
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// مكون الصورة الفعلي (AvatarImage)
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} /> // تنسيق الصورة لتملأ الحاوية
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// مكون البديل في حالة عدم وجود صورة (AvatarFallback)
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)} // تنسيق الخلفية البديلة وتوسيط النص
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback }; // تصدير مكونات الصورة الرمزية
