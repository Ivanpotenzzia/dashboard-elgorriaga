import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { getCapacityStatus, MAX_CAPACITY } from '../../utils/capacity';
import { Users, User, Plus } from 'lucide-react';
import './TimeSlotCard.css';

export const TimeSlotCard = ({ time, paxHotel, paxExternal, onClick, onAddClick }) => {
    const totalPax = paxHotel.adults + paxHotel.kids + paxExternal.adults + paxExternal.kids;
    const status = getCapacityStatus(totalPax);

    return (
        <Card className={`timeslot-card status-${status}`} onClick={onClick} hoverable>
            <div className="timeslot-header">
                <span className="timeslot-time">{time}</span>
                <Badge variant={status}>{totalPax} / {MAX_CAPACITY}</Badge>
            </div>

            <div className="timeslot-details">
                <div className="detail-row">
                    <span className="detail-label">Hotel</span>
                    <div className="pax-count">
                        <User size={14} />
                        <span>{paxHotel.adults + paxHotel.kids}</span>
                    </div>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Externos</span>
                    <div className="pax-count">
                        <Users size={14} />
                        <span>{paxExternal.adults + paxExternal.kids}</span>
                    </div>
                </div>
            </div>

            <button
                className="add-quick-btn"
                onClick={(e) => { e.stopPropagation(); onAddClick(); }}
                title="Añadir reserva rápida"
            >
                <Plus size={16} />
            </button>
        </Card>
    );
};
