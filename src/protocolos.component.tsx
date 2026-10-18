import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  InlineNotification,
  Layer,
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
import { View } from '@carbon/react/icons';
import { formatDate } from '@openmrs/esm-framework';
import { formatearTamanio, urlArchivo, useProtocolos } from './protocolos.resource';
import styles from './protocolos.scss';

const Protocolos: React.FC = () => {
  const { t } = useTranslation();
  const { protocolos, error, isLoading } = useProtocolos();
  const [busqueda, setBusqueda] = useState('');

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
    </div>
  );
};

export default Protocolos;
