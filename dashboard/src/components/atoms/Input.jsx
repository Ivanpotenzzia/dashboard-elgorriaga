import React from 'react';
import { clsx } from 'clsx';
import './Input.css';

export const Input = ({ label, error, className, id, ...props }) => {
    return (
        <div className={clsx('input-group', className)}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <input
                id={id}
                className={clsx('input-field', { 'input-error': error })}
                {...props}
            />
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
};
