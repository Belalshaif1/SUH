/**
 * @file src/components/common/SearchInput/SearchInput.tsx
 * @description Reusable search input with debounce and clear button.
 */

import React, { useState, useEffect, useRef } from 'react';
import './SearchInput.css';

interface SearchInputProps {
    /** Controlled value */
    value?: string;
    /** Called when the search term changes (debounced) */
    onChange: (value: string) => void;
    /** Input placeholder text */
    placeholder?: string;
    /** Debounce delay in milliseconds (default 300ms) */
    debounce?: number;
    /** Additional CSS class */
    className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
    value: controlledValue,
    onChange,
    placeholder = 'بحث...',
    debounce   = 300,
    className  = '',
}) => {
    const [localValue, setLocalValue] = useState(controlledValue ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    // Sync controlled value from outside
    useEffect(() => {
        if (controlledValue !== undefined) setLocalValue(controlledValue);
    }, [controlledValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(newVal), debounce);
    };

    const handleClear = () => {
        setLocalValue('');
        clearTimeout(timerRef.current);
        onChange('');
    };

    return (
        <div className={`search-input ${className}`}>
            <span className="search-input__icon" aria-hidden="true">🔍</span>
            <input
                type="search"
                value={localValue}
                onChange={handleChange}
                placeholder={placeholder}
                className="search-input__field"
                aria-label={placeholder}
            />
            {localValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="search-input__clear"
                    aria-label="Clear search"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default SearchInput;
