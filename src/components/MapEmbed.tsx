import React, { useState } from 'react';

const MAP_QUERY = 'MARECHAL+DEODORO+2305+Andradina+SP';

// O mapa do Google só carrega depois do clique: assim, abrir a página não envia
// dados da visita ao Google nem grava cookies dele sem uma escolha do visitante.
const MapEmbed: React.FC = () => {
    const [loaded, setLoaded] = useState(false);

    if (loaded) {
        return (
            <iframe
                title="Localização - Renovo Centro Automotivo"
                src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        );
    }

    return (
        <div className="map-placeholder">
            <p>📍 Rua Marechal Deodoro, 2305 - Andradina/SP</p>
            <button type="button" className="button" onClick={() => setLoaded(true)}>
                Mostrar mapa
            </button>
            <p className="privacy-notice">
                Ao mostrar o mapa, o Google recebe dados da sua conexão e pode usar cookies próprios.{' '}
                <a href={`https://www.google.com/maps?q=${MAP_QUERY}`} target="_blank" rel="noopener noreferrer">
                    Abrir direto no Google Maps
                </a>
            </p>
        </div>
    );
};

export default MapEmbed;
