import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { ADDRESS, WHATSAPP_PHONE_1 } from '../utils/constants';
import './TowService.css';

// Mesmo número do Perfil da Empresa no Google.
const TOW_PHONE = WHATSAPP_PHONE_1;
const TOW_PHONE_DIGITS = `55${TOW_PHONE.replace(/\D/g, '')}`;
const WHATSAPP_TEXT = 'Olá! Preciso de um guincho. Meu veículo está em:';

const TowService: React.FC = () => {
    usePageMeta(
        'Guincho 24h em Andradina/SP | Renovo Guincho',
        'Precisa de guincho em Andradina/SP? A Renovo Guincho atende 24 horas veículos leves e pesados, na cidade e na estrada. Ligue ou chame no WhatsApp.'
    );

    return (
        <div className="tow-service-page">
            <section className="tow-service-hero">
                <h1>Guincho 24h em Andradina/SP</h1>
                <p>Seu veículo quebrou? A Renovo Guincho atende 24 horas, em Andradina e região.</p>
                <div className="tow-service-actions">
                    <a className="tow-service-cta" href={`tel:+${TOW_PHONE_DIGITS}`}>
                        Ligar: {TOW_PHONE}
                    </a>
                    <a
                        className="tow-service-cta tow-service-cta-whatsapp"
                        href={`https://wa.me/${TOW_PHONE_DIGITS}?text=${encodeURIComponent(WHATSAPP_TEXT)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Chamar no WhatsApp
                    </a>
                </div>
            </section>

            <section className="tow-service-content">
                <div className="tow-service-grid">
                    <div className="tow-service-card">
                        <h2>O que fazemos</h2>
                        <ul>
                            <li>Remoção de veículos com pane ou quebrados</li>
                            <li>Atendimento na cidade e na estrada</li>
                            <li>Guincho para veículos leves e pesados</li>
                        </ul>
                    </div>

                    <div className="tow-service-card">
                        <h2>O que informar ao chamar</h2>
                        <ul>
                            <li>Onde o veículo está</li>
                            <li>Para onde ele deve ser levado</li>
                            <li>Modelo do veículo</li>
                        </ul>
                        <p>O valor depende da distância. Com esses dados, passamos o orçamento.</p>
                    </div>

                    <div className="tow-service-card">
                        <h2>Oficina no mesmo lugar</h2>
                        <p>
                            O guincho faz parte da Renovo Centro Automotivo. Se precisar, seu veículo pode ser levado
                            para a nossa oficina.
                        </p>
                        <p>📍 {ADDRESS}</p>
                        <p>
                            <Link to="/services">Ver serviços da oficina</Link>
                            {' · '}
                            <Link to="/contact">Ver localização</Link>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TowService;
