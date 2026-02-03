import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/atoms/Card';
import { Input } from '../components/atoms/Input';
import { ReservationService } from '../services/reservations';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import './RestaurantPage.css';

export const RestaurantPage = () => {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await ReservationService.getRestaurantReservations(date);
            setReservations(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const { lunch, dinner } = useMemo(() => {
        const lunchGroups = {};
        const dinnerGroups = {};
        let lunchTotal = 0;
        let dinnerTotal = 0;

        reservations.forEach(r => {
            // Logic: Aggregate by time slot of entry? 
            // Specs: "Agrupa por franja horaria de entrada al circuito"

            const time = r.hora_reserva.substring(0, 5);

            if (r.servicio_comida) {
                if (!lunchGroups[time]) lunchGroups[time] = 0;
                lunchGroups[time] += (r.comensales_comida || 0);
                lunchTotal += (r.comensales_comida || 0);
            }

            if (r.servicio_cena) {
                if (!dinnerGroups[time]) dinnerGroups[time] = 0;
                dinnerGroups[time] += (r.comensales_cena || 0);
                dinnerTotal += (r.comensales_cena || 0);
            }
        });

        return {
            lunch: { groups: lunchGroups, total: lunchTotal },
            dinner: { groups: dinnerGroups, total: dinnerTotal }
        };
    }, [reservations]);

    return (
        <Layout>
            <div className="restaurant-header">
                <h1>🍽️ Previsión Restaurante</h1>
                <div style={{ width: '200px' }}>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="center-loading"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="restaurant-grid">

                    {/* Lunch Section */}
                    <Card className="service-card">
                        <h2 className="service-title">☀️ Comidas</h2>
                        <div className="total-badge">Total: {lunch.total} pax</div>

                        <table className="service-table">
                            <thead>
                                <tr>
                                    <th>Hora Entrada</th>
                                    <th>Comensales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(lunch.groups).sort().map(time => (
                                    <tr key={time}>
                                        <td>{time}</td>
                                        <td>{lunch.groups[time]}</td>
                                    </tr>
                                ))}
                                {Object.keys(lunch.groups).length === 0 && (
                                    <tr><td colSpan="2" className="empty-row">Sin reservas</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Card>

                    {/* Dinner Section */}
                    <Card className="service-card">
                        <h2 className="service-title">🌙 Cenas</h2>
                        <div className="total-badge">Total: {dinner.total} pax</div>

                        <table className="service-table">
                            <thead>
                                <tr>
                                    <th>Hora Entrada</th>
                                    <th>Comensales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(dinner.groups).sort().map(time => (
                                    <tr key={time}>
                                        <td>{time}</td>
                                        <td>{dinner.groups[time]}</td>
                                    </tr>
                                ))}
                                {Object.keys(dinner.groups).length === 0 && (
                                    <tr><td colSpan="2" className="empty-row">Sin reservas</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Card>

                </div>
            )}
        </Layout>
    );
};
