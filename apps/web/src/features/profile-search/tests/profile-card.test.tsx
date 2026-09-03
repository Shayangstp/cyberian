import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileCard } from '../components/ProfileCard';

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
});
