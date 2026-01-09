 /** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import { CIProprietarioResponseDTO } from '../../../../../types/Imobiliario';
import { ProprietarioModalScreen } from './ContribuinteModalScreen';
import { ProprietarioSearchModal } from './SearchModal';

interface ProprietarioSearchFlowProps {
    onClose: () => void;
}

const ProprietarioSearchFlow: React.FC<ProprietarioSearchFlowProps> = ({ onClose }) => {
    const [selectedContribuinte, setSelectedContribuinte] = useState<CIProprietarioResponseDTO | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [showDetail, setShowDetail] = useState(false);

    const handleSelectContribuinte = (contribuinte: CIProprietarioResponseDTO) => {
        setSelectedContribuinte(contribuinte);
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
            <ProprietarioSearchModal
                isOpen={showSearch}
                onClose={handleCloseSearch}
                
                onSelectContribuinte={handleSelectContribuinte}
            />
            
            {selectedContribuinte && (
                <ProprietarioModalScreen
                    isOpen={showDetail}
                    onClose={handleCloseDetail}
                    contribuinte={selectedContribuinte}
                />
            )}
        </div>
    );
};

export default ProprietarioSearchFlow;
ð	 ð	‚

‚
  2šfile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/ProprietarioSearchFlow.tsx