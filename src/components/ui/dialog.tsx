import * as React from "react"; // استيراد مكتبة React الأساسية
import * as DialogPrimitive from "@radix-ui/react-dialog"; // استيراد مكونات النافذة من Radix UI
import { X } from "lucide-react"; // استيراد أيقونة الإغلاق X

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

const Dialog = DialogPrimitive.Root; // المكون الجذري للنافذة (Dialog)

const DialogTrigger = DialogPrimitive.Trigger; // المكون المشغل للنافذة

const DialogPortal = DialogPrimitive.Portal; // مكون البوابة لنقل النافذة خارج التسلسل الهرمي لشجرة DOM

const DialogClose = DialogPrimitive.Close; // مكون زر الإغلاق

// مكون خلفية النافذة (Overlay)
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref} // ربط المرجع
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", // تنسيقات الخلفية الشفافة وتأثيرات الحركة
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// مكون محتوى النافذة (Content)
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay /> {/* عرض الخلفية */}
    <DialogPrimitive.Content
      ref={ref}
      aria-describedby={undefined} // تعطيل الوصف التلقائي لسهولة التحكم
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", // تنسيقات الموقع والتحريك والظلال
        className,
      )}
      {...props}
    >
      {children} {/* عرض المحتوى الداخلي */}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" /> {/* زر الإغلاق العلوي */}
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// مكون رأس النافذة
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} /> // حاوية الرأس والتباعد
);
DialogHeader.displayName = "DialogHeader";

// مكون تذييل النافذة
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} /> // حاوية الأزرار والإجراءات
);
DialogFooter.displayName = "DialogFooter";

// مكون عنوان النافذة
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)} // تنسيق العنوان الرئيسي
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// مكون وصف النافذة
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} /> // تنسيق النص الثانوي
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}; // تصدير كافة مكونات النافذة
