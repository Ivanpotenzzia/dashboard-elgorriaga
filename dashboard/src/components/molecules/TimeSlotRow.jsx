import React from 'react';
import { clsx } from 'clsx';
import { getCapacityStatus, getCapacityColor } from '../../utils/capacity';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import './TimeSlotRow.css';

export const TimeSlotRow = ({ time, occupancy, onClick }) => {
    const { total, externos, huespedes, imserso, active, max } = occupancy;
    // Fix: Pass correct arguments to getCapacityColor
    const status = getCapacityStatus(total, max);
    const color = getCapacityColor(status);
    const percentage = Math.min((total / max) * 100, 100);

    const getStatusBadge = () => {
        if (percentage >= 100) return <Badge variant="danger">Completo</Badge>;
        if (percentage >= 80) return <Badge variant="warning">Alta Demanda</Badge>;
        return <Badge variant="success">Disponible</Badge>;
    };

    return (
        <div className="time-slot-row clickable" onClick={onClick}>
            <div className="col-time">{time}</div>

            <div className="col-detail">
                <span className="detail-label">{huespedes} Huéspedes + {externos} Externos{imserso > 0 ? ` + ${imserso} Imserso` : ''}</span>
                {active && <span className="detail-sub">Activo</span>}
            </div>

            <div className="col-occupancy">
                <span className="occupancy-val">{total}</span>
                <span className="occupancy-max">/ {max}</span>
            </div>

            <div className="col-status">
                {getStatusBadge()}
            </div>

            <div className="col-visual">
                <div className="progress-bar-bg">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                </div>
            </div>

            <div className="col-action">
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onClick(); }}>Editar</Button>
            </div>
        </div>
    );
};
