import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// مكون الهيكل المؤقت (Skeleton) الذي يظهر أثناء التحميل
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />; // حاوية مع تأثير النبض (Pulse) ولون باهت
}

export { Skeleton }; // تصدير مكون الهيكل المؤقت
