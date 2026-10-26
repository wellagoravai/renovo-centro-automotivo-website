import React, { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../utils/towQuote/towApi';
import { parseLatLng } from '../../utils/towQuote/geo';

// Resultado de GET /fretes/lugares (Google Places - Text Search).
export interface FoundPlace {
  nome: string;
  endereco: string;
  cidade?: string | null;
  uf?: string | null;
  latitude: number;
  longitude: number;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

// Texto de exibição de um lugar: "Nome - Endereço", sem repetir o nome quando o
// endereço já começa com ele (resultado que é só rua e número).
export const placeLabel = (place: FoundPlace) =>
  place.nome && !place.endereco.startsWith(place.nome) ? `${place.nome} - ${place.endereco}` : place.endereco;

interface PlaceSearchFieldProps {
  value: string;
  onChange: (text: string) => void;
  onSelect: (place: FoundPlace) => void;
  placeholder?: string;
}

// Campo de endereço com sugestões automáticas enquanto digita: rua e número ou
// nome de estabelecimento. Coordenadas/links do Maps colados não disparam busca.
// Sem sugestão escolhida, o texto digitado continua valendo.
const PlaceSearchField: React.FC<PlaceSearchFieldProps> = ({ value, onChange, onSelect, placeholder }) => {
  const [results, setResults] = useState<FoundPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // Texto da última sugestão escolhida: não busca de novo o que acabou de ser selecionado.
  const selectedText = useRef<string | null>(null);

  useEffect(() => {
    const term = value.trim();
    if (term.length < MIN_CHARS || parseLatLng(term) || term === selectedText.current || unavailable) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.get<FoundPlace[]>(`/fretes/lugares?q=${encodeURIComponent(term)}`)
        .then((places) => {
          if (!cancelled) setResults(places);
        })
        .catch((error) => {
          if (cancelled) return;
          setResults([]);
          // Places API não habilitada (503) ou backend sem a rota (404): para de tentar nesta tela.
          if (error instanceof ApiError && (error.status === 503 || error.status === 404)) setUnavailable(true);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, unavailable]);

  const handleSelect = (place: FoundPlace) => {
    const label = placeLabel(place);
    selectedText.current = label;
    setResults([]);
    setOpen(false);
    onSelect(place);
  };

  return (
    <div className="autocomplete-field">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay pra permitir o onMouseDown da opção disparar antes do blur fechar a lista.
          setTimeout(() => setOpen(false), 150);
        }}
        onChange={(e) => {
          selectedText.current = null;
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && (searching || results.length > 0) && (
        <ul className="autocomplete-list">
          {searching && results.length === 0 && <li className="autocomplete-status">Buscando...</li>}
          {results.map((place, index) => (
            <li key={`${place.latitude},${place.longitude},${index}`} onMouseDown={() => handleSelect(place)}>
              {place.nome && <strong className="place-option-name">{place.nome}</strong>}
              <small className="place-option-address">{place.endereco}</small>
            </li>
          ))}
        </ul>
      )}
      {unavailable && value.trim().length >= MIN_CHARS && (
        <p className="hint">Sugestões indisponíveis no momento: o endereço digitado será usado como está.</p>
      )}
    </div>
  );
};

export default PlaceSearchField;
