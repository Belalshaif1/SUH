import * as React from "react"; // استيراد مكتبة React الأساسية

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// مكون الجدول الرئيسي (Table) مع حاوية للتمرير الأفقي
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto"> {/* حاوية تسمح بالتمرير في الشاشات الصغيرة */}
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} /> {/* وسم الجدول الأساسي */}
    </div>
  ),
);
Table.displayName = "Table";

// مكون رأس الجدول (TableHeader)
const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />, // حاوية عناوين الأعمدة
);
TableHeader.displayName = "TableHeader";

// مكون جسم الجدول (TableBody)
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} /> // حاوية الصفوف والبيانات
  ),
);
TableBody.displayName = "TableBody";

// مكون تذييل الجدول (TableFooter)
const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} /> // حاوية معلومات نهاية الجدول
  ),
);
TableFooter.displayName = "TableFooter";

// مكون صف الجدول (TableRow)
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)} // تنسيقات الصف وتأثير التمرير (Hover)
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

// مكون خلية العنوان (TableHead)
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", // تنسيقات خلية الرأس
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

// مكون خلية البيانات (TableCell)
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} /> // تنسيقات خلية البيانات
  ),
);
TableCell.displayName = "TableCell";

// مكون التسمية التوضيحية للجدول (TableCaption)
const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} /> // وسم التسمية أسفل الجدول
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }; // تصدير كافة مكونات الجدول
