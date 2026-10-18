import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  InlineNotification,
  Layer,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tile,
} from '@carbon/react';
import { Add, TrashCan, View } from '@carbon/react/icons';
import { formatDate, showSnackbar, useSession, userHasAccess } from '@openmrs/esm-framework';
import {
  PRIV_MANAGE_PROTOCOLOS,
  type Protocolo,
  eliminarProtocolo,
  formatearTamanio,
  mensajeDeError,
  urlArchivo,
  useProtocolos,
} from './protocolos.resource';
import SubirProtocolo from './subir-protocolo.component';
import styles from './protocolos.scss';

const Protocolos: React.FC = () => {
  const { t } = useTranslation();
  const session = useSession();
  const { protocolos, error, isLoading, mutate } = useProtocolos();
  const [busqueda, setBusqueda] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [aEliminar, setAEliminar] = useState<Protocolo | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Solo cambia lo que se muestra; la seguridad real la aplica el backend
  const puedeGestionar = Boolean(session?.user && userHasAccess(PRIV_MANAGE_PROTOCOLOS, session.user));

  // Filtro en el navegador por título o descripción (la lista es chica)
  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return protocolos;
    }
    return protocolos.filter(
      (p) => p.titulo.toLowerCase().includes(termino) || (p.descripcion ?? '').toLowerCase().includes(termino),
    );
  }, [protocolos, busqueda]);

  const confirmarEliminacion = async () => {
    if (!aEliminar) {
      return;
    }
    setEliminando(true);
    try {
      await eliminarProtocolo(aEliminar.uuid);
      showSnackbar({
        kind: 'success',
        title: t('protocoloEliminado', 'Protocolo eliminado'),
        subtitle: aEliminar.titulo,
      });
      setAEliminar(null);
      mutate();
    } catch (e) {
      showSnackbar({
        kind: 'error',
        title: t('errorEliminando', 'No se pudo eliminar el protocolo'),
        subtitle: mensajeDeError(e),
      });
    } finally {
      setEliminando(false);
    }
  };

  const headers = [
    { key: 'titulo', header: t('titulo', 'Título') },
    { key: 'descripcion', header: t('descripcion', 'Descripción') },
    { key: 'archivo', header: t('archivo', 'Archivo') },
    { key: 'fecha', header: t('fechaCarga', 'Fecha de carga') },
    { key: 'acciones', header: '' },
  ];

  const rows = filtrados.map((p) => ({
    id: p.uuid,
    titulo: p.titulo,
    descripcion: p.descripcion ?? '',
    archivo: `${p.nombreArchivo} (${formatearTamanio(p.tamanioBytes)})`,
    fecha: p.fechaCreacion ? formatDate(new Date(p.fechaCreacion), { mode: 'standard', time: false }) : '',
    acciones: (
      <div className={styles.acciones}>
        <Button
          kind="ghost"
          size="sm"
          renderIcon={View}
          href={urlArchivo(p.uuid)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('ver', 'Ver')}
        </Button>
        {puedeGestionar && (
          <Button
            kind="danger--ghost"
            size="sm"
            hasIconOnly
            renderIcon={TrashCan}
            iconDescription={t('eliminar', 'Eliminar')}
            tooltipPosition="left"
            onClick={() => setAEliminar(p)}
          />
        )}
      </div>
    ),
  }));

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{t('protocolosHeading', 'Protocolos institucionales')}</h1>
      <p className={styles.content}>
        {t('protocolosDescription', 'Consulte los protocolos de atención de la residencia.')}
      </p>

      {isLoading ? (
        <DataTableSkeleton role="progressbar" columnCount={headers.length} rowCount={5} showHeader={false} />
      ) : error ? (
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title={t('errorCargando', 'No se pudieron cargar los protocolos')}
          subtitle={error.message}
        />
      ) : (
        <DataTable rows={rows} headers={headers} size="md" useZebraStyles>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    persistent
                    placeholder={t('buscarProtocolo', 'Buscar por título o descripción')}
                    onChange={(e) => setBusqueda(typeof e === 'string' ? e : e.target.value)}
                  />
                  {puedeGestionar && (
                    <Button kind="primary" renderIcon={Add} onClick={() => setSubiendo(true)}>
                      {t('subirProtocolo', 'Subir protocolo')}
                    </Button>
                  )}
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length === 0 && (
                <Layer>
                  <Tile className={styles.vacio}>
                    {busqueda
                      ? t('sinResultados', 'Ningún protocolo coincide con la búsqueda.')
                      : t('sinProtocolos', 'Todavía no hay protocolos cargados.')}
                  </Tile>
                </Layer>
              )}
            </TableContainer>
          )}
        </DataTable>
      )}

      {puedeGestionar && (
        <>
          <SubirProtocolo
            abierto={subiendo}
            onCerrar={() => setSubiendo(false)}
            onSubido={() => {
              setSubiendo(false);
              mutate();
            }}
          />
          <Modal
            danger
            open={Boolean(aEliminar)}
            modalHeading={t('eliminarProtocolo', 'Eliminar protocolo')}
            primaryButtonText={eliminando ? t('eliminando', 'Eliminando...') : t('eliminar', 'Eliminar')}
            secondaryButtonText={t('cancelar', 'Cancelar')}
            primaryButtonDisabled={eliminando}
            onRequestSubmit={confirmarEliminacion}
            onRequestClose={() => setAEliminar(null)}
          >
            <p>
              {t(
                'confirmarEliminar',
                '¿Seguro que querés eliminar "{{titulo}}"? Dejará de estar visible para el personal.',
                {
                  titulo: aEliminar?.titulo ?? '',
                },
              )}
            </p>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Protocolos;
