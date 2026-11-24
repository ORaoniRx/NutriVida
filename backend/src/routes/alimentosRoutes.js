
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar alimentos
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM alimentos ORDER BY id'
        );

        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alimentos' });
    }
});

// Buscar alimento por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM alimentos WHERE id = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Alimento não encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alimento' });
    }
});

module.exports = router;
