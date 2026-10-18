import useSWR from 'swr';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

/** Lo que devuelve el backend en GET /ws/rest/v1/protocolo */
export interface Protocolo {
  uuid: string;
  titulo: string;
  descripcion: string | null;
  nombreArchivo: string;
  mimeType: string;
  tamanioBytes: number | null;
  fechaCreacion: string | null;
  creadoPor: string | null;
}

const protocolosUrl = `${restBaseUrl}/protocolo`;

/** Lista de protocolos. SWR la cachea y permite refrescarla con mutate() después de subir/borrar. */
export function useProtocolos() {
  const { data, error, isLoading, mutate } = useSWR<{ data: { results: Array<Protocolo> } }, Error>(
    protocolosUrl,
    openmrsFetch,
  );

  return {
    protocolos: data?.data?.results ?? [],
    error,
    isLoading,
    mutate,
  };
}

/** URL para abrir el archivo en el navegador (usa la sesión del usuario logueado) */
export function urlArchivo(uuid: string) {
  return `${window.openmrsBase}${protocolosUrl}/${uuid}/file`;
}

export function formatearTamanio(bytes: number | null) {
  if (bytes == null) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
