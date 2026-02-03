import React from 'react';
import './Button.css';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * @param {string} variant - primary, secondary, danger, ghost, outline
 * @param {string} size - sm, md, lg
 * @param {boolean} isLoading - Shows spinner
 * @param {React.ComponentType} icon - Icon component (e.g., Upload from lucide-react)
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    icon: Icon, // Rename to Icon for rendering as component
    disabled,
    ...props
}) => {
    return (
        <button
            className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {!isLoading && Icon && <Icon size={16} />}
            {children}
        </button>
    );
};
