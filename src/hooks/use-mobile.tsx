/**
 * @file src/hooks/use-mobile.tsx
 * @description A simple hook that detects whether the current viewport width
 *              is below the mobile breakpoint. Uses a MediaQueryList listener
 *              so it responds immediately when the window is resized.
 */

import * as React from 'react'; // Import React for useState and useEffect

/** The pixel threshold below which we consider the screen to be a mobile device */
const MOBILE_BREAKPOINT = 768; // Matches Tailwind's 'md' breakpoint (768px)

/**
 * useIsMobile — returns true if the current viewport is narrower than 768px.
 * Updates automatically when the window is resized across the breakpoint.
 *
 * @returns boolean — true on mobile-sized screens, false on tablet/desktop
 */
export function useIsMobile(): boolean {
    // Start with `undefined` to avoid a server/client mismatch during SSR hydration
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        // Create a MediaQueryList that matches screens narrower than 768px
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        // Handler called whenever the media query match status changes
        const onChange = (): void => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT); // Re-evaluate based on current width
        };

        mql.addEventListener('change', onChange); // Subscribe to breakpoint crossing events

        // Set the initial value synchronously (before any resize events occur)
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

        // Cleanup: remove the listener when the component using this hook unmounts
        return () => mql.removeEventListener('change', onChange);
    }, []); // Empty deps array — this effect only runs once on mount

    return !!isMobile; // Convert undefined → false so the return type is always boolean
}
