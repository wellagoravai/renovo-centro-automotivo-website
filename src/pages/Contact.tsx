import React, { useState } from 'react';
import './Contact.css';
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_PHONE_1, WHATSAPP_PHONE_2, ADDRESS } from '../utils/constants';

const toWhatsappLink = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, '')}`;

const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // Aqui você pode adicionar a lógica para enviar o formulário
        alert('Obrigado por sua mensagem! Em breve entraremos em contato!');
        setFormData({ name: '', email: '', phone: '', message: '' });
    };

    return (
        <div className="contact-page">
            <section className="contact-header">
                <h1>Entre em Contato</h1>
                <p>Estamos prontos para ajudá-lo!</p>
            </section>

            <section className="contact-content">
                <div className="container">
                    <div className="contact-grid">
                        <div className="contact-info">
                            <h2>Informações de Contato</h2>

                            <div className="info-item">
                                <h3>📍 Localização</h3>
                                <p>{ADDRESS}</p>
                            </div>

                            <div className="info-item">
                                <h3>📞 Telefone</h3>
                                <p><a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a></p>
                            </div>

                            <div className="info-item">
                                <h3>💬 WhatsApp</h3>
                                <p>
                                    <a href={toWhatsappLink(WHATSAPP_PHONE_1)} target="_blank" rel="noopener noreferrer">
                                        {WHATSAPP_PHONE_1}
                                    </a>
                                </p>
                                <p>
                                    <a href={toWhatsappLink(WHATSAPP_PHONE_2)} target="_blank" rel="noopener noreferrer">
                                        {WHATSAPP_PHONE_2}
                                    </a>
                                </p>
                            </div>

                            <div className="info-item">
                                <h3>✉️ Email</h3>
                                <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
                            </div>

                            <div className="info-item">
                                <h3>⏰ Horário de Funcionamento</h3>
                                <p>
                                    Segunda a Sexta: 8h às 18h<br/>
                                    Sábado: 8h às 13h<br/>
                                    Domingo: Fechado<br/>
                                    <strong style={{color: '#CC0000'}}>💬 Chat: 24h disponível</strong>
                                </p>
                            </div>
                        </div>

                        <div className="contact-form-wrapper">
                            <h2>Envie uma Mensagem</h2>
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name">Nome *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Seu nome completo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="seu.email@exemplo.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Telefone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(18) 9 XXXX-XXXX"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Mensagem *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Descreva seu problema ou solicitação..."
                                        rows={5}
                                    ></textarea>
                                </div>

                                <button type="submit" className="button">Enviar Mensagem</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <section className="contact-map">
                <h2>Nos Visite</h2>
                <div className="map-wrapper">
                    <iframe
                        title="Localização - Renovo Centro Automotivo"
                        src="https://www.google.com/maps?q=MARECHAL+DEODORO+2305+Andradina+SP&output=embed"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </section>
        </div>
    );
};

export default Contact;
