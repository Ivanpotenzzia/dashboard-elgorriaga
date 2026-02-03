import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Modal } from '../molecules/Modal';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Button } from '../atoms/Button';
import { MAX_CAPACITY } from '../../utils/capacity';
import './ReservationModal.css';

const INITIAL_STATE = {
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora: '09:00', // Actualizado para empezar a las 09:00
    nombre: '',
    telefono: '',
    adultos: 1,
    ninos: 0,
    servicio_comida: false,
    comensales_comida: 0,
    servicio_cena: false,
    comensales_cena: 0,
    importe: '',
    estado_pago: 'Pendiente',
    detalles_br: '',
    comentarios_restaurante: ''
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9; // Empieza a las 09:00 para sincronizarse con Dashboard
    const min = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${min === 0 ? '00' : '30'}`;
});

export const ReservationModal = ({ isOpen, onClose, onSave, currentOccupancy = 0, initialData, defaultDate }) => {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({});
    const [showOverbookingWarning, setShowOverbookingWarning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const baseDate = defaultDate || format(new Date(), 'yyyy-MM-dd');
            if (initialData) {
                // Editing existing reservation
                setFormData({
                    fecha: initialData.fecha_reserva || baseDate,
                    hora: initialData.hora_reserva?.substring(0, 5) || initialData.hora || '10:00',
                    nombre: initialData.nombre_cliente || '',
                    telefono: initialData.telefono || '',
                    adultos: initialData.adultos || 1,
                    ninos: initialData.ninos || 0,
                    servicio_comida: initialData.servicio_comida || false,
                    comensales_comida: initialData.comensales_comida || 0,
                    servicio_cena: initialData.servicio_cena || false,
                    comensales_cena: initialData.comensales_cena || 0,
                    importe: initialData.importe_pago || '',
                    estado_pago: initialData.estado_pago || 'Pendiente',
                    detalles_br: initialData.detalles_br || '',
                    comentarios_restaurante: initialData.comentarios_restaurante || '',
                    id_reserva: initialData.id_reserva // Keep ID for update
                });
            } else {
                // New reservation
                setFormData({
                    ...INITIAL_STATE,
                    fecha: baseDate,
                    hora: initialData?.hora || '10:00'
                });
            }
            setErrors({});
            setShowOverbookingWarning(false);
        }
    }, [isOpen, initialData, defaultDate]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));

        // Auto-set comensales if service checked
        if (type === 'checkbox' && checked) {
            const adults = parseInt(formData.adultos) || 0;
            const kids = parseInt(formData.ninos) || 0;
            setFormData(prev => ({
                ...prev,
                [id]: checked,
                [id === 'servicio_comida' ? 'comensales_comida' : 'comensales_cena']: adults + kids
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        // Only name is required
        if (!formData.nombre || formData.nombre.trim().length < 2) {
            newErrors.nombre = 'Nombre requerido (mínimo 2 caracteres)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        // Check capacity
        const newPax = parseInt(formData.adultos) + parseInt(formData.ninos);
        if (currentOccupancy + newPax > MAX_CAPACITY && !showOverbookingWarning) {
            setShowOverbookingWarning(true);
            return;
        }

        setIsSaving(true);
        try {
            // Format data for the backend - field names MUST match database schema
            const dataToSave = {
                fecha_reserva: formData.fecha, // Now from form
                hora_reserva: formData.hora,
                nombre_cliente: formData.nombre.trim(),
                telefono: formData.telefono || '000000000',
                adultos: parseInt(formData.adultos) || 1,
                ninos: parseInt(formData.ninos) || 0,
                servicio_comida: formData.servicio_comida,
                comensales_comida: formData.servicio_comida ? parseInt(formData.comensales_comida) || 1 : null,
                servicio_cena: formData.servicio_cena,
                comensales_cena: formData.servicio_cena ? parseInt(formData.comensales_cena) || 1 : null,
                importe_pago: formData.importe ? parseFloat(formData.importe) : 0.00,
                estado_pago: formData.estado_pago || 'Pendiente',
                detalles_br: formData.detalles_br || null,
                comentarios_restaurante: (formData.servicio_comida || formData.servicio_cena) ? formData.comentarios_restaurante || null : null
            };

            // Include ID if editing
            if (formData.id_reserva) {
                dataToSave.id_reserva = formData.id_reserva;
            }

            await onSave(dataToSave);
        } catch (err) {
            console.error('Error saving reservation:', err);
            alert('Error al guardar la reserva. Comprueba la consola.');
        } finally {
            setIsSaving(false);
        }
    };

    const isEditing = !!formData.id_reserva;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Reserva' : 'Nueva Reserva'}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isSaving}>
                        {showOverbookingWarning ? 'Confirmar Overbooking' : 'Guardar Reserva'}
                    </Button>
                </>
            }
        >
            {showOverbookingWarning && (
                <div className="alert-warning">
                    ⚠️ <strong>AVISO DE SOBREVENTA:</strong> Esta reserva excederá el aforo máximo de 40 personas.
                    <br />¿Desea continuar de todas formas?
                </div>
            )}

            <div className="form-grid">
                <div className="row">
                    <Input
                        id="fecha"
                        label="Fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <Select id="hora" label="Hora" value={formData.hora} onChange={handleChange} className="flex-1">
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </div>

                <Input
                    id="nombre"
                    label="Nombre Cliente *"
                    value={formData.nombre}
                    onChange={handleChange}
                    error={errors.nombre}
                    placeholder="Ej: García, María"
                />

                <Input
                    id="telefono"
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 600123456"
                    type="tel"
                    maxLength={9}
                />

                <div className="row">
                    <Input
                        id="adultos"
                        label="Adultos"
                        type="number"
                        min="0"
                        value={formData.adultos}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <Input
                        id="ninos"
                        label="Niños (<12)"
                        type="number"
                        min="0"
                        value={formData.ninos}
                        onChange={handleChange}
                        className="flex-1"
                    />
                </div>

                <hr className="divider" />

                {/* Restaurant Section */}
                <div className="section-title">🍽️ Servicios de Restaurante</div>

                <div className="service-row">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            id="servicio_comida"
                            checked={formData.servicio_comida}
                            onChange={handleChange}
                        />
                        Servicio Comida
                    </label>
                    {formData.servicio_comida && (
                        <Input
                            id="comensales_comida"
                            type="number"
                            min="1"
                            value={formData.comensales_comida}
                            onChange={handleChange}
                            placeholder="Nº Pax"
                            className="service-input"
                        />
                    )}
                </div>

                <div className="service-row">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            id="servicio_cena"
                            checked={formData.servicio_cena}
                            onChange={handleChange}
                        />
                        Servicio Cena
                    </label>
                    {formData.servicio_cena && (
                        <Input
                            id="comensales_cena"
                            type="number"
                            min="1"
                            value={formData.comensales_cena}
                            onChange={handleChange}
                            placeholder="Nº Pax"
                            className="service-input"
                        />
                    )}
                </div>

                {/* Campo de comentarios de restaurante (solo si hay comida o cena) */}
                {(formData.servicio_comida || formData.servicio_cena) && (
                    <div className="input-wrapper restaurant-notes" style={{ marginTop: '1rem' }}>
                        <label htmlFor="comentarios_restaurante">📝 Observaciones Restaurante</label>
                        <textarea
                            id="comentarios_restaurante"
                            value={formData.comentarios_restaurante}
                            onChange={handleChange}
                            placeholder="Intolerancias, alergias, preferencias de mesa, etc."
                            rows={3}
                        />
                    </div>
                )}

                <hr className="divider" />

                <div className="row">
                    <Input
                        id="importe"
                        label="Importe (€)"
                        type="number"
                        step="0.01"
                        value={formData.importe}
                        onChange={handleChange}
                        className="flex-1"
                    />
                    <Select
                        id="estado_pago"
                        label="Estado Pago"
                        value={formData.estado_pago}
                        onChange={handleChange}
                        className="flex-1"
                    >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                        <option value="Bono Regalo">Bono Regalo</option>
                        <option value="Cancelado">Cancelado</option>
                    </Select>
                </div>

                <div className="input-wrapper" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <label htmlFor="detalles_br">Detalles / Bono Regalo / Localizador</label>
                    <textarea
                        id="detalles_br"
                        value={formData.detalles_br}
                        onChange={handleChange}
                        placeholder="Introduce el localizador, número de bono u otras observaciones..."
                        rows={4}
                    />
                </div>
            </div>
        </Modal>
    );
};
