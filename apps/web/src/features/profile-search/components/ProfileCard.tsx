import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import type { ProfileSearchResult } from '@cyberian/shared';
export function ProfileCard({ profile }: { profile: ProfileSearchResult }) {
  const initials = (profile.fullName ?? '?')
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
              {profile.fullName || 'Profile'}
            </Typography>
            {[
              profile.jobTitle &&
                [profile.jobTitle, profile.currentCompanyName]
                  .filter(Boolean)
                  .join(' · '),
              [profile.locationName, profile.country]
                .filter(Boolean)
                .join(', '),
              profile.industry,
            ]
              .filter(Boolean)
              .map((value) => (
                <Typography key={value} color="text.secondary">
                  {value}
                </Typography>
              ))}
            {profile.summary && (
              <Typography
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {profile.summary}
              </Typography>
            )}
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {profile.skills.slice(0, 6).map((skill) => (
                <Chip key={skill} size="small" label={skill} />
              ))}
              {profile.skills.length > 6 && (
                <Chip
                  size="small"
                  label={`+${profile.skills.length - 6} more`}
                />
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
