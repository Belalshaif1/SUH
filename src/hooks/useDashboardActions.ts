/**
 * @file src/hooks/useDashboardActions.ts
 * @description Handles all CRUD mutations for the Admin Dashboard:
 *              creating, updating, and deleting any entity type.
 *              Also manages the delete confirmation dialog state.
 *
 * BUG FIX: All async actions now have `setLoading(false)` in a `finally` block,
 *           so the loading indicator is guaranteed to turn off even if a file
 *           upload or API call throws an uncaught exception.
 */

import { useState, useCallback } from 'react'; // React hooks for state and stable function references
import apiClient   from '@/lib/apiClient';      // Central HTTP client with auth, offline queue, and error logging
import { useToast } from '@/hooks/use-toast';   // Toast notifications for success and error feedback
import { useLanguage } from '@/contexts/LanguageContext'; // For localised success/error messages

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * useDashboardActions — provides save, delete, and file-upload handlers.
 *
 * @param fetchData - Callback that refreshes all dashboard lists after a mutation
 * @param onSuccess - Callback called on successful save (typically closes the dialog)
 */
export const useDashboardActions = (
    fetchData: () => void, // Called after each successful save to refresh the UI
    onSuccess: () => void  // Called after each successful save to close the dialog
) => {
    const [loading, setLoading]       = useState<boolean>(false);    // True while any async action is in progress
    const { toast }                   = useToast();                  // Access the toast notification system
    const { language }                = useLanguage();               // Current language for localised messages

    // Delete confirmation dialog state
    const [deleteConfirm, setDeleteConfirm] = useState<{
        id: string;      // The UUID of the entity that is being requested for deletion
        table: string;   // The API endpoint table name (e.g. 'universities', 'graduates')
        name: string;    // The human-readable name to show in the confirmation dialog
    } | null>(null); // null means no deletion is pending and the dialog is hidden

    // ─── File Upload Helper ───────────────────────────────────────────────

    /**
     * handleFileUpload — uploads a single File object to the server.
     * Returns the remote URL string provided by the server after upload.
     * Throws if the upload fails — the calling function should catch this.
     *
     * @param file - A File object from a browser <input type="file"> element
     * @returns The absolute or relative URL of the uploaded file
     */
    const handleFileUpload = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();     // FormData is required for multipart/form-data file uploads
        formData.append('file', file);       // Add the file under the 'file' key the server expects

        // POST to /api/upload — apiClient detects FormData and omits the Content-Type header
        // so the browser can set the correct multipart boundary automatically
        const data = await apiClient('/upload', {
            method: 'POST',
            body: formData, // Send as multipart form — NOT JSON
        });

        return data.url; // Return the file URL so the caller can save it in the entity payload
    }, []); // No dependencies — this function is stable

    // ─── Main Save Handler ───────────────────────────────────────────────

    /**
     * handleSave — the unified create/update handler for all entity types.
     * Determines the HTTP method (POST vs PUT) based on whether editId is set.
     * Handles file uploads as pre-processing steps before the main API call.
     *
     * BUG FIX: `setLoading(false)` is now in a `finally` block so it always runs,
     *           even when a file upload or API call throws before reaching it.
     *
     * @param activeForm - Entity type string ('university', 'graduate', etc.)
     * @param formData   - Raw form state object with all field values
     * @param editId     - null for Create, UUID string for Update
     * @param role       - Current admin's role for RBAC default overrides
     * @param userRole   - Full role object for scoped field injection (e.g. college_id)
     */
    const handleSave = useCallback(async (
        activeForm: string,
        formData: any,
        editId: string | null,
        role: string,
        userRole: any
    ): Promise<void> => {
        setLoading(true); // Lock the save button to prevent double-submission

        try {
            // Start with a shallow copy of the form data so we don't mutate React state
            let payload: any = { ...formData };

            // ── Entity-specific pre-processing ─────────────────────────────
            // Each case uploads files and resolves Foreign Key defaults before the main call.

            if (activeForm === 'university') {
                // Upload the guide PDF if a new file was selected
                if (formData._guide_file) {
                    payload.guide_pdf_url = await handleFileUpload(formData._guide_file);
                }
                // Upload the logo image if a new file was selected
                if (formData._logo_file) {
                    payload.logo_url = await handleFileUpload(formData._logo_file);
                }
            }

            else if (activeForm === 'college') {
                // University admins automatically get their own uni_id injected
                payload.university_id = role === 'university_admin'
                    ? userRole.university_id  // Use the admin's own university
                    : formData.university_id; // Use the value selected in the form

                if (formData._guide_file) {
                    payload.guide_pdf_url = await handleFileUpload(formData._guide_file);
                }
                if (formData._logo_file) {
                    payload.logo_url = await handleFileUpload(formData._logo_file);
                }
            }

            else if (activeForm === 'department') {
                // College admins automatically get their own college_id injected
                payload.college_id = role === 'college_admin'
                    ? userRole.college_id   // Use the admin's own college
                    : formData.college_id;  // Use the value selected in the form

                if (formData._plan_file) {
                    payload.study_plan_url = await handleFileUpload(formData._plan_file); // Study plan PDF
                }
                if (formData._logo_file) {
                    payload.logo_url = await handleFileUpload(formData._logo_file);
                }
            }

            else if (activeForm === 'announcement') {
                if (formData._image_file) {
                    payload.image_url = await handleFileUpload(formData._image_file); // Announcement banner image
                }
                if (formData._attachment_file) {
                    payload.file_url = await handleFileUpload(formData._attachment_file); // Announcement PDF attachment
                }
            }

            else if (activeForm === 'research') {
                if (formData._pdf_file) {
                    payload.pdf_url = await handleFileUpload(formData._pdf_file); // Research paper PDF
                }
            }

            else if (activeForm === 'about') {
                if (formData._image_file) {
                    payload.developer_image_url = await handleFileUpload(formData._image_file); // Developer profile photo
                }
            }

            else if (activeForm === 'service') {
                if (formData._icon_file) {
                    payload.icon = await handleFileUpload(formData._icon_file); // Service icon/image
                }
            }

            else if (activeForm === 'graduate') {
                payload.graduation_year = parseInt(formData.graduation_year, 10); // Convert to integer for database
                payload.gpa = formData.gpa ? parseFloat(formData.gpa) : null;      // Convert to float or null if empty
            }

            else if (activeForm === 'fee') {
                payload.amount = parseFloat(formData.amount); // Convert amount string to float number
            }

            else if (activeForm === 'job') {
                // College admins automatically get their own college_id injected
                payload.college_id = role === 'college_admin'
                    ? userRole.college_id  // Use the admin's own college
                    : formData.college_id; // Use the value selected in the form
            }

            // ── Inject department scope for entities that belong to a department ──
            if (['research', 'graduate', 'fee'].includes(activeForm)) {
                if (role === 'department_admin') {
                    // Department admins can only create records for their own department
                    payload.department_id = userRole.department_id;
                }
            }

            // ── Pin flag security: only super_admin can set is_pinned ──
            if (role === 'super_admin' && formData.is_pinned !== undefined) {
                payload.is_pinned = formData.is_pinned ? 1 : 0; // Convert boolean to 1/0 for DB storage
            } else if (payload.is_pinned !== undefined) {
                delete payload.is_pinned; // Remove the pin flag for non-super admins (prevents privilege escalation)
            }

            // ── Remove internal file references before sending to the server ──
            // The _*_file keys are local browser File objects — the server doesn't need them
            delete payload._guide_file;
            delete payload._logo_file;
            delete payload._plan_file;
            delete payload._image_file;
            delete payload._attachment_file;
            delete payload._pdf_file;
            delete payload._icon_file;

            // ── Determine the HTTP method and endpoint ──────────────────────
            const method = editId ? 'PUT' : 'POST'; // POST for new records, PUT for updates

            // Map entity type names to their corresponding API resource paths
            const endpointMap: Record<string, string> = {
                university:   'universities',  // /api/universities
                college:      'colleges',      // /api/colleges
                department:   'departments',   // /api/departments
                announcement: 'announcements', // /api/announcements
                job:          'jobs',          // /api/jobs
                graduate:     'graduates',     // /api/graduates
                research:     'research',      // /api/research (no 's')
                fee:          'fees',          // /api/fees
                about:        'about',         // /api/about
                service:      'services',      // /api/services
            };

            const base     = endpointMap[activeForm] ?? (activeForm + 's'); // Fallback: append 's' to entity name
            const endpoint = `/${base}${editId ? `/${editId}` : ''}`;       // Append /:id for PUT requests

            // Execute the main API request
            await apiClient(endpoint, {
                method,                        // POST or PUT
                body: JSON.stringify(payload), // Serialise the cleaned payload to JSON
            });

            // ── Post-success actions ────────────────────────────────────────
            toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' }); // Notify the user
            onSuccess();    // Close the dialog (calls useDashboardDialogs.close())
            fetchData();    // Refresh all entity lists to show the newly saved record

        } catch (err: any) {
            // Show the server's error message (or a generic fallback) as a destructive toast
            toast({
                title:       language === 'ar' ? 'فشل الحفظ' : 'Save failed',  // Toast title
                description: err.message,                                        // The specific error from the server
                variant:     'destructive',                                       // Red destructive style
            });
        } finally {
            setLoading(false); // BUG FIX: always runs — even when file upload or API call throws
        }
    }, [fetchData, onSuccess, toast, language, handleFileUpload]); // Stable deps

    // ─── Delete Flow ──────────────────────────────────────────────────────

    /**
     * requestDelete — arms the delete flow by populating the confirmation state.
     * This opens the DeleteConfirmDialog without actually deleting anything yet.
     *
     * @param table - API endpoint table name (e.g. 'universities')
     * @param id    - UUID of the entity to delete
     * @param name  - Human-readable name shown in the confirmation dialog
     */
    const requestDelete = useCallback((table: string, id: string, name: string): void => {
        setDeleteConfirm({ id, table, name }); // Arm the delete — dialog will show
    }, []); // No deps — never recreated

    /**
     * confirmDelete — executes the actual HTTP DELETE after the user clicks "Confirm".
     * Only runs if deleteConfirm is non-null (i.e., requestDelete was called first).
     */
    const confirmDelete = useCallback(async (): Promise<void> => {
        if (!deleteConfirm) return; // Guard: do nothing if no deletion was requested

        const { id, table } = deleteConfirm; // Extract the entity's id and table from the confirmation state

        try {
            await apiClient(`/${table}/${id}`, { method: 'DELETE' }); // Send HTTP DELETE to the server
            toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted' }); // Notify success
            fetchData(); // Refresh the entity lists to remove the deleted record from the UI
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' }); // Show the server's error message
        } finally {
            setDeleteConfirm(null); // Always clear the confirmation state to close the dialog
        }
    }, [deleteConfirm, fetchData, toast, language]); // Recreate when the pending deletion changes

    /**
     * cancelDelete — disarms the delete flow without deleting anything.
     * Called when the user clicks "Cancel" in the confirmation dialog.
     */
    const cancelDelete = useCallback((): void => {
        setDeleteConfirm(null); // Clear the pending deletion — this closes the confirm dialog
    }, []); // No deps — never recreated

    // ─── Return Public API ────────────────────────────────────────────────

    return {
        loading,        // True while any save or delete action is in flight
        handleSave,     // Call to save (create or update) any entity
        requestDelete,  // Call to arm the delete confirmation dialog
        confirmDelete,  // Call when user confirms deletion
        cancelDelete,   // Call when user cancels deletion
        deleteConfirm,  // The pending deletion record — null when no deletion is pending
    };
};
