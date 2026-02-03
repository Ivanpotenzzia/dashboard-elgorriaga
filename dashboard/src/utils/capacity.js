export const MAX_CAPACITY = 40;

export const getCapacityStatus = (totalPax) => {
    if (totalPax >= 36) return 'danger';
    if (totalPax >= 26) return 'warning';
    return 'success';
};

export const getCapacityColor = (status) => {
    switch (status) {
        case 'danger': return 'var(--color-danger)';
        case 'warning': return 'var(--color-warning)';
        case 'success': return 'var(--color-success)';
        default: return 'var(--color-text-muted)';
    }
};
