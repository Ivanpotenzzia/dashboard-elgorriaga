import React from 'react';
import { Card } from '../atoms/Card';
import { Users, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import './SummaryCards.css';

const StatCard = ({ icon: Icon, value, label, subtext, color }) => (
    <Card className="stat-card">
        <div className="stat-icon-wrapper" style={{ color: color, backgroundColor: `${color}20` }}>
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-subtext">{subtext}</div>
        </div>
    </Card>
);

export const SummaryCards = ({ totalPax, peakHour, alerts, occupancyRate }) => {
    return (
        <div className="summary-grid">
            <StatCard
                icon={Users}
                value={totalPax}
                label="Total Visitantes"
                subtext="Reservas hoy"
                color="var(--color-accent)"
            />
            <StatCard
                icon={Clock}
                value={peakHour}
                label="Hora Pico"
                subtext="0 pax max"
                color="#8b5cf6"
            />
            <StatCard
                icon={AlertTriangle}
                value={alerts}
                label="Alertas Activas"
                subtext="Franjas > 80%"
                color="var(--color-warning)"
            />
            <StatCard
                icon={TrendingUp}
                value={`${occupancyRate}%`}
                label="Ocupación Media"
                subtext="0 pax/hora"
                color="var(--color-success)"
            />
        </div>
    );
};
