import React from 'react';
import './Home.css';

const Home: React.FC = () => {
    const openVirtualAssistant = () => {
        const chatWindow = document.querySelector('.chat-window');
        const chatButton = document.querySelector<HTMLButtonElement>('.chat-button');

        // Prefer opening the in-page IA/chat if available
        if (chatWindow) {
            // if the chat is already present, try to focus or open it
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

    const talkToAttendant = () => {
        const whatsappNumber = '551837222388';
        const text = encodeURIComponent('Olá, gostaria de falar com um atendente.');
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="home">
            <main>
                <section className="banner">
                    <div className="banner-content">
                        <h1><span className="title-3d">B</span>em-vindo à Renovo Centro Automotivo</h1>
                        <p>Falou em solucionar seu problema ou fazer sua manutenção preventiva, vem com a Renovo Centro Automotivo! Atendemos veículos a gasolina, álcool e diesel: troca de óleo de motor e câmbio, elétrica automotiva, ar condicionado veicular, sistema de arrefecimento e muito mais — e se seu carro quebrou na estrada, contamos com serviço de resgate para te ajudar. Segurança, confiança e qualidade!!! 🔧</p>
                        <button className="button" type="button" onClick={openVirtualAssistant}>🚗 Solicitar Serviço</button>
                    </div>

                    <div className="banner-scene" aria-hidden="true">
                        <div className="dirt-road dirt-road-back"></div>
                        <div className="dirt-road dirt-road-front"></div>
                        <div className="truck-rig">
                            <div className="truck-bob">
                                <div className="dust-trail">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className="truck-visual">
                                    <img src="/assets/truck-offroad.png" alt="" className="hero-truck" />
                                    <img src="/assets/truck-wheel.png" alt="" className="wheel wheel-front" />
                                    <img src="/assets/truck-wheel.png" alt="" className="wheel wheel-rear" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Store Photos Section */}
                <section className="store-photos">
                    <h2>Conheça Nossa Oficina</h2>
                    <p>Visite nossa oficina e conheça de perto nossos serviços de qualidade.</p>
                    <div className="gallery-grid">
                        <div className="gallery-item">
                            <img src="/assets/fachada.jpg" alt="Fachada da oficina" />
                        </div>
                        <div className="gallery-item">
                            <img src="/assets/interior.jpg" alt="Interior da oficina" />
                        </div>
                        <div className="gallery-item">
                            <img src="/assets/equipamentos.jpg" alt="Equipamentos da oficina" />
                        </div>
                        <div className="gallery-item">
                            <img src="/assets/equipe.jpg" alt="Equipe da oficina" />
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="services">
                    <h2>Nossos Serviços</h2>
                    <p>Conheça nossa gama completa de serviços pensada para suas necessidades.</p>
                    <div className="services-grid">
                        <div className="service-card">
                            <h3>🛠️ Manutenção Preventiva</h3>
                            <p>Mantenha seu veículo sempre em perfeito estado com nossa manutenção preventiva especializada.</p>
                        </div>
                        <div className="service-card">
                            <h3>⛽ Gasolina, Álcool e Diesel</h3>
                            <p>Atendemos todos os tipos de veículo, com técnicos preparados para cada tipo de motorização.</p>
                        </div>
                        <div className="service-card">
                            <h3>🔧 Reparos Gerais</h3>
                            <p>Reparamos qualquer tipo de problema no seu veículo com técnicos experientes e equipamentos modernos.</p>
                        </div>
                        <div className="service-card">
                            <h3>🛢️ Troca de Óleo (Motor e Câmbio)</h3>
                            <p>Troca de óleo de motor e de câmbio manual com produtos de qualidade e prazo certo.</p>
                        </div>
                        <div className="service-card">
                            <h3>⚡ Elétrica Automotiva</h3>
                            <p>Diagnóstico e reparo de sistemas elétricos, sensores, bateria e injeção eletrônica.</p>
                        </div>
                        <div className="service-card">
                            <h3>❄️ Ar Condicionado Veicular</h3>
                            <p>Higienização, recarga de gás e reparo do ar condicionado do seu veículo.</p>
                        </div>
                        <div className="service-card">
                            <h3>🌡️ Sistema de Arrefecimento</h3>
                            <p>Revisão de radiador, mangueiras e bomba d'água para evitar o superaquecimento do motor.</p>
                        </div>
                        <div className="service-card">
                            <h3>🚨 Resgate de Veículos</h3>
                            <p>Seu carro quebrou na estrada? Contamos com serviço de resgate para te socorrer.</p>
                        </div>
                        <div className="service-card">
                            <h3>🔍 Diagnóstico Completo</h3>
                            <p>Utilizamos equipamentos de diagnóstico de última geração para identificar problemas precisamente.</p>
                        </div>
                        <div className="service-card">
                            <h3>💡 Alinhamento e Balanceamento</h3>
                            <p>Garantimos alinhamento e balanceamento com máquinas de precisão para melhor performance.</p>
                        </div>
                    </div>
                </section>

                {/* Products Section */}
                <section className="products">
                    <h2>Produtos e Peças</h2>
                    <p>Contamos com uma grande variedade de peças de reposição para diversos modelos.</p>
                    {/* Produtos podem ser renderizados aqui dinamicamente */}
                </section>

                {/* CTA Section */}
                <section className="cta-section">
                    <h2>Precisa de um Serviço?</h2>
                    <p>Nossa equipe especializada está pronta para resolver seu problema! Entre em contato conosco através do chat ou visite nossa oficina.</p>
                    <button className="button" type="button" onClick={talkToAttendant}>📞 Falar com Atendente</button>
                </section>

                {/* Location Section */}
                <section className="location">
                    <h2>Localização</h2>
                    <p>MARECHAL DEODORO 2305, Andradina/SP 16901-455</p>
                    <p style={{ fontSize: '0.95rem', color: '#666' }}>
                        ⏰ Seg-Sex: 8h-18h | Sábado: 8h-13h | 💬 Chat: 24h
                    </p>
                    <div className="map-wrapper">
                        <iframe
                            title="Localização - Renovo Centro Automotivo"
                            src="https://www.google.com/maps?q=MARECHAL+DEODORO+2305+Andradina+SP&output=embed"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
