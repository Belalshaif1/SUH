import * as React from "react"; // استيراد مكتبة React الأساسية
import { Slot } from "@radix-ui/react-slot"; // استيراد Slot للسماح بتغيير العنصر الأساسي
import { ChevronRight, MoreHorizontal } from "lucide-react"; // استيراد الأيقونات اللازمة

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// المكون الرئيسي لمسار التنقل (Breadcrumb)
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode; // خاصية اختيارية لتحديد الفاصل
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />); // وسم nav مع تسمية توضيحية للوصول
Breadcrumb.displayName = "Breadcrumb";

// مكون قائمة المسار (BreadcrumbList) - الحاوية لجميع العناصر
const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5", // تنسيقات القائمة المرنة والتباعد
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

// مكون عنصر المسار الفردي (BreadcrumbItem)
const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} /> // عنصر قائمة مع محاذاة العناصر بداخله
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

// مكون رابط المسار (BreadcrumbLink)
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean; // خيار لاستخدام مكون خارجي كرابط
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"; // تحديد العنصر المراد استخدامه

  return <Comp ref={ref} className={cn("transition-colors hover:text-foreground", className)} {...props} />; // تنسيق الرابط وتأثير المرور
});
BreadcrumbLink.displayName = "BreadcrumbLink";

// مكون الصفحة الحالية في المسار (BreadcrumbPage)
const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true" // تعطيل المكون كونه يمثل الصفحة الحالية
      aria-current="page" // الإشارة إلى أن هذه هي الصفحة النشطة
      className={cn("font-normal text-foreground", className)} // تنسيق النص
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

// مكون الفاصل بين عناصر المسار (BreadcrumbSeparator)
const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
    {children ?? <ChevronRight />} {/* عرض أيقونة ChevronRight كفاصل افتراضي */}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

// مكون النقاط الثلاث في المسار (BreadcrumbEllipsis) للاختصار
const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" /> {/* عرض أيقونة MoreHorizontal */}
    <span className="sr-only">More</span> {/* نص مخفي لمحركات البحث والوصول */}
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}; // تصدير كافة مكونات مسار التنقل
