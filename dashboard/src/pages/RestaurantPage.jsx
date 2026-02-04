import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Plus, Trash2, Edit, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './RestaurantPage.css';

// Servicio para reservas de restaurante
const RestaurantReservationService = {
    async getByDate(date) {
        const { data, error } = await supabase
            .from('reservas_restaurante')
            .select('*')
            .eq('fecha_reserva', date)
            .eq('activo', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(reservation) {
        const { data, error } = await supabase
            .from('reservas_restaurante')
            .insert({ ...reservation, activo: true })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('reservas_restaurante')
            .update(updates)
            .eq('id_reserva_restaurante', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('reservas_restaurante')
            .update({ activo: false })
            .eq('id_reserva_restaurante', id);

        if (error) throw error;
    }
};

// Modal para crear/editar reserva de restaurante
const RestaurantReservationModal = ({ isOpen, onClose, onSave, initialData, defaultDate }) => {
    const [formData, setFormData] = useState({
        nombre_cliente: '',
        tipo_servicio: 'COMIDA',
        comensales: 1,
        comentarios: '',
        fecha_reserva: defaultDate
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre_cliente: initialData.nombre_cliente || '',
                tipo_servicio: initialData.tipo_servicio || 'COMIDA',
                comensales: initialData.comensales || 1,
                comentarios: initialData.comentarios || '',
                fecha_reserva: initialData.fecha_reserva || defaultDate
            });
        } else {
            setFormData({
                nombre_cliente: '',
                tipo_servicio: 'COMIDA',
                comensales: 1,
                comentarios: '',
                fecha_reserva: defaultDate
            });
        }
    }, [initialData, defaultDate, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nombre_cliente.trim()) {
            alert('Por favor, introduce el nombre del cliente');
            return;
        }
        onSave({
            ...formData,
            id_reserva_restaurante: initialData?.id_reserva_restaurante
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content restaurant-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Editar Reserva' : 'Nueva Reserva de Restaurante'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre y Apellidos *</label>
                        <Input
                            type="text"
                            value={formData.nombre_cliente}
                            onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                            placeholder="Ej: García López, María"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tipo de Servicio *</label>
                            <select
                                value={formData.tipo_servicio}
                                onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                                className="select-input"
                            >
                                <option value="COMIDA">☀️ Comida</option>
                                <option value="CENA">🌙 Cena</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Comensales *</label>
                            <Input
                                type="number"
                                min="1"
                                max="50"
                                value={formData.comensales}
                                onChange={(e) => setFormData({ ...formData, comensales: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Comentarios / Intolerancias / Alergias</label>
                        <textarea
                            className="textarea-input"
                            value={formData.comentarios}
                            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                            placeholder="Ej: Alergia al gluten, mesa cerca de ventana, cumpleaños..."
                            rows={4}
                        />
                    </div>

                    <div className="modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Guardar Reserva</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const RestaurantPage = () => {
    // Leer fecha inicial de localStorage (sincronizado con Dashboard)
    const getInitialDate = () => {
        const savedDate = localStorage.getItem('selectedDate');
        return savedDate || format(new Date(), 'yyyy-MM-dd');
    };

    const [date, setDate] = useState(getInitialDate);
    const [reservations, setReservations] = useState([]); // Reservas directas de restaurante
    const [circuitReservations, setCircuitReservations] = useState([]); // Reservas de piscina con comida/cena
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);

    // Sincronizar fecha con localStorage
    useEffect(() => {
        localStorage.setItem('selectedDate', date);
    }, [date]);

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar reservas directas de restaurante
            const directData = await RestaurantReservationService.getByDate(date);
            setReservations(directData);

            // Cargar reservas de piscina con servicio comida/cena
            // Usamos filtro explícito para asegurar que el OR no interfiera con el AND de fecha/activo
            // Cargar reservas de piscina con servicio comida/cena
            // ESTRATEGIA ROBUSTA: Descargar todas las del día y filtrar en JS para evitar errores de sintaxis OR
            console.log('Fetching pool reservations for date:', date);
            const { data: circuitData, error } = await supabase
                .from('reservas_externas')
                .select('*')
                .eq('fecha_reserva', date)
                .eq('activo', true);

            if (error) throw error;

            // Filtrar en memoria las que tienen comida o cena
            const poolWithFood = (circuitData || []).filter(r => r.servicio_comida === true || r.servicio_cena === true);
            console.log('Pool reservations filtered:', poolWithFood);
            setCircuitReservations(poolWithFood);
        } catch (err) {
            console.error('Error loading restaurant reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            if (formData.id_reserva_restaurante) {
                await RestaurantReservationService.update(formData.id_reserva_restaurante, formData);
            } else {
                await RestaurantReservationService.create(formData);
            }
            setModalOpen(false);
            setEditingReservation(null);
            loadData();
        } catch (err) {
            console.error('Error saving reservation:', err);
            alert(`Error al guardar: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta reserva?')) return;
        try {
            await RestaurantReservationService.delete(id);
            loadData();
        } catch (err) {
            console.error('Error deleting reservation:', err);
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    const handleEdit = (reservation) => {
        setEditingReservation(reservation);
        setModalOpen(true);
    };

    // Combinar y separar por tipo de servicio
    // Directas de restaurante
    const directLunch = reservations.filter(r => r.tipo_servicio === 'COMIDA');
    const directDinner = reservations.filter(r => r.tipo_servicio === 'CENA');

    // De circuito (piscina)
    const circuitLunch = circuitReservations.filter(r => r.servicio_comida);
    const circuitDinner = circuitReservations.filter(r => r.servicio_cena);

    // Combinar
    const lunchReservations = [
        ...directLunch.map(r => ({ ...r, origen: 'RESTAURANTE' })),
        ...circuitLunch.map(r => ({
            ...r,
            origen: 'CIRCUITO',
            nombre_cliente: r.nombre_cliente,
            comensales: r.comensales_comida || 1,
            comentarios: r.comentarios_restaurante || r.detalles_br
        }))
    ];
    const dinnerReservations = [
        ...directDinner.map(r => ({ ...r, origen: 'RESTAURANTE' })),
        ...circuitDinner.map(r => ({
            ...r,
            origen: 'CIRCUITO',
            nombre_cliente: r.nombre_cliente,
            comensales: r.comensales_cena || 1,
            comentarios: r.comentarios_restaurante || r.detalles_br
        }))
    ];

    const lunchTotal = lunchReservations.reduce((sum, r) => sum + (r.comensales || 0), 0);
    const dinnerTotal = dinnerReservations.reduce((sum, r) => sum + (r.comensales || 0), 0);

    const ReservationTable = ({ reservations, emptyMessage }) => (
        <table className="service-table detailed-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Origen</th>
                    <th>Comensales</th>
                    <th>Comentarios / Intolerancias</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {reservations.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="empty-message">{emptyMessage}</td>
                    </tr>
                ) : reservations.map((r, idx) => (
                    <tr key={r.id_reserva_restaurante || r.id_reserva || `res-${idx}`}>
                        <td className="name-cell">{r.nombre_cliente}</td>
                        <td className="origen-cell">
                            <span className={`origen-badge ${r.origen === 'CIRCUITO' ? 'circuito' : 'directo'}`}>
                                {r.origen === 'CIRCUITO' ? '🏊 Circuito' : '🍽️ Directo'}
                            </span>
                        </td>
                        <td className="pax-cell">{r.comensales} pax</td>
                        <td className="comments-cell">
                            {r.comentarios ? (
                                <span className="comment-text">{r.comentarios}</span>
                            ) : (
                                <span className="no-comment">-</span>
                            )}
                        </td>
                        <td className="actions-cell">
                            {r.origen !== 'CIRCUITO' && (
                                <>
                                    <button className="icon-btn" onClick={() => handleEdit(r)} title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button className="icon-btn danger" onClick={() => handleDelete(r.id_reserva_restaurante)} title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <Layout>
            <div className="restaurant-header">
                <div>
                    <h1>🍽️ Previsión Restaurante</h1>
                    <p className="subtitle">Gestión de reservas de comida y cena</p>
                </div>

                <div className="header-actions">
                    <button className="date-nav-btn" onClick={() => {
                        const d = new Date(date); d.setDate(d.getDate() - 1);
                        setDate(format(d, 'yyyy-MM-dd'));
                    }}><ChevronLeft size={20} /></button>

                    <div className="date-display">
                        <Calendar size={18} />
                        <span>{format(new Date(date), "EEEE, d MMMM", { locale: es })}</span>
                    </div>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="date-input-visible"
                        title="Seleccionar fecha"
                    />

                    <button className="date-nav-btn" onClick={() => {
                        const d = new Date(date); d.setDate(d.getDate() + 1);
                        setDate(format(d, 'yyyy-MM-dd'));
                    }}><ChevronRight size={20} /></button>

                    <div className="divider-v" />

                    <Button onClick={() => { setEditingReservation(null); setModalOpen(true); }} icon={Plus}>
                        Nueva Reserva
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="center-loading"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="restaurant-grid">
                    {/* Comidas */}
                    <Card className="service-card">
                        <div className="service-header">
                            <h2 className="service-title">☀️ Comidas</h2>
                            <div className="total-badge">{lunchTotal} comensales</div>
                        </div>
                        <ReservationTable
                            reservations={lunchReservations}
                            emptyMessage="Sin reservas para comida"
                        />
                    </Card>

                    {/* Cenas */}
                    <Card className="service-card">
                        <div className="service-header">
                            <h2 className="service-title">🌙 Cenas</h2>
                            <div className="total-badge">{dinnerTotal} comensales</div>
                        </div>
                        <ReservationTable
                            reservations={dinnerReservations}
                            emptyMessage="Sin reservas para cena"
                        />
                    </Card>
                </div>
            )}

            <RestaurantReservationModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingReservation(null); }}
                onSave={handleSave}
                initialData={editingReservation}
                defaultDate={date}
            />
        </Layout>
    );
};
