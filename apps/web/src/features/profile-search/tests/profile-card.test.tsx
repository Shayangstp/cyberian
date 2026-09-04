import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProfileCard } from '../components/ProfileCard';

afterEach(() => cleanup());

describe('ProfileCard', () => {
  it('highlights matching keyword and filter text', () => {
    const { container } = render(
      <ProfileCard
        profile={{
          id: 'synthetic',
          fullName: 'Alex Leadership',
          jobTitle: 'People Manager',
          currentCompanyName: 'Example Co',
          industry: 'Technology',
          locationName: 'Test City',
          country: 'US',
          summary: 'Experienced leadership professional.',
          skills: [
            'Communication',
            'Planning',
            'Recruiting',
            'Coaching',
            'Negotiation',
            'Strategy',
            'Leadership',
          ],
        }}
        highlightTerms={['leadership', 'People Manager']}
      />,
    );

    expect(
      [...container.querySelectorAll('mark')].map((item) => item.textContent),
    ).toEqual(
      expect.arrayContaining([
        'Leadership',
        'People Manager',
        'leadership',
        'Leadership',
      ]),
    );
    expect(container.querySelector('.MuiChip-label')).toHaveTextContent(
      'Leadership',
    );
  });

  it('promotes partial skill matches while retaining the six-chip limit', () => {
    render(
      <ProfileCard
        profile={{
          id: 'synthetic',
          skills: [
            'Communication',
            'Planning',
            'Recruiting',
            'Coaching',
            'Negotiation',
            'Strategy',
            'Executive Search',
          ],
          matchContext: { skills: ['Executive Search'] },
        }}
        highlightTerms={['search']}
      />,
    );

    const chips = screen.getAllByText(/./, { selector: '.MuiChip-label' });
    expect(chips[0]).toHaveTextContent('Executive Search');
    expect(
      screen.getByText('Search', { selector: 'mark' }),
    ).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('shows the matching excerpt collapsed and the original summary expanded', () => {
    const original = `Opening context ${'background '.repeat(35)}late keyword.`;
    render(
      <ProfileCard
        profile={{
          id: 'synthetic',
          skills: [],
          summary: original,
          matchContext: { summary: '...background around late keyword.' },
        }}
        highlightTerms={['keyword']}
      />,
    );

    expect(screen.getByText(/around late/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText(/Opening context/)).toHaveTextContent(original);
  });

  it('displays a company without requiring a job title', () => {
    render(
      <ProfileCard
        profile={{
          id: 'synthetic',
          currentCompanyName: 'Example Co',
          skills: [],
        }}
      />,
    );
    expect(screen.getByText('Example Co')).toBeInTheDocument();
  });
});
