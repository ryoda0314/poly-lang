'use client';

import { useMemo } from 'react';
import { parseIPA } from '@/lib/ipa/ipa-parser';
import SagittalDiagram from './SagittalDiagram';
import LipDiagram from './LipDiagram';
import styles from './ipa-diagrams.module.css';

interface Props {
    ipa: string;
    size?: 'small' | 'large';
    showLabels?: boolean;
}

export default function IPADiagramPair({ ipa, size = 'small', showLabels = false }: Props) {
    const features = useMemo(() => parseIPA(ipa), [ipa]);

    if (!features) return null;

    const px = size === 'large' ? 120 : 64;

    return (
        <div className={`${styles.pair} ${size === 'large' ? styles.large : ''}`}>
            <div className={styles.diagramWrap}>
                <SagittalDiagram features={features} size={px} showLabels={showLabels} />
            </div>
            <div className={styles.diagramWrap}>
                <LipDiagram features={features} size={px} showLabels={showLabels} />
            </div>
        </div>
    );
}
