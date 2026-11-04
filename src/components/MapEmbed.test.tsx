import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapEmbed from './MapEmbed';

describe('MapEmbed', () => {
  it('só carrega o mapa do Google depois do clique', () => {
    const { container } = render(<MapEmbed />);
    expect(container.querySelector('iframe')).toBeNull();

    userEvent.click(screen.getByRole('button', { name: 'Mostrar mapa' }));

    expect(container.querySelector('iframe')?.getAttribute('src')).toContain('https://www.google.com/maps');
  });
});
