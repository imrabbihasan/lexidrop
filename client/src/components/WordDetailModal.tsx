import React, { useEffect } from 'react';
import type { WordEntry } from '../types';

interface WordDetailModalProps {
    word: WordEntry;
    onClose: () => void;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ word, onClose }) => {

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(5px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
            }}
            onClick={onClose} // Backdrop click closes
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: '30px',
                    maxWidth: '500px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    animation: 'floatIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 15,
                        right: 15,
                        background: 'none',
                        border: 'none',
                        fontSize: 24,
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    ×
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    {word.language && (
                        <div style={{
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            color: '#888',
                            marginBottom: 5
                        }}>
                            {word.language}
                        </div>
                    )}
                    <h2 style={{
                        margin: 0,
                        fontSize: 48,
                        color: '#333',
                        fontFamily: '"Patrick Hand", sans-serif'
                    }}>
                        {word.originalText}
                    </h2>
                    {word.pinyin && (
                        <p style={{ margin: '5px 0 0', fontSize: 18, color: '#666' }}>{word.pinyin}</p>
                    )}
                </div>

                <hr style={{ border: 'none', height: 1, background: '#eee', margin: '20px 0' }} />

                {/* Translations */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: '#999', fontWeight: 'bold' }}>ENGLISH</span>
                        <div style={{ fontSize: 18, color: '#444' }}>{word.translatedText || '...'}</div>
                    </div>
                    {word.secondaryTranslation && (
                        <div>
                            <span style={{ fontSize: 12, color: '#999', fontWeight: 'bold' }}>BANGLA</span>
                            <div style={{ fontSize: 18, color: '#444' }}>{word.secondaryTranslation}</div>
                        </div>
                    )}
                </div>

                {/* Explanation */}
                {word.explanation && (
                    <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 10 }}>
                        <span style={{ fontSize: 12, color: '#999', fontWeight: 'bold', display: 'block', marginBottom: 5 }}>USAGE & MEANING</span>
                        <div style={{ fontSize: 14, lineHeight: 1.5, color: '#555' }}>
                            {word.explanation}
                        </div>
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes floatIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
};

export default WordDetailModal;
