import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the search route', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('LinkedIn Profile Search')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Profile search' }),
    ).toBeInTheDocument();
  });
});
