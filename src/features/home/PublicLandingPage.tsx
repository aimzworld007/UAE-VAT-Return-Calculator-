import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  History,
  Menu,
  Bell,
  X,
} from 'lucide-react';
import { RouteLink } from '../../components/Router';

const STYLE = {
  colorPrimary: '#0D9488',
  colorNavy: '#0F172A',
  colorGold: '#D97706',
  colorBg: '#F8FAFC',
  colorBorder: '#E2E8F0',
};

const TASK_CARDS = [
  {
    title: 'VAT Return',
    description: 'Prepare VAT return inputs and review payable/refundable summary.',
    icon: <FileSpreadsheet size={22} style={{ color: STYLE.colorPrimary }} />,
    to: '/vat/details',
  },
  {
    title: 'Corporate Tax',
    description: 'Estimate corporate tax from revenue, expenses, and taxable profit.',
    icon: <Building2 size={22} style={{ color: STYLE.colorGold }} />,
    to: '/tax/details',
  },
  {
    title: 'Filing History',
    description: 'View and manage saved VAT and corporate tax records.',
    icon: <History size={22} style={{ color: '#2563EB' }} />,
    to: '/history',
  },
  {
    title: 'Reminders',
    description: 'Track filing due dates and stay on top of pending actions.',
    icon: <Bell size={22} style={{ color: '#B45309' }} />,
    to: '/reminders',
  },
];

const STEPS = [
  { title: 'Create Account', description: 'Register and access your secure tax workspace.' },
  { title: 'Set Business Profile', description: 'Add business details and TRN once for all records.' },
  { title: 'Calculate', description: 'Use guided VAT and Corporate Tax workflows.' },
  { title: 'Export & Save', description: 'Download PDF and keep a complete filing history.' },
];

function isLoggedIn() {
  return Boolean(localStorage.getItem('fta_auth_user') || localStorage.getItem('fta_tax_auth_token'));
}

export function PublicLandingPage() {
  const [startedLink, setStartedLink] = React.useState('/register');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = 'UAE VAT & Corporate Tax Filing Assistant';
    setStartedLink(isLoggedIn() ? '/dashboard' : '/register');
  }, []);

  const drawer = (
    <Box sx={{ width: 280, p: 2.5, bgcolor: '#fff', height: '100%' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 900, color: STYLE.colorNavy }}>UAE Tax Suite</Typography>
        <IconButton onClick={() => setMobileOpen(false)}><X size={18} /></IconButton>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <List sx={{ p: 0 }}>
        <ListItem disablePadding><ListItemButton component={RouteLink} to='/vat/details'><ListItemText primary='VAT Return' /></ListItemButton></ListItem>
        <ListItem disablePadding><ListItemButton component={RouteLink} to='/tax/details'><ListItemText primary='Corporate Tax' /></ListItemButton></ListItem>
        <ListItem disablePadding><ListItemButton component={RouteLink} to='/history'><ListItemText primary='Filing History' /></ListItemButton></ListItem>
        <ListItem disablePadding><ListItemButton component={RouteLink} to='/login'><ListItemText primary='Login' /></ListItemButton></ListItem>
      </List>
      <Button component={RouteLink} to={startedLink} fullWidth variant='contained' sx={{ mt: 2, bgcolor: STYLE.colorPrimary, textTransform: 'none', fontWeight: 700 }}>
        Get Started
      </Button>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: STYLE.colorBg, minHeight: '100vh' }}>
      <AppBar elevation={0} position='sticky' sx={{ bgcolor: 'rgba(255,255,255,.92)', borderBottom: `1px solid ${STYLE.colorBorder}`, color: STYLE.colorNavy }}>
        <Container maxWidth='lg'>
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 74 }, justifyContent: 'space-between' }}>
            <Stack direction='row' alignItems='center' spacing={1.2} component={RouteLink} to='/' sx={{ textDecoration: 'none', color: STYLE.colorNavy }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: STYLE.colorNavy, borderLeft: `4px solid ${STYLE.colorGold}`, borderRight: `4px solid ${STYLE.colorPrimary}`, display: 'grid', placeItems: 'center' }}>
                <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>AE</Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1rem', md: '1.2rem' } }}>UAE Tax Suite</Typography>
            </Stack>

            <Stack direction='row' spacing={3} alignItems='center' sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Box component={RouteLink} to='/vat/details' sx={{ color: STYLE.colorNavy, textDecoration: 'none', fontWeight: 700 }}>VAT</Box>
              <Box component={RouteLink} to='/tax/details' sx={{ color: STYLE.colorNavy, textDecoration: 'none', fontWeight: 700 }}>Corporate Tax</Box>
              <Box component={RouteLink} to='/history' sx={{ color: STYLE.colorNavy, textDecoration: 'none', fontWeight: 700 }}>History</Box>
              <Box component={RouteLink} to='/login' sx={{ color: STYLE.colorNavy, textDecoration: 'none', fontWeight: 700 }}>Login</Box>
              <Button component={RouteLink} to={startedLink} variant='contained' sx={{ bgcolor: STYLE.colorNavy, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: STYLE.colorPrimary } }}>Get Started</Button>
            </Stack>

            <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 280 } }}>
        {drawer}
      </Drawer>

      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: '#fff', borderBottom: `1px solid ${STYLE.colorBorder}` }}>
        <Container maxWidth='lg'>
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} md={7.5}>
              <Stack spacing={2}>
                <Stack direction='row' spacing={1} flexWrap='wrap'>
                  <Chip label='VAT 5% Ready' sx={{ bgcolor: '#E6F4F1', color: STYLE.colorPrimary, fontWeight: 800 }} />
                  <Chip label='Corporate Tax 9% Threshold' sx={{ bgcolor: '#FEF3C7', color: STYLE.colorGold, fontWeight: 800 }} />
                  <Chip label='PDF Export + History' sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }} />
                </Stack>
                <Typography variant='h1' sx={{ fontSize: { xs: '2.1rem', md: '3rem' }, lineHeight: 1.14, fontWeight: 900, color: STYLE.colorNavy }}>
                  UAE VAT & Corporate Tax<br />
                  <span style={{ color: STYLE.colorPrimary }}>Filing Assistant</span>
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: { xs: '1rem', md: '1.1rem' }, maxWidth: 680 }}>
                  Calculate returns, manage records, and export professional filing PDFs from one secure workspace.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3}>
                  <Button component={RouteLink} to='/vat/details' variant='contained' sx={{ bgcolor: STYLE.colorPrimary, py: 1.4, px: 3.4, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0B7A70' } }}>
                    Start VAT Return
                  </Button>
                  <Button component={RouteLink} to='/tax/details' variant='outlined' sx={{ py: 1.4, px: 3.4, textTransform: 'none', fontWeight: 700, borderColor: STYLE.colorNavy, color: STYLE.colorNavy }}>
                    Corporate Tax Calculator
                  </Button>
                  <Button component={RouteLink} to='/history' variant='text' endIcon={<ArrowRight size={15} />} sx={{ textTransform: 'none', fontWeight: 700, color: STYLE.colorNavy }}>
                    View Filing History
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4.5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Card variant='outlined' sx={{ borderRadius: 3, borderColor: STYLE.colorBorder }}>
                <CardContent>
                  <Typography sx={{ color: STYLE.colorPrimary, fontSize: 12, fontWeight: 900, letterSpacing: '.08em' }}>COMPLIANCE SNAPSHOT</Typography>
                  <Typography sx={{ mt: 1, mb: 2, color: STYLE.colorNavy, fontWeight: 800, fontSize: 20 }}>Built for UAE filing workflows</Typography>
                  <Stack spacing={1.2}>
                    <Stack direction='row' spacing={1.1} alignItems='center'><CheckCircle2 size={16} color={STYLE.colorPrimary} /><Typography variant='body2'>VAT 5% standard calculation support</Typography></Stack>
                    <Stack direction='row' spacing={1.1} alignItems='center'><CheckCircle2 size={16} color={STYLE.colorPrimary} /><Typography variant='body2'>9% corporate tax threshold support</Typography></Stack>
                    <Stack direction='row' spacing={1.1} alignItems='center'><CheckCircle2 size={16} color={STYLE.colorPrimary} /><Typography variant='body2'>Exportable PDF with saved record history</Typography></Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth='lg' sx={{ py: { xs: 6, md: 9 } }}>
        <Stack spacing={1.2} sx={{ mb: 4, textAlign: 'center' }}>
          <Typography sx={{ color: STYLE.colorPrimary, fontWeight: 900, fontSize: 12, letterSpacing: '.08em' }}>CHOOSE YOUR TASK</Typography>
          <Typography sx={{ color: STYLE.colorNavy, fontWeight: 900, fontSize: { xs: 28, md: 36 } }}>Everything you need for filing</Typography>
          <Typography sx={{ color: '#64748B', maxWidth: 650, mx: 'auto' }}>Focused tools for VAT returns, corporate tax, reminders, and filing records.</Typography>
        </Stack>

        <Grid container spacing={2.2}>
          {TASK_CARDS.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card component={RouteLink} to={card.to} variant='outlined' sx={{ textDecoration: 'none', borderRadius: 3, borderColor: STYLE.colorBorder, height: '100%', '&:hover': { borderColor: STYLE.colorPrimary, transform: 'translateY(-2px)' } }}>
                <CardContent>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#F8FAFC', display: 'grid', placeItems: 'center', mb: 1.6 }}>{card.icon}</Box>
                  <Typography sx={{ color: STYLE.colorNavy, fontWeight: 800, mb: 0.8 }}>{card.title}</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: 14 }}>{card.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#fff', borderTop: `1px solid ${STYLE.colorBorder}` }}>
        <Container maxWidth='lg'>
          <Stack spacing={1} sx={{ mb: 4, textAlign: 'center' }}>
            <Typography sx={{ color: STYLE.colorPrimary, fontWeight: 900, fontSize: 12, letterSpacing: '.08em' }}>HOW IT WORKS</Typography>
            <Typography sx={{ color: STYLE.colorNavy, fontWeight: 900, fontSize: { xs: 26, md: 34 } }}>Simple 4-step flow</Typography>
          </Stack>
          <Grid container spacing={2.5}>
            {STEPS.map((step, idx) => (
              <Grid item xs={12} sm={6} md={3} key={step.title}>
                <Card variant='outlined' sx={{ borderColor: STYLE.colorBorder, borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Typography sx={{ color: STYLE.colorPrimary, fontWeight: 900, mb: 0.5 }}>Step {idx + 1}</Typography>
                    <Typography sx={{ color: STYLE.colorNavy, fontWeight: 800, mb: 0.8 }}>{step.title}</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: 14 }}>{step.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth='lg' sx={{ my: { xs: 5, md: 7 } }}>
        <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, background: `linear-gradient(135deg, ${STYLE.colorNavy} 0%, #1E293B 100%)`, border: `1px solid ${STYLE.colorGold}33`, textAlign: 'center' }}>
          <Stack spacing={1.6} alignItems='center'>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: { xs: 25, md: 34 } }}>Ready to start your filing workflow?</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,.78)', maxWidth: 620 }}>Create your account or sign in to continue VAT and Corporate Tax preparation.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4}>
              <Button component={RouteLink} to='/register' variant='contained' sx={{ bgcolor: STYLE.colorPrimary, textTransform: 'none', fontWeight: 800, px: 3.6, py: 1.35, '&:hover': { bgcolor: '#0B7A70' } }}>Create Account</Button>
              <Button component={RouteLink} to='/login' variant='outlined' sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)', textTransform: 'none', fontWeight: 700, px: 3.6, py: 1.35 }}>Login</Button>
            </Stack>
          </Stack>
        </Box>
      </Container>

      <Box component='footer' sx={{ py: 3.5, borderTop: `1px solid ${STYLE.colorBorder}`, bgcolor: '#fff' }}>
        <Container maxWidth='lg'>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={1.5}>
            <Typography sx={{ color: STYLE.colorNavy, fontWeight: 800 }}>UAE Tax Suite</Typography>
            <Typography sx={{ color: '#64748B', fontSize: 14 }}>© 2026 UAE VAT & Corporate Tax Filing Assistant. All rights reserved.</Typography>
            <Stack direction='row' spacing={2}>
              <Box component={RouteLink} to='/privacy-policy' sx={{ color: '#64748B', textDecoration: 'none', fontSize: 14 }}>Privacy Policy</Box>
              <Box component={RouteLink} to='/terms-and-conditions' sx={{ color: '#64748B', textDecoration: 'none', fontSize: 14 }}>Terms</Box>
              <Box component={RouteLink} to='/documentation' sx={{ color: '#64748B', textDecoration: 'none', fontSize: 14 }}>Documentation</Box>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
