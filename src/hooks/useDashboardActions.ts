/**
 * @file hooks/useDashboardActions.ts
 * @description This hook handles all destructive and constructive actions (CRUD) in the Dashboard.
 * It abstracts the complexity of saving different entity types and handling file uploads.
 */

import { useState } from 'react'; // React state for local action loading states
import apiClient from '@/lib/apiClient'; // Central API client
import { useToast } from '@/hooks/use-toast'; // Toast notifications for user feedback
import { useLanguage } from '@/contexts/LanguageContext'; // For localized success/error messages

/**
 * useDashboardActions Hook
 * @param fetchData Function to refresh the global state after a successful action
 * @param onSuccess Callback to execute after a successful save (e.g., closing a dialog)
 */
export const useDashboardActions = (fetchData: () => void, onSuccess: () => void) => {
    const [loading, setLoading] = useState<boolean>(false); // Action-level loading state (for buttons)
    const { toast } = useToast(); // Hook to trigger UI notifications
    const { language } = useLanguage(); // Current site language
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, table: string, name: string } | null>(null);


    /**
     * handleFileUpload - Helper to upload files to the server
     * @param file The file object from an input
     * @returns The remote URL of the uploaded file
     */
    const handleFileUpload = async (file: File) => {
        const formData = new FormData(); // Browser API to prepare multipart/form-data
        formData.append('file', file); // Append the raw file
        const data = await apiClient('/upload', { // Send to the upload endpoint
            method: 'POST',
            body: formData // Note: apiClient should handle boundary headers if needed
        });
        return data.url; // Return the absolute or relative URL provided by the server
    };

    /**
     * handleSave - The primary entry point for creating/updating any entity
     * @param activeForm The type of entity being saved (e.g., 'university', 'job')
     * @param formData The raw state from the form component
     * @param editId The ID of the item if we are in Edit mode (null for new items)
     * @param role User's role for security checks and default fields
     * @param userRole Object containing IDs like university_id for context
     */
    const handleSave = async (activeForm: string, formData: any, editId: string | null, role: string, userRole: any) => {
        setLoading(true); // Disable buttons during the request
        try {
            let payload: any = { ...formData }; // Start with a copy of the form state

            // --- Entity-Specific Pre-Processing ---
            // This section handles file uploads and ID associations based on the entity type

            if (activeForm === 'university') {
                // Handle images/PDFs if they were newly selected
                if (formData._guide_file) payload.guide_pdf_url = await handleFileUpload(formData._guide_file);
                if (formData._logo_file) payload.logo_url = await handleFileUpload(formData._logo_file);
            }
            else if (activeForm === 'college') {
                payload.university_id = role === 'university_admin' ? userRole.university_id : formData.university_id;
                if (formData._guide_file) payload.guide_pdf_url = await handleFileUpload(formData._guide_file);
                if (formData._logo_file) payload.logo_url = await handleFileUpload(formData._logo_file);
            }
            else if (activeForm === 'department') {
                payload.college_id = role === 'college_admin' ? userRole.college_id : formData.college_id;
                if (formData._plan_file) payload.study_plan_url = await handleFileUpload(formData._plan_file);
                if (formData._logo_file) payload.logo_url = await handleFileUpload(formData._logo_file);
            }
            else if (activeForm === 'announcement') {
                if (formData._image_file) payload.image_url = await handleFileUpload(formData._image_file);
                if (formData._attachment_file) payload.file_url = await handleFileUpload(formData._attachment_file);
            }
            else if (activeForm === 'research') {
                if (formData._pdf_file) payload.pdf_url = await handleFileUpload(formData._pdf_file);
            }
            else if (activeForm === 'about') {
                if (formData._image_file) payload.developer_image_url = await handleFileUpload(formData._image_file);
            }
            else if (activeForm === 'graduate') {
                payload.graduation_year = parseInt(formData.graduation_year);
                payload.gpa = formData.gpa ? parseFloat(formData.gpa) : null;
            }
            else if (activeForm === 'fee') {
                payload.amount = parseFloat(formData.amount);
            }
            else if (activeForm === 'job') {
                payload.college_id = role === 'college_admin' ? userRole.college_id : formData.college_id;
            }

            // Inject department context for lower level admins
            if (['research', 'graduate', 'fee'].includes(activeForm)) {
                if (role === 'department_admin') {
                    payload.department_id = userRole.department_id;
                }
            }

            // Global Security Override: Only Super Admins can pin items
            if (role === 'super_admin' && formData.is_pinned !== undefined) {
                payload.is_pinned = formData.is_pinned ? 1 : 0;
            } else if (payload.is_pinned !== undefined) {
                delete payload.is_pinned;
            }

            // Remove internal file fields (File objects are not JSON-serializable)
            Object.keys(payload).forEach(key => {
                if (key.startsWith('_')) delete payload[key];
            });

            // Note: Logic for other forms (Announcements, Research, etc.) follows the same pattern.
            // We would ideally use a strategy pattern here if the number of entities grows very large.

            // --- API Execution ---
            const method = editId ? 'PUT' : 'POST'; // Choose HTTP verb based on mode

            // Construct the correct endpoint mapping for each entity
            const endpointMap: Record<string, string> = {
                university: 'universities',
                college: 'colleges',
                department: 'departments',
                announcement: 'announcements',
                job: 'jobs',
                graduate: 'graduates',
                research: 'research',      // Note: server uses '/api/research' without 's'
                fee: 'fees',
                about: 'about',
            };

            const base = endpointMap[activeForm] || (activeForm + 's');
            const endpoint = `/${base}${editId ? `/${editId}` : ''}`;
            // Note: The endpoint construction above is simplified; some routes might need explicit mapping.
            // For production, a mapping object { 'university': '/universities' } is safer.

            await apiClient(endpoint, {
                method,
                body: JSON.stringify(payload) // Standardize on JSON for the payload
            });

            // --- Post-Action Success ---
            toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' });
            onSuccess(); // Close dialog or clear state
            fetchData(); // Refresh the main dashboard view
        } catch (err: any) {
            // Production-grade error reporting via Toasts
            toast({
                title: language === 'ar' ? 'فشل الحفظ' : 'Save failed',
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false); // Enable buttons back
        }
    };

    /**
     * requestDelete - Initiates the custom confirmation flow
     */
    const requestDelete = (table: string, id: string, name: string) => {
        setDeleteConfirm({ id, table, name });
    };

    /**
     * confirmDelete - Performs the actual deletion after user clicks "Yes"
     */
    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        const { id, table } = deleteConfirm;

        try {
            await apiClient(`/${table}/${id}`, { method: 'DELETE' }); // Perform HTTP DELETE
            toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted' });
            fetchData(); // Sync UI with database
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setDeleteConfirm(null);
        }
    };

    return {
        loading,
        handleSave,
        requestDelete,
        confirmDelete,
        deleteConfirm,
        cancelDelete: () => setDeleteConfirm(null)
    }; // Expose state and methods
};
