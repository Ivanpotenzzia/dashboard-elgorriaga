import { supabase } from '../lib/supabase';

const TABLE_NAME = 'reservas_externas';
const LOG_TABLE = 'audit_log';

export const ReservationService = {
    /**
     * Get all active reservations for a specific date
     * @param {string} date - Format YYYY-MM-DD
     */
    async getByDate(date) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('fecha_reserva', date)
            .eq('activo', true)
            .neq('estado_pago', 'Cancelado') // Cancelled don't show up in main view usually
            .order('hora_reserva', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Get restaurant reservations for a specific date
     */
    async getRestaurantReservations(date) {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('fecha_reserva', date)
            .eq('activo', true)
            .neq('estado_pago', 'Cancelado')
            .or('servicio_comida.eq.true,servicio_cena.eq.true');

        if (error) throw error;
        return data;
    },

    /**
     * Create a new reservation
     * @param {Object} reservationData 
     * @param {string} user - Username for audit
     */
    async create(reservationData, user = 'system') {
        // 1. Insert Reservation
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([
                {
                    ...reservationData,
                    usuario_creacion: user
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // 2. Create Scan Log (Fire and forget, or await)
        await this.logAction(data.id_reserva, 'CREATE', user, { initial_data: data });

        return data;
    },

    /**
     * Update a reservation
     */
    async update(id, updates, user = 'system') {
        // Get old data for log
        const { data: oldData } = await supabase.from(TABLE_NAME).select('*').eq('id_reserva', id).single();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                ...updates,
                fecha_modificacion: new Date().toISOString(),
                usuario_modificacion: user
            })
            .eq('id_reserva', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAction(id, 'UPDATE', user, { from: oldData, to: data });

        return data;
    },

    /**
     * Soft delete a reservation (or mark as Cancelled)
     * To delete from view: set activo = false OR set estado_pago = 'Cancelado'
     * The specs say "Mark as deleted in DB". We use 'activo' for soft delete.
     */
    async delete(id, user = 'system') {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({
                activo: false,
                fecha_modificacion: new Date().toISOString(),
                usuario_modificacion: user
            })
            .eq('id_reserva', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAction(id, 'DELETE', user, { deleted_at: new Date() });
        return data;
    },

    /**
     * Internal Helper for Logging
     */
    async logAction(id_reserva, action, user, details) {
        const { error } = await supabase
            .from(LOG_TABLE)
            .insert([
                {
                    id_reserva,
                    accion: action,
                    usuario: user,
                    detalles: details
                }
            ]);
        if (error) console.error('Error logging action:', error);
    }
};
