
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar favoritos do usuário
router.get('/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const resultado = await pool.query(`
            SELECT alimentos.*
            FROM favoritos
            JOIN alimentos ON favoritos.alimento_id = alimentos.id
            WHERE favoritos.usuario_id = $1
            ORDER BY alimentos.id
        `, [usuarioId]);

        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar favoritos' });
    }
});

// Adicionar favorito
router.post('/', async (req, res) => {
    try {
        const { usuarioId, alimentoId } = req.body;

        await pool.query(
            'INSERT INTO favoritos (usuario_id, alimento_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [usuarioId, alimentoId]
        );

        res.status(201).json({ mensagem: 'Favorito adicionado!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao adicionar favorito' });
    }
});

// Remover favorito
router.delete('/', async (req, res) => {
    try {
        const { usuarioId, alimentoId } = req.body;

        await pool.query(
            'DELETE FROM favoritos WHERE usuario_id = $1 AND alimento_id = $2',
            [usuarioId, alimentoId]
        );

        res.json({ mensagem: 'Favorito removido!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover favorito' });
    }
});

module.exports = router;
