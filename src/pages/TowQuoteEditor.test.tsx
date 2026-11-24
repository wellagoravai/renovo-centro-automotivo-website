import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import TowQuoteEditor from './TowQuoteEditor';
import { api } from '../services/api';

jest.mock('../services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));
jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1', fullName: 'Wesley' } }) }));
jest.mock('../utils/towQuote/pdfKit', () => ({ shareOrDownloadPdf: jest.fn() }));
jest.mock('../utils/towQuote/quotePdf', () => ({
  buildQuotePdf: jest.fn(),
  shareOrDownloadPdf: jest.fn(),
  formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
}));

const QUOTE = {
  id: 'q1', number: 'ORC-1', status: 'Aprovado', customerName: 'Ana', customerPhone: '', vehiclePlate: '',
  vehicleDescription: '', routeSummary: '', totalKm: 100, total: 390, hasPdf: false, createdAt: '2026-11-20T10:00:00Z',
  createdBy: 'x', updatedAt: '2026-11-20T10:00:00Z', serviceOrderId: 'os1', serviceOrderNumber: 'OS-9',
  formData: JSON.stringify({ customer: { name: 'Ana' }, totalKm: '100', manualRoute: true, pricePerKm: '3.50', truckDeparture: '180' }),
};
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

const renderEditor = () => render(
  <MemoryRouter initialEntries={['/orcamentos-guincho/q1']}>
    <Link to="/orcamentos-guincho/novo">Novo orçamento</Link>
    <Routes>
      <Route path="/orcamentos-guincho/novo" element={<TowQuoteEditor />} />
      <Route path="/orcamentos-guincho/:id" element={<TowQuoteEditor />} />
    </Routes>
  </MemoryRouter>
);

describe('TowQuoteEditor: orçamento aprovado', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] }) as jest.Mock;
    (api.get as jest.Mock).mockResolvedValue(ok(QUOTE));
    (api.put as jest.Mock).mockReset().mockImplementation(async (_: string, body: any) => ok({ ...QUOTE, ...body }));
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  const changeDeparture = async () => {
    await screen.findByDisplayValue('Ana');
    fireEvent.change(screen.getByDisplayValue('180'), { target: { value: '250' } });
    fireEvent.click(screen.getByText(/Salvar alterações no orçamento e na OS/));
  };

  it('salva o novo valor mandando também os dados da OS', async () => {
    renderEditor();
    await changeDeparture();

    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    const [url, body] = (api.put as jest.Mock).mock.calls[0];
    expect(url).toBe('/tow-quotes/q1');
    expect(body.total).toBe(460);
    expect(body.orderSync.route).toEqual({ pricePerKm: 3.5, axleCount: null, distanceKm: 100, tollsValue: null });
    expect(body.orderSync.agreementLines[0].label).toBe('Orçamento ORC-1 aprovado');
    expect(body.orderSync.agreementLines[0].text).toContain('R$ 460.00');
    expect(body.orderSync.agreementLines.find((l: any) => l.label === 'Solicitante').text).toBeNull();
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('OS-9')));
  });

  it('não salva se a pessoa desistir na confirmação', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    renderEditor();
    await changeDeparture();

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(api.put).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('orçamento novo aberto pelo menu começa vazio, sem o registro anterior', async () => {
    renderEditor();
    await screen.findByDisplayValue('Ana');
    fireEvent.click(screen.getByText('Novo orçamento'));

    expect(screen.queryByDisplayValue('Ana')).toBeNull();
    expect(screen.queryByText(/Salvar alterações no orçamento/)).toBeNull();
  });
});
