import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchFilters } from '../components/SearchFilters';
import { useProfileSearch } from '../hooks/use-profile-search';
import { ProfileSearchPage } from '../pages/ProfileSearchPage';

vi.mock('../hooks/use-profile-search', () => ({
  useProfileSearch: vi.fn(),
}));

const mockedUseProfileSearch = vi.mocked(useProfileSearch);

afterEach(() => cleanup());

describe('ProfileSearchPage', () => {
  it('submits search text through URL state and renders results', async () => {
    mockedUseProfileSearch.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: [
          {
            id: 'synthetic',
            fullName: 'Synthetic Engineer',
            jobTitle: 'Engineer',
            currentCompanyName: 'Example Co',
            industry: 'Technology',
            locationName: 'Test City',
            country: 'US',
            summary: 'Synthetic result',
            skills: ['TypeScript'],
            linkedinUrl: undefined,
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1, tookMs: 1 },
      },
    } as unknown as ReturnType<typeof useProfileSearch>);

    render(
      <MemoryRouter initialEntries={['/?q=old']}>
        <ProfileSearchPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Search profiles'), {
      target: { value: 'engineer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(mockedUseProfileSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'engineer' }),
      ),
    );
    expect(screen.getByText('1 profiles found.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Synthetic Engineer' }),
    ).toBeInTheDocument();
  });

  it('shows unfiltered results when URL has no criteria', () => {
    mockedUseProfileSearch.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0, tookMs: 1 },
      },
    } as unknown as ReturnType<typeof useProfileSearch>);

    render(
      <MemoryRouter>
        <ProfileSearchPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('No profiles match your search.'),
    ).toBeInTheDocument();
  });

  it('clears an applied keyword from the input', async () => {
    mockedUseProfileSearch.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0, tookMs: 1 },
      },
    } as unknown as ReturnType<typeof useProfileSearch>);

    render(
      <MemoryRouter initialEntries={['/?q=engineer']}>
        <ProfileSearchPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    await waitFor(() =>
      expect(mockedUseProfileSearch).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: '' }),
      ),
    );
    expect(screen.getByLabelText('Search profiles')).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: 'Clear search' }),
    ).not.toBeInTheDocument();
  });
});

describe('SearchFilters', () => {
  it('applies trimmed title and industry filters and clears filters', () => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    const { getByLabelText, getByRole } = render(
      <SearchFilters
        params={{
          q: '',
          skills: [],
          jobTitle: '',
          industry: '',
          page: 1,
          limit: 10,
        }}
        onApply={onApply}
        onClear={onClear}
      />,
    );

    fireEvent.change(getByLabelText('Job title'), {
      target: { value: ' Engineer ' },
    });
    fireEvent.change(getByLabelText('Industry'), {
      target: { value: ' Technology ' },
    });
    fireEvent.click(getByRole('button', { name: 'Apply filters' }));
    fireEvent.click(getByRole('button', { name: 'Clear filters' }));

    expect(onApply).toHaveBeenCalledWith([], 'Engineer', 'Technology');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('commits typed comma-separated skills when Apply is clicked', () => {
    const onApply = vi.fn();
    render(
      <SearchFilters
        params={{
          q: '',
          skills: [],
          jobTitle: '',
          industry: '',
          page: 1,
          limit: 10,
        }}
        onApply={onApply}
        onClear={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Skills'), {
      target: { value: ' TypeScript, SQL, typescript ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(onApply).toHaveBeenCalledWith(['TypeScript', 'SQL'], '', '');
  });
});
