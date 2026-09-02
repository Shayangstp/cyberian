import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Container maxWidth="lg" disableGutters>
            <Typography variant="h6" component="div" fontWeight={600}>
              LinkedIn Profile Search
            </Typography>
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
