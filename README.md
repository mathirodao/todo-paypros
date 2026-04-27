# To-Do List — To-Do List App

Aplicación fullstack de gestión de tareas con autenticación JWT. Cada usuario puede registrarse, iniciar sesión y administrar sus propias tareas de forma privada.

---

## Stack tecnológico

| Capa              | Tecnologías                                             |
| ----------------- | ------------------------------------------------------- |
| **Backend**       | Node.js · NestJS · TypeScript · Prisma ORM v7 · MySQL 8 |
| **Frontend**      | React 18 · TypeScript · Tailwind CSS · Vite             |
| **Auth**          | JWT (JSON Web Tokens) + bcrypt                          |
| **Base de datos** | MySQL 8 via Docker                                      |
| **ORM**           | Prisma v7 con driver adapter `@prisma/adapter-mariadb`  |

---

## Requisitos previos

| Herramienta    | Versión mínima             | Link                                           |
| -------------- | -------------------------- | ---------------------------------------------- |
| Node.js        | v20+                       | https://nodejs.org                             |
| npm            | v9+                        | (incluido con Node)                            |
| Docker Desktop | cualquier versión reciente | https://www.docker.com/products/docker-desktop |

Verificá que estén instalados:

```bash
node -v
npm -v
docker -v
```

---

## Estructura del repositorio

```
todo-paypros/
├── docker-compose.yml        # MySQL 8 containerizado
├── README.md
├── DOCUMENTATION.md          # Arquitectura y decisiones técnicas
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos User y Task
│   │   ├── prisma.config.ts  # Config de Prisma v7
│   │   └── migrations/       # Migraciones SQL generadas
│   ├── src/
│   │   ├── auth/             # Registro, login, JWT guard/strategy
│   │   ├── tasks/            # CRUD de tareas
│   │   └── prisma/           # PrismaService (conexión DB)
│   ├── test/                 # Tests E2E
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/              # Llamadas HTTP con Axios
    │   ├── context/          # AuthContext (sesión JWT)
    │   ├── components/       # Navbar, TaskCard, TaskForm, UI
    │   └── pages/            # LoginPage, RegisterPage, TasksPage
    └── package.json
```

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/mathirodao/todo-paypros.git
cd todo-paypros
```

### 2. Levantar la base de datos con Docker

```bash
docker compose up -d
```

Esto inicia MySQL 8 en el puerto `3306` con:

- Base de datos: `todo_paypros`
- Usuario: `root` / Contraseña: `root`

Verificar que esté corriendo:

```bash
docker ps
# Debe mostrar "todo_mysql" con estado "Up"
```

> Esperá unos 10 segundos antes de continuar — MySQL necesita inicializarse.

### 3. Configurar el backend

```bash
cd backend
npm install
```

Crear el archivo `.env` (usar el ejemplo):

```bash
cp .env.example .env
```

Contenido del `.env`:

```env
DATABASE_URL="mysql://root:root@localhost:3306/todo_paypros"
JWT_SECRET="secret-jwt-aqui"
PORT=3000
```

Correr la migración (crea las tablas `User` y `Task`):

```bash
npx prisma migrate dev --name init
```

Generar el cliente de Prisma:

```bash
npx prisma generate
```

### 4. Iniciar el backend

```bash
npm run start:dev
```

El backend corre en **http://localhost:3000**

Deberías ver en consola:

```
[Nest] LOG [NestApplication] Nest application successfully started
Backend running on http://localhost:3000
```

### 5. Configurar e iniciar el frontend

Abrí una **nueva terminal**:

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en **http://localhost:5173**

---

## Uso de la aplicación

1. Abrí **http://localhost:5173**
2. Creá una cuenta en `/register`
3. Iniciá sesión en `/login`
4. Gestioná tus tareas: crear, editar, marcar como completada, eliminar
5. Filtrá por estado: **Todo / Pendiente / Completado**

---

## API — Endpoints

### Autenticación (sin token)

| Método | Endpoint         | Body                        | Descripción         |
| ------ | ---------------- | --------------------------- | ------------------- |
| `POST` | `/auth/register` | `{ name, email, password }` | Registro de usuario |
| `POST` | `/auth/login`    | `{ email, password }`       | Inicio de sesión    |

Ambos devuelven:

```json
{
  "access_token": "eyJhbGc...",
  "user": { "id": 1, "name": "Juan", "email": "juan@example.com" }
}
```

### Tareas (requieren `Authorization: Bearer <token>`)

| Método   | Endpoint     | Descripción                         |
| -------- | ------------ | ----------------------------------- |
| `GET`    | `/tasks`     | Listar todas las tareas del usuario |
| `GET`    | `/tasks/:id` | Obtener una tarea                   |
| `POST`   | `/tasks`     | Crear una tarea                     |
| `PUT`    | `/tasks/:id` | Actualizar una tarea                |
| `DELETE` | `/tasks/:id` | Eliminar una tarea                  |

Body para crear/actualizar:

```json
{
  "title": "Terminar el proyecto",
  "description": "Completar todos los endpoints (opcional)",
  "dueDate": "2026-05-01",
  "completed": false
}
```

---

## Probar con Postman

### Configuración inicial

1. Creá una nueva colección en Postman
2. Definí una variable de entorno `base_url = http://localhost:3000`
3. Luego del login, guardá el `access_token` como variable `token`

### Flujo completo de prueba

**1. Registrar usuario**

```
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "123456"
}
```

**2. Iniciar sesión**

```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
→ Copiá el access_token de la respuesta
```

**3. Crear tarea** (header `Authorization: Bearer <token>`)

```
POST {{base_url}}/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mi primera tarea",
  "description": "Descripción opcional",
  "dueDate": "2026-06-01"
}
```

**4. Listar tareas**

```
GET {{base_url}}/tasks
Authorization: Bearer <token>
```

**5. Completar tarea**

```
PUT {{base_url}}/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "completed": true }
```

**6. Eliminar tarea**

```
DELETE {{base_url}}/tasks/:id
Authorization: Bearer <token>
```

---

## Inspeccionar la base de datos

### Opción 1 — Prisma Studio (UI visual)

```bash
cd backend
npx prisma studio
# Abre http://localhost:5555
```

### Opción 2 — MySQL directo via Docker

```bash
docker exec -it todo_mysql mysql -u root -p todo_paypros
# Contraseña: root

SHOW TABLES;
SELECT * FROM User;
SELECT * FROM Task;
EXIT;
```

---

## Tests E2E del backend

```bash
cd backend
npm run test:e2e
```

> La base de datos debe estar corriendo antes de ejecutar los tests E2E.

Los tests cubren: registro → login → crear tarea → listar → actualizar → eliminar.

---

## Variables de entorno

El archivo `.env` no se sube al repositorio. configurarlo con los valores de abajo.

### `backend/.env`

```env
DATABASE_URL="mysql://root:root@localhost:3306/todo_paypros"
JWT_SECRET="jwt_paypros_secret_key"
PORT=3000
```

---

## Detener todo

```bash
# Ctrl+C en cada terminal para detener frontend y backend

docker compose down          # detiene MySQL
docker compose down -v       # detiene MySQL y borra los datos
```

---

## Autor

**Mathías** — [@mathirodao](https://github.com/mathirodao)
