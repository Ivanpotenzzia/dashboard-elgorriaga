/**
 * Pool Reservations Service
 * Servicio para gestionar reservas de piscina en Supabase
 */

import { supabase } from '../lib/supabase';

const TABLE_NAME = 'reservas_piscina';
const LOG_TABLE = 'audit_log_piscina';

export const PoolReservationService = {
    /**
     * Obtener todas las reservas de piscina para una fecha específica
     * @param {string} date - Format YYYY-MM-DD
     */
    async getByDate(date) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('fecha_reserva', date)
            .eq('activo', true)
            .order('hora_reserva', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Reemplazar todas las reservas de piscina de una fecha
     * (Elimina las existentes e inserta las nuevas)
     * @param {string} date - Format YYYY-MM-DD
     * @param {Array} reservations - Array de reservas
     * @param {string} user - Usuario que realiza la acción
     */
    async bulkReplace(date, reservations, user = 'system') {
        try {
            // 1. Desactivar todas las reservas existentes de esa fecha
            const { error: deleteError } = await supabase
                .from(TABLE_NAME)
                .update({ activo: false })
                .eq('fecha_reserva', date);

            if (deleteError) throw deleteError;

            // 2. Insertar nuevas reservas
            if (reservations.length > 0) {
                const { data, error: insertError } = await supabase
                    .from(TABLE_NAME)
                    .insert(reservations)
                    .select();

                if (insertError) throw insertError;

                // 3. Registrar en log de auditoría
                await this.logUpload(date, reservations.length, user);

                return data;
            }

            return [];
        } catch (error) {
            console.error('Error en bulkReplace:', error);
            throw error;
        }
    },

    /**
     * Obtener la hora de la última carga para una fecha
     * @param {string} date - Format YYYY-MM-DD
     * @returns {string|null} Timestamp de última carga
     */
    async getLastUploadTime(date) {
        const { data, error } = await supabase
            .from(LOG_TABLE)
            .select('fecha_carga')
            .eq('fecha_reserva', date)
            .order('fecha_carga', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // Si no hay logs, retornar null
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data?.fecha_carga || null;
    },

    /**
     * Registrar una carga en el log de auditoría
     * @param {string} date - Fecha de las reservas
     * @param {number} recordCount - Número de registros cargados
     * @param {string} user - Usuario que realizó la carga
     */
    async logUpload(date, recordCount, user = 'system') {
        const { error } = await supabase
            .from(LOG_TABLE)
            .insert([
                {
                    fecha_reserva: date,
                    num_registros: recordCount,
                    usuario: user,
                    detalles: {
                        timestamp: new Date().toISOString(),
                        source: 'MULTISELECCION.xlsx'
                    }
                }
            ]);

        if (error) console.error('Error logging upload:', error);
    },

    /**
     * Obtener estadísticas de reservas de piscina
     * @param {string} date - Format YYYY-MM-DD
     */
    async getStats(date) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('cantidad, tecnica, duracion_minutos')
            .eq('fecha_reserva', date)
            .eq('activo', true);

        if (error) throw error;

        const totalReservas = data?.length || 0;
        const totalPersonas = data?.reduce((sum, r) => sum + (r.cantidad || 0), 0) || 0;
        const totalImserso = data?.filter(r => r.duracion_minutos === 30).length || 0;
        const totalRegulares = data?.filter(r => r.duracion_minutos === 60).length || 0;

        return {
            totalReservas,
            totalPersonas,
            totalImserso,
            totalRegulares
        };
    }
};
