import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCanonical } from '../hooks/usePageMeta';
import TowService from './TowService';

const Canonical: React.FC = () => {
  useCanonical();
  return null;
};

const canonicalHref = () => document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

describe('TowService', () => {
  it('mostra os contatos do guincho e usa título próprio enquanto está aberta', () => {
    document.title = 'Título padrão';

    const { unmount } = render(
      <MemoryRouter>
        <TowService />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Guincho 24h em Andradina/SP');
    expect(screen.getByRole('link', { name: /Ligar/ }).getAttribute('href')).toBe('tel:+5518997752055');
    expect(screen.getByRole('link', { name: 'Chamar no WhatsApp' }).getAttribute('href')).toContain(
      'https://wa.me/5518997752055?text='
    );
    expect(document.title).toBe('Guincho 24h em Andradina/SP | Renovo Guincho');

    unmount();
    expect(document.title).toBe('Título padrão');
  });

  it('aponta o canonical para o endereço da própria página', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/servico-de-guincho-andradina']}>
        <Canonical />
      </MemoryRouter>
    );

    expect(canonicalHref()).toBe('https://renovoautoeguincho.com.br/servico-de-guincho-andradina');

    unmount();
    expect(canonicalHref()).toBeUndefined();
  });
});
