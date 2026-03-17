import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"; // استيراد مكونات القابل للطي (Collapsible) من Radix UI

const Collapsible = CollapsiblePrimitive.Root; // المكون الجذري للقابل للطي

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger; // الزر المشغل لفتح/إغلاق المحتوى

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent; // المكون الذي يحتوي على المادة القابلة للطي

export { Collapsible, CollapsibleTrigger, CollapsibleContent }; // تصدير المكونات
