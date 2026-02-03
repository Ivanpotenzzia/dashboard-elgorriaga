import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/atoms/Button';
import { SummaryCards } from '../components/molecules/SummaryCards';
import { TimeSlotRow } from '../components/molecules/TimeSlotRow';
import { ReservationModal } from '../components/organisms/ReservationModal';
import { TimeSlotDetailModal } from '../components/organisms/TimeSlotDetailModal';
import { ReservationService } from '../services/reservations';
import { PoolReservationService } from '../services/poolReservations';
import { parsePoolReservationsFile } from '../utils/poolParserV4';
import { Loader2, Calendar, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import { MAX_CAPACITY } from '../utils/capacity';
import './Dashboard.css';

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9; // Empieza a las 09:00
    const min = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${min === 0 ? '00' : '30'}`;
});

const HeaderV2 = ({ date, setDate, onAdd, onImportExcel, onExportExcel, lastExcelUpdate }) => (
    <div className="dashboard-header-v2">
        <div>
            <h1 className="page-title">Panel de Control</h1>
            <p className="page-subtitle">Gestión del aforo termal y disponibilidad</p>
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

            <Button variant="outline" onClick={onImportExcel} icon={Upload}>Cargar Excel</Button>
            <Button variant="outline" onClick={onExportExcel} icon={Download}>Excel Diario</Button>
            <Button onClick={onAdd}>+ Nueva Reserva</Button>

            {lastExcelUpdate && (
                <div className="last-update-text">
                    Última actualización: {format(new Date(lastExcelUpdate), "HH:mm", { locale: es })}
                </div>
            )}
        </div>
    </div>
);

export const Dashboard = () => {
    // Leer fecha inicial de localStorage si existe (para sincronización con Restaurante)
    const getInitialDate = () => {
        const savedDate = localStorage.getItem('selectedDate');
        return savedDate || format(new Date(), 'yyyy-MM-dd');
    };

    const [date, setDate] = useState(getInitialDate);
    const [externalReservations, setExternalReservations] = useState([]); // Reservas manuales
    const [poolReservations, setPoolReservations] = useState([]); // Todas las del Excel
    const [lastExcelUpdate, setLastExcelUpdate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [editingReservation, setEditingReservation] = useState(null);

    // Sincronizar fecha con localStorage cuando cambia
    useEffect(() => {
        localStorage.setItem('selectedDate', date);
    }, [date]);

    // Load Data
    useEffect(() => {
        loadReservations();
        loadPoolReservations();
    }, [date]);

    const loadReservations = async () => {
        setLoading(true);
        try {
            const data = await ReservationService.getByDate(date);
            setExternalReservations(data || []);
        } catch (err) {
            console.error('Error loading reservations:', err);
        } finally { setLoading(false); }
    };

    const loadPoolReservations = async () => {
        try {
            const data = await PoolReservationService.getByDate(date);
            setPoolReservations(data || []);
            const lastUpdate = await PoolReservationService.getLastUploadTime(date);
            setLastExcelUpdate(lastUpdate);
        } catch (err) {
            console.error('Error loading pool reservations:', err);
        }
    };

    const handleExcelImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setLoading(true);
            const result = await parsePoolReservationsFile(file);

            if (result.isMultiDate) {
                // Archivo quincenal: múltiples fechas
                const { fechas, reservationsByDate, totalReservations } = result;

                const confirmImport = confirm(
                    `📅 Archivo quincenal detectado\n\n` +
                    `Se encontraron ${totalReservations} reservas para ${fechas.length} días:\n` +
                    `${fechas.slice(0, 5).join(', ')}${fechas.length > 5 ? '...' : ''}\n\n` +
                    `¿Deseas importar todas las fechas?`
                );

                if (!confirmImport) {
                    setLoading(false);
                    e.target.value = '';
                    return;
                }

                await PoolReservationService.bulkReplaceMultiple(reservationsByDate);

                // Navegar a la primera fecha del archivo
                const primeraFecha = fechas[0];
                setDate(primeraFecha);
                await loadPoolReservations();

                alert(
                    `✅ Importación quincenal completada\n\n` +
                    `• ${fechas.length} días procesados\n` +
                    `• ${totalReservations} reservas importadas\n\n` +
                    `Se ha navegado al ${primeraFecha}`
                );

            } else {
                // Archivo diario: fecha única (lógica original)
                const { fecha, reservations } = result;

                if (fecha !== date) {
                    const confirmChange = confirm(
                        `El archivo contiene reservas para el día ${fecha}.\n` +
                        `Actualmente estás viendo ${date}.\n\n` +
                        `¿Deseas cambiar a la fecha del archivo?`
                    );

                    if (confirmChange) {
                        setDate(fecha);
                    }
                }

                await PoolReservationService.bulkReplace(fecha, reservations);

                if (fecha === date) {
                    await loadPoolReservations();
                }

                const totalPax = reservations.reduce((sum, r) => sum + (r.cantidad || 0), 0);
                alert(`✅ Importadas ${reservations.length} reservas (${totalPax} personas) para el ${fecha}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error al importar archivo Excel: ${err.message}`);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleExportExcel = () => {
        try {
            const dataToExport = [
                ...externalReservations.map(r => ({
                    Fecha: r.fecha_reserva,
                    Hora: r.hora_reserva,
                    Origen: 'MANUAL',
                    Cliente: r.nombre_cliente,
                    Telefono: r.telefono,
                    Adultos: r.adultos,
                    Ninos: r.ninos,
                    Importe: r.importe_pago,
                    Estado: r.estado_pago,
                    Detalles: r.detalles_br
                })),
                ...poolReservations.map(r => ({
                    Fecha: r.fecha_reserva,
                    Hora: r.hora_reserva,
                    Origen: 'EXCEL',
                    Cliente: r.cliente,
                    Telefono: r.telefono || '',
                    Adultos: r.adultos || r.cantidad,
                    Ninos: r.ninos || 0,
                    Importe: r.importe || '',
                    Estado: r.estado_pago || '',
                    Detalles: r.tecnica || ''
                }))
            ];

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Reservas");
            XLSX.writeFile(wb, `Reservas_Elgorriaga_${date}.xlsx`);
        } catch (err) {
            console.error(err);
            alert('Error al exportar Excel');
        }
    };

    // Función auxiliar para obtener categoría según técnica
    const getCategoriaFromTecnica = (tecnica) => {
        if (!tecnica) return 'OTROS';
        const t = String(tecnica).toUpperCase();
        if (t.includes('NO ALOJADOS')) return 'EXTERNOS';
        if (t.includes('ALOJADOS')) return 'HUESPEDES';
        if (t.includes('IMS') || t.includes('IMSERSO')) return 'IMSERSO';
        return 'OTROS';
    };

    // Función para verificar si una reserva está activa en una franja horaria
    // Una reserva de 60 min ocupa 2 franjas (ej: 10:00 ocupa 10:00 y 10:30)
    const isReservationInSlot = (reserva, slotTime) => {
        const horaReserva = reserva.hora_reserva?.substring(0, 5);
        if (!horaReserva) return false;

        const duracion = reserva.duracion_minutos || 60;

        // Convertir horas a minutos para comparar
        const [rH, rM] = horaReserva.split(':').map(Number);
        const [sH, sM] = slotTime.split(':').map(Number);
        const reservaMinutos = rH * 60 + rM;
        const slotMinutos = sH * 60 + sM;

        // La reserva está activa si la franja cae dentro del rango [inicio, inicio+duracion)
        return slotMinutos >= reservaMinutos && slotMinutos < (reservaMinutos + duracion);
    };

    const slotsData = useMemo(() => {
        return TIME_SLOTS.map(time => {
            // Filtrar reservas que ESTÁN ACTIVAS en esta franja (no solo las que empiezan aquí)
            const extInSlot = externalReservations.filter(r => isReservationInSlot(r, time));
            const poolInSlot = poolReservations.filter(r => isReservationInSlot(r, time));

            // Calcular categoría dinámicamente desde el campo tecnica
            const huespedesInSlot = poolInSlot.filter(r => getCategoriaFromTecnica(r.tecnica) === 'HUESPEDES');
            const externosExcelInSlot = poolInSlot.filter(r => getCategoriaFromTecnica(r.tecnica) === 'EXTERNOS');
            const imsersoInSlot = poolInSlot.filter(r => getCategoriaFromTecnica(r.tecnica) === 'IMSERSO');

            const totalManuales = extInSlot.reduce((s, r) => s + (r.adultos || 0) + (r.ninos || 0), 0);
            const totalHuespedes = huespedesInSlot.reduce((s, r) => s + (r.cantidad || 0), 0);
            const totalExternos = externosExcelInSlot.reduce((s, r) => s + (r.cantidad || 0), 0);
            const totalImserso = imsersoInSlot.reduce((s, r) => s + (r.cantidad || 0), 0);

            return {
                time,
                total: totalHuespedes + (totalExternos + totalManuales) + totalImserso,
                huespedes: totalHuespedes,
                externos: totalExternos + totalManuales,
                imserso: totalImserso,
                active: (totalHuespedes + totalExternos + totalManuales + totalImserso) > 0,
                max: MAX_CAPACITY,
                reservations: extInSlot,
                poolReservations: poolInSlot.map(r => ({
                    ...r,
                    // Añadir flag para saber si es reserva que "continúa" de franja anterior
                    isCarryOver: r.hora_reserva?.substring(0, 5) !== time
                }))
            };
        });
    }, [externalReservations, poolReservations]);

    // Calcular stats con Total Visitantes SIN duplicados
    // (cada reserva cuenta 1 vez, basado en su hora de INICIO)
    const stats = useMemo(() => {
        // Total visitantes: contar por hora de INICIO, no por ocupación
        const totalPaxManuales = externalReservations.reduce((acc, r) =>
            acc + (r.adultos || 0) + (r.ninos || 0), 0);
        const totalPaxPool = poolReservations.reduce((acc, r) =>
            acc + (r.cantidad || 0), 0);
        const totalPax = totalPaxManuales + totalPaxPool;

        // Hora pico: buscar la franja con mayor ocupación simultánea
        const maxSlot = slotsData.reduce((max, s) => s.total > max.total ? s : max, { total: 0, time: '-' });

        // Alertas: franjas con alta demanda
        const highDemandCount = slotsData.filter(s => (s.total / s.max) >= 0.8).length;

        // Ocupación promedio
        const avgOccupancy = Math.round(slotsData.reduce((acc, s) => acc + (s.total / s.max) * 100, 0) / slotsData.length);

        return {
            totalPax,           // Personas únicas del día
            peakHour: maxSlot.time,
            peakPax: maxSlot.total,  // Máxima ocupación simultánea
            alerts: highDemandCount,
            occupancyRate: avgOccupancy
        };
    }, [slotsData, externalReservations, poolReservations]);

    const handleSlotClick = (time) => {
        const slot = slotsData.find(s => s.time === time);
        setSelectedSlot(slot);
        setDetailModalOpen(true);
    };

    const handleAddClick = (time = '10:00') => {
        setEditingReservation({ hora: time });
        setModalOpen(true);
    };

    const handleEditReservation = (reservation) => {
        setEditingReservation(reservation);
        setDetailModalOpen(false);
        setModalOpen(true);
    };

    const handleDeleteReservation = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;
        try {
            await ReservationService.delete(id);
            loadReservations();
            setDetailModalOpen(false);
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Error al eliminar');
        }
    };

    const handleSaveReservation = async (formData) => {
        try {
            if (formData.id_reserva) {
                await ReservationService.update(formData.id_reserva, formData);
            } else {
                await ReservationService.create(formData);
            }

            // 1. Cerrar modal primero para limpiar UI
            setModalOpen(false);
            setEditingReservation(null);

            // 2. Pequeño delay para permitir que React desmonte el modal antes de recargar la tabla pesada
            setTimeout(() => {
                loadReservations();
            }, 50);

        } catch (err) {
            console.error('Error saving reservation:', err);
            alert(`Error al guardar: ${err.message || 'Ver consola'}`);
        }
    };

    return (
        <Layout>
            <HeaderV2
                date={date}
                setDate={setDate}
                onAdd={() => handleAddClick()}
                onImportExcel={() => document.getElementById('excel-upload').click()}
                onExportExcel={handleExportExcel}
                lastExcelUpdate={lastExcelUpdate}
            />

            <input type="file" id="excel-upload" hidden accept=".xls,.xlsx" onChange={handleExcelImport} />

            <SummaryCards
                totalPax={stats.totalPax}
                peakHour={stats.peakHour}
                peakPax={stats.peakPax}
                alerts={stats.alerts}
                occupancyRate={stats.occupancyRate}
            />

            <h2 className="section-title">Detalle por Franjas</h2>

            <div className="table-header">
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
                    <div className="legend-item"><span className="dot success"></span>Disponible</div>
                    <div className="legend-item"><span className="dot warning"></span>Alta Demanda</div>
                    <div className="legend-item"><span className="dot danger"></span>Completo</div>
                </div>
            </div>

            <div className="slots-table-container glass">
                <div className="slots-table-header">
                    <span style={{ width: '80px' }}>HORA</span>
                    <span style={{ flex: 2 }}>DESGLOSE</span>
                    <span style={{ width: '100px' }}>OCUPACIÓN</span>
                    <span style={{ width: '120px' }}>ESTADO</span>
                    <span style={{ flex: 2 }}>INDICADOR VISUAL</span>
                    <span style={{ width: '80px' }}></span>
                </div>

                {loading ? (
                    <div className="table-loading"><Loader2 className="animate-spin" /></div>
                ) : (
                    slotsData.map(slot => (
                        <TimeSlotRow
                            key={slot.time}
                            time={slot.time}
                            occupancy={slot}
                            onClick={() => handleSlotClick(slot.time)}
                        />
                    ))
                )}
            </div>

            <TimeSlotDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                time={selectedSlot?.time}
                date={date}
                reservations={selectedSlot?.reservations || []}
                poolReservations={selectedSlot?.poolReservations || []}
                onEdit={handleEditReservation}
                onDelete={handleDeleteReservation}
                onAddNew={() => {
                    setDetailModalOpen(false);
                    handleAddClick(selectedSlot?.time);
                }}
            />

            <ReservationModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingReservation(null); }}
                onSave={handleSaveReservation}
                initialData={editingReservation}
                defaultDate={date}
            />
        </Layout>
    );
};
