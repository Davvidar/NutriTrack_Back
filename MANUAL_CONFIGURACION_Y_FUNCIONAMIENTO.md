# Manual de Configuración y Funcionamiento - NutriTrack Backend

## Descripción del Proyecto

NutriTrack Backend es una API REST desarrollada en Node.js con Express y MongoDB que proporciona funcionalidades para el seguimiento nutricional de usuarios. El sistema permite gestionar usuarios, productos alimenticios, recetas, registros diarios de comidas y seguimiento de peso.

## Tabla de Contenidos

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Variables de Entorno](#variables-de-entorno)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Modelos de Datos](#modelos-de-datos)
6. [API Endpoints](#api-endpoints)
7. [Autenticación y Autorización](#autenticación-y-autorización)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Ejecución del Proyecto](#ejecución-del-proyecto)
10. [Troubleshooting](#troubleshooting)

## Requisitos del Sistema

### Software Necesario
- **Node.js**: Versión 16 o superior
- **MongoDB**: Base de datos NoSQL
- **npm**: Gestor de paquetes de Node.js
- **Git**: Para control de versiones

### Dependencias Principales
- **express**: Framework web para Node.js
- **mongoose**: ODM para MongoDB
- **bcryptjs**: Encriptación de contraseñas
- **jsonwebtoken**: Autenticación JWT
- **nodemailer**: Envío de correos electrónicos
- **cors**: Manejo de CORS
- **express-validator**: Validación de datos
- **dotenv**: Gestión de variables de entorno
- **ejs**: Motor de plantillas
- **moment-timezone**: Manejo de fechas y zonas horarias

## Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd NutriTrack_Backend
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
MONGO_URI=mongodb://localhost:27017/nutritrack
# o para MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nutritrack

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Servidor
PORT=5000
BASE_URL=http://localhost:5000

# Email (para activación de cuentas y recuperación de contraseñas)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
```

### 4. Configurar MongoDB

#### Opción A: MongoDB Local
1. Instalar MongoDB Community Edition
2. Iniciar el servicio de MongoDB
3. Crear la base de datos `nutritrack`

#### Opción B: MongoDB Atlas (Recomendado)
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear un cluster gratuito
3. Configurar acceso de red (IP whitelist)
4. Crear usuario de base de datos
5. Obtener la cadena de conexión

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|----------|
| `MONGO_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/nutritrack` |
| `JWT_SECRET` | Clave secreta para JWT | `mi_clave_super_secreta_123` |
| `PORT` | Puerto del servidor | `5000` |
| `BASE_URL` | URL base de la aplicación | `http://localhost:5000` |
| `EMAIL_USER` | Email para envío de notificaciones | `nutritrack@gmail.com` |
| `EMAIL_PASS` | Contraseña de aplicación del email | `abcd efgh ijkl mnop` |

## Estructura del Proyecto

```
NutriTrack_Backend/
├── assets/                 # Recursos estáticos
│   └── logo.png
├── config/                 # Configuraciones
├── controllers/            # Controladores de la API
│   ├── dailyLogController.js
│   ├── googleAuthController.js
│   ├── productController.js
│   ├── recipesController.js
│   ├── userController.js
│   └── weightController.js
├── middlewares/            # Middlewares personalizados
│   ├── authMiddleware.js
│   ├── dailyLogValidator.js
│   ├── productValidator.js
│   ├── recipeValidator.js
│   ├── userValidator.js
│   └── validateFields.js
├── models/                 # Modelos de Mongoose
│   ├── DailyLog.js
│   ├── Producto.js
│   ├── Recipe.js
│   └── User.js
├── routes/                 # Definición de rutas
│   ├── dailyLogRoutes.js
│   ├── productRoutes.js
│   ├── recipesRoutes.js
│   ├── userRoutes.js
│   └── weightRoutes.js
├── utils/                  # Utilidades
│   └── calculonutricional.js
├── views/                  # Plantillas EJS
│   └── auth/
│       ├── activation-error.ejs
│       ├── activation-success.ejs
│       ├── reset-error.ejs
│       ├── reset-password.ejs
│       └── reset-success.ejs
├── .gitignore
├── package.json
└── server.js              # Punto de entrada de la aplicación
```

## Modelos de Datos

### User (Usuario)
```javascript
{
  nombre: String,
  apellido: String,
  correo: String (único),
  password: String (encriptado),
  peso: Number,
  altura: Number,
  sexo: "masculino" | "femenino",
  edad: Number,
  objetivo: "perder peso" | "mantenerse" | "ganar músculo",
  actividad: "sedentario" | "ligero" | "moderado" | "activo" | "muy activo",
  objetivosNutricionales: {
    calorias: Number,
    proteinas: Number,
    carbohidratos: Number,
    grasas: Number
  },
  favoritos: [{
    tipo: "product" | "recipe",
    refId: ObjectId
  }],
  isActive: Boolean,
  rol: "user" | "admin"
}
```

### Product (Producto)
```javascript
{
  nombre: String,
  marca: String,
  codigoBarras: String (único),
  calorias: Number,        // por 100g
  proteinas: Number,       // por 100g
  carbohidratos: Number,   // por 100g
  azucares: Number,        // por 100g
  grasas: Number,          // por 100g
  grasasSaturadas: Number, // por 100g
  fibra: Number,           // por 100g
  sal: Number,             // por 100g
  porcion: Number,
  userId: ObjectId         // null para productos globales
}
```

### Recipe (Receta)
```javascript
{
  nombre: String,
  ingredientes: [{
    productId: ObjectId,
    cantidad: Number       // en gramos
  }],
  pesoFinal: Number,
  calorias: Number,
  proteinas: Number,
  carbohidratos: Number,
  grasas: Number,
  azucares: Number,
  grasasSaturadas: Number,
  fibra: Number,
  userId: ObjectId
}
```

### DailyLog (Registro Diario)
```javascript
{
  userId: ObjectId,
  fecha: Date,
  pesoDelDia: Number,
  comidas: {
    desayuno: [{
      productId: ObjectId,
      recipeId: ObjectId,    // opcional
      cantidad: Number       // en gramos
    }],
    almuerzo: [...],
    comida: [...],
    merienda: [...],
    cena: [...],
    recena: [...]
  }
}
```

## API Endpoints

### Autenticación (`/api/users`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión | No |
| POST | `/logout` | Cerrar sesión | No |
| GET | `/activate/:token` | Activar cuenta | No |
| POST | `/reset-password-request` | Solicitar reset de contraseña | No |
| POST | `/reset-password` | Resetear contraseña | No |
| GET | `/profile` | Obtener perfil del usuario | Sí |
| PUT | `/profile` | Actualizar perfil | Sí |
| PUT | `/favorites` | Actualizar favoritos | Sí |
| PUT | `/change-password` | Cambiar contraseña | Sí |
| DELETE | `/delete-account` | Eliminar cuenta | Sí |

### Productos (`/api/products`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar productos | Sí |
| GET | `/:id` | Obtener producto por ID | Sí |
| GET | `/barcode/:codigoBarras` | Buscar por código de barras | Sí |
| GET | `/search` | Buscar productos | Sí |
| GET | `/recientes` | Productos recientes | Sí |
| POST | `/` | Crear producto | Sí |
| POST | `/cargar-masivos` | Cargar productos masivamente | Sí |
| PUT | `/:id` | Actualizar producto | Sí |
| DELETE | `/:id` | Eliminar producto | Sí |

### Recetas (`/api/recipes`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar recetas | Sí |
| GET | `/:id` | Obtener receta por ID | Sí |
| GET | `/search` | Buscar recetas | Sí |
| POST | `/` | Crear receta | Sí |
| PUT | `/:id` | Actualizar receta | Sí |
| DELETE | `/:id` | Eliminar receta | Sí |

### Registros Diarios (`/api/dailylogs`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar registros | Sí |
| GET | `/:id` | Obtener registro por ID | Sí |
| GET | `/por-fecha` | Obtener registro por fecha | Sí |
| GET | `/resumen` | Resumen nutricional | Sí |
| POST | `/` | Crear registro | Sí |
| PUT | `/:id` | Actualizar registro | Sí |

### Peso (`/api/weight`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Obtener historial de peso | Sí |
| POST | `/` | Registrar peso | Sí |

## Autenticación y Autorización

### Sistema JWT
El sistema utiliza JSON Web Tokens (JWT) para la autenticación:

1. **Registro**: El usuario se registra y recibe un email de activación
2. **Activación**: El usuario activa su cuenta mediante el enlace del email
3. **Login**: El usuario inicia sesión y recibe un token JWT
4. **Autorización**: El token debe incluirse en el header `Authorization: Bearer <token>`

### Middleware de Autenticación
Todas las rutas protegidas utilizan el middleware `authMiddleware` que:
- Verifica la presencia del token
- Valida la firma del token
- Extrae la información del usuario
- Permite el acceso a la ruta

### Roles de Usuario
- **user**: Usuario estándar con acceso a sus propios datos
- **admin**: Administrador con permisos adicionales

## Funcionalidades Principales

### 1. Gestión de Usuarios
- Registro con validación de email
- Activación de cuenta por email
- Login/logout seguro
- Recuperación de contraseña
- Actualización de perfil
- Cálculo automático de objetivos nutricionales

### 2. Gestión de Productos
- CRUD completo de productos
- Búsqueda por nombre, marca o código de barras
- Productos personales y globales
- Carga masiva de productos
- Información nutricional detallada

### 3. Gestión de Recetas
- Creación de recetas con múltiples ingredientes
- Cálculo automático de valores nutricionales
- Búsqueda y filtrado de recetas
- Recetas personales por usuario

### 4. Registro Diario de Comidas
- Registro de 6 comidas diarias
- Seguimiento de productos y recetas consumidas
- Cálculo de totales nutricionales
- Registro de peso diario

### 5. Sistema de Favoritos
- Marcar productos y recetas como favoritos
- Acceso rápido a elementos favoritos

### 6. Cálculos Nutricionales
- Cálculo de TMB (Tasa Metabólica Basal)
- Ajuste por nivel de actividad
- Objetivos personalizados según metas
- Distribución de macronutrientes

## Ejecución del Proyecto

### Modo Desarrollo
```bash
npm start
```
Esto ejecuta el servidor con `--watch` para reinicio automático.

### Modo Producción
```bash
node server.js
```

### Verificar Funcionamiento
1. El servidor debería mostrar:
   ```
   MongoDB conectado 🚀
   Servidor corriendo en el puerto 5000
   ```

2. Probar endpoint de salud:
   ```bash
   curl http://localhost:5000/api/users/
   ```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a MongoDB
**Síntoma**: `Error al conectar MongoDB`
**Solución**:
- Verificar que MongoDB esté ejecutándose
- Comprobar la URI de conexión en `.env`
- Verificar credenciales de MongoDB Atlas

#### 2. Error de Variables de Entorno
**Síntoma**: `JWT_SECRET is not defined`
**Solución**:
- Verificar que el archivo `.env` existe
- Comprobar que todas las variables están definidas
- Reiniciar el servidor después de cambios en `.env`

#### 3. Error de Email
**Síntoma**: `Error al enviar email de activación`
**Solución**:
- Verificar credenciales de email en `.env`
- Usar contraseña de aplicación para Gmail
- Verificar configuración de seguridad del email

#### 4. Token JWT Inválido
**Síntoma**: `Token inválido o expirado`
**Solución**:
- Verificar que el token se envía correctamente
- Comprobar formato: `Authorization: Bearer <token>`
- Renovar token si ha expirado

#### 5. Errores de Validación
**Síntoma**: Errores 400 con mensajes de validación
**Solución**:
- Verificar que todos los campos requeridos están presentes
- Comprobar tipos de datos correctos
- Revisar formatos de email, contraseñas, etc.

### Logs y Debugging

Para debugging adicional, agregar logs en puntos clave:

```javascript
console.log('Debug info:', variable);
```

### Herramientas Recomendadas

- **Postman**: Para probar endpoints de la API
- **MongoDB Compass**: Para visualizar la base de datos
- **VS Code**: Editor recomendado con extensiones de Node.js
- **Nodemon**: Para desarrollo con recarga automática

## Consideraciones de Seguridad

1. **Contraseñas**: Siempre encriptadas con bcrypt
2. **JWT**: Tokens con expiración configurada
3. **Validación**: Todos los inputs son validados
4. **CORS**: Configurado para permitir orígenes específicos
5. **Variables de Entorno**: Credenciales nunca en código
6. **Sanitización**: Datos sanitizados antes de guardar

## Mantenimiento

### Actualizaciones
- Revisar dependencias regularmente: `npm audit`
- Actualizar packages: `npm update`
- Monitorear logs de errores
- Realizar backups de la base de datos

### Monitoreo
- Verificar uso de memoria y CPU
- Monitorear conexiones a la base de datos
- Revisar logs de acceso y errores
- Verificar tiempo de respuesta de endpoints

---

**Versión del Manual**: 1.0  
**Última Actualización**: 2024  
**Contacto**: [Información de contacto del desarrollador]