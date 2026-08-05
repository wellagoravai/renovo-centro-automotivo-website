import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_PHONE } from '../utils/constants';
import './Header.css';

const Header: React.FC = () => {
    const [open, setOpen] = useState(false);

    const menuItems = [
        { label: 'Serviços', to: '/services' },
        { label: 'Produtos', to: '/products' },
        { label: 'Sobre', to: '/about' },
        { label: 'Contato', to: '/contact' },
    ];

    const portalButton = {
        label: 'Área do Cliente',
        to: '/portal?login=true'
    };

    const phoneDigits = CONTACT_PHONE.replace(/\D/g, '');

    return (
        <header className="header">
            <div className="container header-inner">
                <div className="logo">
                    <Link to="/">
                        <img
                            src="/assets/logo.png"
                            alt="Renovo Centro Automotivo"
                            className="logo-img"
                        />
                    </Link>
                </div>

                <nav className="nav-desktop">
                    <ul className="nav-items">
                        {menuItems.map((item) => (
                            <li key={item.to}>
                                <Link to={item.to}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="header-actions">
                    <a href={`tel:+55${phoneDigits}`} className="header-cta header-cta-outline">
                        <span className="header-cta-icon" aria-hidden="true">☎</span>
                        <span className="header-cta-text">
                            <small>Agende uma visita</small>
                            <strong>{CONTACT_PHONE}</strong>
                        </span>
                    </a>

                    <Link to="/contact" className="header-cta header-cta-solid">
                        <span className="header-cta-icon" aria-hidden="true">📍</span>
                        <span className="header-cta-text">
                            <small>Nossa oficina</small>
                            <strong>VER LOCALIZAÇÃO</strong>
                        </span>
                    </Link>

                    <Link to={portalButton.to} className="portal-button">
                        {portalButton.label}
                    </Link>

                    <button
                        className={`hamburger ${open ? 'is-open' : ''}`}
                        aria-label="Abrir menu"
                        aria-expanded={open}
                        onClick={() => setOpen(!open)}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>

                {open && (
                    <nav className="nav-mobile" role="menu">
                        <ul>
                            {menuItems.map((item) => (
                                <li key={item.to}>
                                    <Link to={item.to} onClick={() => setOpen(false)}>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            <li key="portal">
                                <Link to={portalButton.to} onClick={() => setOpen(false)} className="portal-mobile-link">
                                    {portalButton.label}
                                </Link>
                            </li>
                            <li key="phone">
                                <a href={`tel:+55${phoneDigits}`}>{CONTACT_PHONE}</a>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;
