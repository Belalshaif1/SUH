import * as React from "react"; // استيراد مكتبة React الأساسية
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"; // استيراد محرك Carousel (Embla)
import { ArrowLeft, ArrowRight } from "lucide-react"; // استيراد أيقونات الأسهم

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn
import { Button } from "@/components/ui/button"; // استيراد مكون الزر

type CarouselApi = UseEmblaCarouselType[1]; // تعريف نوع واجهة برمجة تطبيقات Carousel
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>; // استخراج أنواع بارامترات Embla
type CarouselOptions = UseCarouselParameters[0]; // خيارات الـ Carousel
type CarouselPlugin = UseCarouselParameters[1]; // القوالب الإضافية (Plugins)

type CarouselProps = {
  opts?: CarouselOptions; // خيارات اختيارية
  plugins?: CarouselPlugin; // إضافات اختيارية
  orientation?: "horizontal" | "vertical"; // اتجاه العرض (أفقي أو عمودي)
  setApi?: (api: CarouselApi) => void; // وظيفة لتعيين الـ API
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]; // مرجع الـ Carousel
  api: ReturnType<typeof useEmblaCarousel>[1]; // واجهة التحكم
  scrollPrev: () => void; // وظيفة الانتقال للسابق
  scrollNext: () => void; // وظيفة الانتقال للتالي
  canScrollPrev: boolean; // هل يمكن الرجوع للخلف؟
  canScrollNext: boolean; // هل يمكن التقدم للأمام؟
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null); // إنشاء سياق (Context) للـ Carousel

// هوك (Hook) مخصص لاستخدام سياق الـ Carousel
function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />"); // خطأ في حال الاستخدام خارج المكون
  }

  return context;
}

// المكون الرئيسي للـ Carousel
const Carousel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & CarouselProps>(
  ({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y", // تحديد المحور بناءً على الاتجاه
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false); // حالة إمكانية الرجوع
    const [canScrollNext, setCanScrollNext] = React.useState(false); // حالة إمكانية التقدم

    // تحديث حالات التنقل عند اختيار شريحة جديدة
    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    // وظيفة الانتقال للخلف
    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    // وظيفة الانتقال للأمام
    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    // التعامل مع ضغطات المفاتيح (الأسهم)
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    // ربط الـ API الخارجي عند توفره
    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    // تفعيل المستمعين للأحداث عند تهيئة الـ API
    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect); // عند إعادة التهيئة
      api.on("select", onSelect); // عند تغيير الشريحة

      return () => {
        api?.off("select", onSelect); // تنظيف المستمع عند مسح المكون
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown} // قفل أحداث المفاتيح
          className={cn("relative", className)}
          role="region" // تعريف المنطقة للتوافقية
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

// مكون حاوية المحتوى (CarouselContent)
const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden"> {/* إخفاء المحتوى الخارج عن الحدود */}
        <div
          ref={ref}
          className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)} // ترتيب العناصر بمرونة
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

// مكون الشريحة الفردية (CarouselItem)
const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)} // أبعاد الشريحة
        {...props}
      />
    );
  },
);
CarouselItem.displayName = "CarouselItem";

// مكون زر الرجوع للسابق (CarouselPrevious)
const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full", // نمط دائري
          orientation === "horizontal"
            ? "-left-12 top-1/2 -translate-y-1/2" // تموضع أفقي
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90", // تموضع عمودي
          className,
        )}
        disabled={!canScrollPrev} // تعطيل الزر إذا لم يمكن الرجوع
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span> {/* نص مخفي للوصول */}
      </Button>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

// مكون زر الانتقال للتالي (CarouselNext)
const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-right-12 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        disabled={!canScrollNext} // تعطيل الزر إذا لم يمكن التقدم
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);
CarouselNext.displayName = "CarouselNext";

export { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }; // تصدير كل المكونات
