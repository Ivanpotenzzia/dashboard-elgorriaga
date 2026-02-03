import React from 'react';
import { clsx } from 'clsx';
import './Card.css';

export const Card = ({ children, className, onClick, hoverable }) => {
    return (
        <div
            className={clsx('card glass', { 'card-hover': hoverable }, className)}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
