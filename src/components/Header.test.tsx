import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe('Header', () => {
  it('renders the main nav items linking to the right routes', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Sobre' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/contact');
  });

  it('renders the phone CTA as a tel: link built from CONTACT_PHONE', () => {
    renderHeader();

    const phoneLinks = screen.getAllByText('(18) 3722-2388');
    const phoneLink = phoneLinks[0].closest('a');
    expect(phoneLink).toHaveAttribute('href', 'tel:+551837222388');
  });

  it('renders the portal button pointing at the login route', () => {
    renderHeader();

    const portalLinks = screen.getAllByText('Área do Cliente');
    expect(portalLinks[0].closest('a')).toHaveAttribute('href', '/portal?login=true');
  });

  it('toggles the mobile nav menu when the hamburger button is clicked', () => {
    renderHeader();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Abrir menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Abrir menu'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
