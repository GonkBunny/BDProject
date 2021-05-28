
CREATE TABLE leilao (
	leilaoid		 BIGINT,
	artigoid		 BIGINT NOT NULL,
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
	precodelicitacao	 DOUBLE PRECISION NOT NULL,
	utilizador_userid BIGINT,
	leilao_leilaoid	 BIGINT NOT NULL,
	licitacao_id  	BIGINT NOT NULL,
	anulada		BOOL DEFAULT false,
	PRIMARY KEY(licitacao_id)
);

CREATE TABLE mural (
	texto		 VARCHAR(512),
	datetime		 TIMESTAMP NOT NULL,
	leilao_leilaoid	 BIGINT,
	utilizador_userid BIGINT NOT NULL,
	mural_id bigint NOT NULL,
	PRIMARY KEY(mural_id)
);

CREATE TABLE mensagem (
	texto		 VARCHAR(512) NOT NULL,
	utilread		 BOOL NOT NULL,
	notifdate	 TIMESTAMP NOT NULL,
	utilizador_userid BIGINT,
	mensagem_id bigint NOT NULL,
	PRIMARY KEY(mensagem_id)
);

CREATE TABLE descricao_titulo (
	descricao	 VARCHAR(512),
	titulo		 VARCHAR(512),
	datademudanca	 TIMESTAMP,
	leilao_leilaoid BIGINT,
	descricao_titulo_id BIGINT, 
	PRIMARY KEY(descricao_titulo_id)
);

ALTER TABLE leilao ADD CONSTRAINT leilao_fk1 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE leilao ADD CONSTRAINT constraint_0 CHECK (artigoID> 999999999 and artigoID<10000000000000);
ALTER TABLE licitacao ADD CONSTRAINT licitacao_fk1 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE licitacao ADD CONSTRAINT licitacao_fk2 FOREIGN KEY (leilao_leilaoid) REFERENCES leilao(leilaoid);
ALTER TABLE mural ADD CONSTRAINT mural_fk1 FOREIGN KEY (leilao_leilaoid) REFERENCES leilao(leilaoid);
ALTER TABLE mural ADD CONSTRAINT mural_fk2 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE mensagem ADD CONSTRAINT mensagem_fk1 FOREIGN KEY (utilizador_userid) REFERENCES utilizador(userid);
ALTER TABLE descricao_titulo ADD CONSTRAINT descricao_titulo_fk1 FOREIGN KEY (leilao_leilaoid) REFERENCES leilao(leilaoid);

