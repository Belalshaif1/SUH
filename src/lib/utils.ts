/**
 * @file src/lib/utils.ts
 * @description Shared utility functions used across the entire application.
 */

import { clsx, type ClassValue } from 'clsx'; // Import clsx: a tiny utility for conditionally joining class names
import { twMerge } from 'tailwind-merge';     // Import twMerge: merges Tailwind classes, resolving conflicts intelligently

/**
 * cn — Class Name merger utility.
 * Combines conditional class logic (clsx) with Tailwind conflict resolution (twMerge).
 * Use anywhere you need to conditionally apply Tailwind classes without duplication bugs.
 *
 * @example cn('p-4', isActive && 'bg-blue-500', 'p-6') → 'bg-blue-500 p-6'
 *
 * @param inputs - Any number of class values: strings, arrays, or condition objects
 * @returns A single merged class string safe for use in `className` props
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(   // Step 2: resolve Tailwind utility conflicts (e.g. p-4 vs p-6 → keeps last)
        clsx(inputs)  // Step 1: collapse conditional objects and arrays into a flat class string
    );
}
