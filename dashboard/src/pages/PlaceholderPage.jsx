import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Construction } from 'lucide-react';

export const PlaceholderPage = ({ title }) => {
    return (
        <Layout>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'calc(100vh - 100px)',
                color: 'var(--color-text-muted)',
                gap: '1.5rem',
                textAlign: 'center'
            }}>
                <div style={{
                    background: 'var(--color-bg-base)',
                    padding: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Construction size={48} color="var(--color-accent)" />
                </div>
                <div>
                    <h1 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>{title}</h1>
                    <p>Esta funcionalidad está en desarrollo.</p>
                </div>
            </div>
        </Layout>
    );
};
