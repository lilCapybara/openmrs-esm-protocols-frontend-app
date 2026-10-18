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

export const PRIV_MANAGE_PROTOCOLOS = 'Manage Protocolos';

/** 20 MB, igual que el límite del backend */
export const TAMANIO_MAXIMO_BYTES = 20 * 1024 * 1024;

export const EXTENSIONES_PERMITIDAS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];

/** Sube un protocolo (multipart). Solo funciona si el usuario tiene "Manage Protocolos". */
export function subirProtocolo(archivo: File, titulo: string, descripcion: string) {
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('titulo', titulo);
  if (descripcion) {
    formData.append('descripcion', descripcion);
  }
  // Con FormData, openmrsFetch no fuerza JSON y el navegador arma el multipart solo
  return openmrsFetch<Protocolo>(`${protocolosUrl}/upload`, { method: 'POST', body: formData });
}

/** Borrado lógico: el protocolo deja de aparecer en la lista */
export function eliminarProtocolo(uuid: string) {
  return openmrsFetch(`${protocolosUrl}/${uuid}`, { method: 'DELETE' });
}

/** Extrae el mensaje de error que manda el backend (si lo hay) */
export function mensajeDeError(error: unknown): string {
  const e = error as { responseBody?: { error?: { message?: string } }; message?: string };
  return e?.responseBody?.error?.message ?? e?.message ?? '';
}
