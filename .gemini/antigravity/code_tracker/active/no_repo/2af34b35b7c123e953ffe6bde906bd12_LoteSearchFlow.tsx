©/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import { LoteFisicoResponseDTO } from '../../../../../types/Imobiliario';
import LoteSearchModal from './LoteSearchModal';
import LoteDetailModal from './detail/LoteDetailModal';

interface LoteSearchFlowProps {
    onClose: () => void;
}

const LoteSearchFlow: React.FC<LoteSearchFlowProps> = ({ onClose }) => {
    const [selectedLote, setSelectedLote] = useState<LoteFisicoResponseDTO | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [showDetail, setShowDetail] = useState(false);

    const handleSelectLote = (lote: LoteFisicoResponseDTO) => {
        setSelectedLote(lote);
        setShowSearch(false);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setShowSearch(true);
        // NÃƒO resetar selectedLote para manter o contexto
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        onClose();
    };

    return (
        <div>
            <LoteSearchModal
                isOpen={showSearch}
                onClose={handleCloseSearch}
                onSelectItem={handleSelectLote}
            />

            {showDetail && selectedLote && (
                <LoteDetailModal
                    isOpen={showDetail}
                    lote={selectedLote.lote}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
    );
};

export default LoteSearchFlow;
©2’file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/LoteSearchFlow.tsx