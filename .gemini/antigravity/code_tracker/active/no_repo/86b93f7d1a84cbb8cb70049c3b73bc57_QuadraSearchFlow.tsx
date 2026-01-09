�/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import { QuadraResponseDTO } from '../../../../../types/Imobiliario';
import GenericSearchModal from '../../../../../components/GenericSearchModal';
import QuadraDetailModal from './detail/QuadraDetailModal';
import { LoteFisico } from '../../../../../widgets/types/LoteFisico';
import { useQuadra } from '../hooks/useQuadra';

interface QuadraSearchFlowProps {
    onClose: () => void;
}

const QuadraSearchFlow: React.FC<QuadraSearchFlowProps> = ({ onClose }) => {
    const [selectedQuadra, setSelectedQuadra] = useState<LoteFisico | null>(null);
    const [showSearch, setShowSearch] = useState(true);
    const [showDetail, setShowDetail] = useState(false);
    const { searchWithMultipleFilters } = useQuadra();

    const handleSelectQuadra = (quadra: LoteFisico) => {
        setSelectedQuadra(quadra);
        setShowSearch(false);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setShowSearch(true);
        // NÃO resetar selectedQuadra para manter o contexto
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        onClose();
    };

    const quadraSearchConfig = {
        title: 'Buscar Quadra',
        placeholder: 'Digite o número da quadra para buscar',
        searchUrl: 'lote-fisico/findAllContaining/quadra',
        searchField: 'quadra',
        displayFields: {
            primary: 'quadra',
            secondary: ['setor', 'lote', 'logradouro']
        },
        emptyStateMessage: 'Digite o número da quadra no campo acima para iniciar a busca.\nVocê poderá visualizar informações detalhadas de cada quadra.',
        loadingMessage: 'Buscando quadras...',
        getItemKey: (quadra: LoteFisico) => quadra.quadra || `${Math.random()}`,
        enableSubFilters: true,
        subFilterOptions: [
            { field: 'setor', label: 'Setor' },
            { field: 'lote', label: 'Lote' },
            { field: 'logradouro', label: 'Logradouro' }
        ],
        onSubFilterSearch: searchWithMultipleFilters
    };

    return (
        <div>
            <GenericSearchModal<LoteFisico>
                isOpen={showSearch}
                onClose={handleCloseSearch}
                onSelectItem={handleSelectQuadra}
                config={quadraSearchConfig}
            />

            {showDetail && selectedQuadra && (
                <QuadraDetailModal
                    isOpen={showDetail}
                    quadra={selectedQuadra.quadra}
                    onClose={handleCloseDetail}
                    loteFisico={selectedQuadra}
                />
            )}
        </div>
    );
};

export default QuadraSearchFlow;
� 2�file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/QuadraSearchFlow.tsx