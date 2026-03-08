# Guía Paso a Paso: Despliegue de Frontend en Vercel

Sigue estos pasos exactos para desplegar tu aplicación Angular en Vercel de forma exitosa.

## Paso 1: Asegurar que los cambios estén en GitHub
Antes de ir a Vercel, asegúrate de que tu local esté sincronizado:
1. Abre una terminal en la carpeta `Frontend`.
2. Ejecuta:
   ```bash
   git add .
   git commit -m "Fix: Config de producción final"
   git push origin Jeyson
   ```

## Paso 2: Importar en Vercel
1. Ve a [Vercel.com](https://vercel.com/) e inicia sesión con GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Busca tu repositorio `Frontend` y haz clic en **"Import"**.

## Paso 3: Configuración del Proyecto (¡IMPORTANTE!)
En la pantalla de configuración (**Configure Project**), ajusta estos campos exactamente:

1. **Framework Preset**: Selecciona `Angular`.
2. **Root Directory**: Déjalo vacío o como `./` (Vercel debería detectar la carpeta raíz).
3. **Build & Development Settings**:
   Haz clic para expandir esta sección y activa los interruptores (**Override**) para cambiar los valores:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/smart-restaurante`  <-- *Escribe esto exactamente*
   - **Install Command**: `npm install`

4. **Node.js Version**:
   - Desplázate hacia abajo hasta **"Settings"** de Vercel (una vez creado el proyecto) o asegúrate de que esté configurado en **Node.js 18.x** o **20.x**.

## Paso 4: Finalizar Despliegue
1. Haz clic en **"Deploy"**.
2. Espera unos 2-3 minutos. Si sale un error de "Build Failed", revisa los logs en Vercel y compártemelos.

## Paso 5: Evitar errores de "404 Not Found" al recargar
Angular es una SPA (Single Page Application). Para que las rutas funcionen al recargar la página en Vercel:
1. Crea un archivo llamado `vercel.json` en la raíz de tu carpeta `Frontend`.
2. Pega este contenido:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Sube este archivo al Git (`git add vercel.json && git commit ... && git push`).

## Paso 6: Configurar CORS en el Backend (Render)
Una vez que Vercel te dé tu URL (ej: `https://frontend-tan.vercel.app`):
1. Ve al panel de **Render.com**.
2. Entra a tu servicio de Backend.
3. Ve a **Environment**.
4. Edita la variable `CORS_ALLOWED_ORIGINS`.
5. Agrega tu URL de Vercel (ej: `http://localhost:4200,https://tu-app.vercel.app`).
6. Guarda los cambios. Render se reiniciará automáticamente.

---
**¿En qué paso exacto te estás quedando o qué error te sale en Vercel?**
