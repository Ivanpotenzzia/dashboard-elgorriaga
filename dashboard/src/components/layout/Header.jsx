import React from 'react';
import { Settings, Plus, Upload, Calendar } from 'lucide-react';
import { Button } from '../atoms/Button';
import './Header.css';

export const Header = ({
    selectedDate,
    onDateChange,
    onAddReservation,
    onImportClick,
    lastUpdated
}) => {
    return (
        <header className="app-header glass">
            <div className="header-left">
                <div className="logo-area">
                    <span className="logo-icon">♨️</span>
                    <h1 className="app-title">Balneario Elgorriaga</h1>
                </div>

                <div className="date-control">
                    <label className="date-label">
                        <Calendar size={16} />
                        <span>Fecha:</span>
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="date-input"
                    />
                </div>
            </div>

            <div className="header-right">
                {lastUpdated && (
                    <span className="last-updated">
                        Act: {lastUpdated}
                    </span>
                )}

                <Button
                    variant="secondary"
                    size="sm"
                    icon={<Upload size={16} />}
                    onClick={onImportClick}
                >
                    Importar PMS
                </Button>

                <Button
                    variant="primary"
                    img="sm"
                    icon={<Plus size={16} />}
                    onClick={onAddReservation}
                >
                    Nueva Reserva
                </Button>
            </div>
        </header>
    );
};
