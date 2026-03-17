import * as React from "react"; // استيراد مكتبة React الأساسية
import { Drawer as DrawerPrimitive } from "vaul"; // استيراد مكون الدرج الجانبي من مكتبة vaul

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// المكون الجذري للدرج (Drawer)
const Drawer = ({ shouldScaleBackground = true, ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} /> // المكون الأساسي مع خاصية تصغير الخلفية اختيارياً
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger; // الزر المشغل لفتح الدرج

const DrawerPortal = DrawerPrimitive.Portal; // بوابة لعرض محتوى الدرج خارج التسلسل الهيكلي العادي

const DrawerClose = DrawerPrimitive.Close; // زر لإغلاق الدرج

// مكون التغطية الخلفية (DrawerOverlay) للدرج
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} /> // طبقة معتمة خلف الدرج
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

// مكون محتوى الدرج (DrawerContent)
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal> {/* استخدام البوابة */}
    <DrawerOverlay /> {/* طبقة التغطية */}
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background", // تنسيقات تموضع الدرج في الأسفل مع زوايا علوية مستديرة
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" /> {/* شريط السحب البصري في أعلى الدرج */}
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

// مكون رأس الدرج (DrawerHeader)
const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} /> // حاوية العنوان والوصف مع تنسيقات محاذاة
);
DrawerHeader.displayName = "DrawerHeader";

// مكون تذييل الدرج (DrawerFooter)
const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} /> // حاوية أزرار الإجراءات في أسفل الدرج
);
DrawerFooter.displayName = "DrawerFooter";

// مكون عنوان الدرج (DrawerTitle)
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)} // تنسيق الخط للعنوان
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

// مكون وصف الدرج (DrawerDescription)
const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} /> // تنسيق الخط المساعد للوصف
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}; // تصدير كافة مكونات الدرج
