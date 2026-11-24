
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Cadastro
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, senha } = req.body;

        if (!nome || !senha) {
            return res.status(400).json({ erro: 'Preencha nome e senha' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado = await pool.query(
            'INSERT INTO usuarios (nome, senha_hash) VALUES ($1, $2) RETURNING id, nome',
            [nome.trim(), senhaHash]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        res.status(400).json({ erro: 'Não foi possível cadastrar. Verifique se o nome já existe.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { nome, senha } = req.body;

        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE nome = $1',
            [nome]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        }

        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        }

        const token = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO sessoes (usuario_id, token, expira_em) VALUES ($1, $2, NOW() + INTERVAL \'1 day\')',
            [usuario.id, token]
        );

        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome
            }
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao realizar login' });
    }
});

module.exports = router;
