import * as React from "react"; // استيراد مكتبة React الأساسية
import { ChevronLeft, ChevronRight } from "lucide-react"; // استيراد أيقونات التنقل
import { DayPicker } from "react-day-picker"; // استيراد مكون اختيار الأيام الأساسي

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn
import { buttonVariants } from "@/components/ui/button"; // استيراد أنماط الأزرار الجاهزة

export type CalendarProps = React.ComponentProps<typeof DayPicker>; // تعريف نوع خصائص التقويم

// مكون التقويم (Calendar)
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays} // خيار إظهار الأيام خارج الشهر الحالي
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0", // تنسيق الأشهر
        month: "space-y-4", // تباعد داخل الشهر
        caption: "flex justify-center pt-1 relative items-center", // عنوان الشهر
        caption_label: "text-sm font-medium", // تسمية العنوان
        nav: "space-x-1 flex items-center", // حاوية أزرار التنقل
        nav_button: cn(
          buttonVariants({ variant: "outline" }), // استخدام نمط الزر المفرغ
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100", // تنسيقات إضافية للأزرار
        ),
        nav_button_previous: "absolute left-1", // تموضع زر السابق
        nav_button_next: "absolute right-1", // تموضع زر التالي
        table: "w-full border-collapse space-y-1", // تنسيق جدول الأيام
        head_row: "flex", // صف الرؤوس (أيام الأسبوع)
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]", // خلية الرأس
        row: "flex w-full mt-2", // صف الأيام
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20", // خلية اليوم مع حالات الاختيار
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"), // تنسيق الزر اليومي
        day_range_end: "day-range-end", // صنف نهاية النطاق
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground", // لون اليوم المختار
        day_today: "bg-accent text-accent-foreground", // لون اليوم الحالي
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30", // لون أيام خارج الشهر
        day_disabled: "text-muted-foreground opacity-50", // لون الأيام المعطلة
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground", // لون أيام وسط النطاق
        day_hidden: "invisible", // إخفاء الأيام المخفية
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />, // أيقونة السهم الأيسر
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />, // أيقونة السهم الأيمن
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar }; // تصدير مكون التقويم
