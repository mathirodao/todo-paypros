# Documentación Técnica — TaskFlow

**Proyecto:** To-Do List App — Pay-Pros  
**Autor:** Mathías ([@mathirodao](https://github.com/mathirodao))  
**Stack:** NestJS · Prisma v7 · MySQL · React · TypeScript · Tailwind CSS

---

## 1. Descripción general

TaskFlow es una aplicación de gestión de tareas fullstack que permite a los usuarios registrarse, autenticarse y administrar sus propias tareas de forma segura. Cada usuario solo accede a sus propias tareas — no hay visibilidad cruzada entre cuentas.

La aplicación cumple con todos los requisitos funcionales especificados:

- Autenticación con JWT (registro e inicio de sesión)
- CRUD completo de tareas (crear, leer, actualizar, eliminar)
- Tareas con título, descripción opcional, fecha de vencimiento y estado (pendiente/completada)
- Asociación de tareas a usuarios autenticados
- Protección de rutas tanto en el frontend como en el backend

---

## 2. Arquitectura del proyecto

```
Cliente (React + Vite)
        │
        │  HTTP (Axios + Bearer token)
        ▼
API REST (NestJS) — puerto 3000
        │
        │  Prisma ORM v7
        ▼
MySQL 8 (Docker) — puerto 3306
```

El backend expone una API REST que el frontend consume via HTTP. El token JWT se guarda en `localStorage` en el cliente y se adjunta automáticamente a cada request protegido mediante un interceptor de Axios.

### Backend — estructura modular (NestJS)

NestJS organiza la lógica en módulos, donde cada módulo agrupa su controller, service y DTOs relacionados:

```
src/
├── app.module.ts          # Módulo raíz — importa todo
├── auth/
│   ├── auth.module.ts     # Conecta JWT, Passport, controller y service
│   ├── auth.controller.ts # Rutas: POST /auth/register, POST /auth/login
│   ├── auth.service.ts    # Lógica: hash de contraseña, firma de token
│   ├── jwt.strategy.ts    # Valida el token y popula req.user
│   ├── jwt-auth.guard.ts  # Guard aplicado a rutas protegidas
│   └── dto/               # Validación de datos de entrada
├── tasks/
│   ├── tasks.module.ts
│   ├── tasks.controller.ts # Rutas CRUD de tareas
│   ├── tasks.service.ts    # Lógica + verificación de ownership
│   └── dto/
└── prisma/
    ├── prisma.module.ts    # Global — disponible en todos los módulos
    └── prisma.service.ts   # Wrapper de PrismaClient con lifecycle hooks
```

### Frontend — estructura por capas

```
src/
├── api/          # Capa de datos: funciones que llaman al backend
├── context/      # Estado global: AuthContext con JWT y datos del usuario
├── components/   # Componentes reutilizables: Navbar, TaskCard, TaskForm, UI
└── pages/        # Vistas completas: Login, Register, Tasks
```

---

## 3. Modelo de datos

### User

| Campo     | Tipo     | Notas                                       |
| --------- | -------- | ------------------------------------------- |
| id        | Int (PK) | Auto-increment                              |
| name      | String   |                                             |
| email     | String   | Único                                       |
| password  | String   | Hash bcrypt (10 rounds) — nunca texto plano |
| tasks     | Task[]   | Relación 1:N                                |
| createdAt | DateTime | Auto                                        |

### Task

| Campo       | Tipo      | Notas                             |
| ----------- | --------- | --------------------------------- |
| id          | Int (PK)  | Auto-increment                    |
| title       | String    | Requerido                         |
| description | String?   | Opcional, tipo TEXT               |
| dueDate     | DateTime? | Opcional                          |
| completed   | Boolean   | Default: false                    |
| userId      | Int (FK)  | Referencia a User, cascade delete |
| createdAt   | DateTime  | Auto                              |
| updatedAt   | DateTime  | Se actualiza automáticamente      |

La relación tiene `onDelete: Cascade` — si se elimina un usuario, todas sus tareas se eliminan también.

---

## 4. Autenticación JWT

El flujo de autenticación es el siguiente:

1. El usuario se registra con nombre, email y contraseña
2. La contraseña se hashea con `bcrypt` (10 salt rounds) antes de guardarse
3. Al registrarse o loguearse con éxito, el backend firma un JWT con `{ sub: userId, email }` y expira en 7 días
4. El frontend guarda el token en `localStorage` y lo adjunta en cada request via header `Authorization: Bearer <token>`
5. El `JwtAuthGuard` en NestJS intercepta las rutas protegidas, valida la firma del token y popula `req.user` con los datos del payload
6. Si el token es inválido o expiró, el servidor devuelve `401` y el interceptor de Axios redirige al login automáticamente

**Decisión de seguridad:** los mensajes de error de login son genéricos ("Credenciales inválidas") — no se diferencia entre "email no existe" y "contraseña incorrecta" para no filtrar información sobre qué emails están registrados.

---

## 5. Decisiones técnicas

### NestJS como framework backend

Se trabajó con NestJS como framework backend, aprovechando su arquitectura modular y su integración con TypeScript. Su sistema de modules, controllers y services permitió organizar la aplicación con una separación clara entre rutas, lógica de negocio y funcionalidades específicas.

Además, facilitó la implementación de autenticación mediante JWT utilizando guards y strategies de Passport, así como la validación de datos a través de DTOs y pipes con class-validator.

### Prisma v7 como ORM — Integración con NestJS y MySQL

Durante la implementación apareció un detalle técnico relacionado con Prisma v7. En esta versión cambió la forma en que Prisma maneja la conexión a la base de datos, pasando a utilizar adaptadores externos.

La documentación oficial está más enfocada en PostgreSQL, por lo que fue necesario investigar cómo configurarlo correctamente con MySQL. A partir del error PrismaClientInitializationError: needs to be constructed with valid PrismaClientOptions, se identificó que para este caso correspondía utilizar @prisma/adapter-mariadb, ya que MySQL y MariaDB comparten compatibilidad en este tipo de conexión.

Además, Prisma v7 genera el cliente en formato ESM por defecto, mientras que la configuración utilizada en NestJS estaba basada en CommonJS. Para resolverlo, se ajustó la configuración del schema.prisma, definiendo moduleFormat = "cjs" y un directorio de salida dentro de src/, permitiendo que NestJS lo compile correctamente.

```prisma
generator client {
  provider     = "prisma-client-js"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}
```

Y en el `PrismaService`:

```typescript
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
super({ adapter });
```

También se creó un `prisma.config.ts` en la raíz del backend para separar la configuración de la conexión del schema (otro cambio de Prisma v7: la URL ya no va en el bloque `datasource` del schema).

### AuthContext para estado global de autenticación

Se usó React Context en lugar de una librería externa (Zustand, Redux) porque el estado de autenticación es simple: solo necesitamos saber si el usuario está logueado, quién es y su token. Context es suficiente para este alcance.

El contexto persiste la sesión en `localStorage` y la restaura al iniciar la app, por lo que el usuario no pierde la sesión al refrescar la página.

### Validación con DTOs

Todos los datos de entrada del backend pasan por DTOs decorados con `class-validator`. El `ValidationPipe` global con `whitelist: true` elimina cualquier campo que no esté declarado en el DTO, lo cual previene que datos inesperados lleguen a la base de datos.

### Ownership de tareas

En el `TasksService`, cada operación (obtener, actualizar, eliminar) verifica que la tarea pertenezca al usuario que hace el request. Esto se hace comparando el `userId` de la tarea con el `req.user.id` que proviene del token JWT validado. Si no coinciden, se devuelve `403 Forbidden`.

---

## 6. Instrucciones para ejecutar tests

### Tests E2E del backend

Los tests E2E levantan la aplicación NestJS completa y hacen requests HTTP reales contra la base de datos.

**Requisito previo:** MySQL debe estar corriendo.

```bash
cd backend
npm run test:e2e
```

Los tests cubren el flujo completo:

1. Registro de un nuevo usuario
2. Login y obtención del token JWT
3. Intento de acceso sin token (debe devolver 401)
4. Crear una tarea autenticado
5. Listar tareas del usuario
6. Actualizar una tarea (cambiar título y marcar como completada)
7. Eliminar una tarea

### Tests unitarios

```bash
cd backend
npm run test
```

---

## 7. Evidencia de investigación y aprendizaje

Durante el desarrollo se investigaron y aplicaron tecnologías no utilizadas previamente en proyectos profesionales:

**NestJS:** Si bien se conocía la arquitectura de Node.js con Express, NestJS requirió aprender su sistema de módulos, la inyección de dependencias automática, el uso de decoradores (`@Controller`, `@Injectable`, `@UseGuards`, etc.) y la integración de Passport con JWT mediante strategies y guards. La curva de aprendizaje fue manejable gracias a su documentación y a que TypeScript es el lenguaje nativo del framework.

**Prisma v7:** Durante la implementación surgieron algunos ajustes relacionados con la nueva versión de Prisma. La documentación oficial no estaba tan orientada al caso de MySQL, por lo que fue necesario investigar distintas referencias, principalmente documentación oficial y consultas de la comunidad.

A partir de eso, se llegó a una configuración funcional utilizando `@prisma/adapter-mariadb`, definiendo `moduleFormat = "cjs"` y moviendo la URL de conexión a `prisma.config.ts`.

## 8. Posibles mejoras futuras

- Paginación en el listado de tareas
- Categorías o etiquetas para las tareas
- Tests unitarios para services y guards
- Variables de entorno del frontend via `.env` para la URL del backend
- Deploy con Docker Compose completo (frontend + backend + DB)
