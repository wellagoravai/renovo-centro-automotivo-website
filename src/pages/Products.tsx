import React from 'react';
import './Products.css';

const openVirtualAssistant = () => {
    const chatWindow = document.querySelector('.chat-window');
    const chatButton = document.querySelector<HTMLButtonElement>('.chat-button');

    // Prefer opening the in-page IA/chat if available
    if (chatWindow) {
        (chatWindow as HTMLElement).style.display = '';
        return;
    }

    if (chatButton) {
        chatButton.click();
        return;
    }

    // Fallback: open WhatsApp (loja number provided)
    const whatsappNumber = '551837222388';
    const text = encodeURIComponent('Olá, gostaria de consultar o preço de um produto.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
    window.open(whatsappUrl, '_blank');
};

const Products: React.FC = () => {
    const products = [
        {
            id: '1',
            name: 'Óleo Sintético Premium',
            category: 'Fluidos',
            description: 'Óleo de motor sintético de alta performance para proteção máxima do motor.',
            image: '/assets/products/oleo-sintetico.jpg',
        },
        {
            id: '2',
            name: 'Filtro de Ar',
            category: 'Filtros',
            description: 'Filtro de ar de reposição para melhor fluxo de ar no motor.',
            image: '/assets/products/filtro-ar.jpg',
        },
        {
            id: '3',
            name: 'Pastilhas de Freio',
            category: 'Freios',
            description: 'Pastilhas de freio de cerâmica para segurança e durabilidade.',
            image: '/assets/products/pastilhas-freio.jpg',
        },
        {
            id: '4',
            name: 'Velas de Ignição',
            category: 'Ignição',
            description: 'Velas de ignição de qualidade para melhor desempenho do motor.',
            image: '/assets/products/velas-ignicao.jpg',
        },
    ];

    return (
        <div className="products-page">
            <section className="products-header">
                <h1>Nossos Produtos</h1>
                <p>Conheça nossa seleção de peças e produtos de qualidade para sua manutenção automotiva.</p>
            </section>

            <section className="products-list">
                <div className="container">
                    <div className="products-grid">
                        {products.map((product) => (
                            <div key={product.id} className="product-item">
                                <div className="product-image">
                                    <img src={product.image} alt={product.name} />
                                </div>
                                <div className="product-info">
                                    <h3>{product.name}</h3>
                                    <p className="category">{product.category}</p>
                                    <p className="description">{product.description}</p>
                                    <button type="button" className="button" onClick={openVirtualAssistant}>
                                        🤖 Consultar Preço
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="products-cta">
                <h2>Não encontrou o que procura?</h2>
                <p>Entre em contato conosco e solicite um orçamento personalizado!</p>
                <button className="button">📞 Fale Conosco</button>
            </section>
        </div>
    );
};

export default Products;
