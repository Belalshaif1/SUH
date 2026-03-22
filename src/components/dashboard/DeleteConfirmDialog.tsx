/**
 * @file src/components/dashboard/DeleteConfirmDialog.tsx
 * @description A reusable delete confirmation dialog built with Shadcn AlertDialog.
 *              Displays the name of the item being deleted so the admin has clear context
 *              before confirming an irreversible action.
 *
 * BUG FIX: `AlertDialog.onOpenChange` is used to detect external dismissal
 *           (e.g., pressing Escape) so that the parent's dialog state is always
 *           kept in sync with the dialog's actual open/closed state.
 */

import React from 'react'; // React for JSX and FC type
import {
    AlertDialog,             // Root dialog controller
    AlertDialogAction,       // The destructive "Yes, Delete" confirm button
    AlertDialogCancel,       // The safe "Cancel" dismiss button
    AlertDialogContent,      // Wraps all visible content inside the dialog overlay
    AlertDialogDescription,  // The body text explaining what will be deleted
    AlertDialogFooter,       // Row container for Cancel and Confirm buttons at the bottom
    AlertDialogHeader,       // Column container for the icon, title, and description
    AlertDialogTitle,        // The dialog heading text
} from '@/components/ui/alert-dialog';  // Shadcn AlertDialog — uses Radix UI under the hood
import { useLanguage } from '@/contexts/LanguageContext'; // language for AR/EN inline checks
import { AlertTriangle } from 'lucide-react';            // Warning triangle icon for the dialog

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for the DeleteConfirmDialog component */
interface DeleteConfirmDialogProps {
    isOpen:    boolean;     // Controls whether the dialog is visible
    onClose:   () => void;  // Called when user clicks "Cancel" or presses Escape
    onConfirm: () => void;  // Called when user confirms the deletion
    itemName:  string;      // The human-readable name shown in the confirmation message
}

// ─── Component ────────────────────────────────────────────────────────────

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen, onClose, onConfirm, itemName
}) => {
    const { language } = useLanguage(); // Current UI language for AR/EN text
    const isAr = language === 'ar';     // Shorthand for Arabic conditional checks

    return (
        <AlertDialog
            open={isOpen} // Controlled open state from the parent
            onOpenChange={open => !open && onClose()} // BUG FIX: When Radix closes the dialog (e.g., via Escape key), call onClose() to sync parent state
        >
            {/* Dialog visual container — large rounded corners for premium look */}
            <AlertDialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-card text-card-foreground">

                {/* ── Dialog header: icon + title + description ── */}
                <AlertDialogHeader className="space-y-4">
                    {/* Large red circular icon badge — immediately signals danger */}
                    <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        <AlertTriangle className="h-10 w-10" /> {/* Warning triangle icon */}
                    </div>

                    {/* Dialog title — bold and centered */}
                    <AlertDialogTitle className="text-2xl font-black text-center text-primary leading-tight">
                        {isAr ? 'تأكيد الحذف' : 'Confirm Deletion'}
                    </AlertDialogTitle>

                    {/* Dialog body — shows the name of the item being deleted */}
                    <AlertDialogDescription className="text-center text-lg text-muted-foreground leading-relaxed">
                        {isAr ? (
                            // Arabic confirmation message with the item name highlighted in red
                            <>
                                هل أنت متأكد من رغبتك في حذف{' '}
                                <span className="text-red-500 font-bold">"{itemName}"</span>؟
                                <br />
                                لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة.
                                {/* "This action cannot be undone and all associated data will be removed." */}
                            </>
                        ) : (
                            // English confirmation message
                            <>
                                Are you sure you want to delete{' '}
                                <span className="text-red-500 font-bold">"{itemName}"</span>?
                                <br />
                                This action cannot be undone and all associated data will be removed.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* ── Dialog footer: Cancel + Confirm buttons ── */}
                <AlertDialogFooter className="mt-8 flex gap-3 sm:gap-4 sm:justify-center">
                    {/* Cancel button — safe, muted styling */}
                    <AlertDialogCancel
                        onClick={onClose} // Explicitly call onClose for the Cancel button click
                        className="h-14 flex-1 rounded-2xl border-none bg-muted/50 hover:bg-muted font-bold text-lg transition-all"
                    >
                        {isAr ? 'إلغاء' : 'Cancel'}
                    </AlertDialogCancel>

                    {/* Confirm delete button — red/destructive styling to signal the danger */}
                    <AlertDialogAction
                        onClick={onConfirm} // Executes the deletion logic in useDashboardActions
                        className="h-14 flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-xl shadow-red-600/20 transition-all border-none"
                    >
                        {isAr ? 'نعم، قم بالحذف' : 'Yes, Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    );
};
