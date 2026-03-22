/**
 * @file src/contexts/ThemeContext.tsx
 * @description Provides light/dark theme switching to the entire application.
 *              Persists the selected theme in localStorage so it survives page refreshes.
 *              Applies the 'dark' CSS class on <html> so Tailwind's dark: utilities work.
 */

import React, {
    createContext,  // Creates the typed context object
    useContext,     // Reads the nearest matching context value
    useState,       // Local state for the currently active theme
    useEffect,      // Side effect to sync the <html> class with the theme state
} from 'react';

// ─── Type Definitions ──────────────────────────────────────────────────────

/** The two supported theme modes */
type Theme = 'light' | 'dark';

/** Everything the context exposes to consuming components */
interface ThemeContextType {
    theme: Theme;          // The currently active theme name
    toggleTheme: () => void; // Switches between 'light' and 'dark'
    isDark: boolean;       // Convenience boolean — true when theme is 'dark'
}

// ─── Context Object ────────────────────────────────────────────────────────

/** The raw context object — never import this; use useTheme() instead */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── ThemeProvider Component ────────────────────────────────────────────────

/** Wrap the app root with this to enable theme toggling everywhere */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialise from localStorage so the user's preference is remembered across refreshes
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'light'; // Default to light mode
    });

    /**
     * Toggles between 'light' and 'dark'.
     * The useEffect below will sync the DOM and localStorage after this state update.
     */
    const toggleTheme = (): void => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light'); // Flip the current theme
    };

    // After every theme state change, persist to localStorage and update the <html> class
    useEffect(() => {
        localStorage.setItem('theme', theme); // Save the new theme so it persists on refresh
        // Toggle the 'dark' class on <html> — Tailwind reads this class to apply dark: utilities
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]); // Only runs when `theme` changes — not on every render

    return (
        // Provide the theme state and toggle function to the entire component subtree
        <ThemeContext.Provider value={{
            theme,               // The active theme string ('light' | 'dark')
            toggleTheme,         // The function to switch themes
            isDark: theme === 'dark', // Computed boolean for conditional className usage
        }}>
            {children}  {/* Render all child components with access to this context */}
        </ThemeContext.Provider>
    );
};

// ─── useTheme Hook ─────────────────────────────────────────────────────────

/**
 * Custom hook to consume the ThemeContext from any component.
 * Throws a descriptive error if called outside of a <ThemeProvider>.
 */
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext); // Read the nearest ThemeContext value
    if (!context) {
        throw new Error('[useTheme] must be used inside a <ThemeProvider> component');
    }
    return context; // Return the full context so the component can read and toggle the theme
};
