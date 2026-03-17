import { GripVertical } from "lucide-react"; // استيراد أيقونة المقبض العمودي
import * as ResizablePrimitive from "react-resizable-panels"; // استيراد مكونات اللوحات القابلة لإعادة التحجيم

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// مكون مجموعة اللوحات القابلة لإعادة التحجيم (ResizablePanelGroup)
const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)} // تنسيق الحاوية حسب الاتجاه (أفقي أو عمودي)
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel; // المكون الذي يمثل لوحة فردية داخل المجموعة

// مكون مقبض إعادة التحجيم (ResizableHandle)
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:rotate-90", // تنسيقات المقبض والخط الفاصل وحالات التركيز
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border"> {/* حاوية الأيقونة إذا طُلب إظهار المقبض */}
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }; // تصدير المكونات
