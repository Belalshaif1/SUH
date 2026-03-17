import * as React from "react"; // استيراد مكتبة React الأساسية
import { OTPInput, OTPInputContext } from "input-otp"; // استيراد مكونات OTP من مكتبة input-otp
import { Dot } from "lucide-react"; // استيراد أيقونة النقطة

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn

// مكون حقل إدخال رمز التحقق (InputOTP)
const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)} // تنسيق الحاوية الخارجية
      className={cn("disabled:cursor-not-allowed", className)} // تنسيق الحقل نفسه وحالة التعطيل
      {...props}
    />
  ),
);
InputOTP.displayName = "InputOTP";

// مكون مجموعة حقول الرمز (InputOTPGroup)
const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center", className)} {...props} />, // حاوية أفقية للعناصر
);
InputOTPGroup.displayName = "InputOTPGroup";

// مكون خانة الرمز الفردية (InputOTPSlot)
const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext); // الوصول إلى سياق OTP
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]; // استخراج بيانات الخانة حسب الفهرس

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md", // تنسيق مربع الخانة والحدود
        isActive && "z-10 ring-2 ring-ring ring-offset-background", // إضافة حلقة توهج عند التنشيط
        className,
      )}
      {...props}
    >
      {char} {/* عرض الحرف المدخل */}
      {hasFakeCaret && ( // عرض مؤشر الكتابة الوهمي عند الحاجة
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

// مكون الفاصل بين الخانات (InputOTPSeparator)
const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
      <Dot /> {/* استخدام نقطة كفاصل */}
    </div>
  ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }; // تصدير المكونات
