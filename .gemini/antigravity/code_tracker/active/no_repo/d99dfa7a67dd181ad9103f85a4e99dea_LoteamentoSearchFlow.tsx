ï/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import { CILoteamentoResponseDTO } from '../../../../../types/Imobiliario';
import { LoteamentoSearchModal } from './LoteamentoSearchModal';
import LoteamentoDetailModal from './detail/LoteamentoDetailModal';

interface LoteamentoSearchFlowProps {
    onClose: () => void;
}

const LoteamentoSearchFlow: React.FC<LoteamentoSearchFlowProps> = ({ onClose }) => {
    const [selectedLoteamento, setSelectedLoteamento] = useState<CILoteamentoResponseDTO | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [showDetail, setShowDetail] = useState(false);

    const handleSelectLoteamento = (loteamento: CILoteamentoResponseDTO) => {
        setSelectedLoteamento(loteamento);
        setShowSearch(false);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setShowSearch(true);
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        onClose();
    };

    return (
        <div>
            <LoteamentoSearchModal
                isOpen={showSearch}
                onClose={handleCloseSearch}
                onSelectLoteamento={handleSelectLoteamento}
            />

            {showDetail && selectedLoteamento && (
                <LoteamentoDetailModal
                    isOpen={showDetail}
                    loteamento={selectedLoteamento}
                    onClose={handleCloseDetail}
                />
            )}
        </div>
    );
};

export default LoteamentoSearchFlow;
ï2˜file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/LoteamentoSearchFlow.tsx