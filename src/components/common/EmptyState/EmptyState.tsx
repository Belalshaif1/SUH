/**
 * @file src/components/common/EmptyState/EmptyState.tsx
 * @description Reusable empty state component displayed when a list has no items.
 *              Used consistently across all list pages (Universities, Jobs, etc.)
 */

import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
    /** Icon or emoji to display (e.g. '📭' or a React component) */
    icon?: React.ReactNode;
    /** Main headline (Arabic or English based on language context) */
    title: string;
    /** Optional supporting description */
    description?: string;
    /** Optional action button */
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, description, action }) => {
    return (
        <div className="empty-state" role="status" aria-live="polite">
            <span className="empty-state__icon" aria-hidden="true">
                {icon}
            </span>
            <h3 className="empty-state__title">{title}</h3>
            {description && (
                <p className="empty-state__description">{description}</p>
            )}
            {action && (
                <div className="empty-state__action">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
