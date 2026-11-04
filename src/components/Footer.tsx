import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, SOCIAL_MEDIA_LINKS, CONTACT_PHONE, ADDRESS, SHIPPING_INFO } from '../utils/constants';
import './Footer.css';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-content container">
                <div className="footer-left">
                    <h2>🔧 Renovo Centro Automotivo</h2>
                    <p>Solucionar seu problema ou fazer sua manutenção preventiva, vem com a Renovo Centro Automotivo. Segurança, confiança e qualidade garantidas!</p>
                    <p className="address">📍 {ADDRESS}</p>
                    <p className="shipping">🚗 {SHIPPING_INFO}</p>
                </div>
                <div className="footer-center contact-info">
                    <h3>📞 Contato</h3>
                    <p>✉️ Email: {CONTACT_EMAIL}</p>
                    <p>☎️ Telefone: {CONTACT_PHONE}</p>
                    <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                        Seg-Sex: 8h-18h<br/>
                        Sábado: 8h-13h<br/>
                        💬 Chat: 24h
                    </p>
                </div>
                <div className="footer-right social-media">
                    <h3>🌐 Siga-nos</h3>
                    <a href={SOCIAL_MEDIA_LINKS.facebook} target="_blank" rel="noopener noreferrer">
                        Facebook
                    </a>
                    <a href={SOCIAL_MEDIA_LINKS.instagram} target="_blank" rel="noopener noreferrer">
                        Instagram
                    </a>
                    <a href={SOCIAL_MEDIA_LINKS.twitter} target="_blank" rel="noopener noreferrer">
                        Twitter
                    </a>
                </div>
            </div>
            <div style={{ 
                textAlign: 'center', 
                marginTop: '30px', 
                paddingTop: '20px', 
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.9rem',
                opacity: 0.85
            }}>
                <p>© {currentYear} Renovo Centro Automotivo. Todos os direitos reservados.</p>
                <p><Link to="/privacidade" style={{ color: 'inherit', textDecoration: 'underline' }}>Política de Privacidade</Link></p>
            </div>
        </footer>
    );
};

export default Footer;
