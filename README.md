# Aplicación de Gestión de Préstamos - NativeScript Angular

Una aplicación móvil completa para la gestión de préstamos con intereses, desarrollada con NativeScript y Angular, con base de datos PostgreSQL a través de Supabase.

## 🚀 Características Principales

### 📊 Gestión de Préstamos
- **Préstamos de cuota única**: Cálculo de interés basado en períodos atrasados
- **Préstamos multi-cuotas**: Distribución inteligente de pagos
- **Frecuencias de pago**: Diario, semanal, quincenal, mensual
- **Cálculo automático de moras** después del período de gracia
- **Control de balance de capital pendiente**

### 💰 Sistema de Pagos Avanzado
- **Distribución automática**: Mora → Interés → Capital → Abono extra
- **Opciones de abono extra**:
  - Recalcular cuotas aplicando al capital
  - Mantener como avance para próximos pagos
- **Cálculo de interés inteligente**: Si transcurre ≥50% del período, se calcula interés proporcional

### 📈 Reportes y Análisis
- Préstamos del día actual
- Total prestado y pagos recibidos
- Moras acumuladas
- Historial detallado de pagos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: NativeScript + Angular 18
- **Base de Datos**: PostgreSQL (Supabase)
- **Estilos**: TailwindCSS
- **Autenticación**: Supabase Auth
- **Lenguaje**: TypeScript

## 📱 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- NativeScript CLI
- Cuenta de Supabase

### 1. Configuración del Entorno NativeScript

Para ejecutar el proyecto en WebContainer (StackBlitz), usa el siguiente comando:

```bash
setup-nativescript-stackblitz && ns preview
```

### 2. Configuración de la Base de Datos

#### Paso 1: Configurar Supabase
1. Haz clic en el botón **"Connect to Supabase"** en la esquina superior derecha
2. Crea un nuevo proyecto en Supabase o conecta uno existente
3. Las variables de entorno se configurarán automáticamente

#### Paso 2: Ejecutar Migraciones
Las migraciones se ejecutan automáticamente al conectar Supabase. Incluyen:
- Tabla `loans` para gestión de préstamos
- Tabla `payments` para registro de pagos
- Políticas de seguridad RLS (Row Level Security)

### 3. Estructura de la Base de Datos

#### Tabla `loans`
```sql
- id (uuid): Identificador único
- client_name (text): Nombre del cliente
- amount (decimal): Monto del préstamo
- interest_rate (decimal): Tasa de interés
- payment_frequency (text): Frecuencia de pago
- installments (integer): Número de cuotas
- remaining_balance (decimal): Balance pendiente
- next_payment_date (timestamptz): Fecha del próximo pago
- status (text): Estado del préstamo
- grace_period (integer): Días de gracia antes de mora
```

#### Tabla `payments`
```sql
- id (uuid): Identificador único
- loan_id (uuid): Referencia al préstamo
- amount (decimal): Monto del pago
- payment_date (timestamptz): Fecha del pago
- late_fee_amount (decimal): Monto de mora
- interest_amount (decimal): Monto de interés
- capital_amount (decimal): Monto aplicado al capital
- advance_amount (decimal): Monto de abono extra
```

## 🎯 Cómo Usar la Aplicación

### 1. Autenticación
- Registra una cuenta o inicia sesión
- La autenticación es requerida para acceder a todas las funciones

### 2. Crear un Préstamo
1. Navega a **"+ Nuevo"** desde la pantalla principal
2. Completa la información:
   - Nombre del cliente
   - Monto del préstamo
   - Tasa de interés (%)
   - Número de cuotas (1 para pago único)
   - Frecuencia de pago
   - Días de gracia para moras
3. Para préstamos multi-cuotas, configura si los abonos extra deben recalcular las cuotas

### 3. Gestionar Pagos
1. Selecciona un préstamo de la lista principal
2. En la pantalla de detalles:
   - Ve el desglose automático del pago
   - Ingresa el monto a pagar
   - El sistema calculará automáticamente: mora, interés, capital y abono extra
   - Registra el pago

### 4. Ver Reportes
- Accede a **"Reportes"** para ver:
  - Préstamos creados hoy
  - Total prestado
  - Pagos recibidos
  - Moras acumuladas

## 🧮 Lógica de Cálculos

### Préstamos de Cuota Única (installments = 1)
- **Interés**: Calculado por períodos atrasados
- **Regla del 50%**: Si han transcurrido ≥50% del período, se cobra interés completo
- **Próximo pago**: Fecha actual + período completo al pagar

### Préstamos Multi-Cuotas (installments > 1)
- **Orden de aplicación**: Mora → Interés → Cuota de capital → Abono extra
- **Abonos extra**:
  - **Recalcular**: Reduce el capital y recalcula cuotas restantes
  - **Avance**: Mantiene cuotas originales, aplica como adelanto

### Cálculo de Moras
- Se aplica después del período de gracia
- 1% del balance pendiente por período vencido
- Solo se cobra si el pago está atrasado

## 🔧 Desarrollo y Personalización

### Estructura del Proyecto
```
src/
├── app/
│   ├── components/          # Componentes de la UI
│   │   ├── home/           # Pantalla principal
│   │   ├── new-loan/       # Crear préstamo
│   │   ├── loan-details/   # Detalles y pagos
│   │   ├── reports/        # Reportes
│   │   └── auth/           # Autenticación
│   ├── services/           # Servicios de negocio
│   │   ├── database.service.ts
│   │   ├── payment-calculator.service.ts
│   │   └── auth.service.ts
│   └── models/             # Modelos de datos
│       └── loan.model.ts
```

### Servicios Principales

#### `PaymentCalculatorService`
- Calcula desgloses de pagos
- Maneja lógica de intereses y moras
- Recalcula cuotas cuando se aplican abonos

#### `DatabaseService`
- Gestiona operaciones CRUD con Supabase
- Actualiza préstamos después de pagos
- Mantiene integridad de datos

### Personalización
- Modifica tasas de mora en `PaymentCalculatorService`
- Ajusta períodos de gracia por defecto
- Personaliza frecuencias de pago disponibles

## 🚨 Consideraciones Importantes

### Seguridad
- Todas las tablas tienen Row Level Security (RLS) habilitado
- Los usuarios solo pueden acceder a sus propios datos
- Autenticación requerida para todas las operaciones

### Precisión de Cálculos
- Usa tipos `decimal` para montos monetarios
- Redondeo apropiado en cálculos de interés
- Validación de datos en frontend y backend

### Rendimiento
- Índices en campos frecuentemente consultados
- Consultas optimizadas para reportes
- Carga lazy de datos grandes

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la consola del navegador para errores
2. Verifica la conexión a Supabase
3. Confirma que las migraciones se ejecutaron correctamente

## 🔄 Actualizaciones Futuras

Características planificadas:
- Notificaciones push para pagos vencidos
- Exportación de reportes a PDF
- Integración con sistemas de pago
- Dashboard analítico avanzado

---

**Desarrollado con ❤️ usando NativeScript + Angular + Supabase**