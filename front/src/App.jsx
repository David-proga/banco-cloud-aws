import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css'; // Importamos los nuevos estilos

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_TU_USER_POOL_ID', // Asegúrate de reponer tu ID
      userPoolClientId: 'TU_CLIENT_ID',       // Asegúrate de reponer tu Client ID
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
        body: JSON.stringify({ email_cliente: emailUsuario, monto: parseFloat(monto), plazo_meses: parseInt(plazo) })
      });
      if (res.ok) {
        alert('¡Solicitud enviada con éxito!');
        setMonto('');
        setPlazo('');
        cargarMisCreditos();
      }
    } catch (error) { console.error(error); }
  };

  const cargarMisCreditos = async () => {
    try {
      const res = await fetch(`${API_URL}/prestamos/mis-creditos/${emailUsuario}`);
      const data = await res.json();
      setMisCreditos(data);
    } catch (error) { console.error(error); }
  };

  const cargarCarteraAdmin = async () => {
    try {
      const res = await fetch(`${API_URL}/prestamos`);
      const data = await res.json();
      setCarteraTotal(data);
    } catch (error) { console.error(error); }
  };

  const evaluarPrestamo = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`${API_URL}/prestamos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        cargarCarteraAdmin();
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="container">
      <header className="header">
        <h2>Banco Cloud <span style={{color: '#6b7280', fontSize: '18px'}}>| {isAdmin ? 'Panel Administrativo' : 'Portal de Clientes'}</span></h2>
        <div className="user-info">
          <span><b>{emailUsuario}</b></span>
          <button onClick={signOut} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      {!isAdmin && (
        <>
          <div className="card">
            <h3>Simular y Solicitar Crédito</h3>
            <form onSubmit={solicitarCredito}>
              <div className="form-group">
                <label>Monto Solicitado ($)</label>
                <input type="number" className="form-input" value={monto} onChange={(e) => setMonto(e.target.value)} required placeholder="Ej: 15000000" />
              </div>
              <div className="form-group">
                <label>Plazo (Meses)</label>
                <input type="number" className="form-input" value={plazo} onChange={(e) => setPlazo(e.target.value)} required placeholder="Ej: 60" />
              </div>
              <button type="submit" className="btn-primary">Enviar Solicitud al Banco</button>
            </form>
          </div>

          <h3 style={{color: '#111827', marginBottom: '15px'}}>Mis Préstamos</h3>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr><th>ID</th><th>Monto</th><th>Plazo</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {misCreditos.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign: 'center', color: '#6b7280'}}>Sin solicitudes registradas.</td></tr>
                ) : (
                  misCreditos.map((c) => (
                    <tr key={c.id_prestamo}>
                      <td>#{c.id_prestamo}</td>
                      <td>${Number(c.monto).toLocaleString()}</td>
                      <td>{c.plazo_meses} meses</td>
                      <td><span className={`badge badge-${c.estado}`}>{c.estado}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <h3 style={{color: '#111827', marginBottom: '15px'}}>Cartera Global de Solicitudes</h3>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr><th>ID</th><th>Cliente</th><th>Monto</th><th>Plazo</th><th>Estado</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {carteraTotal.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center', color: '#6b7280'}}>Cartera vacía.</td></tr>
                ) : (
                  carteraTotal.map((item) => (
                    <tr key={item.id_prestamo}>
                      <td>#{item.id_prestamo}</td>
                      <td>{item.email_cliente}</td>
                      <td>${Number(item.monto).toLocaleString()}</td>
                      <td>{item.plazo_meses} meses</td>
                      <td><span className={`badge badge-${item.estado}`}>{item.estado}</span></td>
                      <td>
                        {item.estado === 'Pendiente' && (
                          <div className="action-buttons">
                            <button onClick={() => evaluarPrestamo(item.id_prestamo, 'Aprobado')} className="btn-action btn-approve">Aprobar</button>
                            <button onClick={() => evaluarPrestamo(item.id_prestamo, 'Rechazado')} className="btn-action btn-reject">Rechazar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
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