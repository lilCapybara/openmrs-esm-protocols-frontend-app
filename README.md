# openmrs-esm-protocols-frontend-app

Módulo frontend de OpenMRS 3 (O3) para los **protocolos institucionales de atención** de la Residencia
Santa María (requerimiento RF18 de la PPS – TUDAI, UNICEN).

Agrega una pestaña **Protocolos** en el menú lateral de la página de inicio donde el personal ve la lista de
protocolos y abre sus archivos. Quien tenga permiso de gestión además puede subir y eliminar protocolos.

Los datos y archivos los guarda el módulo backend
[openmrs-module-protocolos](https://github.com/lilCapybara/openmrs-module-protocolos); este repo es solo la interfaz.

---

## Qué ve cada usuario

| | Enfermería (`Get Protocolos`) | Administración (`Manage Protocolos`) |
|---|---|---|
| Pestaña "Protocolos" en Inicio | ✅ | ✅ |
| Lista con búsqueda por título/descripción | ✅ | ✅ |
| Botón **Ver** (abre el archivo) | ✅ | ✅ |
| Botón **Subir protocolo** | — | ✅ |
| Ícono de **eliminar** en cada fila | — | ✅ |

Ocultar botones es solo visual: la restricción real la aplica el backend (responde 403 si alguien intenta
subir o borrar sin permiso).

---

## Cómo funciona

```
 Inicio (home)
 └─ menú lateral  ← extensión "protocolos-dashboard-link" en el slot homepage-dashboard-slot
     └─ clic → /openmrs/spa/home/protocolos
         └─ se monta "protocolos-dashboard" (componente Protocolos)
             ├─ useProtocolos()      → GET  /ws/rest/v1/protocolo          (lista, cacheada con SWR)
             ├─ Ver                  → abre /ws/rest/v1/protocolo/{uuid}/file en otra pestaña
             ├─ Subir protocolo      → POST /ws/rest/v1/protocolo/upload   (FormData) → mutate()
             └─ Eliminar             → DELETE /ws/rest/v1/protocolo/{uuid}            → mutate()
```

1. **Registro en O3**: `routes.json` declara una página propia (`/protocolos`) y dos extensiones: el link del
   menú de Inicio y el contenido que se muestra al hacer clic. El link solo se muestra a usuarios con
   `Get Protocolos` (`"privileges"` en `routes.json`).
2. **Lectura**: `useProtocolos()` pide la lista al backend con `openmrsFetch` (envía la sesión del usuario)
   y SWR la guarda en caché.
3. **Escritura**: después de subir o eliminar se llama a `mutate()`, que vuelve a pedir la lista; la tabla se
   actualiza sin recargar la página.
4. **Permisos en pantalla**: `userHasAccess('Manage Protocolos', session.user)` decide si se muestran los
   botones de gestión.

---

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `src/index.ts` | Punto de entrada del módulo: registra la configuración y exporta los componentes que referencia `routes.json` (`root`, `protocolosDashboardLink`, `protocolosDashboard`). |
| `src/routes.json` | Le dice a O3 qué páginas y extensiones aporta el módulo y en qué *slots* se montan. |
| `src/constants.ts` | Nombre del módulo (`@residencia/esm-protocolos-app`). Tiene que coincidir con el `name` de `package.json`. |
| `src/dashboard.meta.ts` | Ruta (`/home/protocolos`), título y slot de la pestaña en Inicio. |
| `src/create-dashboard-link.component.tsx` | Arma el link del menú lateral (mismo patrón que el módulo de turnos de OpenMRS). |
| `src/root.component.tsx` | Página independiente `/openmrs/spa/protocolos` (útil para pruebas). |
| `src/protocolos.component.tsx` | Pantalla principal: tabla, buscador, Ver, botón de subida y confirmación de borrado. |
| `src/subir-protocolo.component.tsx` | Modal de subida: título, descripción, archivo; valida el tamaño (20 MB) y muestra el error del backend si lo rechaza. |
| `src/protocolos.resource.ts` | Todo lo que habla con el backend: tipo `Protocolo`, hook `useProtocolos`, `subirProtocolo`, `eliminarProtocolo`, URL del archivo y utilidades. |
| `src/protocolos.scss` | Estilos de la pantalla y del formulario. |
| `src/config-schema.ts` | Configuración del módulo (sin opciones por ahora). |
| `translations/es.json`, `en.json` | Textos de la interfaz. La residencia usa `es`. |
| `rspack.config.js` | Build con la configuración estándar de OpenMRS. |
| `package.json` | Dependencias y scripts. El campo `browser` define el nombre del bundle (`openmrs-esm-protocols-frontend-app.js`). |
| `.husky/` | Antes de cada commit corre lint y prettier; antes de cada push, los tests. |

Proyecto generado con [`@openmrs/create-o3-app`](https://github.com/openmrs/create-o3-app).

---

## Desarrollo

Requiere Node 20+ y el backend levantado con Docker (con el módulo `protocolos` instalado).

```bash
corepack yarn install
corepack yarn start --backend http://localhost/
```

Abrir **http://localhost:8080/openmrs/spa/home** → pestaña Protocolos. Los cambios se recargan solos
(salvo `routes.json`, que requiere reiniciar `yarn start`).

> Sin `--backend` el servidor de desarrollo usa el demo público de OpenMRS en lugar del backend local.

Otros comandos: `corepack yarn build` (bundle de producción en `dist/`), `corepack yarn test`,
`corepack yarn lint`.

---

## Despliegue

El módulo no está publicado en npm, así que se agrega ya compilado a la imagen del frontend del repo de
despliegue ([Historia-clinica-Residencia-Santa-Maria](https://github.com/lilCapybara/Historia-clinica-Residencia-Santa-Maria)):

```powershell
corepack yarn build
# en el repo de despliegue: reemplazar el build anterior (conservar module.json)
Get-ChildItem "..\PPS Residencia Santa Maria\OpenMRS\frontend\custom-modules\esm-protocolos-app" -Exclude module.json | Remove-Item -Recurse -Force
Copy-Item dist\* "..\PPS Residencia Santa Maria\OpenMRS\frontend\custom-modules\esm-protocolos-app" -Recurse
cd "..\PPS Residencia Santa Maria\OpenMRS"
docker compose up -d --build --force-recreate frontend
docker compose restart gateway
```

Si cambia la versión en `package.json`, actualizarla también en `module.json`.

Qué pasa en ese build (`residencia/frontend.Dockerfile` + `frontend/add-custom-modules.js` del repo de despliegue):

1. Parte de la imagen **oficial** del frontend de OpenMRS.
2. Copia el `dist/` del módulo a la carpeta del SPA.
3. Lo registra en `importmap.json` (dónde está el código) y dentro de la clave `"routes"` de
   `routes.registry.json` (qué páginas/extensiones aporta).
4. Borra las versiones precomprimidas `.gz`/`.br` de esos dos archivos, que quedarían desactualizadas y son
   las que nginx le entrega al navegador.

---

## Problemas conocidos

- **La pestaña no aparece en Docker**: verificar que la imagen no tenga `importmap.json.gz` / `.br`
  (`docker exec openmrs-frontend-1 ls /usr/share/nginx/html | Select-String importmap`). `curl` recibe el
  `.json` sin comprimir y puede dar la falsa impresión de que todo está bien.
- **Login que rebota en `localhost:8080`**: `localhost` y `localhost:8080` comparten la cookie de sesión.
  Usar una sola de las dos a la vez, o borrar las cookies de `localhost`.
- **Usuario de prueba que no puede entrar**: además de `Protocolos: Consulta`, necesita un rol con los
  permisos básicos de O3 (por ejemplo `Enfermeria`).
- **Archivos que "vuelven" a una versión anterior**: si un archivo está abierto en IntelliJ mientras se
  modifica desde afuera, el editor puede pisarlo al guardar. Recargarlo desde disco antes de seguir.
