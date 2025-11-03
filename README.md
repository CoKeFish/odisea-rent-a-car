# 🚗 Rent-a-Car dApp - Stellar Soroban Smart Contract

Aplicación descentralizada (dApp) para el alquiler de vehículos construida sobre la red Stellar utilizando contratos inteligentes de Soroban. Este proyecto implementa un sistema completo de gestión de alquiler de autos con roles de administrador, propietarios y arrendatarios.

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Características Principales](#-características-principales)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Arquitectura del Contrato](#-arquitectura-del-contrato)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Testing](#-testing)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)

## 🎯 Descripción del Proyecto

Esta aplicación permite gestionar el alquiler de vehículos de forma descentralizada utilizando la tecnología blockchain de Stellar. Los usuarios pueden:

- **Administradores**: Configurar comisiones, gestionar vehículos y retirar ganancias
- **Propietarios**: Agregar vehículos al catálogo, recibir pagos por alquileres
- **Arrendatarios**: Explorar vehículos disponibles, alquilar y devolver autos

El contrato inteligente garantiza transparencia, seguridad y automatización de todos los procesos financieros.

### 💡 Recomendación para Desarrollo y Pruebas

Para una mejor experiencia al probar la aplicación, **recomendamos crear 3 cuentas diferentes en Freighter** y mantenerlas conectadas simultáneamente:

1. **Wallet de Administrador**: Para configurar comisiones y gestionar vehículos
2. **Wallet de Owner**: Para agregar vehículos y recibir pagos por alquileres
3. **Wallet de Renter**: Para alquilar y devolver vehículos

De esta manera, puedes cambiar fácilmente entre roles desde la interfaz sin necesidad de desconectar y reconectar wallets. Freighter permite tener múltiples cuentas conectadas al mismo tiempo, facilitando las pruebas de las diferentes funcionalidades según el rol seleccionado.

**Pasos para configurar:**
1. Abre Freighter y crea o importa 3 cuentas diferentes
2. Asegúrate de que cada cuenta tenga fondos en la red de prueba (Testnet)
3. Conecta todas las cuentas a la dApp
4. Selecciona el rol correspondiente en la interfaz

---

## ✨ Características Principales

### 🧾 Comisión del Administrador

El administrador puede configurar una comisión monetaria fija por cada alquiler. Esta comisión se suma automáticamente al depósito que paga el arrendatario, garantizando ingresos para la plataforma.

**Funcionalidades:**
- Configuración de comisión por el administrador
- Comisión automática en cada alquiler
- Retiro de comisiones acumuladas en cualquier momento
- Consulta de comisión disponible para retiro

**Captura de pantalla:**
<!-- Aquí puedes agregar la captura de la pantalla de configuración de comisión -->
![Configurar Comisión](images/set-commission.png)

---

### 💰 Depósito + Comisión

Al alquilar un vehículo, la comisión configurada se suma automáticamente al depósito total. El propietario recibe el 100% del monto del alquiler (sin deducción de comisión), mientras que el administrador acumula la comisión configurada.

**Funcionalidades:**
- Cálculo automático: `Depósito Total = Monto Alquiler + Comisión`
- El propietario recibe el monto completo del alquiler
- La comisión se acumula en la cuenta del administrador

**Captura de pantalla:**
<!-- Aquí puedes agregar la captura de la pantalla de alquiler mostrando el depósito total -->
![Alquiler con Comisión](images/rental-with-commission.png)

---

### 💸 Retiro de Fondos del Administrador

El administrador puede consultar y retirar las comisiones acumuladas en cualquier momento a través de una interfaz intuitiva.

**Funcionalidades:**
- Visualización de comisión disponible en tiempo real
- Modal para retirar comisiones
- Validación de fondos disponibles
- Botón deshabilitado cuando no hay fondos disponibles

**Captura de pantalla:**
<!-- Aquí puedes agregar la captura de la pantalla de retiro de comisión -->
![Retiro de Comisión](images/withdraw-commission.png)

---

### 🚗 Retornos de Autos

Los arrendatarios pueden devolver los vehículos que han alquilado, cambiando el estado del vehículo de "Rented" a "Available".

**Funcionalidades:**
- Botón "Return" visible para arrendatarios en vehículos alquilados
- Cambio automático de estado del vehículo
- Actualización en tiempo real del catálogo

**Captura de pantalla:**
<!-- Aquí puedes agregar la captura de la pantalla de devolución de auto -->
![Devolver Auto](images/return-car.png)

---

### 🔒 Retiros de Owners Restringidos

Los propietarios solo pueden retirar sus fondos cuando el vehículo ha sido devuelto (estado "Available"). El botón de retiro está deshabilitado si:
- El vehículo está alquilado (estado "Rented")
- No hay fondos disponibles para retirar

**Funcionalidades:**
- Validación en el contrato: solo permite retiro si el auto está disponible
- Botón "Withdraw" visible únicamente cuando hay fondos disponibles
- Modal para especificar monto a retirar
- Visualización de fondos disponibles en tiempo real

**Captura de pantalla:**
<!-- Aquí puedes agregar la captura de la pantalla de retiro de owner -->
![Retiro de Owner](images/withdraw-owner.png)

---

## 📦 Requisitos

Antes de instalar y ejecutar el proyecto, asegúrate de tener instalado:

- **Rust** (última versión estable): [Instalar Rust](https://www.rust-lang.org/tools/install)
- **Cargo** (incluido con Rust)
- **Target de Rust para Soroban**: Instalar el target según la [guía de Soroban](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- **Node.js** (v22 o superior): [Instalar Node.js](https://nodejs.org/en/download/package-manager)
- **npm** (incluido con Node.js)
- **Stellar CLI**: [Stellar CLI](https://github.com/stellar/stellar-core)
- **Scaffold Stellar CLI Plugin**: [Scaffold Stellar](https://github.com/AhaLabs/scaffold-stellar)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd stellar0dApp
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones de red y contratos.

### 3. Instalar Dependencias del Frontend

```bash
npm install
```

### 4. Instalar Dependencias de los Contratos

```bash
npm run install:contracts
```

### 5. Compilar el Contrato

```bash
cd contracts/rent-a-car
cargo build --target wasm32-unknown-unknown --release
```

---

## 💻 Uso

### Modo Desarrollo

Para ejecutar el proyecto en modo desarrollo:

```bash
npm run dev
```

Esto iniciará:
- El servidor de desarrollo de Vite
- El watcher de Scaffold Stellar para reconstruir los clientes del contrato

Abre tu navegador en la URL que se muestra en la consola (generalmente `http://localhost:5173`).

### Compilar para Producción

```bash
npm run build
```

### Preview de Producción

```bash
npm run preview
```

---

## 🏗️ Arquitectura del Contrato

### Estructura de Datos

El contrato utiliza las siguientes estructuras principales:

#### **Car (Vehículo)**
```rust
pub struct Car {
    pub car_status: CarStatus,
    pub available_to_withdraw: i128,
}
```

#### **Rental (Alquiler)**
```rust
pub struct Rental {
    pub total_days_to_rent: u32,
    pub amount: i128,
}
```

#### **CarStatus (Estado del Vehículo)**
- `Available`: Disponible para alquilar
- `Rented`: Actualmente alquilado
- `Maintenance`: En mantenimiento

### Funciones del Contrato

#### **Funciones Públicas (Cualquiera puede llamar)**
- `get_car_status(owner)`: Obtiene el estado de un vehículo
- `get_admin_available_to_withdraw()`: Obtiene la comisión disponible del admin
- `get_owner_available_to_withdraw(owner)`: Obtiene los fondos disponibles del owner

#### **Funciones de Administrador**
- `set_admin_commission(commission)`: Configura la comisión del administrador
- `withdraw_admin_commission(amount)`: Retira comisiones acumuladas
- `remove_car(owner)`: Elimina un vehículo del catálogo

#### **Funciones de Owner**
- `add_car(owner, price_per_day)`: Agrega un vehículo al catálogo
- `payout_owner(owner, amount)`: Retira fondos (solo si el auto está disponible)

#### **Funciones de Renter**
- `rental(renter, owner, total_days_to_rent, amount)`: Alquila un vehículo
- `return_car(renter, owner)`: Devuelve un vehículo alquilado

---

## 🎮 Funcionalidades Implementadas

### ✅ Gestión de Vehículos
- [x] Agregar vehículos al catálogo (Owner)
- [x] Eliminar vehículos del catálogo (Admin)
- [x] Consultar estado de vehículos
- [x] Actualización de estado en tiempo real

### ✅ Sistema de Alquiler
- [x] Alquilar vehículos por días
- [x] Cálculo automático de precio total
- [x] Validación de disponibilidad
- [x] Cambio automático de estado a "Rented"

### ✅ Sistema de Comisiones
- [x] Configuración de comisión por el administrador
- [x] Comisión automática en cada alquiler
- [x] Acumulación de comisiones
- [x] Consulta de comisiones disponibles
- [x] Retiro de comisiones acumuladas

### ✅ Devolución de Vehículos
- [x] Devolución de vehículos por arrendatarios
- [x] Cambio automático de estado a "Available"
- [x] Eliminación de registro de alquiler

### ✅ Gestión de Fondos
- [x] Retiro de fondos por owners (solo cuando el auto está disponible)
- [x] Retiro de comisiones por administrador
- [x] Validación de fondos disponibles
- [x] Visualización de fondos en tiempo real

### ✅ Interfaz de Usuario
- [x] Selección de roles (Admin, Owner, Renter)
- [x] Dashboard con funcionalidades por rol
- [x] Modales para todas las operaciones
- [x] Validación de formularios
- [x] Manejo de errores
- [x] Enlaces a StellarExpert para transacciones

---

## 📁 Estructura del Proyecto

```
stellar0dApp/
├── contracts/
│   └── rent-a-car/
│       ├── src/
│       │   ├── contract.rs              # Implementación principal del contrato
│       │   ├── interfaces/
│       │   │   └── contract.rs          # Interfaz del contrato
│       │   ├── storage/
│       │   │   ├── admin.rs              # Funciones de almacenamiento del admin
│       │   │   ├── car.rs                # Funciones de almacenamiento de autos
│       │   │   ├── rental.rs             # Funciones de almacenamiento de alquileres
│       │   │   └── structs/
│       │   │       ├── car.rs            # Estructura de datos Car
│       │   │       └── rental.rs         # Estructura de datos Rental
│       │   ├── methods/
│       │   │   ├── admin/                # Métodos del administrador
│       │   │   ├── owner/                 # Métodos del propietario
│       │   │   ├── renter/                # Métodos del arrendatario
│       │   │   └── public/                # Métodos públicos (consultas)
│       │   ├── events/                    # Definición de eventos
│       │   └── tests/                     # Tests unitarios del contrato
│       └── Cargo.toml
├── src/
│   ├── components/
│   │   ├── CarList.tsx                   # Lista de vehículos
│   │   ├── CreateCarForm.tsx             # Formulario para agregar vehículos
│   │   ├── RentCarModal.tsx              # Modal para alquilar
│   │   ├── SetCommissionModal.tsx         # Modal para configurar comisión
│   │   ├── WithdrawCommissionModal.tsx    # Modal para retirar comisión
│   │   └── WithdrawOwnerModal.tsx         # Modal para retiro de owner
│   ├── pages/
│   │   ├── Dashboard.tsx                  # Dashboard principal
│   │   ├── RoleSelection.tsx              # Selección de rol
│   │   └── ConnectWallet.tsx              # Conexión de wallet
│   ├── services/
│   │   ├── stellar.service.ts             # Servicio para interactuar con Stellar
│   │   └── wallet.service.ts              # Servicio para manejo de wallets
│   ├── providers/
│   │   └── StellarAccountProvider.tsx      # Context provider para cuentas
│   └── interfaces/                        # Definiciones TypeScript
├── package.json
├── environments.toml
└── README.md
```

---

## 🧪 Testing

El proyecto incluye una suite completa de tests unitarios para el contrato inteligente.

### Ejecutar Tests del Contrato

```bash
cd contracts/rent-a-car
cargo test --lib
```

### Tests Implementados

- **Tests de Administración:**
  - `test_set_admin_commission_successfully`
  - `test_withdraw_admin_commission_successfully`
  - `test_get_admin_available_to_withdraw_after_rental`

- **Tests de Vehículos:**
  - `test_add_car_successfully`
  - `test_remove_car_deletes_from_storage`
  - `test_get_car_status_returns_available`

- **Tests de Alquiler:**
  - `test_rental_car_successfully`
  - `test_rental_with_admin_commission`
  - `test_return_car_successfully`

- **Tests de Retiros:**
  - `test_payout_owner_successfully`
  - `test_payout_owner_when_car_is_rented_fails`
  - `test_get_owner_available_to_withdraw_car_available_with_funds`

- **Tests de Autenticación:**
  - Tests para verificar que solo usuarios autorizados pueden ejecutar funciones específicas

---

## 🛠️ Tecnologías Utilizadas

### Backend (Smart Contract)
- **Rust**: Lenguaje de programación
- **Soroban SDK**: Framework para contratos inteligentes en Stellar
- **Stellar XDR**: Serialización de datos

### Frontend
- **React 19**: Biblioteca para construir interfaces
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **Stellar SDK**: Cliente para interactuar con Stellar
- **Stellar Wallets Kit**: Integración con wallets de Stellar (Freighter, etc.)

### Herramientas
- **Scaffold Stellar**: Framework para desarrollo de dApps en Stellar
- **Cargo**: Gestor de paquetes de Rust
- **npm**: Gestor de paquetes de Node.js

---

## 📝 Notas Adicionales

### Conversión de Unidades

El contrato trabaja en **stroops** (la unidad más pequeña de XLM), donde:
- `1 XLM = 10,000,000 stroops`

La interfaz realiza la conversión automáticamente entre XLM y stroops para mejorar la experiencia del usuario.

### Seguridad

- Todas las operaciones que modifican el estado requieren autenticación
- Validación de fondos antes de permitir retiros
- Validación de estados de vehículos antes de operaciones
- Manejo de errores robusto en el frontend y backend

### Red

El proyecto está configurado para trabajar con:
- **Testnet de Stellar**: Para desarrollo y pruebas
- Fácilmente configurable para Mainnet en producción

---

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo `LICENSE`.

---

## 👤 Autor

Proyecto desarrollado como parte de la entrega final del curso de Stellar.

---

## 🙏 Agradecimientos

- Núcleo - Por la guía y soporte durante el desarrollo
- Comunidad de Stellar - Por la documentación y herramientas
- Equipo de Scaffold Stellar - Por el framework de desarrollo

---


