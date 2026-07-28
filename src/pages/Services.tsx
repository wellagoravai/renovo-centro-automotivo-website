import React from 'react';
import './Services.css';

const COMPANY_PHONE = '+551837222388';
const COMPANY_PHONE_DISPLAY = '+55 (18) 3722-2388';

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
    const text = encodeURIComponent('Olá, quero solicitar um serviço.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
    window.open(whatsappUrl, '_blank');
};

const handleCallNow = () => {
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    if (isMobileDevice) {
        window.location.href = `tel:${COMPANY_PHONE}`;
    } else {
        alert(`Ligue para nós: ${COMPANY_PHONE_DISPLAY}`);
    }
};

const Services: React.FC = () => {
    const services = [
        {
            id: '1',
            name: 'Manutenção Preventiva',
            icon: '🛠️',
            description: 'Mantenha seu veículo sempre em perfeito estado com nossa manutenção preventiva especializada.',
            details: 'Troca de óleo, verificação de filtros, inspeção de pastilhas e revisão geral.',
        },
        {
            id: '2',
            name: 'Reparos Gerais',
            icon: '🔧',
            description: 'Reparamos qualquer tipo de problema no seu veículo com técnicos experientes.',
            details: 'Reparação de motor, câmbio, suspensão e outros sistemas.',
        },
        {
            id: '3',
            name: 'Diagnóstico Completo',
            icon: '🔍',
            description: 'Utilizamos equipamentos de diagnóstico de última geração.',
            details: 'Identificamos problemas precisamente com scanner automotivo de alta precisão.',
        },
        {
            id: '4',
            name: 'Alinhamento e Balanceamento',
            icon: '⚙️',
            description: 'Garantimos alinhamento e balanceamento com máquinas de precisão.',
            details: 'Melhora na segurança, conforto e desempenho do seu veículo.',
        },
        {
            id: '5',
            name: 'Freios e Pastilhas',
            icon: '🛑',
            description: 'Sistema de freios em perfeito estado para sua segurança.',
            details: 'Revisão, troca de pastilhas e sangria de freios.',
        },
        {
            id: '6',
            name: 'Suspensão',
            icon: '🚗',
            description: 'Garantimos conforto e estabilidade do seu veículo.',
            details: 'Inspeção e reparação de amortecedores e molas.',
        },
        {
            id: '7',
            name: 'Gasolina, Álcool e Diesel',
            icon: '⛽',
            description: 'Atendemos todos os tipos de veículo, seja qual for a motorização.',
            details: 'Técnicos preparados para veículos flex, a álcool e a diesel.',
        },
        {
            id: '8',
            name: 'Troca de Óleo (Motor e Câmbio)',
            icon: '🛢️',
            description: 'Troca de óleo de motor e de câmbio manual com produtos de qualidade.',
            details: 'Utilizamos óleos recomendados pelo fabricante para cada modelo.',
        },
        {
            id: '9',
            name: 'Elétrica Automotiva',
            icon: '⚡',
            description: 'Diagnóstico e reparo de sistemas elétricos do seu veículo.',
            details: 'Bateria, alternador, sensores, injeção eletrônica e fiação.',
        },
        {
            id: '10',
            name: 'Ar Condicionado Veicular',
            icon: '❄️',
            description: 'Ar condicionado gelado e higienizado o ano todo.',
            details: 'Higienização, recarga de gás e reparo de componentes.',
        },
        {
            id: '11',
            name: 'Sistema de Arrefecimento',
            icon: '🌡️',
            description: 'Evite o superaquecimento do motor com revisões periódicas.',
            details: 'Radiador, mangueiras, bomba d’água e fluido de arrefecimento.',
        },
        {
            id: '12',
            name: 'Resgate de Veículos',
            icon: '🚨',
            description: 'Seu carro quebrou na estrada? A gente te socorre.',
            details: 'Serviço de resgate para veículos com pane ou quebrados.',
        },
    ];

    return (
        <div className="services-page">
            <section className="services-header">
                <h1>Nossos Serviços</h1>
                <p>Conheça a gama completa de serviços da Renovo Centro Automotivo</p>
            </section>

            <section className="services-content">
                <div className="container">
                    <div className="services-grid">
                        {services.map((service) => (
                            <div key={service.id} className="service-box">
                                <div className="service-box-header">
                                    <div className="service-icon">{service.icon}</div>
                                    <h3>{service.name}</h3>
                                </div>
                                <p className="description">{service.description}</p>
                                <div className="details-box">
                                    <span className="details-label">O que inclui</span>
                                    <p className="details">{service.details}</p>
                                </div>
                                <button type="button" className="button" onClick={openVirtualAssistant}>
                                    🤖 Solicitar Serviço
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="services-cta">
                <h2>Agende seu Serviço Agora</h2>
                <p>Ligue para nós ou use nosso chat para agendar um horário que seja conveniente para você.</p>
                <div className="cta-buttons">
                    <button type="button" className="button" onClick={handleCallNow}>
                        📞 Ligar Agora
                    </button>
                    <button type="button" className="button secondary-button" onClick={openVirtualAssistant}>
                        💬 Usar Chat
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Services;
