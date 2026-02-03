import React from 'react';
import { clsx } from 'clsx';
import './Input.css'; // Share styles

export const Select = ({ label, error, className, id, children, ...props }) => {
    return (
        <div className={clsx('input-group', className)}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <select
                id={id}
                className={clsx('input-field', 'select-field', { 'input-error': error })}
                {...props}
            >
                {children}
            </select>
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
};
