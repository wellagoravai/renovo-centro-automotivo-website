import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Contact from './Contact';

describe('Contact', () => {
  it('abre o WhatsApp com a mensagem preenchida, sem registrar dados no console', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    userEvent.type(screen.getByLabelText(/Nome/), 'Maria Teste');
    userEvent.type(screen.getByLabelText(/Telefone \*/), '18999990000');
    userEvent.type(screen.getByLabelText(/Mensagem \*/), 'Carro não liga');
    userEvent.click(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' }));

    expect(open).toHaveBeenCalledTimes(1);
    const url = decodeURIComponent(open.mock.calls[0][0] as string);
    expect(url).toContain('https://wa.me/551837222388?text=');
    expect(url).toContain('Maria Teste');
    expect(url).toContain('Carro não liga');
    expect(log).not.toHaveBeenCalled();

    open.mockRestore();
    log.mockRestore();
  });
});
