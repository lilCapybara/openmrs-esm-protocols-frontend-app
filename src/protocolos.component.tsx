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
          <h1 className={styles.heading}>
            {t('protocolosHeading', 'Protocolos')}
          </h1>
          <p className={styles.content}>
            {t('protocolosDescription', 'Welcome to the Protocolos page.')}
          </p>
        </Tile>
      </Layer>
    </div>
  );
};

export default Protocolos;