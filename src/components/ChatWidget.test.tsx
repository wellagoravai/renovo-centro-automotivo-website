import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatWidget from './ChatWidget';

// O bot responde depois de um setTimeout de 1500ms (efeito "digitando...");
// os testes avançam esse tempo manualmente com fake timers.
const openChat = () => {
  fireEvent.click(screen.getByLabelText('Abrir chat'));
};

const sendMessage = (text: string) => {
  const input = screen.getByPlaceholderText('Digite sua mensagem...');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByLabelText('Enviar mensagem'));
  act(() => {
    jest.advanceTimersByTime(1500);
  });
};

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens the lead form with subject "Guincho 24h" when the message contains an emergency keyword', () => {
    render(<ChatWidget />);
    openChat();

    sendMessage('meu carro quebrou na estrada');

    const subjectSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(subjectSelect.value).toBe('Guincho 24h');
  });

  it('answers a known FAQ (horário de funcionamento) without starting the guided flow', () => {
    render(<ChatWidget />);
    openChat();

    sendMessage('qual o horário de funcionamento?');

    expect(screen.getByText(/8h às 18h/)).toBeInTheDocument();
    // Sem fluxo guiado nem emergência, o formulário de lead não deve abrir sozinho.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('walks through the guided flow and pre-fills the lead form when the message is not a known FAQ', () => {
    render(<ChatWidget />);
    openChat();

    sendMessage('o carro está com um barulho estranho no motor');
    sendMessage('Onix 2020');
    sendMessage('2020');
    sendMessage('João Silva');
    sendMessage('18999998888');

    const nameInput = screen.getByPlaceholderText('Seu nome') as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText('Seu telefone') as HTMLInputElement;
    expect(nameInput.value).toBe('João Silva');
    expect(phoneInput.value).toBe('18999998888');
  });

  it('opens WhatsApp with the collected lead data on form submit', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<ChatWidget />);
    openChat();

    sendMessage('meu carro quebrou');
    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText('Seu telefone'), { target: { value: '18988887777' } });

    fireEvent.click(screen.getByText('Enviar no WhatsApp'));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target] = openSpy.mock.calls[0];
    expect(url).toContain('https://wa.me/551837222388?text=');
    expect(url).toContain(encodeURIComponent('Maria'));
    expect(target).toBe('_blank');

    openSpy.mockRestore();
  });
});
