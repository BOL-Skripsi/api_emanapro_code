-- Table: public.revoked_tokens

-- DROP TABLE IF EXISTS public.revoked_tokens;

CREATE TABLE IF NOT EXISTS public.revoked_tokens
(
    id integer NOT NULL DEFAULT nextval('revoked_tokens_id_seq'::regclass),
    token character varying(255) COLLATE pg_catalog."default" NOT NULL,
    expiration_time timestamp without time zone NOT NULL,
    CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.revoked_tokens
    OWNER to postgres;


    -- Table: public.tbl_user

-- DROP TABLE IF EXISTS public.tbl_user;

CREATE TABLE IF NOT EXISTS public.tbl_user
(
    id integer NOT NULL DEFAULT nextval('tbl_user_id_seq'::regclass),
    uuid uuid DEFAULT uuid_generate_v4(),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    refresh_token character varying(255) COLLATE pg_catalog."default",
    role character varying(255) COLLATE pg_catalog."default",
    reset_password_token character varying(255) COLLATE pg_catalog."default",
    reset_password_token_expires character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT tbl_user_pkey PRIMARY KEY (id),
    CONSTRAINT tbl_user_email_key UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tbl_user
    OWNER to postgres;