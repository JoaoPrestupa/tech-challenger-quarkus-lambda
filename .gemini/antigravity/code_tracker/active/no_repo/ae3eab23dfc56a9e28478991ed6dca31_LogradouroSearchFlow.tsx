“/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import { LogradouroResponseDTO } from '../../../../../types/Imobiliario';
import GenericSearchModal from '../../../../../components/GenericSearchModal';
import LogradouroDetailModal from './detail/LogradouroDetailModal';

interface LogradouroSearchFlowProps {
    onClose: () => void;
}

const LogradouroSearchFlow: React.FC<LogradouroSearchFlowProps> = ({ onClose }) => {
    const [selectedLogradouro, setSelectedLogradouro] = useState<LogradouroResponseDTO | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [showDetail, setShowDetail] = useState(false);

    const handleSelectLogradouro = (logradouro: LogradouroResponseDTO) => {
        setSelectedLogradouro(logradouro);
        setShowSearch(false);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setShowSearch(true);
        // NÃƒO resetar selectedLogradouro para manter o contexto
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        onClose();
    };

    const logradouroSearchConfig = {
        title: 'Buscar Logradouro',
        placeholder: 'Digite o nome do logradouro para buscar',
        searchUrl: 'logradouro/all/containing',
        searchField: 'nmlogradou',
        displayFields: {
            primary: 'nmlogradou',
            secondary: ['logradouro', 'tipo', 'cep', 'bairro']
        },
        emptyStateMessage: 'Digite o nome do logradouro no campo acima para iniciar a busca.\nVocÃª poderÃ¡ visualizar informaÃ§Ãµes detalhadas de cada logradouro.',
        loadingMessage: 'Buscando logradouros...',
        getItemKey: (logradouro: LogradouroResponseDTO) => logradouro.logradouro || `${logradouro.nmlogradou}-${Math.random()}`
    };

    return (
        <div>
            <GenericSearchModal<LogradouroResponseDTO>
                isOpen={showSearch}
                onClose={handleCloseSearch}
                onSelectItem={handleSelectLogradouro}
                config={logradouroSearchConfig}
            />
            
            {selectedLogradouro && (
                <LogradouroDetailModal
                    isOpen={showDetail}
                    onClose={handleCloseDetail}
                    logradouro={selectedLogradouro.logradouro}
                    nmlogradou={selectedLogradouro.nmlogradou}
                />
            )}
        </div>
    );
};

export default LogradouroSearchFlow;
“2˜file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/LogradouroSearchFlow.tsx