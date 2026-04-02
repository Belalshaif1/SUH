/**
 * @file src/contexts/AuthContext.tsx
 * @description Provides authentication state (current user, role, permissions) to the
 *              entire React component tree. Uses Context + useState so all components
 *              can call useAuth() instead of prop-drilling.
 *
 * BUG FIX: Wrapped `hasPermission` in useCallback so its reference is stable.
 *           Previously, re-renders of AuthProvider would re-create `hasPermission`
 *           on every render, causing any `useEffect` or `useCallback` that depended
 *           on it (e.g., in useDashboardData) to fire in an infinite loop.
 */

import React, {
    createContext,   // Creates a typed React context object
    useContext,      // Reads the nearest matching context value
    useState,        // Local component state with re-render trigger
    useEffect,       // Side effects that run after render (used here only once, on mount)
    useCallback,     // Memoizes a function so its reference only changes when deps change
    useMemo,         // Memoizes a value object
} from 'react';

import apiClient from '@/lib/apiClient'; // Central fetch wrapper with auth headers and offline queueing

// ─── Type Definitions ──────────────────────────────────────────────────────

/** Represents the logged-in user's public profile fields */
interface User {
    id: string;                  // UUID of the user record in the database
    email: string;               // The user's login email address
    full_name: string | null;    // Display name — null if not set
    role: string;                // The user's base role (e.g. 'super_admin', 'user')
    avatar_url: string | null;   // URL path to the uploaded profile picture — null if none
    cover_url: string | null;    // URL path to the uploaded cover picture — null if none
    phone: string | null;        // Phone number — null if not provided
}

/** Represents the user's administrative role and the scope they are allowed to manage */
interface UserRole {
    id: string;                              // The user's record id (same as User.id)
    role: 'super_admin' | 'university_admin' | 'college_admin' | 'department_admin' | 'user';
    university_id: string | null;            // The university this admin manages — null for super_admin
    college_id: string | null;               // The college this admin manages — null if not a college admin
    department_id: string | null;            // The department this admin manages — null if not a dept admin
    permissions: Record<string, boolean>;    // Map of permission keys to their enabled/disabled state
}

/** Represents the user's extended profile (mirrors relevant fields of User) */
interface Profile {
    id: string;               // Profile record id
    user_id: string;          // References the User.id
    full_name: string | null; // Display name
    avatar_url: string | null; // Profile picture URL
    cover_url: string | null;  // Cover picture URL
    phone: string | null;     // Phone number
}

/** The shape of all values and functions exposed by the Auth Context */
interface AuthContextType {
    user: User | null;            // The currently authenticated user — null if logged out
    profile: Profile | null;      // The user's extended profile data
    userRole: UserRole | null;    // The user's admin role and permission overrides
    loading: boolean;             // True during the initial token validation on app startup
    signIn: (identifier: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string | null, phone: string | null, password: string, fullName: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;   // Clears token and resets all auth state
    refreshProfile: () => Promise<void>; // Re-fetches user data from server (call after profile edits)
    hasPermission: (key: string) => boolean; // Returns true if the user can perform the given action
}

// ─── Context Object ────────────────────────────────────────────────────────

/** The raw context object — never use this directly; use the useAuth() hook instead */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── AuthProvider Component ────────────────────────────────────────────────

/** Wrap your entire app with this component to make auth state available everywhere */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);          // Holds the logged-in user or null
    const [profile, setProfile] = useState<Profile | null>(null); // Holds the extended profile or null
    const [userRole, setUserRole] = useState<UserRole | null>(null); // Holds role/permissions or null
    const [loading, setLoading] = useState(true);                  // True until first auth check completes

    /**
     * Internal helper: parses a raw user object from the API and updates all three state slices.
     * Kept separate so it can be reused by both signIn and the startup token check.
     */
    const applyUserData = useCallback((userData: any) => {
        // Update the user object with the fields from the API response
        setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name ?? null,
            role: userData.role,
            avatar_url: userData.avatar_url ?? null,
            cover_url: userData.cover_url ?? null,
            phone: userData.phone ?? null,
        });

        // Mirror the relevant user fields into the profile shape (no separate profile endpoint needed)
        setProfile({
            id: userData.id,
            user_id: userData.id,
            full_name: userData.full_name ?? null,
            avatar_url: userData.avatar_url ?? null,
            cover_url: userData.cover_url ?? null,
            phone: userData.phone ?? null,
        });

        // Extract the role scope and permission overrides from the API response
        setUserRole({
            id: userData.id,
            role: userData.role,
            university_id: userData.university_id ?? null,   // Null if user isn't a university admin
            college_id: userData.college_id ?? null,         // Null if user isn't a college admin
            department_id: userData.department_id ?? null,   // Null if user isn't a department admin
            permissions: userData.permissions ?? {},         // Empty object if no custom overrides exist
        });
    }, []); // No dependencies — this function never needs to be re-created

    /**
     * Fetches the current user data from '/auth/me' using the stored JWT.
     * Clears all state and the token if the server rejects the request.
     */
    const fetchCurrentUser = useCallback(async (): Promise<any> => {
        try {
            const userData = await apiClient('/auth/me'); // GET /api/auth/me — validates the token
            applyUserData(userData);                       // Parse and store the returned user data
            return userData;                              // Return so callers can use the data if needed
        } catch {
            // Token is invalid or expired — clean up everything to force a fresh login
            localStorage.removeItem('token'); // Remove the stale token from local storage
            setUser(null);                    // Reset the user state to logged-out
            setProfile(null);                 // Reset the profile state
            setUserRole(null);                // Reset the role/permissions state
            return null;                      // Signal failure to the caller
        }
    }, [applyUserData]); // Only recreate if applyUserData changes (it never does)

    /**
     * Public method to re-fetch and update the user profile from the server.
     * Call this after the user submits a profile edit form.
     */
    const refreshProfile = useCallback(async (): Promise<void> => {
        if (localStorage.getItem('token')) { // Only refresh if we have a valid token
            await fetchCurrentUser();         // Re-fetch and apply the latest server data
        }
    }, [fetchCurrentUser]); // Only recreate if fetchCurrentUser changes

    // ─── Startup Auth Check ─────────────────────────────────────────────

    useEffect(() => {
        // This effect runs exactly once when the app first loads (empty deps array)
        const initAuth = async () => {
            const token = localStorage.getItem('token'); // Check if a JWT is stored locally
            if (token) {
                await fetchCurrentUser(); // Validate the token and load the user
            }
            setLoading(false); // Always clear loading so the app can render, even on failure
        };

        initAuth(); // Execute the async init immediately
    }, []); // Empty array = only run on mount, never again

    // ─── Auth Actions ───────────────────────────────────────────────────

    /**
     * Authenticates a user with an email/phone identifier and password.
     * On success, stores the JWT and updates all auth state slices.
     */
    const signIn = useCallback(async (identifier: string, password: string): Promise<{ error: any }> => {
        try {
            const data = await apiClient('/auth/login', { // POST /api/auth/login with credentials
                method: 'POST',
                body: JSON.stringify({ identifier, password }), // Send identifier and password as JSON
            });

            localStorage.setItem('token', data.token); // Store the returned JWT for future requests
            applyUserData(data.user);                  // Populate all state slices from the response
            return { error: null };                    // Signal success with a null error
        } catch (error: any) {
            return { error }; // Return the error so the Login form can display it
        }
    }, [applyUserData]);

    /**
     * Registers a new user account, then automatically signs them in.
     * The user can register with either email or phone (one must be provided).
     */
    const signUp = useCallback(async (
        email: string | null,
        phone: string | null,
        password: string,
        fullName: string
    ): Promise<{ error: any }> => {
        try {
            await apiClient('/auth/register', { // POST /api/auth/register to create the account
                method: 'POST',
                body: JSON.stringify({ email, phone, password, full_name: fullName }),
            });

            // After successful registration, sign in immediately so the user doesn't have to log in again
            return await signIn(email ?? phone ?? '', password);
        } catch (error: any) {
            return { error }; // Return registration error to the Signup form
        }
    }, [signIn]);

    /**
     * Signs the user out by removing the JWT and resetting all auth state.
     */
    const signOut = useCallback(async (): Promise<void> => {
        localStorage.removeItem('token'); // Delete the stored JWT — next request will be rejected
        setUser(null);                    // Clear the user reference
        setProfile(null);                 // Clear the profile reference
        setUserRole(null);                // Clear the role reference
    }, []); // No dependencies — never needs to be recreated

    /**
     * Checks if the current user has a specific permission key.
     * Super admins bypass all checks — they always return true.
     *
     * BUG FIX: Wrapped in useCallback so downstream hooks that depend on `hasPermission`
     *           (e.g., useDashboardData) don't re-render infinitely.
     */
    const hasPermission = useCallback((key: string): boolean => {
        if (userRole?.role === 'super_admin') return true;  // Super admins can do everything
        return !!userRole?.permissions?.[key];              // Check if the specific key is enabled
    }, [userRole]); // Only recreate when the user's role or permissions change

    // ─── Context Value ──────────────────────────────────────────────────

    const authValue = useMemo(() => ({
        user,          // The logged-in user or null
        profile,       // The user's profile data or null
        userRole,      // The user's admin role and permissions or null
        loading,       // True during the initial startup auth check
        signIn,        // Function to log in
        signUp,        // Function to create an account and log in
        signOut,       // Function to log out
        refreshProfile, // Function to re-fetch the profile from the server
        hasPermission, // Function to check if the user can perform an action
    }), [user, profile, userRole, loading, signIn, signUp, signOut, refreshProfile, hasPermission]);

    return (
        // Provide all auth state and methods to every component in the subtree
        <AuthContext.Provider value={authValue}>
            {children}     {/* Render all child components inside this provider */}
        </AuthContext.Provider>
    );
};

// ─── useAuth Hook ──────────────────────────────────────────────────────────

/**
 * Custom hook to consume the AuthContext from any component.
 * Throws an error if called outside of an AuthProvider — this is intentional
 * because it's a programming mistake, not a user-facing error.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext); // Read the nearest AuthContext value
    if (!context) {
        // If context is undefined, the hook was called outside of AuthProvider
        throw new Error('[useAuth] must be used inside an <AuthProvider> component');
    }
    return context; // Return the full context object for the calling component to use
};
