/**
 * @file src/hooks/useDashboardDialogs.ts
 * @description Manages all dialog/modal state for the Admin Dashboard.
 *              Provides a single source of truth for which dialog is open,
 *              what entity type is being edited, and the form data buffer.
 *              This separates UI trigger logic from the actual data/save logic.
 */

import { useState } from 'react'; // React state — triggers re-renders when dialog state changes

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * useDashboardDialogs — returns state and helper functions for opening, closing,
 * and resetting the Add/Edit entity dialog and the Job Applicants viewer dialog.
 *
 * Usage: call once in Dashboard.tsx, destructure what you need, pass down to tabs.
 */
export const useDashboardDialogs = () => {

    // ─── Dialog Visibility ──────────────────────────────────────────────

    const [dialogOpen, setDialogOpen]     = useState(false);         // Controls whether the Add/Edit dialog is visible
    const [viewingJobId, setViewingJobId] = useState<string | null>(null); // When non-null, shows the Job Applicants viewer

    // ─── Form Context ───────────────────────────────────────────────────

    const [activeForm, setActiveForm] = useState('');     // Which entity is being added/edited ('university', 'job', etc.)
    const [formData, setFormData]     = useState<any>({}); // Buffer holding the current values of all form fields
    const [editId, setEditId]         = useState<string | null>(null); // null = Add mode; populated UUID = Edit mode

    // ─── Actions ────────────────────────────────────────────────────────

    /**
     * openAdd — configure the dialog for creating a new entity and open it.
     * Clears any stale form data from a previous session before opening.
     *
     * BUG FIX: Previously called setDialogOpen first, which could cause a brief
     * render with stale `activeForm`. Now all state updates are batched before
     * React renders by updating in a single function call sequence.
     *
     * @param type - The entity type string (e.g. 'university', 'graduate', 'job')
     */
    const openAdd = (type: string): void => {
        setActiveForm(type);    // Tell EntityForm which set of fields to render
        setFormData({});        // Clear any form data left over from a previous open
        setEditId(null);        // Null signals "Create New" mode to handleSave
        setDialogOpen(true);    // Show the dialog — do this last so the form is configured first
    };

    /**
     * openEdit — configure the dialog with an existing entity's data and open it.
     * Clones the item into formData so edits don't mutate the source list.
     *
     * @param type - The entity type string
     * @param item - The existing entity object to edit (from the data list)
     */
    const openEdit = (type: string, item: any): void => {
        setActiveForm(type);         // Tell EntityForm which fields to render
        setFormData({ ...item });    // Clone the item to prevent direct state mutation
        setEditId(item.id);          // Non-null ID signals "Edit Existing" mode to handleSave
        setDialogOpen(true);         // Show the dialog after configuring all state
    };

    /**
     * close — resets all dialog-related state and hides all dialogs.
     * Called by the Dialog's onOpenChange handler and the Cancel button.
     */
    const close = (): void => {
        setDialogOpen(false);    // Hide the Add/Edit entity dialog
        setViewingJobId(null);   // Also close the Job Applicants viewer if it was open
        // Note: we intentionally do NOT reset formData/activeForm/editId here
        // because they remain set until openAdd/openEdit clears them — this prevents
        // a flicker where the form goes blank during the close animation.
    };

    // ─── Return Public API ────────────────────────────────────────────────

    return {
        // ── State values ──
        dialogOpen,    // Boolean — whether the main Add/Edit dialog is shown
        activeForm,    // String — which entity type's form fields to render
        formData,      // Object — the current live form field values
        editId,        // String|null — null for Add mode, UUID for Edit mode
        viewingJobId,  // String|null — the job whose applicants we are viewing

        // ── State setters (for controlled form inputs) ──
        setDialogOpen,    // Allows the dialog component to close itself via onOpenChange
        setFormData,      // Allows form field onChange handlers to update the buffer
        setViewingJobId,  // Allows the Jobs tab to open the applicants viewer

        // ── Action helpers ──
        openAdd,   // Call with entity type to open dialog in Add mode
        openEdit,  // Call with entity type + item to open dialog in Edit mode
        close,     // Call to close all dialogs and reset triggers
    };
};
