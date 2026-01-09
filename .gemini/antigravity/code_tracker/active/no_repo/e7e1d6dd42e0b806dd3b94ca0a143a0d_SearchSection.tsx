’/** @jsx jsx */
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
        title: 'Pesquisar BIC por SQLS',
        placeholder: 'Digite o SQLS do lote...',
        searchUrl: 'lote-fisico/search/sqls',
        searchField: 'sqls',
        displayFields: {
            primary: 'sqls',
            secondary: ['inscrmunic', 'lote', 'quadra', 'setor']
        },
        emptyStateMessage: 'Nenhum lote encontrado para este SQLS',
        loadingMessage: 'Buscando lotes...',
        getItemKey: (item: any) => item.sqls || item.SQLS || String(item.OBJECTID || Math.random()),
        minSearchLength: 1
    };

    const handleSelect = (item: any) => {
        setShowSearch(false);
        onSelectBic(item);
    };

    const searchButtonStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        backgroundColor: '#3b82f6',
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
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
                }}
            >
                <img src={SearchIcon} alt="Pesquisar" style={{ width: '20px', height: '20px' }} />
                <span>Pesquisar BIC por SQLS</span>
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
’2{file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/bic/src/runtime/components/SearchSection.tsx