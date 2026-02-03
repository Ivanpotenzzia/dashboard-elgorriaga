import React from 'react';

export const SetupScreen = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '2rem',
            padding: '2rem',
            backgroundColor: '#1e293b',
            color: 'white'
        }}>
            <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #14b8a6, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ♨️ Balneario Elgorriaga
            </h1>

            <div style={{
                maxWidth: '600px',
                padding: '2rem',
                backgroundColor: '#334155',
                borderRadius: '12px',
                border: '1px solid #f59e0b'
            }}>
                <h2 style={{ color: '#f59e0b', marginTop: 0 }}>⚠️ Configuración Requerida</h2>
                <p>No se ha detectado la conexión con Supabase. Para continuar:</p>

                <ol style={{ textAlign: 'left', lineHeight: '1.8' }}>
                    <li>Crea/edita el archivo <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>.env</code> en la carpeta <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>dashboard</code>.</li>
                    <li>Añade tus claves de Supabase:
                        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.875rem' }}>
                            {`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tus-credenciales`}
                        </pre>
                    </li>
                    <li>Reinicia la terminal donde corre <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>npm run dev</code> (Ctrl+C y volver a ejecutar).</li>
                </ol>
            </div>
        </div>
    );
};
