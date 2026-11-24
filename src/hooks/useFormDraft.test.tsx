import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { clearDrafts, useFormDraft } from './useFormDraft';

let mockUserId = 'u1';
jest.mock('./useAuth', () => ({ useAuth: () => ({ user: { id: mockUserId } }) }));

const Form: React.FC<{ name?: string | null }> = ({ name = 'teste' }) => {
  const [text, setText] = useState('');
  const draft = useFormDraft(name, { text }, (data) => setText(data.text));
  return (
    <>
      <input aria-label="texto" value={text} onChange={(e) => setText(e.target.value)} />
      {draft.restored && <button onClick={draft.discard}>descartar</button>}
      <button onClick={draft.clear}>salvo</button>
    </>
  );
};

const input = () => screen.getByLabelText('texto');
const type = (value: string) => fireEvent.change(input(), { target: { value } });

describe('useFormDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUserId = 'u1';
  });

  it('devolve o que foi digitado quando a tela é recarregada', () => {
    const { unmount } = render(<Form />);
    type('placa ABC');
    unmount();

    render(<Form />);
    expect(input()).toHaveValue('placa ABC');

    fireEvent.click(screen.getByText('descartar'));
    expect(input()).toHaveValue('');
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it('não guarda formulário vazio e apaga o rascunho ao salvar', () => {
    render(<Form />);
    expect(Object.keys(localStorage)).toHaveLength(0);
    type('x');
    expect(Object.keys(localStorage)).toHaveLength(1);
    fireEvent.click(screen.getByText('salvo'));
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it('apaga o rascunho quando o registro passa a existir no servidor', () => {
    const { rerender } = render(<Form />);
    type('x');
    rerender(<Form name={null} />);
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it('não mostra o rascunho de outro usuário nem um vencido', () => {
    const { unmount } = render(<Form />);
    type('do u1');
    unmount();

    mockUserId = 'u2';
    const second = render(<Form />);
    expect(input()).toHaveValue('');
    second.unmount();

    mockUserId = 'u1';
    const now = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 60 * 60 * 1000);
    render(<Form />);
    expect(input()).toHaveValue('');
    now.mockRestore();
  });

  it('clearDrafts apaga só os rascunhos', () => {
    localStorage.setItem('token', 't');
    render(<Form />);
    type('x');
    clearDrafts();
    expect(Object.keys(localStorage)).toEqual(['token']);
  });
});
