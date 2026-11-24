
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar avaliações de um alimento
router.get('/:alimentoId', async (req, res) => {
    try {
        const { alimentoId } = req.params;

        const resultado = await pool.query(`
            SELECT
                avaliacoes.id,
                avaliacoes.nota,
                avaliacoes.comentario,
                avaliacoes.criado_em,
                usuarios.nome
            FROM avaliacoes
            JOIN usuarios ON avaliacoes.usuario_id = usuarios.id
            WHERE avaliacoes.alimento_id = $1
            ORDER BY avaliacoes.id DESC
        `, [alimentoId]);

        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar avaliações' });
    }
});

// Criar avaliação
router.post('/', async (req, res) => {
    try {
        const { usuarioId, alimentoId, nota, comentario } = req.body;

        const texto = comentario?.trim();

        if (!usuarioId || !alimentoId || !nota || !texto) {
            return res.status(400).json({ erro: 'Preencha todos os campos' });
        }

        if (!Number.isInteger(Number(nota)) || nota < 1 || nota > 5) {
            return res.status(400).json({ erro: 'A nota deve ser de 1 a 5' });
        }

        if (texto.length < 3 || texto.length > 500) {
            return res.status(400).json({ erro: 'O comentário deve ter entre 3 e 500 caracteres' });
        }

        const resultado = await pool.query(`
            INSERT INTO avaliacoes
            (usuario_id, alimento_id, nota, comentario)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [usuarioId, alimentoId, Number(nota), texto]);

        res.status(201).json({
            mensagem: 'Avaliação enviada!',
            avaliacao: resultado.rows[0]
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao enviar avaliação' });
    }
});

module.exports = router;
