import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-card text-card-foreground">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <AlertDialogTitle className="text-2xl font-black text-center text-primary leading-tight">
            {isAr ? 'تأكيد الحذف' : 'Confirm Deletion'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg text-muted-foreground leading-relaxed">
            {isAr ? (
              <>
                هل أنت متأكد من رغبتك في حذف <span className="text-red-500 font-bold">"{itemName}"</span>؟ 
                <br />
                لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة.
              </>
            ) : (
              <>
                Are you sure you want to delete <span className="text-red-500 font-bold">"{itemName}"</span>?
                <br />
                This action cannot be undone and all associated data will be removed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 flex gap-3 sm:gap-4 sm:justify-center">
          <AlertDialogCancel 
            onClick={onClose}
            className="h-14 flex-1 rounded-2xl border-none bg-muted/50 hover:bg-muted font-bold text-lg transition-all"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-14 flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-600/20 transition-all border-none"
          >
            {isAr ? 'نعم، قم بالحذف' : 'Yes, Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
