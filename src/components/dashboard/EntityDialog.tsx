/**
 * @file components/dashboard/EntityDialog.tsx
 * @description Centralized Dialog orchestrator for Add/Edit operations.
 * It wraps the dynamic EntityForm with the premium UI Dialog shell.
 */

import React from 'react'; // React library for UI
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // UI Dialog system
import { Button } from '@/components/ui/button'; // Reusable button
import { Save } from 'lucide-react'; // Icons
import { EntityForm } from './EntityForm'; // The dynamic form engine
import { useLanguage } from '@/contexts/LanguageContext'; // For internationalization

/**
 * Props for EntityDialog
 */
interface EntityDialogProps {
    isOpen: boolean; // Flag to control dialog visibility
    onClose: () => void; // Command to shut the dialog
    activeForm: string; // The type of entity currently being handled
    formData: any; // The current form state
    setFormData: (data: any) => void; // State updater
    onSave: () => void; // Primary action: Save the data
    loading: boolean; // Flag to show loading state on the Save button
    editId: string | null; // Determines if context is "Add" or "Edit"
    // Data for selects (passed down to EntityForm)
    universities: any[];
    colleges: any[];
    departments: any[];
    role: string | undefined;
}

export const EntityDialog: React.FC<EntityDialogProps> = ({
    isOpen, onClose, activeForm, formData, setFormData, onSave, loading, editId,
    universities, colleges, departments, role
}) => {
    const { t, language } = useLanguage(); // User localization preferences

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border-none shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-black text-primary flex items-center gap-3">
                        {/* Conditional Title - Dynamic based on active form and mode */}
                        {editId ? t('common.edit') : t('common.add')}
                        <span className="text-gold opacity-50">•</span>
                        <span className="text-primary/40 uppercase tracking-widest text-xs font-bold mt-1">
                            {activeForm.replace('_', ' ')}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* --- Dynamic Form Injection --- */}
                <EntityForm
                    activeForm={activeForm}
                    formData={formData}
                    setFormData={setFormData}
                    role={role}
                    universities={universities}
                    colleges={colleges}
                    departments={departments}
                    t={t}
                />

                {/* --- Action Buttons --- */}
                <div className="flex gap-4 mt-10">
                    {/* Main Save Action - High visibility Gold button */}
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        className="flex-1 h-14 rounded-2xl bg-gold text-white font-black text-lg shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all gap-3"
                    >
                        {loading ? (
                            <span className="animate-pulse">{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                        ) : (
                            <><Save className="h-5 w-5" /> {t('common.save')}</>
                        )}
                    </Button>

                    {/* Cancel Action - Subtle ghost button */}
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-14 px-8 rounded-2xl font-black text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
