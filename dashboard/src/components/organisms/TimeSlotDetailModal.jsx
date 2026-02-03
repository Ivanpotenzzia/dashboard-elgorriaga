import React from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Trash2, Edit, ArrowLeft, X } from 'lucide-react';
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

    const huespedes = poolReservations.filter(r => getCategoriaFromTecnica(r.tecnica) === 'HUESPEDES');
    const externosExcel = poolReservations.filter(r => getCategoriaFromTecnica(r.tecnica) === 'EXTERNOS');
    const imserso = poolReservations.filter(r => getCategoriaFromTecnica(r.tecnica) === 'IMSERSO');

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
                                        <span className="section-count">{huespedes.length} reserva{huespedes.length !== 1 ? 's' : ''}</span>
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
                                                {huespedes.map((r, index) => (
                                                    <tr key={r.id_reserva_piscina || `h-${index}`} className="pool-row">
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

                            {/* Sección: EXTERNOS (Manual + Excel) */}
                            {hasExternos && (
                                <div className="reservation-section">
                                    <h3 className="section-title">
                                        <Badge variant="success">EXTERNOS</Badge>
                                        <span className="section-count">
                                            {reservations.length + externosExcel.length} reserva{(reservations.length + externosExcel.length) !== 1 ? 's' : ''}
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
                                                    <tr key={r.id_reserva_piscina || `ee-${index}`} className="pool-row">
                                                        <td className="name-cell">{r.cliente}</td>
                                                        <td><Badge variant="ghost">EXCEL</Badge></td>
                                                        <td>{r.telefono || (r.habitacion ? `Hab: ${r.habitacion}` : '-')}</td>
                                                        <td>{r.adultos || r.cantidad}</td>
                                                        <td>{r.ninos || 0}</td>
                                                        <td>{r.estado_pago || '-'}</td>
                                                        <td>{r.importe ? `${r.importe}€` : '-'}</td>
                                                        <td className="tecnica-cell">{r.detalles || r.tecnica}</td>
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
                                        <span className="section-count">{imserso.length} reserva{imserso.length !== 1 ? 's' : ''}</span>
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
