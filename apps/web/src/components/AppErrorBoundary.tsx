import { Alert, Box, Button, Typography } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled application error', error, errorInfo);
  }

  private reload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 2, sm: 4 } }}>
          <Alert severity="error">
            <Typography variant="h6" component="h1" gutterBottom>
              Something went wrong
            </Typography>
            <Button color="inherit" onClick={this.reload}>
              Reload application
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
