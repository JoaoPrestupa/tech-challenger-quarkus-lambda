É/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import { BairroResponseDTO } from '../../../../../types/Imobiliario';
import GenericSearchModal from '../../../../../components/GenericSearchModal';
import BairroDetailModal from './detail/BairroDetailModal';

interface BairroSearchFlowProps {
    onClose: () => void;
}

const BairroSearchFlow: React.FC<BairroSearchFlowProps> = ({ onClose }) => {
    const [selectedBairro, setSelectedBairro] = useState<BairroResponseDTO | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [showDetail, setShowDetail] = useState(false);

    const handleSelectBairro = (bairro: BairroResponseDTO) => {
        setSelectedBairro(bairro);
        setShowSearch(false);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setShowSearch(true);
        // NÃƒO resetar selectedBairro para manter o contexto
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        onClose();
    };

    const bairroSearchConfig = {
        title: 'Buscar Bairro',
        placeholder: 'Digite o nome do bairro para buscar',
        searchUrl: 'bairro/all/containing',
        searchField: 'nmbairro',
        displayFields: {
            primary: 'nmbairro',
            secondary: ['cdbairro', 'zona', 'regiao']
        },
        emptyStateMessage: 'Digite o nome do bairro no campo acima para iniciar a busca.\nVocÃª poderÃ¡ visualizar informaÃ§Ãµes detalhadas de cada bairro.',
        loadingMessage: 'Buscando bairros...',
        getItemKey: (bairro: BairroResponseDTO) => bairro.cdbairro
    };

    return (
        <div>
            <GenericSearchModal<BairroResponseDTO>
                isOpen={showSearch}
                onClose={handleCloseSearch}
                onSelectItem={handleSelectBairro}
                config={bairroSearchConfig}
            />
            
            {selectedBairro && (
                <BairroDetailModal
                    isOpen={showDetail}
                    onClose={handleCloseDetail}
                    cdbairro={selectedBairro.cdbairro}
                    nmbairro={selectedBairro.nmbairro}
                />
            )}
        </div>
    );
};

export default BairroSearchFlow;
É2”file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/BairroSearchFlow.tsx