//importando bibliotecas
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rota inicial
app.get('/', (req, res) => {
    res.send('API NutriVida funcionando!');
});

//ROTAS
const alimentosRoutes = require('./routes/alimentosRoutes');

app.use('/api/alimentos', alimentosRoutes);

const usuariosRoutes = require('./routes/usuariosRoutes');

app.use('/api/usuarios', usuariosRoutes);

const favoritosRoutes = require('./routes/favoritosRoutes');

app.use('/api/favoritos', favoritosRoutes);

const planoRoutes = require('./routes/planoRoutes');

app.use('/api/plano', planoRoutes);

const avaliacoesRoutes = require('./routes/avaliacoesRoutes');

app.use('/api/avaliacoes', avaliacoesRoutes);

// Porta
const PORT = process.env.PORT || 3000;

// Inicializar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
