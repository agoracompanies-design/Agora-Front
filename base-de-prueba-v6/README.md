# Base de prueba v6 — para montar Ágora en local

Aquí está la base de datos con la que estamos trabajando, **con sus datos y sus
imágenes**, para que podáis levantar la aplicación entera y verla funcionando sin
tener que sembrar nada a mano.

Contiene 5 cuentas, 4 negocios, 41 productos con foto, 7 categorías y 96
calificaciones.

| Archivo | Qué es |
|---|---|
| `pruebas_agora_v6.sql` | Volcado completo de la base (56 KB) |
| `uploads/products/` | Las 41 imágenes de los productos (4,3 MB) |

---

## Antes de nada: por qué hace falta esto

Lo normal sería clonar el backend, ejecutar las migraciones y tener la base
lista. **Con este proyecto eso no funciona todavía**, y conviene explicar por qué
para que nadie pierda una tarde intentándolo.

### Cómo se clona el proyecto

Son dos repositorios distintos:

```bash
# Backend (NestJS + PostgreSQL)
git clone https://github.com/YaselB/Agora_Api.git
cd Agora_Api
yarn install          # yarn, nunca npm

# Frontend (React + Vite) — en otra carpeta
git clone https://github.com/JoelDavid7324/agora-frontend.git
cd agora-frontend/frontend
yarn install
```

### Qué hacen las migraciones

El backend usa TypeORM con `synchronize: false`, así que el esquema no se crea
solo: lo levantan las migraciones, con los scripts que dejó Javier en el
`package.json`:

```bash
yarn migration:run        # aplica las que falten
yarn migration:generate   # crea una nueva a partir de las entidades
yarn migration:revert     # deshace la última
```

**Esto hay que ejecutarlo cada vez que alguien sube cambios en las entidades.**
Si el código espera una columna que la base no tiene, la aplicación entera se
cae: no es que falle una pantalla, es que hasta el login responde 500.

### El problema: no hay una migración que cree la base desde cero

En `src/migrations/` hay diez migraciones, y **todas son incrementales**:

```
CreateRatingEntity · AddLocationToUserEnterprise · CreateSuperUserTable
CreateJobGroupsTable · AddEconomistAndRelation · CreateClientAttentionAndRelation
AddCategoriesAndUpdateProducts · CreateRefreshTokensTable
AddCreatedAtToProduct · AddSuggestedCategoryNameToProduct
```

Fíjate en lo que **no** está: ninguna crea `users`, `products`,
`user_enterprises` ni `subscriptions`. Esas tablas nacieron con `synchronize` en
`true` al principio del proyecto, y esa parte nunca se convirtió en migración.

Consecuencia práctica: **si creas una base vacía y ejecutas `migration:run`, no
obtienes una base utilizable.** Las migraciones intentan modificar tablas que no
existen y se quedan a medias.

Mientras no exista esa migración inicial —está pedido, y es la solución de
verdad—, la forma de montar el proyecto es restaurar el volcado que hay en esta
carpeta. Eso es lo que explican los pasos de abajo.

---

## Pasos para montarlo

Necesitas **PostgreSQL 17** y **Node con yarn** instalados.

### 1. Crear la base vacía

```bash
psql -U postgres -h localhost -c "CREATE DATABASE pruebas_agora_v6;"
```

En Windows, si `psql` no está en el PATH, está en
`C:\Program Files\PostgreSQL\17\bin\psql.exe`.

### 2. Restaurar el volcado

Desde esta carpeta:

```bash
psql -U postgres -h localhost -d pruebas_agora_v6 -f pruebas_agora_v6.sql
```

Ya tienes el esquema **y** los datos. No ejecutes `migration:run` después: la
tabla `migrations` viene dentro del volcado con las diez ya marcadas como
aplicadas, así que TypeORM sabe que no hay nada pendiente.

### 3. Copiar las imágenes

Copia la carpeta `uploads/products/` de aquí a la **raíz del backend**, de modo
que quede así:

```
Agora_Api/
└── uploads/
    └── products/     ← las 41 imágenes
```

Esto hace falta porque `/uploads` está en el `.gitignore` del backend, así que
las imágenes no viajan al clonar. Sin este paso la aplicación funciona igual,
pero todos los productos salen con el recuadro de imagen rota.

### 4. Configurar el `.env` del backend

El `.env` tampoco está versionado. Crea uno en la raíz de `Agora_Api` con esto,
cambiando la contraseña por la de tu PostgreSQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_DATABASE=pruebas_agora_v6
JWT_SECRET=cualquier_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=15m
```

Sobre `JWT_EXPIRES_IN`: son los minutos que dura el token de acceso. Ponerlo en
`15m` **no acorta la sesión** —esa la sostiene la cookie de refresco, que dura
una semana—; lo que cambia es cuánto tarda en surtir efecto un cierre de sesión
o la retirada de un permiso.

### 5. Levantar las dos partes

```bash
# En Agora_Api
yarn start:dev            # queda en http://localhost:3000

# En agora-frontend/frontend
yarn dev                  # queda en http://localhost:5173
```

Abre `http://localhost:5173` y entra con cualquiera de las cuentas de abajo.

---

## Con qué cuentas entrar

Todas usan la misma contraseña: **`Pruebas123!`**

| Usuario | Negocio | Plan |
|---|---|---|
| `bodega_vedado` | Bodega El Vedado | Plan Vendedor |
| `farmacia_23` | Farmacia 23 y 12 | Plan Vendedor |
| `mercado_central` | Mercado Central | Plan Vendedor |
| `joel_pruebas` | — | Prueba gratuita |
| `user` | xd | Prueba gratuita |

Las tres primeras tienen catálogo publicado y sirven para ver el panel de
negocio. `joel_pruebas` sirve para mirar la aplicación como comprador.

> Son cuentas de prueba con una contraseña conocida: **no reutilizar ninguna en
> producción**.

---

## Si algo no arranca

**El login responde 500 y en el log pone «no existe la columna …»**
La base se ha quedado atrás respecto al código. Ejecuta `yarn migration:run` en
el backend; si aparecieron migraciones nuevas después de este volcado, eso las
aplica.

**Los productos salen sin foto**
Falta el paso 3: la carpeta `uploads/products/` no está en la raíz del backend.

**El frontend carga pero no se ve nada y la consola da errores de red**
El backend no está levantado, o está en otro puerto. Comprueba que responde:
`curl http://localhost:3000/api/products` debe contestar 401 (que es correcto:
significa que está vivo y pide sesión).

**Restaurar el volcado da errores de «ya existe»**
La base no estaba vacía. Bórrala y vuelve a empezar:
`psql -U postgres -c "DROP DATABASE pruebas_agora_v6;"`

---

## Volver a generar este paquete

Si alguien quiere rehacerlo con datos más frescos:

```bash
pg_dump -U postgres -h localhost -d pruebas_agora_v6 \
  --no-owner --no-privileges -f pruebas_agora_v6.sql
cp -r <ruta-del-backend>/uploads/products ./uploads/
```
