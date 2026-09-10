--
-- PostgreSQL database dump
--

\restrict dBcU56D2JKyWJo5db9Xeyoht741dUCjhEvXkh0aNm6E7zPivyugdjmL9ihzgLG0

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: auth_identities_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.auth_identities_provider_enum AS ENUM (
    'password',
    'google',
    'facebook'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    "idAccount" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    name character varying(100) NOT NULL,
    description text,
    "accountType" character varying(50) NOT NULL,
    account_number character varying(50) NOT NULL,
    balance numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    initial_balance numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    last_activity_at timestamp without time zone
);


--
-- Name: auth_identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_identities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    provider public.auth_identities_provider_enum NOT NULL,
    "providerUserId" character varying(255),
    "passwordHash" character varying(255),
    "emailVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    "suggestedBy" uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: client_attentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_attentions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    "idNumber" character varying(50) NOT NULL,
    account_number character varying(50) NOT NULL,
    "jobGroupId" uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: economists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.economists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: job_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "superUserId" uuid NOT NULL,
    "economistId" uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    "idPayment" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "accountId" uuid,
    "subscriptionId" uuid,
    "userId" uuid,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    "paymentMethod" character varying(50) NOT NULL,
    "transactionId" character varying(100),
    transfer_code character varying(50),
    pay_date timestamp without time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    description text,
    metadata json,
    deleted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    "idProduct" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    "priceCup" numeric(10,2),
    "priceUsd" numeric(10,2),
    image character varying(255),
    description text NOT NULL,
    unit character varying(50) NOT NULL,
    stock boolean DEFAULT true NOT NULL,
    "userEnterpriseId" uuid NOT NULL,
    "categoryId" uuid,
    "suggestedCategoryName" character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    "pendingCategoryId" uuid
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    "idRating" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quantity integer NOT NULL,
    "userId" uuid NOT NULL,
    "productId" uuid,
    "serviceId" uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_4922715adc93ee98876530a947" CHECK (((quantity >= 1) AND (quantity <= 5)))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "isRevoked" boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    "idService" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    "priceCup" numeric(10,2),
    "priceUsd" numeric(10,2),
    description text NOT NULL,
    "userEnterpriseId" uuid NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    "idSubscription" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    name character varying(100) NOT NULL,
    cost numeric(10,2) NOT NULL,
    description text,
    status boolean DEFAULT true NOT NULL,
    "quantityAccounts" integer NOT NULL,
    duration_days integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    last_checked_at timestamp without time zone,
    deleted_at timestamp without time zone,
    "userEnterpriseId" uuid,
    "planType" character varying(50) DEFAULT 'buyer'::character varying NOT NULL
);


--
-- Name: super_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.super_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    permissions json DEFAULT '[]'::json NOT NULL,
    "accountId" uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_enterprises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_enterprises (
    "idUserEnterprise" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid,
    "companyName" character varying(200) NOT NULL,
    address jsonb,
    contact jsonb,
    "officeHours" timestamp without time zone,
    code bigint,
    latitude double precision,
    longitude double precision
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(100) NOT NULL,
    permissions json DEFAULT '[]'::json,
    password character varying(255)
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts ("idAccount", "userId", name, description, "accountType", account_number, balance, initial_balance, currency, status, created_at, updated_at, deleted_at, last_activity_at) FROM stdin;
\.


--
-- Data for Name: auth_identities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_identities (id, "userId", provider, "providerUserId", "passwordHash", "emailVerified", "createdAt") FROM stdin;
805c963b-214f-45ec-af6f-3be084e487af	e8785541-db7c-432c-a158-7c0010d09ab2	password	\N	$2b$10$q4snEgJ46c7roWdYUNf2E.NuZdeHj6mLiLWQ37HB0wMChlkbv8Hbe	f	2026-08-31 10:46:33.694326
767b8ac7-c529-41f3-b9e6-b622cd825718	2128ed97-57cd-420c-b651-140a8f702dff	password	\N	$2b$10$On.rS/keB0HgwNcW/Sf.RegEVR3R8A078rXTr6.3SPuaCIqVRZVba	f	2026-08-31 10:57:03.608417
6b68202f-a123-40c0-a156-0cf67439cc0c	4f0de561-7b9c-40ee-aaf1-fbb71875c036	password	\N	$2b$10$NQejuLCvnZbrL8M/VneUDevMo9ozl.1YrBx/AkQUF5s72qXYTzAHS	f	2026-08-31 10:57:03.942576
a1b8e68a-47d1-4776-bbec-10ae0cbebe8c	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	password	\N	$2b$10$oGd45Oo0rItAL3BiDo/ijuGpBWrPi1Bm8/4j4/mu3vqAQSEMKuvye	f	2026-08-31 10:57:04.268724
aca7bea5-8afc-49db-bf06-bca468edd782	2cbb87e2-c7cb-4e7e-8819-4e736d053abf	password	\N	$2b$10$ds8CwNjSzBKRerRtMee4POxxd/KfdnSGn6F/Unpj6GK6ExklhDlsW	f	2026-09-02 12:41:24.440874
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, approved, "suggestedBy", created_at, updated_at) FROM stdin;
07deb6d3-e56d-488d-81e9-cde51163b8d0	Alimentos	t	\N	2026-09-03 13:12:21.757809	2026-09-03 13:12:21.757809
ac4c9c1e-730f-4516-96d6-622cedaaeb0b	Bebidas	t	\N	2026-09-03 13:12:21.763364	2026-09-03 13:12:21.763364
cc3eb95c-16d6-4bfb-8818-6765bc38c4b2	Cuidado personal	t	\N	2026-09-03 13:12:21.764245	2026-09-03 13:12:21.764245
a88df949-7fce-4b0f-8769-a8bfda83b90b	Farmacia	t	\N	2026-09-03 13:12:21.764998	2026-09-03 13:12:21.764998
ae44c9d7-4509-4213-ab63-120695f741dd	Ferretería	t	\N	2026-09-03 13:12:21.765722	2026-09-03 13:12:21.765722
f8ac0e90-f373-4884-980a-13e35df0ea86	Limpieza	t	\N	2026-09-03 13:12:21.766504	2026-09-03 13:12:21.766504
3e8de41e-645f-4e19-a568-91deb8b8beda	Otros	t	\N	2026-09-03 13:12:21.76725	2026-09-03 13:12:21.76725
\.


--
-- Data for Name: client_attentions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_attentions (id, name, "lastName", "idNumber", account_number, "jobGroupId", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: economists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.economists (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_groups (id, name, description, "superUserId", "economistId", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1786830838258	CreateRatingEntity1786830838258
2	1786894405936	AddLocationToUserEnterprise1786894405936
3	1787323818868	CreateSuperUserTable1787323818868
4	1787324454038	CreateJobGroupsTable1787324454038
5	1787324946791	AddEconomistAndRelation1787324946791
6	1787325572330	CreateClientAttentionAndRelation1787325572330
7	1788452540755	AddCategoriesAndUpdateProducts1788452540755
8	1788460532478	CreateRefreshTokensTable1788460532478
9	1788539350237	AddCreatedAtToProduct1788539350237
10	1788618236475	AddSuggestedCategoryNameToProduct1788618236475
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments ("idPayment", "accountId", "subscriptionId", "userId", amount, currency, "paymentMethod", "transactionId", transfer_code, pay_date, status, description, metadata, deleted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products ("idProduct", name, "priceCup", "priceUsd", image, description, unit, stock, "userEnterpriseId", "categoryId", "suggestedCategoryName", created_at, "pendingCategoryId") FROM stdin;
e1383411-4b11-4d4c-98b0-0e47bc756298	preuba	1200.00	\N	/products/image/1788363204792-577275207.png	esto es una prueba 	unidad	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	3e8de41e-645f-4e19-a568-91deb8b8beda	\N	2026-09-04 22:19:24.928216	\N
21cae6b0-32d7-474f-830c-217ff0d9b0a6	Café molido	1200.00	3.00	/products/image/cafe-molido.jpg	Café tostado y molido, paquete de 250 g.	paquete	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
a5049e5e-c5bf-4d58-97e2-1c3f0a7e0f92	Frijoles negros	880.00	2.20	/products/image/frijoles-negros.jpg	Frijoles negros secos, empacados al vacío.	kg	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
0cc62132-eb2a-411e-8177-8e122830bc98	Galletas de sal	380.00	0.95	/products/image/galletas-de-sal.jpg	Paquete de 400 g.	paquete	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
789f8ace-2b19-411c-b515-f5abb5f96216	Huevos	2100.00	5.25	/products/image/huevos.jpg	Cartón de 30 unidades.	cartón	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
0685908c-d692-4894-adbe-69a54c8302ef	Leche en polvo	2720.00	6.80	/products/image/leche-en-polvo.jpg	Leche entera en polvo, lata de 800 g.	lata	f	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
fd185ea5-d833-4224-ba62-a6a62b98a6ad	Pasta larga	460.00	1.15	/products/image/pasta-larga.jpg	Espaguetis de trigo, paquete de 500 g.	paquete	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
86484da1-19a2-4501-b3a7-6e177565de6c	Sal de mesa	140.00	0.35	/products/image/sal-de-mesa.jpg	Sal refinada, bolsa de 1 kg.	bolsa	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
4085064f-2d2d-4228-a76f-dd1aee866fea	Agua mineral	180.00	0.45	/products/image/agua-mineral.jpg	Agua sin gas, botella de 1,5 litros.	botella	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	ac4c9c1e-730f-4516-96d6-622cedaaeb0b	\N	2026-09-04 22:19:24.928216	\N
bd3586cf-3e7c-470d-8803-364e5805cd1e	Jugo de mango	440.00	1.10	/products/image/jugo-de-mango.jpg	Néctar de mango, envase de 1 litro.	envase	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	ac4c9c1e-730f-4516-96d6-622cedaaeb0b	\N	2026-09-04 22:19:24.928216	\N
79dfac9f-9285-4dd3-b8e7-0f9649276b33	Refresco de cola	520.00	1.30	/products/image/refresco-de-cola.jpg	Botella de 1,5 litros.	botella	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	ac4c9c1e-730f-4516-96d6-622cedaaeb0b	\N	2026-09-04 22:19:24.928216	\N
fef02510-8a94-4d83-8449-80e5b7b11f0f	Cepillo de dientes	280.00	0.70	/products/image/cepillo-de-dientes.jpg	Cerdas suaves, unidad.	unidad	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	cc3eb95c-16d6-4bfb-8818-6765bc38c4b2	\N	2026-09-04 22:19:24.928216	\N
0efbb6c8-6c24-4d43-9b19-59c60e96c572	Champú	900.00	2.25	/products/image/champu.jpg	Champú para uso diario, 400 ml.	botella	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	cc3eb95c-16d6-4bfb-8818-6765bc38c4b2	\N	2026-09-04 22:19:24.928216	\N
d6bcf2ce-93dd-4a83-8b17-27daa25c7857	Crema hidratante	1240.00	3.10	/products/image/crema-hidratante.jpg	Crema corporal, envase de 200 ml.	envase	f	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	cc3eb95c-16d6-4bfb-8818-6765bc38c4b2	\N	2026-09-04 22:19:24.928216	\N
0d5390e1-44a9-4bc0-83b3-bb13aef68f1e	Desodorante	780.00	1.95	/products/image/desodorante.jpg	Desodorante en barra, 50 g.	unidad	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	cc3eb95c-16d6-4bfb-8818-6765bc38c4b2	\N	2026-09-04 22:19:24.928216	\N
165fb619-4c49-44e5-957a-ccc9b1050016	Pasta dental	460.00	1.15	/products/image/pasta-dental.jpg	Crema dental con flúor, 100 ml.	tubo	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	cc3eb95c-16d6-4bfb-8818-6765bc38c4b2	\N	2026-09-04 22:19:24.928216	\N
5782e7ec-48ba-4fcc-82bd-26bf44012793	Alcohol al 70%	260.00	0.65	/products/image/alcohol-al-70.jpg	Frasco de 250 ml para antisepsia.	frasco	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	a88df949-7fce-4b0f-8769-a8bfda83b90b	\N	2026-09-04 22:19:24.928216	\N
85e61e08-8f7b-46fa-aec7-bd6c568759e5	Analgésico genérico	300.00	0.75	/products/image/analgesico-generico.jpg	Tabletas de 500 mg, blíster de 10.	blíster	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	a88df949-7fce-4b0f-8769-a8bfda83b90b	\N	2026-09-04 22:19:24.928216	\N
b93221a9-1d44-4783-8e11-e6b255e8e198	Mascarilla quirúrgica	1100.00	2.75	/products/image/mascarilla-quirurgica.jpg	Caja de 50 unidades.	caja	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	a88df949-7fce-4b0f-8769-a8bfda83b90b	\N	2026-09-04 22:19:24.928216	\N
209dae25-938a-4910-83f1-c896d4f5c2ff	Suero oral	500.00	1.25	/products/image/suero-oral.jpg	Sobre para rehidratación, caja de 5.	caja	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	a88df949-7fce-4b0f-8769-a8bfda83b90b	\N	2026-09-04 22:19:24.928216	\N
85dfa0af-b7ac-482d-a445-054cfb5d0790	Termómetro digital	3200.00	8.00	/products/image/termometro-digital.jpg	Medición axilar con pantalla.	unidad	f	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	a88df949-7fce-4b0f-8769-a8bfda83b90b	\N	2026-09-04 22:19:24.928216	\N
c98b5ee9-a4d5-43cb-8e04-544a0290325d	Vendaje elástico	420.00	1.05	/products/image/vendaje-elastico.jpg	Venda de 5 cm por 4 m.	unidad	t	8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	a88df949-7fce-4b0f-8769-a8bfda83b90b	\N	2026-09-04 22:19:24.928216	\N
223178f6-3a5b-4025-8a77-ccea5366a549	Batería AA	560.00	1.40	/products/image/bateria-aa.jpg	Pack de 4 pilas alcalinas.	pack	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	ae44c9d7-4509-4213-ab63-120695f741dd	\N	2026-09-04 22:19:24.928216	\N
f52f451e-f6da-4255-ab86-8ccb657e89b8	Bombillo LED	900.00	2.25	/products/image/bombillo-led.jpg	Bombillo LED de 9 W, luz blanca.	unidad	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	ae44c9d7-4509-4213-ab63-120695f741dd	\N	2026-09-04 22:19:24.928216	\N
4993ebd1-7074-4a25-9eca-9229de1a12a7	Candado mediano	1600.00	4.00	/products/image/candado-mediano.jpg	Candado de acero con dos llaves.	unidad	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	ae44c9d7-4509-4213-ab63-120695f741dd	\N	2026-09-04 22:19:24.928216	\N
be6f0a56-d09f-455c-90f2-ebfdb97114ec	Cinta aislante	260.00	0.65	/products/image/cinta-aislante.jpg	Rollo de cinta aislante negra.	rollo	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	ae44c9d7-4509-4213-ab63-120695f741dd	\N	2026-09-04 22:19:24.928216	\N
d1ce2db7-d2f4-4098-9a36-8f1262c185ae	Juego de destornilladores	2400.00	6.00	/products/image/juego-de-destornilladores.jpg	Seis piezas, punta plana y estrella.	juego	f	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	ae44c9d7-4509-4213-ab63-120695f741dd	\N	2026-09-04 22:19:24.928216	\N
3b102ff8-5104-404a-b455-bc840659ceeb	Cloro	320.00	0.80	/products/image/cloro.jpg	Hipoclorito de sodio, envase de 1 litro.	botella	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	f8ac0e90-f373-4884-980a-13e35df0ea86	\N	2026-09-04 22:19:24.928216	\N
d4759ff1-7b36-434a-9eaf-cbbd433dbc35	Esponja de fregar	200.00	0.50	/products/image/esponja-de-fregar.jpg	Esponja doble cara, pack de 2.	pack	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	f8ac0e90-f373-4884-980a-13e35df0ea86	\N	2026-09-04 22:19:24.928216	\N
fce8d73e-55a3-4927-81aa-4021c07ae232	Fregasuelos	700.00	1.75	/products/image/fregasuelos.jpg	Limpiador de pisos con aroma, 1 litro.	botella	f	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	f8ac0e90-f373-4884-980a-13e35df0ea86	\N	2026-09-04 22:19:24.928216	\N
03f4e4cb-a2f8-47a5-9f27-5e2d2039d0f8	Jabón de baño	480.00	1.20	/products/image/jabon-de-bano.jpg	Pack de 3 jabones de tocador.	pack	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	f8ac0e90-f373-4884-980a-13e35df0ea86	\N	2026-09-04 22:19:24.928216	\N
debd1007-caa9-43c9-831d-dca22ce5a058	Papel sanitario	640.00	1.60	/products/image/papel-sanitario.jpg	Paquete de 4 rollos.	paquete	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	f8ac0e90-f373-4884-980a-13e35df0ea86	\N	2026-09-04 22:19:24.928216	\N
15e18bd8-644b-4069-88be-013b08494b19	Aceite de cocina	1560.00	3.90	/products/image/aceite-de-cocina.jpg	Aceite vegetal, botella de 1 litro.	botella	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
ebd7e7f8-0191-4045-b4ab-7122437d63e6	Arroz blanco	1800.00	\N	/products/image/arroz-blanco.jpg	Arroz de grano largo, saco de 5 kg.	saco	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
df514f7e-e18f-481d-8f6d-23396521f947	Detergente en polvo	1400.00	\N	/products/image/detergente-en-polvo.jpg	Detergente para lavado a mano, 1 kg.	kg	t	e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	f8ac0e90-f373-4884-980a-13e35df0ea86	\N	2026-09-04 22:19:24.928216	\N
386f04ae-bc75-48f6-b96b-df6e36eeb3e5	Azúcar refino	720.00	1.80	/products/image/azucar-refino.jpg	Azúcar blanca refinada, bolsa de 2 kg.	bolsa	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
23c1f38a-ddde-4856-8ac4-b26f3bf97170	Calabaza	260.00	0.65	/products/image/calabaza.jpg	Calabaza entera de temporada.	unidad	f	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
fd0e008a-5591-4869-81eb-4144c01f9928	Cebolla blanca	380.00	0.95	/products/image/cebolla-blanca.jpg	Cebolla blanca de cultivo local.	libra	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
278451a2-9d4d-48e0-93c7-97b40774ecca	Plátano burro	300.00	0.75	/products/image/platano-burro.jpg	Plátano para vianda, racimo pequeño.	racimo	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
e5d51270-ac91-4e33-b54d-be8ba5c98af2	Tomate natural	240.00	0.60	/products/image/tomate-natural.jpg	Tomate de temporada, por libra.	libra	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
17725a59-a635-4b22-8bfd-d9a537eee6a2	Boniato	180.00	\N	/products/image/boniato.jpg	Boniato fresco, por libra.	libra	t	65c4c163-9bbd-4412-8c22-4f68dea4b2fd	07deb6d3-e56d-488d-81e9-cde51163b8d0	\N	2026-09-04 22:19:24.928216	\N
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ratings ("idRating", quantity, "userId", "productId", "serviceId", created_at) FROM stdin;
29b1f7d7-6f41-4b61-b9a0-5db7dbf7f466	3	e8785541-db7c-432c-a158-7c0010d09ab2	86484da1-19a2-4501-b3a7-6e177565de6c	\N	2026-08-31 11:03:10.042447
637631bb-d770-412c-8ea0-4b4f42b752f0	4	2128ed97-57cd-420c-b651-140a8f702dff	86484da1-19a2-4501-b3a7-6e177565de6c	\N	2026-08-31 11:03:10.061876
11abee1a-0002-49ed-a93a-416d5cf427de	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	86484da1-19a2-4501-b3a7-6e177565de6c	\N	2026-08-31 11:03:10.075951
ac380185-d440-4bc6-9dc4-a1c019b489fc	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	86484da1-19a2-4501-b3a7-6e177565de6c	\N	2026-08-31 11:03:10.09116
3317d11a-03fd-4091-b09c-222b5f70c182	4	e8785541-db7c-432c-a158-7c0010d09ab2	17725a59-a635-4b22-8bfd-d9a537eee6a2	\N	2026-08-31 11:03:10.106928
639c773e-f432-43da-ace7-b2293de9e16a	5	2128ed97-57cd-420c-b651-140a8f702dff	17725a59-a635-4b22-8bfd-d9a537eee6a2	\N	2026-08-31 11:03:10.122501
f17d5ff5-aa27-4e71-81e0-d544057ff944	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	17725a59-a635-4b22-8bfd-d9a537eee6a2	\N	2026-08-31 11:03:10.137562
4b2fe5ca-025a-46a7-a071-18bc09cc17d0	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	17725a59-a635-4b22-8bfd-d9a537eee6a2	\N	2026-08-31 11:03:10.154008
ca7ce8b2-7664-435f-94fc-8113f8023ccb	5	e8785541-db7c-432c-a158-7c0010d09ab2	4085064f-2d2d-4228-a76f-dd1aee866fea	\N	2026-08-31 11:03:10.16909
c637bc89-99b9-4d94-9b49-e482b42a5a18	3	2128ed97-57cd-420c-b651-140a8f702dff	4085064f-2d2d-4228-a76f-dd1aee866fea	\N	2026-08-31 11:03:10.184745
a961668c-47e2-45ed-813c-6874abe988f1	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	4085064f-2d2d-4228-a76f-dd1aee866fea	\N	2026-08-31 11:03:10.200973
2b80f5d6-d413-479a-af0f-119363d5f864	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	4085064f-2d2d-4228-a76f-dd1aee866fea	\N	2026-08-31 11:03:10.207559
f2aa933d-e753-4e44-af22-f15543362c66	3	e8785541-db7c-432c-a158-7c0010d09ab2	d4759ff1-7b36-434a-9eaf-cbbd433dbc35	\N	2026-08-31 11:03:10.217578
35602c70-6518-4b39-a5a5-d1bd56c70ecc	4	2128ed97-57cd-420c-b651-140a8f702dff	d4759ff1-7b36-434a-9eaf-cbbd433dbc35	\N	2026-08-31 11:03:10.232508
98da1dea-c7ae-4f8b-9bec-80bc6858170e	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	d4759ff1-7b36-434a-9eaf-cbbd433dbc35	\N	2026-08-31 11:03:10.247172
4492a56b-db12-4574-a45a-d7331b6af8d1	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	d4759ff1-7b36-434a-9eaf-cbbd433dbc35	\N	2026-08-31 11:03:10.262342
91ed24eb-1d32-48a1-bb20-6e8a2177d20b	4	e8785541-db7c-432c-a158-7c0010d09ab2	e5d51270-ac91-4e33-b54d-be8ba5c98af2	\N	2026-08-31 11:03:10.277723
a7b1002d-192f-446d-96d9-309b52ea1e62	5	2128ed97-57cd-420c-b651-140a8f702dff	e5d51270-ac91-4e33-b54d-be8ba5c98af2	\N	2026-08-31 11:03:10.293902
ccd7eaa0-f4fa-420f-88df-8d5df57fe57f	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	e5d51270-ac91-4e33-b54d-be8ba5c98af2	\N	2026-08-31 11:03:10.309994
e3ae4ada-dc2a-4c43-965c-150057e68d70	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	e5d51270-ac91-4e33-b54d-be8ba5c98af2	\N	2026-08-31 11:03:10.326157
e9a37d4b-a36b-4729-9929-b8bb6eefd87a	5	e8785541-db7c-432c-a158-7c0010d09ab2	be6f0a56-d09f-455c-90f2-ebfdb97114ec	\N	2026-08-31 11:03:10.340947
6e5cdbc4-5f20-4c6a-827e-f1fb7a66fe1a	3	2128ed97-57cd-420c-b651-140a8f702dff	be6f0a56-d09f-455c-90f2-ebfdb97114ec	\N	2026-08-31 11:03:10.35576
f0558dc8-ca1a-492f-a368-3e9882f67f72	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	be6f0a56-d09f-455c-90f2-ebfdb97114ec	\N	2026-08-31 11:03:10.371124
898a99d1-bfd6-4171-bec7-fc7b900d1c25	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	be6f0a56-d09f-455c-90f2-ebfdb97114ec	\N	2026-08-31 11:03:10.38779
224cf1f4-28f9-42b0-9c92-256cd2af5ea5	3	e8785541-db7c-432c-a158-7c0010d09ab2	23c1f38a-ddde-4856-8ac4-b26f3bf97170	\N	2026-08-31 11:03:10.403407
ed37cfc3-b907-4a0a-977e-75fa984b8984	4	2128ed97-57cd-420c-b651-140a8f702dff	23c1f38a-ddde-4856-8ac4-b26f3bf97170	\N	2026-08-31 11:03:10.417958
16e86b51-b0d6-4003-86cf-4d055b5c0862	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	23c1f38a-ddde-4856-8ac4-b26f3bf97170	\N	2026-08-31 11:03:10.433251
7bf4da1d-e8db-4458-9007-8c0c48bc1fb7	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	23c1f38a-ddde-4856-8ac4-b26f3bf97170	\N	2026-08-31 11:03:10.448899
2d8074bf-6750-4444-8e65-f0d8277fcb5e	4	e8785541-db7c-432c-a158-7c0010d09ab2	5782e7ec-48ba-4fcc-82bd-26bf44012793	\N	2026-08-31 11:03:10.463938
7ae78e84-1569-4c6d-8bef-152d1cb4c3d2	5	2128ed97-57cd-420c-b651-140a8f702dff	5782e7ec-48ba-4fcc-82bd-26bf44012793	\N	2026-08-31 11:03:10.479197
7c414a9f-b9d4-43e1-adb4-35251f53ba5c	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	5782e7ec-48ba-4fcc-82bd-26bf44012793	\N	2026-08-31 11:03:10.496937
2830e69c-8d87-4ca8-92db-e8ba3563b2ea	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	5782e7ec-48ba-4fcc-82bd-26bf44012793	\N	2026-08-31 11:03:10.510547
7eb7c5b8-5d60-4b80-96a1-8110d23fc353	5	e8785541-db7c-432c-a158-7c0010d09ab2	fef02510-8a94-4d83-8449-80e5b7b11f0f	\N	2026-08-31 11:03:10.526721
d21de4ad-f199-4547-b7b6-99726dd1a288	3	2128ed97-57cd-420c-b651-140a8f702dff	fef02510-8a94-4d83-8449-80e5b7b11f0f	\N	2026-08-31 11:03:10.534375
22131618-2156-4d8e-9118-479dac53d540	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	fef02510-8a94-4d83-8449-80e5b7b11f0f	\N	2026-08-31 11:03:10.543073
b42930ab-c597-4918-b064-6375cc0d2d67	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	fef02510-8a94-4d83-8449-80e5b7b11f0f	\N	2026-08-31 11:03:10.558031
bfdecf22-0b03-4f77-b50b-59203b84eedb	3	e8785541-db7c-432c-a158-7c0010d09ab2	278451a2-9d4d-48e0-93c7-97b40774ecca	\N	2026-08-31 11:03:10.57398
64c93214-a916-4545-b68a-b04e10c183b6	4	2128ed97-57cd-420c-b651-140a8f702dff	278451a2-9d4d-48e0-93c7-97b40774ecca	\N	2026-08-31 11:03:10.589941
768e742d-661b-4fca-bff0-cd47da3c2a48	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	278451a2-9d4d-48e0-93c7-97b40774ecca	\N	2026-08-31 11:03:10.605749
5cfcb866-63f6-4d09-9cd5-e1263c8a8896	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	278451a2-9d4d-48e0-93c7-97b40774ecca	\N	2026-08-31 11:03:10.621015
dcda1b8b-2af9-42c6-acb1-66bd48117724	4	e8785541-db7c-432c-a158-7c0010d09ab2	85e61e08-8f7b-46fa-aec7-bd6c568759e5	\N	2026-08-31 11:03:10.636973
2c21e5a7-6951-42e9-852d-d304796cc20f	5	2128ed97-57cd-420c-b651-140a8f702dff	85e61e08-8f7b-46fa-aec7-bd6c568759e5	\N	2026-08-31 11:03:10.652731
f8c85b08-8351-423a-a02e-4351450b1f6c	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	85e61e08-8f7b-46fa-aec7-bd6c568759e5	\N	2026-08-31 11:03:10.6679
1ec21fa8-6b2b-4708-a7d8-c2c37a99cf23	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	85e61e08-8f7b-46fa-aec7-bd6c568759e5	\N	2026-08-31 11:03:10.684379
88e300cf-f80c-4668-9d0f-5fe83ea01203	5	e8785541-db7c-432c-a158-7c0010d09ab2	3b102ff8-5104-404a-b455-bc840659ceeb	\N	2026-08-31 11:03:10.699836
6f486be6-58fe-4ff8-8468-8f50c2b30af3	3	2128ed97-57cd-420c-b651-140a8f702dff	3b102ff8-5104-404a-b455-bc840659ceeb	\N	2026-08-31 11:03:10.715822
7ddd7a10-33f4-4088-9efb-fa5149f9b5c1	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	3b102ff8-5104-404a-b455-bc840659ceeb	\N	2026-08-31 11:03:10.730466
b96bcc1e-d57c-4bca-aea0-6df4dc04f995	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	3b102ff8-5104-404a-b455-bc840659ceeb	\N	2026-08-31 11:03:10.74577
f7ca43d6-4a51-4660-ab0f-c06f9179f8ec	3	e8785541-db7c-432c-a158-7c0010d09ab2	0cc62132-eb2a-411e-8177-8e122830bc98	\N	2026-08-31 11:03:10.761125
d81d077a-a42f-4d4d-bced-d125723f3769	4	2128ed97-57cd-420c-b651-140a8f702dff	0cc62132-eb2a-411e-8177-8e122830bc98	\N	2026-08-31 11:03:10.775892
cb762f2f-a3c2-4a35-b7cf-4415071cde75	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	0cc62132-eb2a-411e-8177-8e122830bc98	\N	2026-08-31 11:03:10.791469
b47011c9-54c2-46d6-8897-140da5ddee27	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	0cc62132-eb2a-411e-8177-8e122830bc98	\N	2026-08-31 11:03:10.806707
554b9f89-5852-4b4c-942f-7c0de737c031	4	e8785541-db7c-432c-a158-7c0010d09ab2	fd0e008a-5591-4869-81eb-4144c01f9928	\N	2026-08-31 11:03:10.82239
c6f45608-a529-4bc9-9bb9-b541fa697566	5	2128ed97-57cd-420c-b651-140a8f702dff	fd0e008a-5591-4869-81eb-4144c01f9928	\N	2026-08-31 11:03:10.837924
ba01d3b6-7501-4b3b-8448-2bf93b6563e6	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	fd0e008a-5591-4869-81eb-4144c01f9928	\N	2026-08-31 11:03:10.8443
993627c8-c42c-411c-89ce-d9ada55cdd83	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	fd0e008a-5591-4869-81eb-4144c01f9928	\N	2026-08-31 11:03:10.853536
69f3be7d-7e92-4716-b132-73000de73347	5	e8785541-db7c-432c-a158-7c0010d09ab2	c98b5ee9-a4d5-43cb-8e04-544a0290325d	\N	2026-08-31 11:03:10.868509
81e2a271-688b-4a4f-aa52-891fdf500957	3	2128ed97-57cd-420c-b651-140a8f702dff	c98b5ee9-a4d5-43cb-8e04-544a0290325d	\N	2026-08-31 11:03:10.883731
e737721b-6a8b-4586-96ff-31b828060169	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	c98b5ee9-a4d5-43cb-8e04-544a0290325d	\N	2026-08-31 11:03:10.899929
97020921-c36a-4999-a2d1-ab267e8efbdc	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	c98b5ee9-a4d5-43cb-8e04-544a0290325d	\N	2026-08-31 11:03:10.915986
8da13fe6-f4af-43e8-9418-ba39cf61b978	3	e8785541-db7c-432c-a158-7c0010d09ab2	bd3586cf-3e7c-470d-8803-364e5805cd1e	\N	2026-08-31 11:03:10.931013
01dbf04c-2e97-4200-8102-05e03a93e318	4	2128ed97-57cd-420c-b651-140a8f702dff	bd3586cf-3e7c-470d-8803-364e5805cd1e	\N	2026-08-31 11:03:10.947249
f52b703c-5681-4ff8-9dde-fc0f192e49dd	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	bd3586cf-3e7c-470d-8803-364e5805cd1e	\N	2026-08-31 11:03:10.962416
cb232df9-0ee6-4cdf-8a47-7e3131864815	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	bd3586cf-3e7c-470d-8803-364e5805cd1e	\N	2026-08-31 11:03:10.978262
93e0fd6f-0922-41b4-bd9d-56603ecb0e19	4	e8785541-db7c-432c-a158-7c0010d09ab2	fd185ea5-d833-4224-ba62-a6a62b98a6ad	\N	2026-08-31 11:03:10.993848
3d2a2fc5-8702-4c0e-aad7-e8ed50eb50c6	5	2128ed97-57cd-420c-b651-140a8f702dff	fd185ea5-d833-4224-ba62-a6a62b98a6ad	\N	2026-08-31 11:03:11.010344
eabc6845-82c8-4584-b198-0aac6d285c49	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	fd185ea5-d833-4224-ba62-a6a62b98a6ad	\N	2026-08-31 11:03:11.025042
bfd335c6-7ab2-43a8-ba1e-9f23e0856a5c	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	fd185ea5-d833-4224-ba62-a6a62b98a6ad	\N	2026-08-31 11:03:11.041215
55eab932-bad6-4386-a8fc-13f49b71578d	5	e8785541-db7c-432c-a158-7c0010d09ab2	165fb619-4c49-44e5-957a-ccc9b1050016	\N	2026-08-31 11:03:11.057467
408bb29e-6771-4567-9db9-7026f6c42283	3	2128ed97-57cd-420c-b651-140a8f702dff	165fb619-4c49-44e5-957a-ccc9b1050016	\N	2026-08-31 11:03:11.073391
42fb44d9-949c-427a-80dc-dd24babef771	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	165fb619-4c49-44e5-957a-ccc9b1050016	\N	2026-08-31 11:03:11.089488
8cc4d365-875b-4f52-b6a2-c1fc27f140a0	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	165fb619-4c49-44e5-957a-ccc9b1050016	\N	2026-08-31 11:03:11.105142
3ee9dbcd-5d92-4415-9e5c-0d47fdc34ab8	3	e8785541-db7c-432c-a158-7c0010d09ab2	03f4e4cb-a2f8-47a5-9f27-5e2d2039d0f8	\N	2026-08-31 11:03:11.119928
47bab530-f4e4-495e-83a0-797d5e6a8e81	4	2128ed97-57cd-420c-b651-140a8f702dff	03f4e4cb-a2f8-47a5-9f27-5e2d2039d0f8	\N	2026-08-31 11:03:11.135409
591481d3-7c4e-4385-be0e-146ed220e755	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	03f4e4cb-a2f8-47a5-9f27-5e2d2039d0f8	\N	2026-08-31 11:03:11.151421
2ab25051-53c0-4a0b-a61e-eaec61322c07	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	03f4e4cb-a2f8-47a5-9f27-5e2d2039d0f8	\N	2026-08-31 11:03:11.167772
50e876c5-0aaf-4d44-bb07-2747904f8f9e	4	e8785541-db7c-432c-a158-7c0010d09ab2	209dae25-938a-4910-83f1-c896d4f5c2ff	\N	2026-08-31 11:03:11.182259
0e2b8a8e-4a71-4820-99d3-f643e798b442	5	2128ed97-57cd-420c-b651-140a8f702dff	209dae25-938a-4910-83f1-c896d4f5c2ff	\N	2026-08-31 11:03:11.198091
dd34cdde-f150-4c7e-82bc-bfd761bf48f0	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	209dae25-938a-4910-83f1-c896d4f5c2ff	\N	2026-08-31 11:03:11.213137
e6a6e020-d0af-4de6-a774-12b369a53490	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	209dae25-938a-4910-83f1-c896d4f5c2ff	\N	2026-08-31 11:03:11.229132
e6378ada-9771-4c91-98e2-49f5648dc6df	5	e8785541-db7c-432c-a158-7c0010d09ab2	79dfac9f-9285-4dd3-b8e7-0f9649276b33	\N	2026-08-31 11:03:11.245411
bb3efc85-e6a2-4aa9-b2d4-c64b128a1ef2	3	2128ed97-57cd-420c-b651-140a8f702dff	79dfac9f-9285-4dd3-b8e7-0f9649276b33	\N	2026-08-31 11:03:11.260299
a40f8eb4-236c-4881-a82e-84a01dac9813	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	79dfac9f-9285-4dd3-b8e7-0f9649276b33	\N	2026-08-31 11:03:11.276382
dec528e5-554c-42f2-a65a-81cdfee631cf	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	79dfac9f-9285-4dd3-b8e7-0f9649276b33	\N	2026-08-31 11:03:11.293268
14c19ec3-ec4e-4741-a037-d9b35da20faf	3	e8785541-db7c-432c-a158-7c0010d09ab2	223178f6-3a5b-4025-8a77-ccea5366a549	\N	2026-08-31 11:03:11.307625
ee817f94-beb1-4838-929d-1433b0fd835c	4	2128ed97-57cd-420c-b651-140a8f702dff	223178f6-3a5b-4025-8a77-ccea5366a549	\N	2026-08-31 11:03:11.322783
3909ef72-04a0-48c6-abc6-e517a8d6cefa	5	4f0de561-7b9c-40ee-aaf1-fbb71875c036	223178f6-3a5b-4025-8a77-ccea5366a549	\N	2026-08-31 11:03:11.33915
e558cd22-5bf5-46ae-b56d-b2b97debe7a0	3	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	223178f6-3a5b-4025-8a77-ccea5366a549	\N	2026-08-31 11:03:11.354736
939d92e1-453e-405a-89e2-4f19a472ac92	4	e8785541-db7c-432c-a158-7c0010d09ab2	debd1007-caa9-43c9-831d-dca22ce5a058	\N	2026-08-31 11:03:11.369807
c5d442e8-6e0f-428c-a749-2098a3b39559	5	2128ed97-57cd-420c-b651-140a8f702dff	debd1007-caa9-43c9-831d-dca22ce5a058	\N	2026-08-31 11:03:11.384976
59908aee-54a2-4cd5-a60e-33b67583b2c0	3	4f0de561-7b9c-40ee-aaf1-fbb71875c036	debd1007-caa9-43c9-831d-dca22ce5a058	\N	2026-08-31 11:03:11.400002
3957fa18-f417-40ae-91dd-e8d1ab0ea4a8	4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	debd1007-caa9-43c9-831d-dca22ce5a058	\N	2026-08-31 11:03:11.415809
de45ca92-ae74-4416-b31c-85cd9366d9f3	5	e8785541-db7c-432c-a158-7c0010d09ab2	fce8d73e-55a3-4927-81aa-4021c07ae232	\N	2026-08-31 11:03:11.431066
7b1c78b3-9eeb-43b6-a3ed-e1b81775ae18	3	2128ed97-57cd-420c-b651-140a8f702dff	fce8d73e-55a3-4927-81aa-4021c07ae232	\N	2026-08-31 11:03:11.446686
3820eed3-741d-43bf-97eb-8c83358d8972	4	4f0de561-7b9c-40ee-aaf1-fbb71875c036	fce8d73e-55a3-4927-81aa-4021c07ae232	\N	2026-08-31 11:03:11.462916
77d7bd0f-0322-4849-9703-bb2119a9ff79	5	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	fce8d73e-55a3-4927-81aa-4021c07ae232	\N	2026-08-31 11:03:11.477657
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, token, "expiresAt", "isRevoked", created_at, "userId") FROM stdin;
f7710c28-4f4f-43cf-aa9c-927cf2d22de0	040c814f-f30d-43ac-9aec-47da63fd2575	2026-09-11 10:30:32.35	t	2026-09-04 10:30:32.353556	e8785541-db7c-432c-a158-7c0010d09ab2
97d5e6e0-a913-4452-8242-2cd2628d9811	16390661-b8a0-4e9d-a071-c1b9cc9ac714	2026-09-11 10:39:52.142	t	2026-09-04 10:39:52.143182	e8785541-db7c-432c-a158-7c0010d09ab2
07286d3d-eae5-482c-9dff-dc3e2a22fc77	feeee44a-6faf-4bcf-b711-3cb1eca49f66	2026-09-12 10:45:32.852	f	2026-09-05 10:45:32.853025	4f0de561-7b9c-40ee-aaf1-fbb71875c036
41f7eab0-7fcc-4e42-98fa-7e7a6a4d5f45	556a2e46-9f3b-46d7-94f0-2ac241d5cace	2026-09-12 10:47:32.062	f	2026-09-05 10:47:32.063301	4f0de561-7b9c-40ee-aaf1-fbb71875c036
91a42bd2-9616-4d72-89e0-6acdab364c35	a90839dc-9b0a-4eb2-893d-74f7d0b8453d	2026-09-12 10:47:56.823	f	2026-09-05 10:47:56.824853	4f0de561-7b9c-40ee-aaf1-fbb71875c036
de5f2ec7-36af-4176-8631-142c7f0bcf8b	150f178d-c2af-41aa-a770-d674eb8214de	2026-09-11 10:40:56.168	t	2026-09-04 10:40:56.170016	e8785541-db7c-432c-a158-7c0010d09ab2
56ad322e-1348-484b-a92f-ab74b1592a90	505015f4-504d-4f48-8ab0-c0dcb5d8a8ae	2026-09-11 10:43:17.705	t	2026-09-04 10:43:17.706341	e8785541-db7c-432c-a158-7c0010d09ab2
d25079d6-e1fe-440f-add6-a5f5cca644e1	47a3a0e6-abf5-426f-85bd-00d02f0a525b	2026-09-11 22:20:34.837	t	2026-09-04 22:20:34.841105	e8785541-db7c-432c-a158-7c0010d09ab2
15645504-1afe-4d40-a8b7-f52ba6a7853c	bd5dcc8c-36fd-4096-92f8-6d5e51962c5a	2026-09-12 10:44:24.852	t	2026-09-05 10:44:24.85551	e8785541-db7c-432c-a158-7c0010d09ab2
f6bf1a91-0483-4e78-a19d-45198d4f84ae	413bb401-f2cf-4f30-b892-37862169d11e	2026-09-12 11:25:17.729	t	2026-09-05 11:25:17.730305	e8785541-db7c-432c-a158-7c0010d09ab2
98a0d38c-ec52-40b5-a259-8be24c48881a	a8cc7470-8626-467b-ab3a-b232e673c83f	2026-09-12 22:12:28.205	f	2026-09-05 22:12:28.208095	e8785541-db7c-432c-a158-7c0010d09ab2
9b4de04f-47d4-4e7c-814f-000b2a2a4c5d	876597af-0b1f-4949-bdc1-a83e53d6ee00	2026-09-14 10:19:10.165	f	2026-09-07 10:19:10.168115	e8785541-db7c-432c-a158-7c0010d09ab2
3fa6831a-f3d4-43ca-9fac-c5c0ad194f33	24652552-9cc1-490e-aac2-00e62054d5f4	2026-09-14 10:19:27.7	f	2026-09-07 10:19:27.70198	e8785541-db7c-432c-a158-7c0010d09ab2
1cfeeb4d-b70a-4319-9ed6-ae559c3e451a	7ef23fd1-c8f4-4bec-8cdd-c3f5294c8afe	2026-09-14 11:29:10.434	f	2026-09-07 11:29:10.43523	e8785541-db7c-432c-a158-7c0010d09ab2
54d143e1-512f-4e84-857f-1b4ec3fc2f7b	40bcc6fb-d531-4461-8c31-113c33ba4bb6	2026-09-14 11:30:12.953	f	2026-09-07 11:30:12.954323	e8785541-db7c-432c-a158-7c0010d09ab2
8bd6e42c-e577-4748-8797-a97d2632ca1e	7ea95b73-225b-496a-9451-5e988f04965f	2026-09-14 11:57:52.292	f	2026-09-07 11:57:52.293514	e8785541-db7c-432c-a158-7c0010d09ab2
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services ("idService", name, "priceCup", "priceUsd", description, "userEnterpriseId") FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions ("idSubscription", "userId", name, cost, description, status, "quantityAccounts", duration_days, created_at, expires_at, last_checked_at, deleted_at, "userEnterpriseId", "planType") FROM stdin;
4f99ba94-333a-44f4-a7ad-2e8ce67c24ba	2128ed97-57cd-420c-b651-140a8f702dff	Plan Vendedor	27.00	Trimestral (sembrado local)	t	1	90	2026-09-01 11:39:46.470113	2026-11-20 11:39:46.470113	\N	\N	\N	buyer
0903a49b-0d53-402b-9065-36e05536475b	4f0de561-7b9c-40ee-aaf1-fbb71875c036	Plan Vendedor	27.00	Trimestral (sembrado local)	t	1	90	2026-09-01 11:39:46.470113	2026-11-20 11:39:46.470113	\N	\N	\N	buyer
ac6a86a6-1fba-4832-aff0-c05be5b0a7b4	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	Plan Vendedor	27.00	Trimestral (sembrado local)	t	1	90	2026-09-01 11:39:46.470113	2026-11-20 11:39:46.470113	\N	\N	\N	buyer
5c2bf0f9-299b-48b3-82c9-3e7c5e5e2a3b	e8785541-db7c-432c-a158-7c0010d09ab2	Prueba gratuita	0.00	Prueba de 7 dias	t	1	7	2026-09-01 11:39:46.480128	2026-09-08 11:39:46.480128	\N	\N	\N	buyer
76d5f65d-19b1-432a-8949-c606c6a1b5ce	2cbb87e2-c7cb-4e7e-8819-4e736d053abf	Prueba gratuita	0.00	Prueba de 7 días	t	1	7	2026-09-02 12:41:24.53732	2026-09-09 12:41:24.536	2026-09-02 12:41:24.536	\N	\N	buyer
\.


--
-- Data for Name: super_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.super_users (id, name, permissions, "accountId", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_enterprises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_enterprises ("idUserEnterprise", "userId", "companyName", address, contact, "officeHours", code, latitude, longitude) FROM stdin;
65c4c163-9bbd-4412-8c22-4f68dea4b2fd	2128ed97-57cd-420c-b651-140a8f702dff	Mercado Central	{"city": "La Habana", "state": "La Habana", "street": "Calle 23 e/ N y O", "country": "Cuba", "zipCode": "10400"}	{"email": "contacto@mercadocentral.cu", "phone": "+53 7 831 0001"}	\N	\N	23.14	-82.386
e4411dd9-aa1a-447f-8f6a-899ff1bce0c6	4f0de561-7b9c-40ee-aaf1-fbb71875c036	Bodega El Vedado	{"city": "La Habana", "state": "La Habana", "street": "Calle Línea e/ 8 y 10", "country": "Cuba", "zipCode": "10400"}	{"email": "ventas@bodegavedado.cu", "phone": "+53 7 832 4417"}	\N	\N	23.1435	-82.3925
8d5ff821-7bdd-4fe4-ab15-428af4bee3d0	8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	Farmacia 23 y 12	{"city": "La Habana", "state": "La Habana", "street": "Calle 23 esq. 12", "country": "Cuba", "zipCode": "10400"}	{"email": "turno@farmacia2312.cu", "phone": "+53 7 833 9080"}	\N	\N	23.1385	-82.399
e34b6d74-ccff-4524-8b2d-950cc4d93959	2cbb87e2-c7cb-4e7e-8819-4e736d053abf	xd	{"city": "xd", "state": "xd", "street": "xd", "country": "Cuba", "zipCode": "12312312"}	{"email": "ssdsa@gmail.com", "phone": "58468600"}	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, permissions, password) FROM stdin;
2128ed97-57cd-420c-b651-140a8f702dff	mercado_central	["user:create", "user:update_password", "user:delete", "user:view", "product:create", "product:update", "product:delete", "product:view", "service:create", "service:update", "service:delete", "service:view", "rating:create", "rating:view", "rating:update", "rating:delete", "category:view"]	\N
4f0de561-7b9c-40ee-aaf1-fbb71875c036	bodega_vedado	["user:create", "user:update_password", "user:delete", "user:view", "product:create", "product:update", "product:delete", "product:view", "service:create", "service:update", "service:delete", "service:view", "rating:create", "rating:view", "rating:update", "rating:delete", "category:view"]	\N
8e79b871-0a9f-4f95-9319-d3d9b7a5b8a3	farmacia_23	["user:create", "user:update_password", "user:delete", "user:view", "product:create", "product:update", "product:delete", "product:view", "service:create", "service:update", "service:delete", "service:view", "rating:create", "rating:view", "rating:update", "rating:delete", "category:view"]	\N
2cbb87e2-c7cb-4e7e-8819-4e736d053abf	user	["user:create", "user:update_password", "user:delete", "user:view", "product:view", "service:view", "category:view"]	\N
e8785541-db7c-432c-a158-7c0010d09ab2	joel_pruebas	["user:create", "user:update_password", "user:delete", "user:view", "product:create", "product:update", "product:delete", "product:view", "service:create", "service:update", "service:delete", "service:view", "rating:create", "rating:view", "rating:update", "rating:delete", "super_user:view", "category:view", "category:approve", "category:update", "category:create", "category:delete"]	\N
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 10, true);


--
-- Name: payments PK_04a756f10fa4e39fc39c2fd5d80; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_04a756f10fa4e39fc39c2fd5d80" PRIMARY KEY ("idPayment");


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: accounts PK_3904a44eb589719e28107aaffc5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "PK_3904a44eb589719e28107aaffc5" PRIMARY KEY ("idAccount");


--
-- Name: ratings PK_6204ddd6b2fda059290f85a868c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "PK_6204ddd6b2fda059290f85a868c" PRIMARY KEY ("idRating");


--
-- Name: auth_identities PK_63a29aebcddd09448dbeee4666b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_identities
    ADD CONSTRAINT "PK_63a29aebcddd09448dbeee4666b" PRIMARY KEY (id);


--
-- Name: services PK_680a39e0f4f7df3b329ac06d0ee; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "PK_680a39e0f4f7df3b329ac06d0ee" PRIMARY KEY ("idService");


--
-- Name: job_groups PK_73bababbb57e75b8460c4b17a21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_groups
    ADD CONSTRAINT "PK_73bababbb57e75b8460c4b17a21" PRIMARY KEY (id);


--
-- Name: refresh_tokens PK_7d8bee0204106019488c4c50ffa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id);


--
-- Name: products PK_806d889fe45683f13794b83f3ce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_806d889fe45683f13794b83f3ce" PRIMARY KEY ("idProduct");


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: user_enterprises PK_97ff5760c4acf0563746c99c482; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_enterprises
    ADD CONSTRAINT "PK_97ff5760c4acf0563746c99c482" PRIMARY KEY ("idUserEnterprise");


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: client_attentions PK_abca06b888f9c6e514ab351a962; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attentions
    ADD CONSTRAINT "PK_abca06b888f9c6e514ab351a962" PRIMARY KEY (id);


--
-- Name: super_users PK_b07ef8895a01e1a2b2ab4d9c185; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_users
    ADD CONSTRAINT "PK_b07ef8895a01e1a2b2ab4d9c185" PRIMARY KEY (id);


--
-- Name: economists PK_efb651ff7b37446c369bf1e64c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economists
    ADD CONSTRAINT "PK_efb651ff7b37446c369bf1e64c3" PRIMARY KEY (id);


--
-- Name: subscriptions PK_f20d392cf4acabf21c2796b4a0a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "PK_f20d392cf4acabf21c2796b4a0a" PRIMARY KEY ("idSubscription");


--
-- Name: client_attentions REL_2f21210a5fe18fea147c0b5c63; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attentions
    ADD CONSTRAINT "REL_2f21210a5fe18fea147c0b5c63" UNIQUE ("jobGroupId");


--
-- Name: accounts REL_3aa23c0a6d107393e8b40e3e2a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "REL_3aa23c0a6d107393e8b40e3e2a" UNIQUE ("userId");


--
-- Name: user_enterprises REL_91e90d200b1f8a7ef4f2ecac75; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_enterprises
    ADD CONSTRAINT "REL_91e90d200b1f8a7ef4f2ecac75" UNIQUE ("userId");


--
-- Name: super_users REL_d5511ca19881d2dc441f55cc6d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_users
    ADD CONSTRAINT "REL_d5511ca19881d2dc441f55cc6d" UNIQUE ("accountId");


--
-- Name: client_attentions UQ_465f15bd77145e1b3f2e773752b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attentions
    ADD CONSTRAINT "UQ_465f15bd77145e1b3f2e773752b" UNIQUE ("idNumber");


--
-- Name: categories UQ_8b0be371d28245da6e4f4b61878; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE (name);


--
-- Name: auth_identities UQ_e2afaeac776db523ee689bfdf9a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_identities
    ADD CONSTRAINT "UQ_e2afaeac776db523ee689bfdf9a" UNIQUE (provider, "providerUserId");


--
-- Name: client_attentions UQ_f30df7ba3172f3e5b06bf4d1840; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attentions
    ADD CONSTRAINT "UQ_f30df7ba3172f3e5b06bf4d1840" UNIQUE (account_number);


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: accounts UQ_ffd1ae96513bfb2c6eada0f7d31; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "UQ_ffd1ae96513bfb2c6eada0f7d31" UNIQUE (account_number);


--
-- Name: job_groups FK_06005040b3b679f4c6bd9c58508; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_groups
    ADD CONSTRAINT "FK_06005040b3b679f4c6bd9c58508" FOREIGN KEY ("economistId") REFERENCES public.economists(id) ON DELETE SET NULL;


--
-- Name: ratings FK_19f05e4a7e2cc589584e3ac2693; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "FK_19f05e4a7e2cc589584e3ac2693" FOREIGN KEY ("serviceId") REFERENCES public.services("idService") ON DELETE CASCADE;


--
-- Name: payments FK_2017d0cbfdbfec6b1b388e6aa08; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES public.subscriptions("idSubscription");


--
-- Name: client_attentions FK_2f21210a5fe18fea147c0b5c639; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_attentions
    ADD CONSTRAINT "FK_2f21210a5fe18fea147c0b5c639" FOREIGN KEY ("jobGroupId") REFERENCES public.job_groups(id) ON DELETE SET NULL;


--
-- Name: accounts FK_3aa23c0a6d107393e8b40e3e2a6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: payments FK_4634839a93faaa2b163c1215f0b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_4634839a93faaa2b163c1215f0b" FOREIGN KEY ("accountId") REFERENCES public.accounts("idAccount");


--
-- Name: ratings FK_4d0b0e3a4c4af854d225154ba40; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "FK_4d0b0e3a4c4af854d225154ba40" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens FK_610102b60fea1455310ccd299de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: auth_identities FK_6ed26ac7e2276ae145ca68c23af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_identities
    ADD CONSTRAINT "FK_6ed26ac7e2276ae145ca68c23af" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products FK_85972efa1e5c4e3908ddfb01404; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_85972efa1e5c4e3908ddfb01404" FOREIGN KEY ("userEnterpriseId") REFERENCES public.user_enterprises("idUserEnterprise");


--
-- Name: products FK_8b020475be2f16a48ab3d92ffd0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_8b020475be2f16a48ab3d92ffd0" FOREIGN KEY ("pendingCategoryId") REFERENCES public.categories(id);


--
-- Name: job_groups FK_9098c5659d2600129c08141aabd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_groups
    ADD CONSTRAINT "FK_9098c5659d2600129c08141aabd" FOREIGN KEY ("superUserId") REFERENCES public.super_users(id) ON DELETE CASCADE;


--
-- Name: user_enterprises FK_91e90d200b1f8a7ef4f2ecac757; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_enterprises
    ADD CONSTRAINT "FK_91e90d200b1f8a7ef4f2ecac757" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: ratings FK_abcea824a43708933e5ac15a0e4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "FK_abcea824a43708933e5ac15a0e4" FOREIGN KEY ("productId") REFERENCES public.products("idProduct") ON DELETE CASCADE;


--
-- Name: subscriptions FK_b3a5bed633255b682c053e4c8c1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_b3a5bed633255b682c053e4c8c1" FOREIGN KEY ("userEnterpriseId") REFERENCES public.user_enterprises("idUserEnterprise");


--
-- Name: payments FK_d35cb3c13a18e1ea1705b2817b1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: super_users FK_d5511ca19881d2dc441f55cc6dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_users
    ADD CONSTRAINT "FK_d5511ca19881d2dc441f55cc6dd" FOREIGN KEY ("accountId") REFERENCES public.accounts("idAccount");


--
-- Name: services FK_d656640c2430cc7f974513b23ad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "FK_d656640c2430cc7f974513b23ad" FOREIGN KEY ("userEnterpriseId") REFERENCES public.user_enterprises("idUserEnterprise");


--
-- Name: subscriptions FK_fbdba4e2ac694cf8c9cecf4dc84; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: products FK_ff56834e735fa78a15d0cf21926; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES public.categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dBcU56D2JKyWJo5db9Xeyoht741dUCjhEvXkh0aNm6E7zPivyugdjmL9ihzgLG0

