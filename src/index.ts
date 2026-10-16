import { getAsyncLifecycle, getSyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';
import { createDashboardLink } from './create-dashboard-link.component';
import { protocolosDashboardMeta } from './dashboard.meta';

const options = {
  featureName: 'protocolos',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Página independiente: /openmrs/spa/protocolos
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Extensions

// t('protocolos', 'Protocolos')
// Link "Protocolos" en el menú lateral de inicio
export const protocolosDashboardLink = getSyncLifecycle(createDashboardLink(protocolosDashboardMeta), options);

// Contenido que se muestra en /home/protocolos
export const protocolosDashboard = getAsyncLifecycle(() => import('./protocolos.component'), options);

// Modals

// Workspaces
