CREATE DATABASE project;

CREATE TABLE leilao (
	leilaoid		 BIGINT,
	titulo		 VARCHAR(512) UNIQUE NOT NULL,
	descricao	 VARCHAR(512),
	artigoid		 BIGINT UNIQUE NOT NULL,
	minpreco		 DOUBLE PRECISION NOT NULL,
	datacomeco	 TIMESTAMP NOT NULL,
	cancelar		 BOOL DEFAULT false,
	datafim		 TIMESTAMP NOT NULL,
	utilizador_userid BIGINT NOT NULL,
	PRIMARY KEY(leilaoid)
);

CREATE TABLE utilizador (
	userid	 BIGINT,
	username VARCHAR(512) UNIQUE NOT NULL,
	email	 VARCHAR(512) UNIQUE NOT NULL,
	password VARCHAR(512) NOT NULL,
	admin	 BOOL NOT NULL,
	blocked	 BOOL NOT NULL,
	PRIMARY KEY(userid)
);

CREATE TABLE licitacao (
	datadalicitacao	 TIMESTAMP NOT NULL,
	precodelicitacao	 BIGINT NOT NULL,
	utilizador_userid BIGINT,
	leilao_leilaoid	 BIGINT NOT NULL,
	PRIMARY KEY(utilizador_userid)
);

CREATE TABLE mural (
	texto		 VARCHAR(512),
	datetime		 TIMESTAMP NOT NULL,
	leilao_leilaoid	 BIGINT,
	utilizador_userid BIGINT NOT NULL,
	PRIMARY KEY(leilao_leilaoid)
);

CREATE TABLE mensagem (
	texto		 VARCHAR(512) NOT NULL,
	utilizador_userid BIGINT,
	PRIMARY KEY(utilizador_userid)
);

ALTER TABLE leilao ADD CONSTRAINT leilao_fk1 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE leilao ADD CONSTRAINT constraint_0 CHECK (artigoID> 999999999 and artigoID<10000000000000);
ALTER TABLE licitacao ADD CONSTRAINT licitacao_fk1 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE licitacao ADD CONSTRAINT licitacao_fk2 FOREIGN KEY (leilao_leilaoid) REFERENCES leilao(leilaoid);
ALTER TABLE mural ADD CONSTRAINT mural_fk1 FOREIGN KEY (leilao_leilaoid) REFERENCES leilao(leilaoid);
ALTER TABLE mural ADD CONSTRAINT mural_fk2 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE mensagem ADD CONSTRAINT mensagem_fk1 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);

