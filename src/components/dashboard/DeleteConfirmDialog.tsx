import React from 'react'; // استيراد مكتبة ريأكت
import {
  AlertDialog, // استيراد مكون مربع حوار التنبيه الرئيسي
  AlertDialogAction, // استيراد زر الإجراء (التأكيد) في مربع الحوار
  AlertDialogCancel, // استيراد زر الإلغاء في مربع الحوار
  AlertDialogContent, // استيراد حاوية محتوى مربع الحوار
  AlertDialogDescription, // استيراد مكون الوصف في مربع الحوار
  AlertDialogFooter, // استيراد مكون التذييل في مربع الحوار للأزرار
  AlertDialogHeader, // استيراد مكون الرأس في مربع الحوار للعنوان والأيقونة
  AlertDialogTitle, // استيراد مكون العنوان في مربع الحوار
} from "@/components/ui/alert-dialog"; // استيراد المكونات من مكتبة واجهة المستخدم المحلية
import { useLanguage } from '@/contexts/LanguageContext'; // استيراد سياق اللغة للتحقق من اللغة الحالية
import { AlertTriangle } from 'lucide-react'; // استيراد أيقونة مثلث التنبيه

interface DeleteConfirmDialogProps { // تعريف واجهة خصائص المكون
  isOpen: boolean; // حالة فتح أو إغلاق مربع الحوار
  onClose: () => void; // دالة تُستدعى عند الرغبة في إغلاق المربع
  onConfirm: () => void; // دالة تُستدعى لتأكيد عملية الحذف
  itemName: string; // اسم العنصر المراد حذفه ليظهر في الرسالة
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ // تعريف المكون كمكون وظيفي وتفكيك الخصائص
  isOpen, // استخراج حالة الفتح
  onClose, // استخراج دالة الإغلاق
  onConfirm, // استخراج دالة التأكيد
  itemName, // استخراج اسم العنصر
}) => {
  const { language } = useLanguage(); // الحصول على اللغة الحالية من السياق
  const isAr = language === 'ar'; // التحقق مما إذا كانت اللغة هي العربية

  return ( // إرجاع هيكل واجهة المستخدم لمربع الحوار
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}> {/* مكون مربع الحوار مع التحكم في حالة الفتح والإغلاق */}
      <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-card text-card-foreground"> {/* حاوية المحتوى بتنسيقات مستديرة وظلال ثقيلة */}
        <AlertDialogHeader className="space-y-4"> {/* رأس المربع مع تباعد بين العناصر */}
          <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2"> {/* دائرة خلفية حمراء فاتحة للأيقونة */}
            <AlertTriangle className="h-10 w-10" /> {/* عرض أيقونة التنبيه */}
          </div>
          <AlertDialogTitle className="text-2xl font-black text-center text-primary leading-tight"> {/* عنوان مربع الحوار */}
            {isAr ? 'تأكيد الحذف' : 'Confirm Deletion'} {/* عرض العنوان حسب اللغة */}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg text-muted-foreground leading-relaxed"> {/* وصف تفصيلي لعملية الحذف */}
            {isAr ? ( // إذا كانت اللغة عربية
              <>
                هل أنت متأكد من رغبتك في حذف <span className="text-red-500 font-bold">"{itemName}"</span>؟ {/* رسالة التأكيد مع اسم العنصر */}
                <br />
                لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة. {/* تحذير من عدم إمكانية التراجع */}
              </>
            ) : ( // إذا كانت اللغة إنجليزية
              <>
                Are you sure you want to delete <span className="text-red-500 font-bold">"{itemName}"</span>? {/* English confirmation message */}
                <br />
                This action cannot be undone and all associated data will be removed. {/* English undo warning */}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 flex gap-3 sm:gap-4 sm:justify-center"> {/* تذييل المربع يحتوي على أزرار التحكم */}
          <AlertDialogCancel // زر الإلغاء
            onClick={onClose} // إغلاق المربع عند النقر
            className="h-14 flex-1 rounded-2xl border-none bg-muted/50 hover:bg-muted font-bold text-lg transition-all" // تنسيقات زر الإلغاء
          >
            {isAr ? 'إلغاء' : 'Cancel'} {/* نص زر الإلغاء حسب اللغة */}
          </AlertDialogCancel>
          <AlertDialogAction // زر التأكيد (الحذف)
            onClick={onConfirm} // تنفيذ عملية الحذف عند النقر
            className="h-14 flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-600/20 transition-all border-none" // تنسيقات زر الحذف باللون الأحمر
          >
            {isAr ? 'نعم، قم بالحذف' : 'Yes, Delete'} {/* نص زر التأكيد حسب اللغة */}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
