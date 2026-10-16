import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, Tile } from '@carbon/react';
import styles from './protocolos.scss';

const Protocolos: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Layer>
        <Tile className={styles.tile}>
          <h1 className={styles.heading}>{t('protocolosHeading', 'Protocolos institucionales')}</h1>
          <p className={styles.content}>
            {t('protocolosDescription', 'Consulte los protocolos de atención de la residencia.')}
          </p>
        </Tile>
      </Layer>
    </div>
  );
};

export default Protocolos;
