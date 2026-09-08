import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configuración de Cognito (Reemplaza con tus datos reales)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_7YKgTB0ZV',
      userPoolClientId: '5811olh3c1jh3b9lmq5qr5rmj2',
      region: 'us-east-1',
    }
  }
});

const API_URL = 'http://localhost:3000';

function BancoCloudApp({ user, signOut }) {
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('');
  const [misCreditos, setMisCreditos] = useState([]);
  const [carteraTotal, setCarteraTotal] = useState([]);

  const emailUsuario = user?.signInDetails?.loginId || user?.username;
  const isAdmin = emailUsuario?.includes('admi') || false;

  useEffect(() => {
    if (isAdmin) {
      cargarCarteraAdmin();
    } else if (emailUsuario) {
      cargarMisCreditos();
    }
  }, [user]);

  const solicitarCredito = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/prestamos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_cliente: emailUsuario,
          monto: parseFloat(monto),
          plazo_meses: parseInt(plazo)
        })
      });
      if (res.ok) {
        alert('¡Solicitud de crédito enviada con éxito!');
        setMonto('');
        setPlazo('');
        cargarMisCreditos();
      }
    } catch (error) {
      console.error('Error al solicitar crédito:', error);
    }
  };

  const cargarMisCreditos = async () => {
    try {
      const res = await fetch(`${API_URL}/prestamos/mis-creditos/${emailUsuario}`);
      const data = await res.json();
      setMisCreditos(data);
    } catch (error) {
      console.error('Error al cargar créditos:', error);
    }
  };

  const cargarCarteraAdmin = async () => {
    try {
      const res = await fetch(`${API_URL}/prestamos`);
      const data = await res.json();
      setCarteraTotal(data);
    } catch (error) {
      console.error('Error al cargar la cartera:', error);
    }
  };

  const evaluarPrestamo = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`${API_URL}/prestamos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        alert(`Préstamo #${id} actualizado a: ${nuevoEstado}`);
        cargarCarteraAdmin();
      }
    } catch (error) {
      console.error('Error al evaluar el préstamo:', error);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2>Banco Cloud — Portal {isAdmin ? 'Administrador' : 'de Clientes'}</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Usuario: <b>{emailUsuario}</b></span>
          <button onClick={signOut} style={{ padding: '8px 14px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {!isAdmin && (
        <div>
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
            <h3>Simular y Solicitar Crédito</h3>
            <form onSubmit={solicitarCredito} style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Monto Solicitado ($):</label>
                <input 
                  type="number" 
                  value={monto} 
                  onChange={(e) => setMonto(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Plazo (Meses):</label>
                <input 
                  type="number" 
                  value={plazo} 
                  onChange={(e) => setPlazo(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Enviar Solicitud
              </button>
            </form>
          </div>

          <h3>Mis Préstamos Solicitados</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Monto</th>
                <th style={{ padding: '10px' }}>Plazo (Meses)</th>
                <th style={{ padding: '10px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {misCreditos.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center' }}>No tienes créditos registrados.</td></tr>
              ) : (
                misCreditos.map((c) => (
                  <tr key={c.id_prestamo} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{c.id_prestamo}</td>
                    <td style={{ padding: '10px' }}>${Number(c.monto).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{c.plazo_meses}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: c.estado === 'Aprobado' ? 'green' : c.estado === 'Rechazado' ? 'red' : 'orange' }}>
                      {c.estado}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <div>
          <h3>Cartera Global de Solicitudes (Panel Administrativo)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Cliente</th>
                <th style={{ padding: '10px' }}>Monto</th>
                <th style={{ padding: '10px' }}>Plazo</th>
                <th style={{ padding: '10px' }}>Estado</th>
                <th style={{ padding: '10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carteraTotal.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '15px', textAlign: 'center' }}>No hay solicitudes en la cartera.</td></tr>
              ) : (
                carteraTotal.map((item) => (
                  <tr key={item.id_prestamo} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{item.id_prestamo}</td>
                    <td style={{ padding: '10px' }}>{item.email_cliente}</td>
                    <td style={{ padding: '10px' }}>${Number(item.monto).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{item.plazo_meses} meses</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: item.estado === 'Aprobado' ? 'green' : item.estado === 'Rechazado' ? 'red' : 'orange' }}>
                      {item.estado}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {item.estado === 'Pendiente' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => evaluarPrestamo(item.id_prestamo, 'Aprobado')} style={{ background: '#52c41a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
                            Aprobar
                          </button>
                          <button onClick={() => evaluarPrestamo(item.id_prestamo, 'Rechazado')} style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BancoCloudApp user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}