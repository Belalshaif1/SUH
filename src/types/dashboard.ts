/**
 * @file src/types/dashboard.ts
 * @description Defines every TypeScript interface and type used throughout the Admin Dashboard.
 *              Centralising types here ensures type safety and a single source of truth.
 */

// ─── University ─────────────────────────────────────────────────────────────

/** Represents a single University record stored in the database */
export interface University {
    id: string;             // UUID primary key generated server-side
    name_ar: string;        // Arabic name — required for all entities
    name_en?: string;       // English name — optional for bilingual display
    description_ar?: string;  // Arabic description shown on detail pages
    description_en?: string;  // English description shown on detail pages
    logo_url?: string;        // Path or URL to the uploaded university logo image
    guide_pdf_url?: string;   // Path or URL to the university guide PDF file
    is_pinned?: number;       // 1 = pinned to the top of lists, 0 = normal order
    created_at?: string;      // ISO timestamp of when this record was created
}

// ─── College ────────────────────────────────────────────────────────────────

/** Represents a single College that belongs to a University */
export interface College {
    id: string;             // UUID primary key
    university_id: string;  // Foreign key linking this college to its parent university
    name_ar: string;        // Arabic name of the college
    name_en?: string;       // Optional English name of the college
    description_ar?: string;  // Arabic description
    description_en?: string;  // English description
    logo_url?: string;        // Path to the college logo image
    guide_pdf_url?: string;   // Path to the college guide PDF
    is_pinned?: number;       // 1 = pinned, 0 = normal
    created_at?: string;      // ISO timestamp of record creation
}

// ─── Department ─────────────────────────────────────────────────────────────

/** Represents an academic Department that belongs to a College */
export interface Department {
    id: string;              // UUID primary key
    college_id: string;      // Foreign key for the parent college
    university_id?: string;  // Denormalized university reference for faster filtering
    name_ar: string;         // Arabic name of the department
    name_en?: string;        // Optional English name
    description_ar?: string; // Arabic description
    description_en?: string; // English description
    logo_url?: string;       // Path to department logo image
    study_plan_url?: string; // Path to the PDF study plan document
    created_at?: string;     // ISO timestamp of record creation
}

// ─── Announcement ───────────────────────────────────────────────────────────

/** Represents a public or scoped Announcement posted by an admin */
export interface Announcement {
    id: string;              // UUID primary key
    title_ar: string;        // Arabic title shown in listings
    title_en?: string;       // Optional English title
    content_ar: string;      // Arabic body content of the announcement
    content_en?: string;     // Optional English body content
    scope: 'global' | 'university' | 'college' | 'department'; // Visibility scope
    university_id?: string;  // Scope: restrict to a specific university if set
    college_id?: string;     // Scope: restrict to a specific college if set
    department_id?: string;  // Scope: restrict to a specific department if set
    image_url?: string;      // Path to an optional banner/thumbnail image
    file_url?: string;       // Path to an optional attached PDF file
    is_pinned?: number;      // 1 = pinned to top, 0 = normal
    created_by?: string;     // User ID of the admin who posted this announcement
    created_at?: string;     // ISO timestamp of record creation
}

// ─── Job ───────────────────────────────────────────────────────────────────

/** Represents a Job listing posted by a college */
export interface Job {
    id: string;               // UUID primary key
    college_id: string;       // Foreign key for the college posting this job
    title_ar: string;         // Arabic job title
    title_en?: string;        // Optional English job title
    description_ar: string;   // Arabic job description
    description_en?: string;  // Optional English job description
    deadline?: string;        // ISO date string of the application deadline
    is_pinned?: number;       // 1 = pinned, 0 = normal ordering
    created_at?: string;      // ISO timestamp of record creation
}

// ─── Graduate ──────────────────────────────────────────────────────────────

/** Represents a Graduate record linked to an academic Department */
export interface Graduate {
    id: string;                   // UUID primary key
    department_id: string;        // Foreign key linking to the graduate's department
    full_name_ar: string;         // Arabic full name — required field
    full_name_en?: string;        // Optional English full name
    graduation_year: number;      // The year of graduation (e.g. 2023)
    gpa?: number;                 // Grade point average (e.g. 3.75)
    specialization_ar?: string;   // Arabic field of specialization
    specialization_en?: string;   // English field of specialization
    created_at?: string;          // ISO timestamp of record creation
}

// ─── Research ──────────────────────────────────────────────────────────────

/** Represents an academic Research paper or thesis */
export interface Research {
    id: string;               // UUID primary key
    department_id: string;    // Foreign key linking to the department that owns it
    title_ar: string;         // Arabic title of the research paper
    title_en?: string;        // Optional English title
    abstract_ar?: string;     // Arabic abstract / summary
    abstract_en?: string;     // English abstract / summary
    author_name: string;      // Free-text name of the primary author(s)
    pdf_url?: string;         // Path to the uploaded PDF file of the research
    published?: boolean;      // Whether this research is publicly published
    students?: string[];      // Array of contributing student names (if applicable)
    is_pinned?: number;       // 1 = pinned, 0 = normal ordering
    created_at?: string;      // ISO timestamp of record creation
}

// ─── Fee ──────────────────────────────────────────────────────────────────

/** Represents a Tuition Fee entry linked to an academic Department */
export interface Fee {
    id: string;               // UUID primary key
    department_id: string;    // Foreign key for the department this fee applies to
    fee_type: 'public' | 'private'; // Distinguishes government vs. private/parallel track fees
    amount: number;           // Numeric fee amount in local currency
    academic_year: string;    // The academic year this fee applies to (e.g. "2024-2025")
    created_at?: string;      // ISO timestamp of record creation
}

// ─── ErrorLog ─────────────────────────────────────────────────────────────

/** Represents a single error log entry captured from frontend or backend */
export interface ErrorLog {
    id: string;             // UUID primary key
    message: string;        // Short, human-readable error message
    stack_trace?: string;   // Full stack trace or HTTP status string for debugging
    source: string;         // Origin of the error (e.g. 'frontend_apiClient', 'backend')
    user_id?: string;       // The ID of the user who triggered the error (if authenticated)
    user_name?: string;     // The display name of that user (for convenience in logs UI)
    user_email?: string;    // The email of that user (for filtering in the error log tab)
    created_at: string;     // ISO timestamp — required for sorting and time-based filtering
}

// ─── DashboardStats ───────────────────────────────────────────────────────

/** Aggregated numeric statistics shown in the stats cards at the top of the Dashboard */
export interface DashboardStats {
    universities: number;  // Total number of university records
    colleges: number;      // Total number of college records
    departments: number;   // Total number of department records
    graduates: number;     // Total number of graduate records
    research: number;      // Total number of research paper records
    users: number;         // Total number of admin user accounts
}
