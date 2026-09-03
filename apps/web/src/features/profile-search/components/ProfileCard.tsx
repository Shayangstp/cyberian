import {
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ProfileSearchResult } from '@cyberian/shared';
export function ProfileCard({
  profile,
  highlightTerms = [],
}: {
  profile: ProfileSearchResult;
  highlightTerms?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const fullName = display(profile.fullName);
  const jobTitle = display(profile.jobTitle);
  const company = display(profile.currentCompanyName);
  const location = display(profile.locationName);
  const country = display(profile.country);
  const industry = display(profile.industry);
  const summary = display(profile.summary);
  const skills = prioritizeMatchingSkills(
    profile.skills.filter((skill) => Boolean(display(skill))),
    highlightTerms,
  );
  const initials = (fullName ?? '?')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Card component="article" variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2}>
          <Avatar aria-hidden>{initials}</Avatar>
          <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h2" fontSize="1.1rem">
              <HighlightedText
                text={fullName || 'Profile'}
                terms={highlightTerms}
              />
            </Typography>
            {[
              jobTitle && [jobTitle, company].filter(Boolean).join(' · '),
              [location, country].filter(Boolean).join(', '),
              industry,
            ]
              .filter((value): value is string => Boolean(value))
              .map((value) => (
                <Typography key={value} color="text.secondary">
                  <HighlightedText text={value} terms={highlightTerms} />
                </Typography>
              ))}
            {summary && (
              <Typography
                sx={{
                  ...(expanded
                    ? {}
                    : {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }),
                }}
              >
                <HighlightedText text={summary} terms={highlightTerms} />
              </Typography>
            )}
            {summary && summary.length > 280 && (
              <Button
                size="small"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            )}
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {skills.slice(0, 6).map((skill) => (
                <Chip
                  key={skill}
                  size="small"
                  label={
                    <HighlightedText text={skill} terms={highlightTerms} />
                  }
                />
              ))}
              {skills.length > 6 && (
                <Chip size="small" label={`+${skills.length - 6} more`} />
              )}
            </Stack>
            {profile.linkedinUrl && (
              <Link
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${profile.fullName ?? 'profile'} on LinkedIn`}
              >
                View LinkedIn profile
              </Link>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  const matches = [
    ...new Set(terms.flatMap((term) => [term, ...term.split(/\s+/)])),
  ]
    .map((term) => term.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!matches.length) return text;

  const pattern = new RegExp(`(${matches.map(escapeRegex).join('|')})`, 'gi');
  const match = new RegExp(`^(?:${matches.map(escapeRegex).join('|')})$`, 'i');
  return text
    .split(pattern)
    .map((part, index): ReactNode =>
      match.test(part) ? <mark key={index}>{part}</mark> : part,
    );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function prioritizeMatchingSkills(skills: string[], terms: string[]) {
  const filters = new Set(
    terms.map((term) => term.trim().toLocaleLowerCase()).filter(Boolean),
  );
  return [...skills].sort((a, b) => {
    const aMatches = filters.has(a.toLocaleLowerCase());
    const bMatches = filters.has(b.toLocaleLowerCase());
    return Number(bMatches) - Number(aMatches);
  });
}

function display(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (
    !text ||
    /^(?:\[|\{|null\b)/i.test(text) ||
    /^\d{4}-\d{1,2}-\d{1,2}$/.test(text)
  )
    return null;
  if (
    /^\d{1,6}\s+.+\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?)\b/i.test(
      text,
    )
  )
    return null;
  return text;
}
