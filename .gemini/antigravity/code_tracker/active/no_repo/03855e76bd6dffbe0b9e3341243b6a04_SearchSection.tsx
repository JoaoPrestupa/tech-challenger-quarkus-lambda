�4/** @jsx jsx */
import { jsx } from 'jimu-core';
import { useState } from 'react';
//@ts-ignore
import SearchIcon from '../../../../../assets/lupa.png';

interface SearchSectionProps {
    onSelectBic: (item: any) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSelectBic }) => {
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [inscricao, setInscricao] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSearch = () => {
        if (!inscricao || inscricao.trim().length === 0) {
            setError('Digite uma inscrição válida');
            return;
        }

        // Remover pontos da inscrição
        const inscricaoSemPontos = inscricao.replace(/\./g, '');

        // Fechar modal e passar a inscrição para o componente pai processar
        setShowSearchModal(false);
        setInscricao('');
        setError(null);

        onSelectBic({
            inscricao: inscricao, // Inscrição com pontos para exibição
            inscricaoSemPontos // Inscrição sem pontos para API
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
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

    const modalOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    };

    const modalContentStyle: React.CSSProperties = {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px',
        outline: 'none'
    };

    const buttonGroupStyle: React.CSSProperties = {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
    };

    const secondaryButtonStyle: React.CSSProperties = {
        padding: '10px 20px',
        backgroundColor: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    };

    const primaryButtonStyle: React.CSSProperties = {
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    };

    return (
        <div>
            <button
                style={searchButtonStyle}
                onClick={() => setShowSearchModal(true)}
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
                <span>Pesquisar BIC por Inscrição</span>
            </button>

            {showSearchModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                            🔍 Pesquisar BIC por Inscrição
                        </h2>

                        <input
                            type="text"
                            value={inscricao}
                            onChange={(e) => setInscricao(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Digite a inscrição (ex: 115.267.0271)"
                            style={inputStyle}
                            autoFocus
                        />

                        {error && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '6px',
                                marginBottom: '20px',
                                fontSize: '14px'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={buttonGroupStyle}>
                            <button
                                onClick={() => {
                                    setShowSearchModal(false);
                                    setInscricao('');
                                    setError(null);
                                }}
                                style={secondaryButtonStyle}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSearch}
                                style={primaryButtonStyle}
                            >
                                Pesquisar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchSection;
�4 2�file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/bic-soap/src/runtime/components/SearchSection.tsx