import React from 'react';
import { LayoutDashboard, Upload, History, Settings, LogOut, Utensils } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

import logo from '../../assets/logo.png';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Utensils, label: 'Restaurante', path: '/restaurant' },
    { icon: History, label: 'Histórico', path: '/history' },
];

export const Sidebar = () => {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand-logo">
                    <img src={logo} alt="Elgorriaga Logo" className="brand-image" />
                </div>
            </div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                <div className="nav-divider" />

                <Link to="/settings" className="nav-item">
                    <Settings size={20} />
                    <span>Configuración</span>
                </Link>
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">JD</div>
                    <div className="user-info">
                        <span className="user-name">Admin</span>
                        <span className="user-role">Gerente Spa</span>
                    </div>
                </div>
                <button className="logout-btn">
                    <LogOut size={16} />
                    <span>Salir</span>
                </button>
            </div>
        </aside>
    );
};
