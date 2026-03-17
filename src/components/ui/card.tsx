import * as React from "react"; // استيراد مكتبة React الأساسية

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// إنشاء مكون البطاقة الرئيسي باستخدام forwardRef
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} /> // إرجاع حاوية البطاقة مع التنسيقات والظل
));
Card.displayName = "Card"; // تحديد اسم العرض للمكون

// إنشاء مكون رأس البطاقة
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} /> // حاوية مرنة للعناوين مع هوامش داخلية
  ),
);
CardHeader.displayName = "CardHeader";

// إنشاء مكون عنوان البطاقة
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} /> // وسم h3 لتنسيق العنوان الرئيسي
  ),
);
CardTitle.displayName = "CardTitle";

// إنشاء مكون وصف البطاقة
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} /> // وسم p لتنسيق النص الثانوي
  ),
);
CardDescription.displayName = "CardDescription";

// إنشاء مكون محتوى البطاقة
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />, // حاوية المحتوى الأساسي
);
CardContent.displayName = "CardContent";

// إنشاء مكون تذييل البطاقة
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} /> // حاوية الأزرار أو الإجراءات في أسفل البطاقة
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }; // تصدير جميع مكونات البطاقة
