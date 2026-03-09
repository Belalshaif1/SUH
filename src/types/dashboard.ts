/**
 * @file types/dashboard.ts
 * @description defines the data structures and types used across the Admin Dashboard.
 * This ensures type safety and better developer experience.
 */

export interface University {
    id: string;
    name_ar: string;
    name_en?: string;
    description_ar?: string;
    description_en?: string;
    logo_url?: string;
    guide_pdf_url?: string;
    is_pinned?: number;
    created_at?: string;
}

export interface College {
    id: string;
    university_id: string;
    name_ar: string;
    name_en?: string;
    description_ar?: string;
    description_en?: string;
    logo_url?: string;
    guide_pdf_url?: string;
    is_pinned?: number;
    created_at?: string;
}

export interface Department {
    id: string;
    college_id: string;
    university_id?: string;
    name_ar: string;
    name_en?: string;
    description_ar?: string;
    description_en?: string;
    logo_url?: string;
    study_plan_url?: string;
    created_at?: string;
}

export interface Announcement {
    id: string;
    title_ar: string;
    title_en?: string;
    content_ar: string;
    content_en?: string;
    scope: 'global' | 'university' | 'college' | 'department';
    university_id?: string;
    college_id?: string;
    department_id?: string;
    image_url?: string;
    file_url?: string;
    is_pinned?: number;
    created_by?: string;
    created_at?: string;
}

export interface Job {
    id: string;
    college_id: string;
    title_ar: string;
    title_en?: string;
    description_ar: string;
    description_en?: string;
    deadline?: string;
    is_pinned?: number;
    created_at?: string;
}

export interface Graduate {
    id: string;
    department_id: string;
    full_name_ar: string;
    full_name_en?: string;
    graduation_year: number;
    gpa?: number;
    specialization_ar?: string;
    specialization_en?: string;
    created_at?: string;
}

export interface Research {
    id: string;
    department_id: string;
    title_ar: string;
    title_en?: string;
    abstract_ar?: string;
    abstract_en?: string;
    author_name: string;
    pdf_url?: string;
    published?: boolean;
    students?: string[];
    is_pinned?: number;
    created_at?: string;
}

export interface Fee {
    id: string;
    department_id: string;
    fee_type: 'public' | 'private';
    amount: number;
    academic_year: string;
    created_at?: string;
}

export interface ErrorLog {
    id: string;
    message: string;
    stack_trace?: string;
    source: string;
    user_id?: string;
    user_name?: string;
    user_email?: string;
    created_at: string;
}

export interface DashboardStats {
    universities: number;
    colleges: number;
    departments: number;
    graduates: number;
    research: number;
    users: number;
}
