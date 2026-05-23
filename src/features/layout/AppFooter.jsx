import React from 'react';
import { Box, Typography } from '@mui/material';

export function AppFooter() {
  return (
    <Box component='footer' sx={{ mt: { xs: 0.5, md: 1 }, px: 2, pb: { xs: 10.5, md: 3 } }}>
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          py: { xs: 1.1, md: 1.4 },
          px: 2,
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography sx={{ fontSize: { xs: '0.72rem', sm: '0.8rem' }, opacity: 0.84, lineHeight: 1.5 }}>
          © 2026 FTA VAT & Tax Filing Assistant
        </Typography>
        <Typography sx={{ fontSize: { xs: '0.72rem', sm: '0.78rem' }, opacity: 0.72, lineHeight: 1.5 }}>
          UAE VAT & Corporate Tax System
        </Typography>
      </Box>
    </Box>
  );
}
