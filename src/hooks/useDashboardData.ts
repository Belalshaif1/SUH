/**
 * @file hooks/useDashboardData.ts
 * @description This custom hook centralizes all data-related logic for the Admin Dashboard.
 * It manages state for entities (universities, colleges, etc.) and provides methods for fetching and processing data.
 */

import { useState, useEffect, useCallback } from 'react'; // Import React hooks for state and lifecycle management
import apiClient from '@/lib/apiClient'; // Import our centralized API client for network requests
import { useAuth } from '@/contexts/AuthContext'; // Import authentication context to access user role and permissions
import { useLanguage } from '@/contexts/LanguageContext'; // Import language context for localization support
import {
    University, College, Department, Graduate, Research,
    Job, Announcement, Fee, ErrorLog, DashboardStats
} from '@/types/dashboard'; // Import type definitions for better type safety

/**
 * useDashboardData Hook
 * @returns An object containing all dashboard state and data manipulation functions.
 */
export const useDashboardData = () => {
    // Access global state using custom contexts
    const { user, userRole } = useAuth(); // Destructure user and role info to understand access level
    const { language } = useLanguage(); // Destructure language to handle localized sorting/filtering

    // --- Entity State Hooks ---
    // Each hook manages a specific list of academic entities
    const [universities, setUniversities] = useState<University[]>([]); // State for the list of universities
    const [colleges, setColleges] = useState<College[]>([]); // State for the list of colleges
    const [departments, setDepartments] = useState<Department[]>([]); // State for the list of departments
    const [graduates, setGraduates] = useState<Graduate[]>([]); // State for the list of graduates
    const [research, setResearch] = useState<Research[]>([]); // State for the list of research papers
    const [jobs, setJobs] = useState<Job[]>([]); // State for the list of available jobs
    const [announcements, setAnnouncements] = useState<Announcement[]>([]); // State for system/entity announcements
    const [fees, setFees] = useState<Fee[]>([]); // State for tuition and academic fees
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]); // State for system error logs (Super Admin only)
    const [aboutData, setAboutData] = useState<any>(null); // State for "About Us" page content

    // --- UI/UX State Hooks ---
    const [stats, setStats] = useState<DashboardStats>({
        universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0, users: 0
    }); // State for top-level numeric statistics displayed in the dashboard cards
    const [loading, setLoading] = useState<boolean>(true); // Global loading flag to show spinners during data fetch

    // --- Filtering & Sorting State Hooks ---
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest'); // Current sort direction
    const [uniFilter, setUniFilter] = useState<string>('all'); // Filter by specific university ID
    const [collegeFilter, setCollegeFilter] = useState<string>('all'); // Filter by specific college ID
    const [deptFilter, setDeptFilter] = useState<string>('all'); // Filter by specific department ID

    /**
     * fetchData - Asynchronous function to pull all relevant data from the backend
     * It respects the user's role and filters data appropriately for security and relevance.
     */
    const fetchData = useCallback(async () => {
        // If user is not logged in or role is missing, skip fetching
        if (!user || !userRole) return;

        // Start the loading state to inform the UI
        setLoading(true);

        const role = userRole.role; // Helper variable for the current user's role string

        try {
            // Execute all API calls concurrently for maximum performance (Production Ready approach)
            const [uRes, cRes, dRes, gRes, rRes, jRes, aRes, aboutRes, logsRes, fRes] = await Promise.all([
                apiClient('/universities'), // Fetch all universities
                apiClient('/colleges'), // Fetch all colleges
                apiClient('/departments'), // Fetch all departments
                apiClient('/graduates'), // Fetch all graduates records
                apiClient('/research'), // Fetch all research records
                apiClient('/jobs'), // Fetch all job postings
                apiClient('/announcements'), // Fetch all announcements
                apiClient('/about'), // Fetch About page config
                role === 'super_admin' ? apiClient('/error_logs') : Promise.resolve([]), // Fetch logs only if Super Admin (Security)



                apiClient('/fees') // Fetch all fee records
            ]);

            // --- RBAC Logic (Role-Based Access Control) ---
            // We process the global result based on what the user is allowed to see.

            if (role === 'super_admin') {
                // Super Admins see everything directly without filtering
                setUniversities(uRes || []);
                setColleges(cRes || []);
                setDepartments(dRes || []);
                setGraduates(gRes || []);
                setResearch(rRes || []);
                setJobs(jRes || []);
                setAnnouncements(aRes || []);
                setFees(fRes || []);
                setErrorLogs(logsRes || []);
                setAboutData(aboutRes);

                // Calculate global stats for Super Admin
                setStats({
                    universities: uRes.length || 0,
                    colleges: cRes.length || 0,
                    departments: dRes.length || 0,
                    graduates: gRes.length || 0,
                    research: rRes.length || 0,
                    users: 0 // User counting logic can be added here if needed
                });
            } else if (role === 'university_admin') {
                // University Admins see data related ONLY to their specific University ID
                const uid = userRole.university_id;
                const filteredUniversities = (uRes || []).filter((u: any) => u.id === uid);
                const filteredColleges = (cRes || []).filter((c: any) => c.university_id === uid);
                const filteredDepartments = (dRes || []).filter((d: any) => d.university_id === uid);
                const collegeIds = filteredColleges.map((c: any) => c.id);

                // Complex filtering for announcements based on scope (Multi-level access)
                const filteredAnnouncements = (aRes || []).filter((a: any) =>
                    (a.scope === 'university' && a.university_id === uid) ||
                    (a.scope === 'college' && collegeIds.includes(a.college_id))
                );

                setUniversities(filteredUniversities);
                setColleges(filteredColleges);
                setDepartments(filteredDepartments);
                setJobs((jRes || []).filter((j: any) => collegeIds.includes(j.college_id)));
                setAnnouncements(filteredAnnouncements);
                setGraduates((gRes || []).filter((g: any) => filteredDepartments.some((d: any) => d.id === g.department_id)));
                setResearch((rRes || []).filter((r: any) => filteredDepartments.some((d: any) => d.id === r.department_id)));
                setFees((fRes || []).filter((f: any) => filteredDepartments.some((d: any) => d.id === f.department_id)));

                setStats({
                    universities: 1,
                    colleges: filteredColleges.length,
                    departments: filteredDepartments.length,
                    graduates: (gRes || []).filter((g: any) => filteredDepartments.some((d: any) => d.id === g.department_id)).length,
                    research: (rRes || []).filter((r: any) => filteredDepartments.some((d: any) => d.id === r.department_id)).length,
                    users: 0
                });

            } else if (role === 'college_admin') {
                // College Admins see ONLY data within their college
                const cid = userRole.college_id;
                const myCollege = (cRes || []).filter((c: any) => c.id === cid);
                const myDepts = (dRes || []).filter((d: any) => d.college_id === cid);
                const deptIds = myDepts.map((d: any) => d.id);
                const myUni = (uRes || []).filter((u: any) =>
                    myCollege.some((c: any) => c.university_id === u.id)
                );

                setUniversities(myUni);
                setColleges(myCollege);
                setDepartments(myDepts);
                setJobs((jRes || []).filter((j: any) => j.college_id === cid));
                setGraduates((gRes || []).filter((g: any) => deptIds.includes(g.department_id)));
                setResearch((rRes || []).filter((r: any) => deptIds.includes(r.department_id)));
                setFees((fRes || []).filter((f: any) => deptIds.includes(f.department_id)));
                setAnnouncements((aRes || []).filter((a: any) =>
                    a.scope === 'college' && a.college_id === cid
                ));
                setStats({
                    universities: myUni.length,
                    colleges: 1,
                    departments: myDepts.length,
                    graduates: (gRes || []).filter((g: any) => deptIds.includes(g.department_id)).length,
                    research: (rRes || []).filter((r: any) => deptIds.includes(r.department_id)).length,
                    users: 0
                });

            } else if (role === 'department_admin') {
                // Department Admins see ONLY data within their department
                const did = userRole.department_id;
                const myDept = (dRes || []).filter((d: any) => d.id === did);
                const myCollege = myDept.length > 0
                    ? (cRes || []).filter((c: any) => c.id === myDept[0]?.college_id)
                    : [];
                const myUni = myCollege.length > 0
                    ? (uRes || []).filter((u: any) => u.id === myCollege[0]?.university_id)
                    : [];

                setUniversities(myUni);
                setColleges(myCollege);
                setDepartments(myDept);
                setJobs((jRes || []).filter((j: any) =>
                    myCollege.some((c: any) => c.id === j.college_id)
                ));
                setGraduates((gRes || []).filter((g: any) => g.department_id === did));
                setResearch((rRes || []).filter((r: any) => r.department_id === did));
                setFees((fRes || []).filter((f: any) => f.department_id === did));
                setAnnouncements((aRes || []).filter((a: any) =>
                    a.created_by === user?.id || (a.scope === 'college' && myCollege.some((c: any) => c.id === a.college_id))
                ));
                setStats({
                    universities: myUni.length,
                    colleges: myCollege.length,
                    departments: 1,
                    graduates: (gRes || []).filter((g: any) => g.department_id === did).length,
                    research: (rRes || []).filter((r: any) => r.department_id === did).length,
                    users: 0
                });
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {

            // Ensure loading state is turned off regardless of success or failure
            setLoading(false);
        }
    }, [user, userRole]); // Dependencies for the callback

    /**
     * processData - Utility to sort and filter lists before rendering
     * This handles UI-level concerns like sorting by name or pinning items.
     */
    const processData = (data: any[]) => {
        let result = [...data]; // Create a shallow copy to avoid mutating state directly

        // Apply active filters (Uni/College/Dept)
        if (uniFilter !== 'all') {
            result = result.filter(item => {
                if (item.university_id) return item.university_id === uniFilter;
                // Recursive filtering could be implemented for deeper nested items
                return true;
            });
        }

        // Apply Sorting logic
        result.sort((a, b) => {
            // 1. Pinned items always stay at the top (UX requirement)
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;

            // 2. Secondary sort based on user selection
            if (sortOrder === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            if (sortOrder === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            return 0; // Default: no change
        });

        return result; // Return the processed list
    };

    // Trigger initial fetch on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Return the data and controls to the component
    return {
        universities, colleges, departments, graduates, research, jobs, announcements, fees, errorLogs, aboutData,
        stats, loading, fetchData, processData,
        sortOrder, setSortOrder, uniFilter, setUniFilter, collegeFilter, setCollegeFilter, deptFilter, setDeptFilter
    };
};
