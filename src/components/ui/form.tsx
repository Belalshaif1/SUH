import * as React from "react"; // استيراد مكتبة React الأساسية
import * as LabelPrimitive from "@radix-ui/react-label"; // استيراد مكونات التسمية من Radix UI
import { Slot } from "@radix-ui/react-slot"; // استيراد مكون Slot لدمج الخصائص مع العناصر الأبناء
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from "react-hook-form"; // استيراد أدوات إدارة النماذج من react-hook-form

import { cn } from "@/lib/utils"; // استيراد أداة دمج الأصناف cn
import { Label } from "@/components/ui/label"; // استيراد مكون التسمية المخصص

const Form = FormProvider; // استخدام FormProvider كمكون أساسي للنماذج

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

// إنشاء سياق (Context) لحقل النموذج
const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

// مكون حقل النموذج (FormField) الذي يغلف المتحكم (Controller)
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// هوك (Hook) مخصص للوصول إلى بيانات حقل النموذج الحالي
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id, // معرف الحقل الفريد
    name: fieldContext.name, // اسم الحقل
    formItemId: `${id}-form-item`, // معرف عنصر النموذج
    formDescriptionId: `${id}-form-item-description`, // معرف وصف الحقل
    formMessageId: `${id}-form-item-message`, // معرف رسالة الخطأ
    ...fieldState, // حالة الحقل (خطأ، لمس، إلخ)
  };
};

type FormItemContextValue = {
  id: string;
};

// إنشاء سياق (Context) لعنصر النموذج (FormItem)
const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

// مكون عنصر النموذج (FormItem) الذي يحوي التسمية والحقل
const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId(); // توليد معرف فريد

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

// مكون تسمية الحقل (FormLabel)
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField(); // الحصول على حالة الخطأ والمعرف

  return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />; // تلوين التسمية بالأحمر عند وجود خطأ
});
FormLabel.displayName = "FormLabel";

// مكون متحكم النموذج (FormControl) الذي يربط العنصر بالنظام
const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`} // ربط الوصف والخطأ للوصولية (Accessibility)
        aria-invalid={!!error} // تأشير الحقل كغير صالح عند وجود خطأ
        {...props}
      />
    );
  },
);
FormControl.displayName = "FormControl";

// مكون وصف الحقل (FormDescription)
const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />; // نص صغير باهت للوصف
  },
);
FormDescription.displayName = "FormDescription";

// مكون رسالة الخطأ (FormMessage)
const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children; // عرض رسالة الخطأ من التحقق أو الأبناء

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }; // تصدير كافة المكونات والهوكات
