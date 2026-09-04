import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0a66c2' },
    background: { default: '#f6f7f9' },
  },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  shape: { borderRadius: 8 },
});
