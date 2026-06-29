# 🏥 Sistema Web de Evaluación Anual del Personal de Enfermería

## ISSSTECALI

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-UI-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PDF](https://img.shields.io/badge/PDF-Automático-red?style=for-the-badge&logo=adobeacrobatreader)
![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo-orange?style=for-the-badge)

---

> **Sistema institucional para la evaluación anual del personal de enfermería**

Digitalización completa del proceso de evaluación, generación automática de folios institucionales, cálculo de calificaciones y creación de PDFs idénticos al formato oficial de ISSSTECALI.

---
---

# 📋 Características Principales

## 👥 Administración de Personal

- Registro de empleados
- Edición y eliminación
- Búsqueda rápida
- Categorías laborales
- Turnos:
  - TM
  - TV
  - TNA
  - TNB
  - JAD
  - JAN

---

## 📝 Evaluación Institucional

Sistema basado en un **Wizard de 10 pasos** que permite completar la evaluación de forma ordenada.

### Incluye

✅ Evaluación por competencias

✅ Evaluación mensual

✅ Registro de asistencia

✅ Anecdotario

✅ Observaciones

✅ Firmas

✅ Guardado automático

---

# ⚙️ Cálculo Automático

Las calificaciones son calculadas automáticamente utilizando la tabla institucional.

| Valor | Calificación |
|--------|--------------|
| E | 10 |
| B | 9 |
| R | 8 |
| D | 7 |

El sistema calcula automáticamente:

- Promedios mensuales
- Promedios por sección
- Promedio General
- Totales

Sin necesidad de cálculos manuales.

---

# 🏷 Generación de Folios

Cada evaluación genera un folio único utilizando un contador secuencial.

Ejemplo:

```

ENF-2026-000001
ENF-2026-000002
ENF-2026-000003

```

Características:

- Folio único
- Secuencial
- Sin duplicados
- Basado en año
- Configurable mediante parámetros institucionales

---

# 📄 Generación de PDF

El sistema genera automáticamente un PDF institucional que replica el formato oficial.

Incluye:

- Evaluación completa
- Matriz de calificaciones
- Promedios
- Registro de asistencia
- Anecdotario
- Firmas
- Formato listo para impresión

---

# 📊 Dashboard

Panel principal con indicadores:

- Total de empleados
- Evaluaciones realizadas
- Evaluaciones pendientes
- Borradores
- Promedio general
- Evaluaciones recientes

---

# ⚙️ Configuración

Configuración institucional centralizada.

Permite administrar:

- Prefijo del folio
- Año de evaluación
- Datos institucionales

---

# 🚀 Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| Next.js | Frontend + Backend |
| React | Interfaz |
| MongoDB | Base de datos |
| Tailwind CSS | Diseño |
| pdf-lib | Generación de PDF |
| UUID | Identificadores únicos |

---

# 📁 Estructura del Proyecto

```

📦 nurse_evaluacion

├── app
│   ├── api
│   ├── dashboard
│   ├── empleados
│   ├── evaluaciones
│   └── configuracion
│
├── components
│   ├── eval
│   ├── dashboard
│   └── ui
│
├── lib
│   ├── mongodb.js
│   ├── pdfGenerator.js
│   └── utils.js
│
├── public
│
└── README.md

```

---

# 🔌 API

## Configuración

```

GET    /api/config
PUT    /api/config

```

---

## Empleados

```

GET      /api/employees
POST     /api/employees
PUT      /api/employees/:id
DELETE   /api/employees/:id

```

---

## Evaluaciones

```

GET      /api/evaluations
POST     /api/evaluations
GET      /api/evaluations/:id
PUT      /api/evaluations/:id
DELETE   /api/evaluations/:id

```

---

## Dashboard

```

GET /api/dashboard

```

---

## PDF

```

GET /api/evaluations/:id/pdf

````

---

# 🚀 Instalación

Clonar el repositorio

```bash
git clone https://github.com/Israel8002/nurse_evaluacion.git
````

Entrar al proyecto

```bash
cd nurse_evaluacion
```

Instalar dependencias

```bash
npm install
```

Configurar variables de entorno

```env
MONGODB_URI=

NEXT_PUBLIC_APP_NAME=Sistema de Evaluación
```

Ejecutar

```bash
npm run dev
```

Abrir

```
http://localhost:3000
```

---

# 🎯 Flujo del Sistema

```text
Empleado
      │
      ▼
Nueva Evaluación
      │
      ▼
Generación de Folio
      │
      ▼
Wizard (10 pasos)
      │
      ▼
Cálculo Automático
      │
      ▼
Guardado
      │
      ▼
Generación PDF
      │
      ▼
Impresión
```

---

# ✨ Funcionalidades Destacadas

* ✅ CRUD completo de empleados
* ✅ CRUD de evaluaciones
* ✅ Dashboard estadístico
* ✅ Configuración institucional
* ✅ Generación automática de folios
* ✅ Cálculo automático de promedios
* ✅ Registro de asistencia
* ✅ Anecdotario
* ✅ PDF institucional
* ✅ Diseño responsivo
* ✅ MongoDB
* ✅ Next.js App Router

---

# 📈 Estado del Proyecto

| Módulo        | Estado |
| ------------- | ------ |
| Dashboard     | ✅      |
| Empleados     | ✅      |
| Configuración | ✅      |
| Evaluaciones  | ✅      |
| Wizard        | ✅      |
| PDF           | ✅      |
| API REST      | ✅      |
| MongoDB       | ✅      |

---

# 👨‍💻 Autor

**LSC. Israel Díaz Serrano**

Proyecto desarrollado para la digitalización del proceso de Evaluación Anual del Personal de Enfermería de **ISSSTECALI**.

---

<div align="center">

## ⭐ Si este proyecto te resulta útil, considera darle una estrella al repositorio ⭐

</div>
```
