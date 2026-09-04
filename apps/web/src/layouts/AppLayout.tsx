import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Container maxWidth="lg" disableGutters>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6" component="div" fontWeight={600}>
                LinkedIn Profile Search
              </Typography>
              <nav aria-label="Primary navigation">
                <Stack direction="row" spacing={1}>
                  <Button color="inherit" component={NavLink} to="/search">
                    Search
                  </Button>
                  <Button color="inherit" component={NavLink} to="/analytics">
                    Analytics
                  </Button>
                </Stack>
              </nav>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>
      <Container
        component="main"
        maxWidth="lg"
        sx={{ py: { xs: 4, sm: 6, md: 8 } }}
      >
        {children}
      </Container>
    </Box>
  );
}
