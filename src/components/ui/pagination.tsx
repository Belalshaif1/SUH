import * as React from "react"; // استيراد مكتبة React الأساسية
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"; // استيراد أيقونات التنقل

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn
import { ButtonProps, buttonVariants } from "@/components/ui/button"; // استيراد متغيرات وتنسيقات الأزرار

// المكون الرئيسي للتنقل بين الصفحات (Pagination)
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation" // تحديد دور المكون للتنقل
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)} // توسيط مكون التنقل
    {...props}
  />
);
Pagination.displayName = "Pagination";

// مكون حاوية عناصر التنقل (PaginationContent)
const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} /> // عرض العناصر في صف واحد مع تباعد
  ),
);
PaginationContent.displayName = "PaginationContent";

// مكون عنصر التنقل الفردي (PaginationItem)
const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} /> // عنصر ضمن القائمة
));
PaginationItem.displayName = "PaginationItem";

// تعريف أنواع خصائص رابط التنقل
type PaginationLinkProps = {
  isActive?: boolean; // حالة الرابط إذا كان نشطاً
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

// مكون رابط التنقل (PaginationLink)
const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined} // تحديد إذا كانت هذه هي الصفحة الحالية
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost", // تغيير النمط بناءً على الحالة النشطة
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

// مكون زر الصفحة السابقة (PaginationPrevious)
const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4" /> {/* أيقونة السهم لليسار */}
    <span>Previous</span> {/* نص الزر */}
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

// مكون زر الصفحة التالية (PaginationNext)
const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 pr-2.5", className)} {...props}>
    <span>Next</span> {/* نص الزر */}
    <ChevronRight className="h-4 w-4" /> {/* أيقونة السهم لليمين */}
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

// مكون النقاط الثلاث في التنقل (PaginationEllipsis) للإشارة لصفحات مخفية
const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" /> {/* أيقونة المزيد */}
    <span className="sr-only">More pages</span> {/* نص مخفي لمحركات البحث */}
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}; // تصدير كافة مكونات التنقل بين الصفحات
