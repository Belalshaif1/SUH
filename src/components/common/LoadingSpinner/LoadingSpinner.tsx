/**
 * @file src/components/common/LoadingSpinner/LoadingSpinner.tsx
 * @description Reusable loading spinner with size and label props.
 */

import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    /** 'sm' | 'md' | 'lg' */
    size?: 'sm' | 'md' | 'lg';
    /** Accessible label for screen readers */
    label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size  = 'md',
    label = 'Loading...',
}) => {
    return (
        <div
            className={`loading-spinner loading-spinner--${size}`}
            role="status"
            aria-label={label}
        >
            <span className="loading-spinner__ring" aria-hidden="true" />
            <span className="sr-only">{label}</span>
        </div>
    );
};

export default LoadingSpinner;
