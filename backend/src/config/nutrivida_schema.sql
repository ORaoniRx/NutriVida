-- =====================================================
-- NutriVida - Estrutura do banco (PostgreSQL 18)
-- Execute no pgAdmin: Query Tool > colar > F5
-- =====================================================

-- (Opcional) limpar para recriar do zero
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS plano_alimentar CASCADE;
DROP TABLE IF EXISTS sessoes CASCADE;
DROP TABLE IF EXISTS alimentos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1) USUARIOS ------------------------------------------
CREATE TABLE usuarios (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome        VARCHAR(40)  NOT NULL UNIQUE,
    senha_hash  TEXT         NOT NULL,              -- hash scrypt
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuarios_nome CHECK (char_length(nome) BETWEEN 3 AND 40)
);

-- 2) ALIMENTOS -----------------------------------------
CREATE TABLE alimentos (
    id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome             VARCHAR(100) NOT NULL,
    emoji            VARCHAR(16)  NOT NULL,
    categoria        VARCHAR(20)  NOT NULL,
    quantidade_ref   INTEGER      NOT NULL DEFAULT 1,
    tempo_preparo    INTEGER      NOT NULL,         -- minutos
    calorias         NUMERIC(8,2) NOT NULL,         -- kcal
    descricao        TEXT         NOT NULL,
    proteinas        NUMERIC(8,2) NOT NULL DEFAULT 0,   -- g
    carboidratos     NUMERIC(8,2) NOT NULL DEFAULT 0,   -- g
    gorduras         NUMERIC(8,2) NOT NULL DEFAULT 0,   -- g
    CONSTRAINT ck_alimentos_categoria
        CHECK (categoria IN ('refeicoes', 'lanches', 'vitaminas')),
    CONSTRAINT ck_alimentos_tempo    CHECK (tempo_preparo >= 0),
    CONSTRAINT ck_alimentos_calorias CHECK (calorias >= 0)
);

CREATE INDEX idx_alimentos_categoria ON alimentos (categoria, id);

-- 3) SESSOES -------------------------------------------
CREATE TABLE sessoes (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token        VARCHAR(128) NOT NULL UNIQUE,
    criado_em    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expira_em    TIMESTAMPTZ,
    encerrada_em TIMESTAMPTZ                          -- preenchido no "Sair"
);

CREATE INDEX idx_sessoes_usuario ON sessoes (usuario_id);

-- 4) PLANO_ALIMENTAR -----------------------------------
-- refeicao: 1 = Café da manhã, 2 = Almoço, 3 = Lanche, 4 = Jantar
CREATE TABLE plano_alimentar (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
    alimento_id  INTEGER     NOT NULL REFERENCES alimentos(id) ON DELETE RESTRICT,
    refeicao     SMALLINT    NOT NULL,
    quantidade   INTEGER     NOT NULL DEFAULT 1,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_plano_refeicao   CHECK (refeicao BETWEEN 1 AND 4),
    CONSTRAINT ck_plano_quantidade CHECK (quantidade BETWEEN 1 AND 20)
);

CREATE INDEX idx_plano_usuario ON plano_alimentar (usuario_id);

-- 5) FAVORITOS -----------------------------------------
CREATE TABLE favoritos (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
    alimento_id  INTEGER     NOT NULL REFERENCES alimentos(id) ON DELETE CASCADE,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_favoritos_usuario_alimento UNIQUE (usuario_id, alimento_id)
);

-- 6) AVALIACOES ----------------------------------------
CREATE TABLE avaliacoes (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
    alimento_id  INTEGER     NOT NULL REFERENCES alimentos(id) ON DELETE CASCADE,
    nota         SMALLINT    NOT NULL,
    comentario   VARCHAR(500) NOT NULL,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5),
    CONSTRAINT ck_avaliacoes_comentario
        CHECK (char_length(btrim(comentario)) BETWEEN 3 AND 500)
);

CREATE INDEX idx_avaliacoes_alimento ON avaliacoes (alimento_id, criado_em DESC);
