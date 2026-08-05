import React, { useState } from 'react';
import './Home.css';

const WHATSAPP_NUMBER = '551837222388';

interface QuoteForm {
    name: string;
    phone: string;
    service: string;
    message: string;
}

const emptyQuoteForm: QuoteForm = { name: '', phone: '', service: '', message: '' };

const Home: React.FC = () => {
    const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuoteForm);

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
        const text = encodeURIComponent('Olá, quero solicitar um serviço.');
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    };

    const talkToAttendant = () => {
        const text = encodeURIComponent('Olá, gostaria de falar com um atendente.');
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    };

    const handleQuoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuoteForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuoteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lines = [
            'Olá! Gostaria de solicitar um orçamento.',
            `Nome: ${quoteForm.name}`,
            `Telefone: ${quoteForm.phone}`,
            `Serviço: ${quoteForm.service}`,
        ];
        if (quoteForm.message.trim()) lines.push(`Mensagem: ${quoteForm.message}`);
        const text = encodeURIComponent(lines.join('\n'));
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
        setQuoteForm(emptyQuoteForm);
    };

    return (
        <div className="home">
            <main>
                <section
                    className="banner"
                    style={{
                        backgroundImage:
                            "linear-gradient(100deg, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.88) 45%, rgba(68,0,0,0.8) 100%), url('/assets/equipamentos.jpg')",
                    }}
                >
                    <span className="banner-chevron banner-chevron-1" aria-hidden="true"></span>
                    <span className="banner-chevron banner-chevron-2" aria-hidden="true"></span>

                    <div className="container banner-inner">
                        <div className="banner-content">
                            <span className="banner-eyebrow">Manutenção preventiva e corretiva</span>
                            <h1>Cuidado de verdade <span className="highlight">com o seu carro</span></h1>
                            <p>Atendemos veículos a gasolina, álcool e diesel: troca de óleo, elétrica automotiva, ar-condicionado, arrefecimento e muito mais. Quebrou na estrada? Contamos com guincho 24h.</p>
                            <button className="button" type="button" onClick={openVirtualAssistant}>
                                Quero solicitar um orçamento <span aria-hidden="true">→</span>
                            </button>
                        </div>

                        <form className="quote-card" onSubmit={handleQuoteSubmit}>
                            <h2>Solicite um orçamento</h2>
                            <input
                                name="name"
                                required
                                placeholder="Nome completo"
                                value={quoteForm.name}
                                onChange={handleQuoteChange}
                            />
                            <input
                                name="phone"
                                required
                                placeholder="Seu telefone"
                                value={quoteForm.phone}
                                onChange={handleQuoteChange}
                            />
                            <select name="service" required value={quoteForm.service} onChange={handleQuoteChange}>
                                <option value="">O que você precisa?</option>
                                <option>Troca de óleo</option>
                                <option>Diagnóstico / revisão</option>
                                <option>Elétrica automotiva</option>
                                <option>Ar-condicionado</option>
                                <option>Guincho 24h</option>
                                <option>Outro serviço</option>
                            </select>
                            <textarea
                                name="message"
                                placeholder="Deixe sua mensagem (opcional)"
                                rows={3}
                                value={quoteForm.message}
                                onChange={handleQuoteChange}
                            ></textarea>
                            <button type="submit" className="quote-submit">
                                Solicitar orçamento <span aria-hidden="true">→</span>
                            </button>
                        </form>
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
