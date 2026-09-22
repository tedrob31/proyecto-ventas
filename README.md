# 🛍️ Sistema de Registro de Ventas e Inventario

Un sistema moderno, ultra-rápido y portable diseñado para el control de inventario, registro simultáneo de ventas y visualización de ranking de asesoras mediante metas escalonadas.

## 🚀 Tecnologías y Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Node.js >= 20.x)
- **Lenguaje**: TypeScript
- **Estilos y UI**: Tailwind CSS (Dark Mode nativo) e Íconos de `lucide-react`.
- **Gestión de Estado**: [Zustand](https://zustand-demo.pmnd.rs/) (Sincronizado y cacheado en Local Storage)
- **Base de Datos / Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Contenedorización**: Docker (Imagen Alpine ultraligera `node:20-alpine`)
- **CI/CD**: GitHub Actions (Subida a `ghcr.io`)
- **Despliegue y Enrutamiento**: Portainer, Traefik (Docker Compose)

## ✨ Arquitectura Destacada

- **Arquitectura B.O.D.A. (Build Once, Deploy Anywhere)**: El contenedor de Docker se compila sin quemar variables de entorno (`NEXT_PUBLIC_`). El `layout.tsx` inyecta las variables de entorno en tiempo de ejecución (`Run Time`), lo que permite que una sola imagen se pueda desplegar en cualquier servidor simplemente cambiando las variables de Portainer.
- **Autenticación Rápida (Custom)**: Login validado por PIN directamente contra la base de datos (Diseñado para herramientas internas, bypass de Supabase Auth).
- **Concurrencia Segura**: Generación de identificadores universales (UUID) que permite a múltiples asesoras registrar ventas simultáneamente en el último segundo del mes sin que haya choques en la base de datos.
- **Optimizaciones de Carga**: Renderizado inteligente y persistencia local de sesión.

## 🛠️ Desarrollo Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tedrob31/proyecto-ventas.git
   cd proyecto-ventas
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Variables de Entorno:
   Crea un archivo `.env.local` en la raíz (puedes basarte en `.env.example`) y agrega tus llaves de Supabase:
   ```env
   SUPABASE_URL=https://tu-url.supabase.co
   SUPABASE_ANON_KEY=tu-llave-anonima
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🐳 Despliegue en Producción (Portainer)

Este proyecto está preparado para automatizarse mediante **GitHub Actions**.

1. Haz un `push` a la rama `main`.
2. Github Actions construirá y empujará la imagen estática automáticamente a `ghcr.io/tedrob31/proyecto-ventas:main`.
3. En **Portainer**, crea un nuevo *Stack* cargando el repositorio de Github.
4. En las variables de entorno (*Environment variables*) o `stack.env` de Portainer, define:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL real de Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu llave anónima.
   - `DOMAIN_NAME`: El dominio en el que responderá Traefik (ej. `ventas.tudominio.com`).
5. Despliega el Stack y Traefik generará el certificado Let's Encrypt automáticamente.
