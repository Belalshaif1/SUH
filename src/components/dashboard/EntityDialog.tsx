/**
 * @file src/components/dashboard/EntityDialog.tsx
 * @description Centralised modal shell for Add/Edit operations across all entity types.
 *              Wraps the dynamic EntityForm (which renders the correct fields based on `activeForm`)
 *              with the Shadcn Dialog frame, header, and action buttons.
 *
 * This component has NO local state — it is purely presentational,
 * delegating all business logic to the parent (Dashboard.tsx via useDashboardDialogs / useDashboardActions).
 */

import React from 'react'; // React for JSX and FC type
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';        // Shadcn Dialog components
import { Button }    from '@/components/ui/button'; // Shadcn button
import { Save }      from 'lucide-react';            // Save icon for the confirm button
import { EntityForm } from './EntityForm';           // The dynamic form that renders fields for each entity type
import { useLanguage } from '@/contexts/LanguageContext'; // t() for translated strings

// ─── Props ────────────────────────────────────────────────────────────────

/** Props for the EntityDialog component */
interface EntityDialogProps {
    isOpen:       boolean;          // Controls whether the dialog is currently visible
    onClose:      () => void;       // Called when the user dismisses the dialog without saving
    activeForm:   string;           // Determines which entity type is being added/edited (e.g. 'university', 'college')
    formData:     any;              // Current form field values (managed in useDashboardDialogs)
    setFormData:  (data: any) => void; // Updates form field values on user input
    onSave:       () => void;       // Triggers the save/submit logic in useDashboardActions
    loading:      boolean;          // True while the save request is in flight
    editId:       string | null;    // null = Add mode, non-null string = Edit mode
    universities: any[];            // Options for the university dropdown fields
    colleges:     any[];            // Options for the college dropdown fields
    departments:  any[];            // Options for the department dropdown fields
    role:         string | undefined; // Current user role — passed to EntityForm for conditional fields
}

// ─── Component ────────────────────────────────────────────────────────────

export const EntityDialog: React.FC<EntityDialogProps> = ({
    isOpen, onClose, activeForm, formData, setFormData, onSave, loading, editId,
    universities, colleges, departments, role
}) => {
    const { t, language } = useLanguage(); // t() for "Save", "Cancel", "Add", "Edit" labels

    return (
        <Dialog
            open={isOpen}      // Controlled open state from useDashboardDialogs
            onOpenChange={onClose} // Handle external dismissal (Escape key, backdrop click)
        >
            {/* Dialog box — wide enough for multi-column forms, scrollable if content overflows */}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border-none shadow-2xl">

                {/* ── Dialog header ── */}
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-black text-primary flex items-center gap-3">
                        {/* Title: "Add" in add mode, "Edit" in edit mode */}
                        {editId ? t('common.edit') : t('common.add')}
                        {/* Gold bullet separator between the action and entity type */}
                        <span className="text-gold opacity-50">•</span>
                        {/* Entity type display (e.g. "college", "department") — undercase slug */}
                        <span className="text-primary/40 uppercase tracking-widest text-xs font-bold mt-1">
                            {activeForm.replace('_', ' ')} {/* Replace underscore with space for readability */}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* ── Dynamic form — fields vary based on activeForm ── */}
                <EntityForm
                    activeForm={activeForm}   // Tells EntityForm which field set to render
                    formData={formData}       // Current field values (controlled by Dialog state)
                    setFormData={setFormData} // Handler to update form state on user input
                    role={role}               // Passed to EntityForm for RBAC-aware conditional fields
                    universities={universities} // Options for university selector fields
                    colleges={colleges}         // Options for college selector fields
                    departments={departments}   // Options for department selector fields
                    t={t}                       // Translation function for field labels and placeholders
                />

                {/* ── Footer action buttons ── */}
                <div className="flex gap-4 mt-10"> {/* Spaced row below the form */}
                    {/* Primary save button — gold accent to make it visually prominent */}
                    <Button
                        onClick={onSave}       // Delegates to useDashboardActions.handleSave
                        disabled={loading}     // Disabled while the API call is in-flight
                        className="flex-1 h-14 rounded-2xl bg-gold text-white font-black text-lg shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all gap-3"
                    >
                        {loading ? (
                            // Show "Saving..." with a pulsing animation while the save request is in-flight
                            <span className="animate-pulse">
                                {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                            </span>
                        ) : (
                            // Normal idle state: save icon + "Save" label
                            <><Save className="h-5 w-5" /> {t('common.save')}</>
                        )}
                    </Button>

                    {/* Secondary cancel button — subtle ghost style so it doesn't compete with Save */}
                    <Button
                        variant="ghost"
                        onClick={onClose} // Calls onClose to close the dialog and reset state
                        className="h-14 px-8 rounded-2xl font-black text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        {t('common.cancel')} {/* "إلغاء" / "Cancel" */}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};
