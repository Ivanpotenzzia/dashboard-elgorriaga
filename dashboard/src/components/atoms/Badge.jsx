import React from 'react';
import { clsx } from 'clsx';
import './Badge.css';

/**
 * Badge Component
 * @param {string} variant - success, warning, danger, neutral
 */
export const Badge = ({ children, variant = 'neutral', className }) => {
    return (
        <span className={clsx('badge', `badge-${variant}`, className)}>
            {children}
        </span>
    );
};
