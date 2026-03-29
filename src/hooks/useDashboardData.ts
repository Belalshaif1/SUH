/**
 * @file src/hooks/useDashboardData.ts
 * @description The central data-management hook for the Admin Dashboard.
 *              Fetches all entity lists from the API, applies RBAC filtering
 *              based on the current user's role, and exposes sort/filter controls.
 *
 * BUG FIX: The `fetchData` useCallback previously listed `user` and `userRole` as deps.
 *           Because `AuthContext` was re-creating these objects on every render,
 *           `fetchData` was re-created → the `useEffect` below re-fired → infinite loop.
 *           Fix: depend on stable primitive IDs (`user?.id`, `userRole?.role`) instead
 *           of the full object references.
 */

import { useState, useEffect, useCallback } from 'react'; // React hooks for state, lifecycle, and memoised callbacks
import apiClient from '@/lib/apiClient';                  // Centralised fetch wrapper with auth and offline support
import { useAuth }     from '@/contexts/AuthContext';     // Auth context for role and user ID
import { useLanguage } from '@/contexts/LanguageContext'; // Language context for locale-aware sorting
import {
    University, College, Department, Graduate, Research,
    Job, Announcement, Fee, ErrorLog, DashboardStats, Service
} from '@/types/dashboard'; // All entity interfaces for full type safety

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * useDashboardData — provides all entity lists, stats, and sort/filter controls.
 * Call this once in Dashboard.tsx and pass the returned values down to child tabs.
 */
export const useDashboardData = () => {
    // Pull the user id, role object, and the full user from Auth context
    const { user, userRole } = useAuth();
    const { language } = useLanguage(); // Used in sorting if we need locale-aware string compare

    // ─── Entity Lists ───────────────────────────────────────────────────────

    const [universities, setUniversities]   = useState<University[]>([]);   // Full list filtered for the current role
    const [colleges, setColleges]           = useState<College[]>([]);       // Full list filtered for the current role
    const [departments, setDepartments]     = useState<Department[]>([]);    // Full list filtered for the current role
    const [graduates, setGraduates]         = useState<Graduate[]>([]);       // Graduate records visible to this admin
    const [research, setResearch]           = useState<Research[]>([]);       // Research papers visible to this admin
    const [jobs, setJobs]                   = useState<Job[]>([]);             // Job listings visible to this admin
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);  // Announcements visible to this admin
    const [fees, setFees]                   = useState<Fee[]>([]);             // Fee records visible to this admin
    const [errorLogs, setErrorLogs]         = useState<ErrorLog[]>([]);       // Error logs — super_admin only
    const [services, setServices]           = useState<Service[]>([]);        // University services
    const [aboutData, setAboutData]         = useState<any>(null);            // About-page CMS content

    // ─── UI State ──────────────────────────────────────────────────────────

    const [stats, setStats] = useState<DashboardStats>({
        universities: 0, // Initial count for the university stat card
        colleges: 0,     // Initial count for the college stat card
        departments: 0,  // Initial count for the department stat card
        graduates: 0,    // Initial count for the graduates stat card
        research: 0,     // Initial count for the research stat card
        services: 0,     // Initial count for the services stat card
        users: 0,        // Initial count for the users stat card (populated separately)
    });

    const [loading, setLoading] = useState<boolean>(true); // True while data is being fetched

    // ─── Sort and Filter Controls ──────────────────────────────────────────

    const [sortOrder, setSortOrder]       = useState<'newest' | 'oldest' | 'name'>('newest'); // Current sort mode
    const [uniFilter, setUniFilter]       = useState<string>('all');    // Active university filter ('all' = no filter)
    const [collegeFilter, setCollegeFilter] = useState<string>('all'); // Active college filter
    const [deptFilter, setDeptFilter]     = useState<string>('all');    // Active department filter

    // ─── Data Fetcher ──────────────────────────────────────────────────────

    /**
     * fetchData — triggers a full refresh of all entity lists from the server.
     * Applies RBAC filtering based on the current user's role and scope IDs.
     *
     * BUG FIX: Instead of depending on `user` and `userRole` (object references that
     * change every render), we depend on stable primitive values: `user?.id` and
     * `userRole?.role`. This prevents the infinite loop where:
     *   AuthContext re-renders → new `user` object → fetchData re-created →
     *   useEffect re-fires → fetchData called again → repeat forever.
     */
    const fetchData = useCallback(async (): Promise<void> => {
        if (!user || !userRole) return; // Guard: don't fetch if there's no authenticated user

        setLoading(true); // Show the loading indicator while the fetch is in progress

        const role          = userRole.role;           // Short alias for the current user's role string
        const universityId  = userRole.university_id;  // Scope: which university this admin manages
        const collegeId     = userRole.college_id;     // Scope: which college this admin manages
        const departmentId  = userRole.department_id;  // Scope: which department this admin manages

        try {
            // Fire all 10 API requests in parallel for maximum performance
            const [
                uRes,    // Raw universities array from the server
                cRes,    // Raw colleges array
                dRes,    // Raw departments array
                gRes,    // Raw graduates array
                rRes,    // Raw research array
                jRes,    // Raw jobs array
                aRes,    // Raw announcements array
                aboutRes, // About page content object
                logsRes, // Error logs — only fetched for super_admin (others get empty array)
                fRes,    // Raw fees array
                sRes,    // Raw services array
            ] = await Promise.all([
                apiClient('/universities'),            // GET /api/universities
                apiClient('/colleges'),                // GET /api/colleges
                apiClient('/departments'),             // GET /api/departments
                apiClient('/graduates'),               // GET /api/graduates
                apiClient('/research'),                // GET /api/research
                apiClient('/jobs'),                    // GET /api/jobs
                apiClient('/announcements'),           // GET /api/announcements
                apiClient('/about'),                   // GET /api/about
                role === 'super_admin'                 // Only super_admin can view error logs
                    ? apiClient('/error_logs')
                    : Promise.resolve([]),             // Other roles receive an empty array immediately
                apiClient('/fees'),                    // GET /api/fees
                apiClient('/services'),                // GET /api/services
            ]);

            // ── RBAC Filtering ──────────────────────────────────────────────
            // Each branch filters the globally fetched data down to what the
            // current admin is authorised to see and manage.

            if (role === 'super_admin') {
                // Super admins have full unfiltered access to all data
                setUniversities(uRes || []);   // Store the complete universities list
                setColleges(cRes || []);        // Store the complete colleges list
                setDepartments(dRes || []);     // Store the complete departments list
                setGraduates(gRes || []);       // Store the complete graduates list
                setResearch(rRes || []);        // Store the complete research list
                setJobs(jRes || []);            // Store the complete jobs list
                setAnnouncements(aRes || []);  // Store the complete announcements list
                setFees(fRes || []);            // Store the complete fees list
                setServices(sRes || []);        // Store the complete services list
                setErrorLogs(logsRes || []);   // Store the error logs (super_admin only)
                setAboutData(aboutRes);         // Store the about-page CMS content

                // Calculate stats from the raw unfiltered response lengths
                setStats({
                    universities: (uRes || []).length, // Total number of universities in the system
                    colleges:     (cRes || []).length,  // Total number of colleges
                    departments:  (dRes || []).length,  // Total number of departments
                    graduates:    (gRes || []).length,  // Total number of graduates
                    research:     (rRes || []).length,  // Total number of research papers
                    services:     (sRes || []).length,  // Total number of services
                    users: 0, // User count populated via AdminManagement separately
                });

            } else if (role === 'university_admin') {
                // University admins see all entities within their specific university
                const uid = universityId; // The UUID of the university this admin manages

                // Filter universities to only this admin's university
                const filteredUnis = (uRes || []).filter((u: any) => u.id === uid);

                // Filter colleges to those that belong to this admin's university
                const filteredColleges = (cRes || []).filter((c: any) => c.university_id === uid);

                // Filter departments based on the filtered college list
                const filteredDepts = (dRes || []).filter((d: any) => d.university_id === uid);

                // Build a set of college IDs for O(1) lookup in nested filters
                const collegeIds = new Set(filteredColleges.map((c: any) => c.id));

                // Filter announcements scoped to this university or its colleges
                const filteredAnnouncements = (aRes || []).filter((a: any) =>
                    (a.scope === 'university' && a.university_id === uid) ||
                    (a.scope === 'college' && collegeIds.has(a.college_id))
                );

                // Build a set of department IDs for O(1) lookup
                const deptIds = new Set(filteredDepts.map((d: any) => d.id));

                setUniversities(filteredUnis);     // Only their university
                setColleges(filteredColleges);      // Only colleges in their university
                setDepartments(filteredDepts);      // Only departments in their university
                setJobs((jRes || []).filter((j: any) => collegeIds.has(j.college_id)));           // Jobs in their colleges
                setGraduates((gRes || []).filter((g: any) => deptIds.has(g.department_id)));     // Graduates in their departments
                setResearch((rRes || []).filter((r: any) => deptIds.has(r.department_id)));      // Research in their departments
                setFees((fRes || []).filter((f: any) => deptIds.has(f.department_id)));          // Fees in their departments
                setServices(sRes || []);        // Services are visible to university admins as well
                setAnnouncements(filteredAnnouncements); // Scoped announcements

                // Stats scoped to this university
                setStats({
                    universities: 1,                     // They manage exactly one university
                    colleges:    filteredColleges.length, // All colleges in their university
                    departments: filteredDepts.length,    // All departments in their university
                    graduates:   (gRes || []).filter((g: any) => deptIds.has(g.department_id)).length,
                    research:    (rRes || []).filter((r: any) => deptIds.has(r.department_id)).length,
                    services:    (sRes || []).length,
                    users: 0,
                });

            } else if (role === 'college_admin') {
                // College admins see all entities within their specific college
                const cid = collegeId; // The UUID of the college this admin manages

                const myCollege = (cRes || []).filter((c: any) => c.id === cid);     // Their single college
                const myDepts   = (dRes || []).filter((d: any) => d.college_id === cid); // Departments in their college
                const deptIds   = new Set(myDepts.map((d: any) => d.id));            // Fast lookup set

                // Find the parent university of their college for read-only display
                const myUni = (uRes || []).filter((u: any) =>
                    myCollege.some((c: any) => c.university_id === u.id)
                );

                setUniversities(myUni);    // Their university (read-only parent reference)
                setColleges(myCollege);     // Only their college
                setDepartments(myDepts);    // Departments in their college
                setJobs((jRes || []).filter((j: any) => j.college_id === cid));                  // Jobs in their college
                setGraduates((gRes || []).filter((g: any) => deptIds.has(g.department_id)));    // Graduates in their departments
                setResearch((rRes || []).filter((r: any) => deptIds.has(r.department_id)));     // Research in their departments
                setFees((fRes || []).filter((f: any) => deptIds.has(f.department_id)));         // Fees in their departments
                setAnnouncements((aRes || []).filter((a: any) =>
                    a.scope === 'college' && a.college_id === cid // Only college-scoped announcements for their college
                ));
                setServices(sRes || []); // Visible

                setStats({
                    universities: myUni.length,     // Usually 1 — the parent university
                    colleges:     1,                 // They manage exactly one college
                    departments:  myDepts.length,    // All departments in their college
                    graduates:    (gRes || []).filter((g: any) => deptIds.has(g.department_id)).length,
                    research:     (rRes || []).filter((r: any) => deptIds.has(r.department_id)).length,
                    services:     (sRes || []).length,
                    users: 0,
                });

            } else if (role === 'department_admin') {
                // Department admins see only entities within their specific department
                const did = departmentId; // The UUID of the department this admin manages

                const myDept = (dRes || []).filter((d: any) => d.id === did);  // Their single department (array of 1)

                // Navigate up the hierarchy to find the parent college
                const myCollege = myDept.length > 0
                    ? (cRes || []).filter((c: any) => c.id === myDept[0]?.college_id)
                    : []; // Empty if department isn't found (safety guard)

                // Navigate up further to find the parent university
                const myUni = myCollege.length > 0
                    ? (uRes || []).filter((u: any) => u.id === myCollege[0]?.university_id)
                    : []; // Empty if college isn't found

                setUniversities(myUni);    // Parent university (read-only reference)
                setColleges(myCollege);     // Parent college (read-only reference)
                setDepartments(myDept);     // Only their department
                setResearch((rRes || []).filter((r: any) => r.department_id === did));   // Research in their department
                setGraduates((gRes || []).filter((g: any) => g.department_id === did));  // Graduates in their department
                setFees((fRes || []).filter((f: any) => f.department_id === did));       // Fees in their department
                setJobs((jRes || []).filter((j: any) =>
                    myCollege.some((c: any) => c.id === j.college_id) // Jobs from their college
                ));
                setAnnouncements((aRes || []).filter((a: any) =>
                    a.created_by === user?.id || // Their own announcements
                    (a.scope === 'college' && myCollege.some((c: any) => c.id === a.college_id)) // Or college-scoped ones
                ));
                setServices(sRes || []); // Visible

                setStats({
                    universities: myUni.length,     // Usually 1
                    colleges:     myCollege.length,  // Usually 1
                    departments:  1,                 // They manage exactly one department
                    graduates:    (gRes || []).filter((g: any) => g.department_id === did).length,
                    research:     (rRes || []).filter((r: any) => r.department_id === did).length,
                    services:     (sRes || []).length,
                    users: 0,
                });
            }

        } catch (err) {
            // Log the error to the console — it was already logged to the server by apiClient
            console.error('[useDashboardData] Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false); // Always turn off loading, even on failure (prevents a stuck spinner)
        }

    // BUG FIX: Use stable primitive IDs as deps, NOT the full user/userRole object references.
    // This prevents new object references from triggering fetchData recreation on every render.
    }, [user?.id, userRole?.role, userRole?.university_id, userRole?.college_id, userRole?.department_id]);

    // ─── Trigger on Mount / Role Change ────────────────────────────────────

    useEffect(() => {
        fetchData(); // Fetch data when the component mounts or when the user's identity changes
    }, [fetchData]); // Only re-run when fetchData itself changes (i.e., when the user changes)

    // ─── Data Processor ────────────────────────────────────────────────────

    /**
     * processData — applies the current sort order and optional university filter
     * to any entity list before it is rendered in a tab.
     * Does NOT mutate the original state arrays (uses shallow copy).
     */
    const processData = useCallback((data: any[]): any[] => {
        let result = [...data]; // Shallow copy to avoid mutating state

        // Apply the university scope filter (only if a specific uni is selected)
        if (uniFilter !== 'all') {
            result = result.filter(item =>
                item.university_id === uniFilter // Keep items that belong to the selected university
            );
        }

        // Sort the filtered results according to the current sortOrder
        result.sort((a, b) => {
            // Pinned items always sort before unpinned items, regardless of other sort criteria
            if (a.is_pinned && !b.is_pinned) return -1; // a is pinned, b is not → a comes first
            if (!a.is_pinned && b.is_pinned) return 1;  // b is pinned, a is not → b comes first

            // Secondary sort: apply the user's chosen sort order
            if (sortOrder === 'newest') {
                // Sort by creation date descending (newest record first)
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
            if (sortOrder === 'oldest') {
                // Sort by creation date ascending (oldest record first)
                return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            }
            return 0; // 'name' sort: leave order unchanged (could add locale string compare here)
        });

        return result; // Return the sorted and filtered copy
    }, [uniFilter, sortOrder]); // Recreate only when the active filter or sort order changes

    // ─── Return Public API ─────────────────────────────────────────────────

    return {
        // ── Entity data lists ──
        universities, // Filtered university list for the current admin's scope
        colleges,     // Filtered college list
        departments,  // Filtered department list
        graduates,    // Filtered graduates list
        research,     // Filtered research list
        jobs,         // Filtered jobs list
        announcements, // Filtered announcements list
        fees,         // Filtered fees list
        services,     // Filtered services list
        errorLogs,    // Error logs (empty for non-super_admins)
        aboutData,    // About-page CMS content

        // ── Aggregated statistics ──
        stats,   // Numeric counts for the dashboard stats cards

        // ── Loading indicator ──
        loading, // True while fetchData is in flight

        // ── Data actions ──
        fetchData,   // Call this after a successful mutation to refresh all lists
        processData, // Call this on each list before rendering (applies sort and filter)

        // ── Sort and filter controls ──
        sortOrder, setSortOrder,         // Current sort mode and its setter
        uniFilter, setUniFilter,         // University filter value and its setter
        collegeFilter, setCollegeFilter, // College filter value and its setter
        deptFilter, setDeptFilter,       // Department filter value and its setter
    };
};
