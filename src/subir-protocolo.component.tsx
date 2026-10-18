import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUploader, InlineNotification, Modal, TextArea, TextInput } from '@carbon/react';
import { showSnackbar } from '@openmrs/esm-framework';
import { EXTENSIONES_PERMITIDAS, TAMANIO_MAXIMO_BYTES, mensajeDeError, subirProtocolo } from './protocolos.resource';
import styles from './protocolos.scss';

interface SubirProtocoloProps {
  abierto: boolean;
  onCerrar: () => void;
  onSubido: () => void;
}

const SubirProtocolo: React.FC<SubirProtocoloProps> = ({ abierto, onCerrar, onSubido }) => {
  const { t } = useTranslation();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Cambiar la key reinicia el FileUploader (Carbon no permite vaciarlo de otra forma)
  const [uploaderKey, setUploaderKey] = useState(0);

  const limpiar = () => {
    setTitulo('');
    setDescripcion('');
    setArchivo(null);
    setError('');
    setUploaderKey((k) => k + 1);
  };

  const cerrar = () => {
    limpiar();
    onCerrar();
  };

  const alElegirArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const elegido = event.target.files?.[0] ?? null;
    setError('');
    if (elegido && elegido.size > TAMANIO_MAXIMO_BYTES) {
      setError(t('archivoMuyGrande', 'El archivo supera el máximo de 20 MB.'));
      setArchivo(null);
      return;
    }
    setArchivo(elegido);
    // Si todavía no escribió un título, proponemos el nombre del archivo sin extensión
    if (elegido && !titulo) {
      setTitulo(elegido.name.replace(/\.[^.]+$/, ''));
    }
  };

  const enviar = async () => {
    if (!archivo || !titulo.trim()) {
      setError(t('faltanDatos', 'Completá el título y elegí un archivo.'));
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await subirProtocolo(archivo, titulo.trim(), descripcion.trim());
      showSnackbar({
        kind: 'success',
        title: t('protocoloSubido', 'Protocolo cargado'),
        subtitle: titulo.trim(),
      });
      limpiar();
      onSubido();
    } catch (e) {
      setError(mensajeDeError(e) || t('errorSubiendo', 'No se pudo subir el protocolo.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={abierto}
      modalHeading={t('subirProtocolo', 'Subir protocolo')}
      primaryButtonText={enviando ? t('subiendo', 'Subiendo...') : t('guardar', 'Guardar')}
      secondaryButtonText={t('cancelar', 'Cancelar')}
      primaryButtonDisabled={enviando || !archivo || !titulo.trim()}
      onRequestSubmit={enviar}
      onRequestClose={cerrar}
      preventCloseOnClickOutside
    >
      <div className={styles.formulario}>
        <TextInput
          id="protocolo-titulo"
          labelText={t('titulo', 'Título')}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={255}
        />
        <TextArea
          id="protocolo-descripcion"
          labelText={t('descripcionOpcional', 'Descripción (opcional)')}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={1000}
          rows={3}
        />
        <FileUploader
          key={uploaderKey}
          labelTitle={t('archivo', 'Archivo')}
          labelDescription={t('archivosPermitidos', 'PDF, imágenes (PNG/JPG) o Word. Máximo 20 MB.')}
          buttonLabel={t('elegirArchivo', 'Elegir archivo')}
          buttonKind="tertiary"
          accept={EXTENSIONES_PERMITIDAS}
          filenameStatus="edit"
          multiple={false}
          onChange={alElegirArchivo}
          onDelete={() => setArchivo(null)}
        />
        {error && (
          <InlineNotification kind="error" lowContrast hideCloseButton title={t('error', 'Error')} subtitle={error} />
        )}
      </div>
    </Modal>
  );
};

export default SubirProtocolo;
