import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../atoms/Button';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} icon={X} />
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
