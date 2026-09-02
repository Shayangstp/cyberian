import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the application shell and foundation message', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('LinkedIn Profile Search')).toHaveLength(2);
    expect(
      screen.getByText('Search interface will be implemented in a later card.'),
    ).toBeInTheDocument();
  });
});
