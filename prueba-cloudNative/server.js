const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); 

// Conexión a tu base de datos en AWS RDS
const pool = mysql.createPool({
    host: 'mi-base-rds.ctuwdcnb0dfg.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'tommynala12*', // Ingresa tu contraseña maestra aquí
    database: 'banco_cloud',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Endpoint Cliente: Crear solicitud de préstamo
app.post('/prestamos', async (req, res) => {
    const { email_cliente, monto, plazo_meses } = req.body;
    try {
        const [result] = await pool.execute(
            "INSERT INTO prestamos (email_cliente, monto, plazo_meses, estado) VALUES (?, ?, ?, 'Pendiente')",
            [email_cliente, monto, plazo_meses]
        );
        res.status(201).json({ mensaje: 'Solicitud creada con éxito', id_prestamo: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al registrar la solicitud' });
    }
});
// 3. Endpoint Admin: Listar todos los préstamos de la cartera
app.get('/prestamos', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM prestamos");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar la cartera de préstamos' });
    }
});

// 4. Endpoint Admin: Aprobar o Rechazar solicitud
app.put('/prestamos/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // Debe ser 'Aprobado' o 'Rechazado'
    
    try {
        const [result] = await pool.execute(
            "UPDATE prestamos SET estado = ? WHERE id_prestamo = ?",
            [estado, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        
        res.json({ mensaje: `Préstamo actualizado exitosamente a estado: ${estado}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estado del préstamo' });
    }
});

// Endpoint Cliente: Consultar préstamos propios
app.get('/prestamos/mis-creditos/:email', async (req, res) => {
    const email = req.params.email;
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM prestamos WHERE email_cliente = ?",
            [email]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el historial de créditos' });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Microservicio Banco Cloud escuchando en el puerto 3000');
});