import React from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Trash2, Edit, ArrowLeft, X, Clock } from 'lucide-react';
import './TimeSlotDetailModal.css';

export const TimeSlotDetailModal = ({
    isOpen,
    onClose,
    time,
    date,
    reservations = [],
    poolReservations = [],
    onEdit,
    onDelete,
    onAddNew
}) => {
    if (!isOpen) return null;

    // Función auxiliar para obtener categoría según técnica
    const getCategoriaFromTecnica = (tecnica) => {
        if (!tecnica) return 'OTROS';
        const t = String(tecnica).toUpperCase();
        if (t.includes('NO ALOJADOS')) return 'EXTERNOS';
        if (t.includes('ALOJADOS')) return 'HUESPEDES';
        if (t.includes('IMS') || t.includes('IMSERSO')) return 'IMSERSO';
        return 'OTROS';
    };

    // Ordenar por hora de inicio (las que empezaron antes primero)
    const sortByHoraInicio = (a, b) => {
        const horaA = a.hora_reserva || '99:99';
        const horaB = b.hora_reserva || '99:99';
        return horaA.localeCompare(horaB);
    };

    const huespedes = poolReservations
        .filter(r => getCategoriaFromTecnica(r.tecnica) === 'HUESPEDES')
        .sort(sortByHoraInicio);
    const externosExcel = poolReservations
        .filter(r => getCategoriaFromTecnica(r.tecnica) === 'EXTERNOS')
        .sort(sortByHoraInicio);
    const imserso = poolReservations
        .filter(r => getCategoriaFromTecnica(r.tecnica) === 'IMSERSO')
        .sort(sortByHoraInicio);

    // Contar personas por categoría
    const totalHuespedes = huespedes.reduce((sum, r) => sum + (r.cantidad || 0), 0);
    const totalExternosExcel = externosExcel.reduce((sum, r) => sum + (r.cantidad || 0), 0);
    const totalManuales = reservations.reduce((sum, r) => sum + (r.adultos || 0) + (r.ninos || 0), 0);
    const totalImserso = imserso.reduce((sum, r) => sum + (r.cantidad || 0), 0);

    const hasHuespedes = huespedes.length > 0;
    const hasExternos = (reservations.length + externosExcel.length) > 0;
    const hasImserso = imserso.length > 0;
    const isEmpty = !hasHuespedes && !hasExternos && !hasImserso;

    return (
        <div className="fullscreen-modal-overlay">
            <div className="fullscreen-modal">
                {/* Fixed Header */}
                <div className="fullscreen-modal-header">
                    <div className="header-left">
                        <button className="back-button" onClick={onClose} title="Volver">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="header-title">Detalle de Franja Horaria</h2>
                            <p className="header-subtitle">{time} - {date}</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <Button onClick={onAddNew}>+ Añadir Nueva Reserva</Button>
                        <button className="close-button" onClick={onClose} title="Cerrar">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="fullscreen-modal-content">
                    {isEmpty ? (
                        <div className="empty-state">
                            <p>No hay reservas para esta franja horaria.</p>
                        </div>
                    ) : (
                        <div className="reservations-sections">
                            {/* Sección: HUÉSPEDES (Sólo Excel) */}
                            {hasHuespedes && (
                                <div className="reservation-section">
                                    <h3 className="section-title">
                                        <Badge variant="primary">HUÉSPEDES (HOTEL)</Badge>
                                        <span className="section-count">{huespedes.length} reserva{huespedes.length !== 1 ? 's' : ''} • {totalHuespedes} pax</span>
                                    </h3>
                                    <div className="reservations-table-wrapper">
                                        <table className="reservations-table pool-table">
                                            <thead>
                                                <tr>
                                                    <th>Hora Inicio</th>
                                                    <th>Cliente</th>
                                                    <th>Habitación</th>
                                                    <th>Personas</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {huespedes.map((r, index) => (
                                                    <tr key={r.id_reserva_piscina || `h-${index}`} className={`pool-row ${r.isCarryOver ? 'carry-over-row' : ''}`}>
                                                        <td className="hora-cell">
                                                            {r.hora_reserva?.substring(0, 5)}
                                                            {r.isCarryOver && <span className="carry-over-badge" title="Continúa desde franja anterior">↩</span>}
                                                        </td>
                                                        <td className="name-cell">{r.cliente}</td>
                                                        <td>{r.habitacion || '-'}</td>
                                                        <td>{r.cantidad}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Sección: EXTERNOS (Manual + Excel) */}
                            {hasExternos && (
                                <div className="reservation-section">
                                    <h3 className="section-title">
                                        <Badge variant="success">EXTERNOS</Badge>
                                        <span className="section-count">
                                            {reservations.length + externosExcel.length} reserva{(reservations.length + externosExcel.length) !== 1 ? 's' : ''} • {totalExternosExcel + totalManuales} pax
                                        </span>
                                    </h3>
                                    <div className="reservations-table-wrapper">
                                        <table className="reservations-table">
                                            <thead>
                                                <tr>
                                                    <th>Nombre/Cliente</th>
                                                    <th>Origen</th>
                                                    <th>Teléfono / Hab.</th>
                                                    <th>Adultos</th>
                                                    <th>Niños</th>
                                                    <th>Cabina</th>
                                                    <th>Estado Pago</th>
                                                    <th>Importe</th>
                                                    <th>Detalles / Técnica</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Primero las manuales */}
                                                {reservations.map(r => (
                                                    <tr key={r.id_reserva}>
                                                        <td className="name-cell">{r.nombre_cliente}</td>
                                                        <td><Badge variant="ghost">MANUAL</Badge></td>
                                                        <td>{r.telefono || '-'}</td>
                                                        <td>{r.adultos}</td>
                                                        <td>{r.ninos}</td>
                                                        <td>
                                                            {r.tratamientos_cabina ? (
                                                                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Sí</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)' }}>No</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge variant={r.estado_pago === 'Pagado' ? 'success' : (r.estado_pago === 'Bono Regalo' ? 'info' : 'warning')}>
                                                                {r.estado_pago || 'Pendiente'}
                                                            </Badge>
                                                        </td>
                                                        <td>{r.importe_pago ? `${r.importe_pago}€` : '-'}</td>
                                                        <td className="details-cell">{r.detalles_br || '-'}</td>
                                                        <td className="actions-cell">
                                                            <button className="icon-btn" onClick={() => onEdit(r)} title="Editar">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button className="icon-btn danger" onClick={() => onDelete(r.id_reserva)} title="Eliminar">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Luego las de Excel marcadas como Externos */}
                                                {externosExcel.map((r, index) => (
                                                    <tr key={r.id_reserva_piscina || `ee-${index}`} className={`pool-row ${r.isCarryOver ? 'carry-over-row' : ''}`}>
                                                        <td className="name-cell">
                                                            {r.cliente}
                                                            {r.isCarryOver && <span className="carry-over-badge" title="Continúa desde franja anterior"> ↩</span>}
                                                        </td>
                                                        <td><Badge variant="ghost">EXCEL</Badge></td>
                                                        <td>{r.telefono || (r.habitacion ? `Hab: ${r.habitacion}` : '-')}</td>
                                                        <td>{r.cantidad}</td>
                                                        <td>{r.ninos || 0}</td>
                                                        <td>-</td>
                                                        <td>{r.estado_pago || '-'}</td>
                                                        <td>{r.importe ? `${r.importe}€` : '-'}</td>
                                                        <td className="tecnica-cell">{r.hora_reserva?.substring(0, 5)}</td>
                                                        <td></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Sección: IMSERSO (Sólo Excel) */}
                            {hasImserso && (
                                <div className="reservation-section">
                                    <h3 className="section-title">
                                        <Badge variant="info">IMSERSO</Badge>
                                        <span className="section-count">{imserso.length} reserva{imserso.length !== 1 ? 's' : ''} • {totalImserso} pax</span>
                                    </h3>
                                    <div className="reservations-table-wrapper">
                                        <table className="reservations-table pool-table">
                                            <thead>
                                                <tr>
                                                    <th>Cliente</th>
                                                    <th>Habitación</th>
                                                    <th>Cantidad</th>
                                                    <th>Técnica</th>
                                                    <th>Duración</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {imserso.map((r, index) => (
                                                    <tr key={r.id_reserva_piscina || `i-${index}`} className="pool-row">
                                                        <td className="name-cell">{r.cliente}</td>
                                                        <td>{r.habitacion || '-'}</td>
                                                        <td>{r.cantidad}</td>
                                                        <td className="tecnica-cell">{r.tecnica}</td>
                                                        <td>{r.duracion_minutos} min</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
