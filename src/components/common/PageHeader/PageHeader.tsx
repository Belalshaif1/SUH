/**
 * @file src/components/common/PageHeader/PageHeader.tsx
 * @description Reusable page header component for consistent layout across pages.
 */

import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
    return (
        <div className="page-header">
            <div className="page-header__content">
                <h1 className="page-header__title heading-premium">{title}</h1>
                {description && <p className="page-header__description">{description}</p>}
            </div>
            {action && (
                <div className="page-header__actions">
                    {action}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
