
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar plano alimentar do usuário
router.get('/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const resultado = await pool.query(`
            SELECT
                pa.id,
                pa.refeicao,
                pa.quantidade,
                a.id AS alimento_id,
                a.nome,
                a.emoji,
                a.calorias,
                a.proteinas,
                a.carboidratos,
                a.gorduras
            FROM plano_alimentar pa
            JOIN alimentos a ON pa.alimento_id = a.id
            WHERE pa.usuario_id = $1
            ORDER BY pa.refeicao, pa.id
        `, [usuarioId]);

        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar plano alimentar' });
    }
});

// Adicionar alimento ao plano
router.post('/', async (req, res) => {
    try {
        const { usuarioId, alimentoId, refeicao, quantidade } = req.body;

        if (!usuarioId || !alimentoId || !refeicao || !quantidade) {
            return res.status(400).json({ erro: 'Preencha todos os campos' });
        }

        if (refeicao < 1 || refeicao > 4 || quantidade < 1 || quantidade > 20) {
            return res.status(400).json({ erro: 'Refeição ou quantidade inválida' });
        }

        const resultado = await pool.query(`
            INSERT INTO plano_alimentar
            (usuario_id, alimento_id, refeicao, quantidade)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [usuarioId, alimentoId, refeicao, quantidade]);

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao adicionar alimento ao plano' });
    }
});

// Remover alimento do plano
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuarioId } = req.body;

        const resultado = await pool.query(
            'DELETE FROM plano_alimentar WHERE id = $1 AND usuario_id = $2 RETURNING *',
            [id, usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ erro: 'Item não encontrado' });
        }

        res.json({ mensagem: 'Alimento removido do plano!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover alimento' });
    }
});

module.exports = router;
