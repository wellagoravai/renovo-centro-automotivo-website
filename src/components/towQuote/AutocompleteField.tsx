import React, { useEffect, useMemo, useState } from 'react';

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
}

// Campo de texto com busca incremental (já filtra a partir da 1ª letra digitada)
// sobre uma lista de opções carregada previamente — usado pelos campos de
// Marca/Modelo do check-in, que puxam a lista completa da FIPE.
const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  loading,
  required,
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  // Mantém o texto exibido em sincronia quando o pai reseta o valor de fora
  // (ex.: limpar o modelo ao trocar de marca).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options.slice(0, 50);
    return options.filter((option) => option.label.toLowerCase().includes(term)).slice(0, 50);
  }, [query, options]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.label);
    setQuery(option.label);
    setOpen(false);
  };

  return (
    <div className="autocomplete-field">
      <input
        type="text"
        value={query}
        disabled={disabled}
        required={required}
        placeholder={loading ? 'Carregando...' : placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay pra permitir o onMouseDown da opção disparar antes do blur fechar a lista.
          setTimeout(() => setOpen(false), 150);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className="autocomplete-list">
          {filtered.map((option) => (
            <li key={option.value} onMouseDown={() => handleSelect(option)}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteField;
