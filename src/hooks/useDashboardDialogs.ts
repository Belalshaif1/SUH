/**
 * @file hooks/useDashboardDialogs.ts
 * @description Manages the state and logic for opening/closing and resetting dashboard forms and application views.
 * Ensures a clean separation between UI triggers and business data.
 */

import { useState } from 'react'; // React library for local component state

/**
 * useDashboardDialogs Hook
 * Provides a clean interface for controlling the massive variety of dashboard dialogs.
 */
export const useDashboardDialogs = () => {
    // --- Dialog Visibility States ---
    const [dialogOpen, setDialogOpen] = useState(false); // Controls the Add/Edit entity dialog
    const [viewingJobId, setViewingJobId] = useState<string | null>(null); // Triggers the "View Applicants" dialog for a job

    // --- Form Context States ---
    const [activeForm, setActiveForm] = useState(''); // Tracks which entity type is being edited (e.g. 'university')
    const [formData, setFormData] = useState<any>({}); // The dynamic buffer for form inputs
    const [editId, setEditId] = useState<string | null>(null); // Null for 'Add', ID for 'Edit' contexts

    /**
     * openAdd - Prepares the dialog for a fresh 'Create' operation
     * @param type The entity type indicator
     */
    const openAdd = (type: string) => {
        setActiveForm(type); // Set the target entity structure
        setFormData({}); // Clear any previous residue (Production Ready: no stale data)
        setEditId(null); // Explicitly enter "Create" mode
        setDialogOpen(true); // Pop the modal
    };

    /**
     * openEdit - Prepares the dialog for an 'Update' operation
     * @param type The entity type indicator
     * @param item The existing data object to be modified
     */
    const openEdit = (type: string, item: any) => {
        setActiveForm(type); // Set the target entity structure
        setFormData({ ...item }); // Clone the existing item into the form state (Immutable approach)
        setEditId(item.id); // Explicitly enter "Edit" mode with the item's primary key
        setDialogOpen(true); // Pop the modal
    };

    /**
     * close - Resets all dialog-related states
     */
    const close = () => {
        setDialogOpen(false); // Hide the modal
        setViewingJobId(null); // Hide any applicant view as well
    };

    // Expose the tools to the orchestrator component
    return {
        dialogOpen, activeForm, formData, editId, viewingJobId,
        setDialogOpen, setFormData, setViewingJobId,
        openAdd, openEdit, close
    };
};
