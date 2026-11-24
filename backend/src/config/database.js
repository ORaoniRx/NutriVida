//chama a extensão do pg + o dotenv criado por mim
const { Pool } = require('pg');
require('dotenv').config();

//cria o objeto com os dados do banco para utilizar no back
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    database: process.env.DB_NAME || "nutri_vida",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "senai"
});

//exporta o objeto
module.exports = pool;
