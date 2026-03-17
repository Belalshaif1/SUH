import * as React from "react"; // استيراد مكتبة React الأساسية
import * as RechartsPrimitive from "recharts"; // استيراد مكتبة Recharts لرسم المخططات البرمجية بشكل أساسي

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// التنسيق: { اسم_الثيم: محدد_CSS }
const THEMES = { light: "", dark: ".dark" } as const; // تعريف الثيمات المتاحة (الفاتح والداكن)

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode; // تسمية العنصر في المخطط
    icon?: React.ComponentType; // أيقونة اختيارية للعنصر
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> }); // إما لون ثابت أو ألوان حسب الثيم
};

type ChartContextProps = {
  config: ChartConfig; // كائن التكوين الخاص بالمخطط
};

const ChartContext = React.createContext<ChartContextProps | null>(null); // إنشاء سياق (Context) للمخطط

// هوك (Hook) للوصول إلى بيانات المخطط داخل المكونات التابعة
function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />"); // تنبيه إذا تم استخدام الهوك خارج الحاوية
  }

  return context;
}

// مكون حاوية المخطط (ChartContainer)
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig; // مرور التكوين
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]; // العناصر الابنة (غالباً مخططات Recharts)
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId(); // توليد معرف فريد تلقائي
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`; // إنشاء معرف المخطط مع تنظيف الأحرف الخاصة

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId} // سمة بيانات لتحديد المخطط في CSS
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className, // تطبيق الأنماط الافتراضية لـ Recharts مع دعم التخصيص
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} /> {/* تطبيق الأنماط الديناميكية للألوان */}
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer> {/* الحاوية المتجاوبة للمخطط */}
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart"; // اسم المكون للعرض في أدوات المطورين

// مكون لإنشاء أنماط CSS ديناميكية بناءً على التكوين (ChartStyle)
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color); // تصفية العناصر التي لها ألوان

  if (!colorConfig.length) {
    return null; // إذا لم يوجد ألوان، لا يتم رندر أي شيء
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color; // اختيار اللون المناسب للثيم
    return color ? `  --color-${key}: ${color};` : null; // تعريف متغير CSS للون
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip; // إعادة تصدير مكون تلميح الأدوات من Recharts

// مكون محتوى تلميح الأدوات المخصص (ChartTooltipContent)
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean; // إخفاء التسمية الرئيسية
      hideIndicator?: boolean; // إخفاء مؤشر اللون
      indicator?: "line" | "dot" | "dashed"; // نوع المؤشر (خط، نقطة، متقطع)
      nameKey?: string; // مفتاح الاسم في البيانات
      labelKey?: string; // مفتاح التسمية في البيانات
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart(); // الوصول إلى تكوين الألوان والتسميات

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null; // لا تظهر التسمية إذا كانت مخفية أو لا توجد بيانات
      }

      const [item] = payload; // الحصول على أول عنصر في البيانات المعروضة
      const key = `${labelKey || item.dataKey || item.name || "value"}`; // تحديد المفتاح المناسب
      const itemConfig = getPayloadConfigFromPayload(config, item, key); // جلب التكوين لهذا المفتاح
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label // استخدام التسمية من التكوين أو القيمة المباشرة
          : itemConfig?.label;

      if (labelFormatter) {
        return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>; // استخدام منسق تسمية مخصص إن وجد
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>; // عرض التسمية الافتراضية
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
      return null; // لا يظهر التلميح إذا لم يكن نشطاً
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"; // هل يجب دمج التسمية مع القيمة

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className, // حاوية تلميح الأدوات بتنسيق أنيق
        )}
      >
        {!nestLabel ? tooltipLabel : null} {/* عرض التسمية في الأعلى إذا لم تكن مدمجة */}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`; // تحديد مفتاح العنصر الحالي
            const itemConfig = getPayloadConfigFromPayload(config, item, key); // جلب تكوين العنصر الحالي
            const indicatorColor = color || item.payload.fill || item.color; // تحديد لون المؤشر

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center", // تنسيق العناصر داخل سطر التلميح
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload) // استخدام منسق مخصص للقيم إن وجد
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon /> // عرض أيقونة العنصر إذا كانت موجودة
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                            "h-2.5 w-2.5": indicator === "dot", // تنسيق النقطة
                            "w-1": indicator === "line", // تنسيق الخط
                            "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed", // تنسيق الخط المتقطع
                            "my-0.5": nestLabel && indicator === "dashed",
                          })}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties // تمرير اللون عبر متغيرات CSS
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center", // محاذاة النص والقيمة
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null} {/* عرض التسمية المدمجة */}
                        <span className="text-muted-foreground">{itemConfig?.label || item.name}</span> {/* اسم السلسلة */}
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()} {/* عرض القيمة الرقمية منسقة */}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip"; // اسم المكون للعرض

const ChartLegend = RechartsPrimitive.Legend; // إعادة تصدير مكون وسائل الإيضاح من Recharts

// مكون محتوى وسائل الإيضاح المخصص (ChartLegendContent)
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean; // إخفاء الأيقونة
      nameKey?: string; // مفتاح الاسم
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart(); // الوصول للتكوين

  if (!payload?.length) {
    return null; // لا تظهر شيئاً إذا لم تكن هناك بيانات للأسطورة
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`; // التعرف على المفتاح
        const itemConfig = getPayloadConfigFromPayload(config, item, key); // جلب الإعدادات

        return (
          <div
            key={item.value}
            className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon /> // عرض الأيقونة المخصصة
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]" // عرض مربع اللون الصغير
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label} {/* عرض النص التوضيحي للسلسلة */}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend"; // اسم المكون للعرض

// دالة مساعدة لاستخراج تكوين العنصر من بيانات Recharts المحملة (getPayloadConfigFromPayload)
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined; // حماية ضد القيم غير الصحيحة
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined; // الوصول للبيانات الأصلية داخل الكائن

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string; // محاولة إيجاد مفتاح التسمية مباشرة
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string; // البحث في البيانات المتداخلة
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config]; // إرجاع التكوين المناسب للمفتاح المستخرج
}

// تصدير كافة المكونات المساعدة للمخططات
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
