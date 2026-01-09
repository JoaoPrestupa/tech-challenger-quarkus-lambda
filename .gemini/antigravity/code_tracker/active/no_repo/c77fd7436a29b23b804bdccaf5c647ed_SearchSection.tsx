ÿ/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
import GenericSearchModal from '../../../../../components/GenericSearchModal';
//@ts-ignore
import SearchIcon from '../../../../../assets/lupa.png';

interface SearchSectionProps {
    onSelectBic: (item: any) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSelectBic }) => {
    const [showSearch, setShowSearch] = useState(false);

    const searchConfig = {
        title: 'Pesquisar BIC por InscriÃ§Ã£o',
        placeholder: 'Digite a inscriÃ§Ã£o do imÃ³vel...',
        searchUrl: 'cadastro-imobiliario-geral/all/pageable/containing',
        searchField: 'inscricao',
        displayFields: {
            primary: 'inscricao',
            secondary: ['cadastro', 'situacao', 'dataCadastro']
        },
        emptyStateMessage: 'Nenhum cadastro encontrado',
        loadingMessage: 'Buscando cadastros...',
        getItemKey: (item: any) => item.inscricao || String(item.idGeral || Math.random()),
        minSearchLength: 1,
        backendPort: 8081,
        useQueryString: true
    };

    const handleSelect = (item: any) => {
        setShowSearch(false);
        onSelectBic(item);
    };

    const searchButtonStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        backgroundColor: '#55CFED',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
        transition: 'all 0.3s ease'
    };

    return (
        <div>
            <button
                style={searchButtonStyle}
                onClick={() => setShowSearch(true)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3099D3';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#55CFED';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
                }}
            >
                <img src={SearchIcon} alt="Pesquisar" style={{ width: '20px', height: '20px' }} />
                <span>Pesquisar BIC por InscriÃ§Ã£o teste</span>
            </button>

            {showSearch && (
                <GenericSearchModal
                    isOpen={showSearch}
                    onClose={() => setShowSearch(false)}
                    onSelectItem={handleSelect}
                    config={searchConfig}
                />
            )}
        </div>
    );
};

export default SearchSection;
á
 á
ç

ç
à 
àæ 
æŒ Œ’
’ô ôú
úÿ 2€file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/bic-rest/src/runtime/components/SearchSection.tsx