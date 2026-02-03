import React from 'react';
import { Sidebar } from './Sidebar';
import './Layout.css';

export const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-content">
                {children}
            </main>
        </div>
    );
};
