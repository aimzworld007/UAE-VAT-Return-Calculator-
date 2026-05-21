import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  FileSpreadsheet,
  Building2,
  History,
  Briefcase,
  FileDown,
  Bell,
  ShieldCheck,
  Layers,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { RouteLink, usePathname } from '../../components/Router';

// Premium UAE-inspired Design Constants
const STYLE = {
  colorPrimary: '#0D9488', // Teal accent
  colorNavy: '#0F172A', // Slate/Navy primary
  colorGold: '#D97706', // Brushed UAE gold highlight
  colorBg: '#F8FAFC', // Ultra-light grey bg
  colorBorder: '#E2E8F0', // Border color
  radiusCard: 16,
};

// 8 Feature Cards
const FEATURE_CARDS = [
  {
    title: 'VAT Return Calculator',
    description: 'Calculate standard-rated (5%), zero-rated, and exempt transactions with guided UAE Federal Tax Authority (FTA) compliance.',
    icon: <FileSpreadsheet size={24} style={{ color: STYLE.colorPrimary }} />,
    color: '#E0F2FE', // Light blue badge bg
    to: '/vat/business-details',
  },
  {
    title: 'Corporate Tax Estimator',
    description: 'Assess taxable profit margins and estimate corporate tax liabilities under the new UAE 9% tax threshold rules.',
    icon: <Building2 size={24} style={{ color: STYLE.colorGold }} />,
    color: '#FEF3C7', // Light gold badge bg
    to: '/tax/business-details',
  },
  {
    title: 'Filing History',
    description: 'Access a secure ledger of your previously calculated returns, draft estimates, and submission-ready tax entries.',
    icon: <History size={24} style={{ color: '#6366F1' }} />,
    color: '#EEF2FF', // Light indigo badge bg
    to: '/dashboard/vat-history',
  },
  {
    title: 'Business Profile',
    description: 'Maintain and update your official entity details, address, and primary Tax Registration Number (TRN).',
    icon: <Briefcase size={24} style={{ color: '#0EA5E9' }} />,
    color: '#E0F2FE', // Light blue badge bg
    to: '/dashboard/business-profile',
  },
  {
    title: 'PDF Export',
    description: 'Generate fully-styled, professional, audit-compliant PDF reports for direct submission or internal archives.',
    icon: <FileDown size={24} style={{ color: '#10B981' }} />,
    color: '#ECFDF5', // Light emerald badge bg
    to: '/dashboard',
  },
  {
    title: 'Filing Reminders',
    description: 'Never miss an FTA deadline with proactive tracking for quarterly VAT filings and annual corporate returns.',
    icon: <Bell size={24} style={{ color: '#F59E0B' }} />,
    color: '#FFFBEB', // Light amber badge bg
    to: '/dashboard/reminders',
  },
  {
    title: 'Secure User Dashboard',
    description: 'Access your records with complete confidence via enterprise-grade local data isolation and user authentication.',
    icon: <ShieldCheck size={24} style={{ color: '#14B8A6' }} />,
    color: '#F0FDFA', // Light teal badge bg
    to: '/dashboard',
  },
  {
    title: 'Multi-business Ready',
    description: 'Configure and toggle between multiple business entities or trade names within a single organized dashboard.',
    icon: <Layers size={24} style={{ color: '#8B5CF6' }} />,
    color: '#F5F3FF', // Light purple badge bg
    to: '/dashboard',
  },
];

// Steps for How it works
const STEPS = [
  {
    title: 'Create Account',
    description: 'Sign up securely with your professional email address to protect your financial records.',
  },
  {
    title: 'Define Business Profile',
    description: 'Set up business profiles, enter your FTA-issued TRN, and select your filing frequency.',
  },
  {
    title: 'Compute Tax & Preview',
    description: 'Input your sales, purchases, or corporate profits into our elegant step-by-step calculator wizard.',
  },
  {
    title: 'Export & File Record',
    description: 'Download a pristine PDF summary or Excel template formatted for hassle-free FTA filing.',
  },
];

function isLoggedIn() {
  return Boolean(
    localStorage.getItem('fta_auth_user') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken')
  );
}

export function PublicLandingPage() {
  const [startedLink, setStartedLink] = React.useState('/register');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { navigate } = usePathname();

  React.useEffect(() => {
    document.title = 'UAE VAT & Corporate Tax Filing Assistant';

    const metaName = 'description';
    const content = 'Calculate UAE VAT, estimate Corporate Tax, save filing records, and track upcoming tax deadlines in one secure assistant.';
    let tag = document.querySelector(`meta[name="${metaName}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', metaName);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);

    setStartedLink(isLoggedIn() ? '/dashboard' : '/register');
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navLinkStyle = {
    color: STYLE.colorNavy,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    opacity: 0.85,
    transition: 'color 0.2s, opacity 0.2s',
    '&:hover': {
      color: STYLE.colorPrimary,
      opacity: 1,
    },
  };

  const drawer = (
    <Box sx={{ width: 280, p: 3, bgcolor: '#ffffff', height: '100%' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 4 }}>
        <Typography variant='h6' sx={{ color: STYLE.colorNavy, fontWeight: 800, letterSpacing: '-0.5px' }}>
          UAE Tax Suite
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: STYLE.colorNavy }}>
          <X size={20} />
        </IconButton>
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <List sx={{ p: 0 }}>
        <ListItem disablePadding sx={{ mb: 1.5 }}>
          <ListItemButton component={RouteLink} to="/vat/business-details" onClick={handleDrawerToggle} sx={{ borderRadius: 2 }}>
            <ListItemText primary="VAT Return Calculator" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1.5 }}>
          <ListItemButton component={RouteLink} to="/tax/business-details" onClick={handleDrawerToggle} sx={{ borderRadius: 2 }}>
            <ListItemText primary="Corporate Tax Calculator" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1.5 }}>
          <ListItemButton component={RouteLink} to="/dashboard" onClick={handleDrawerToggle} sx={{ borderRadius: 2 }}>
            <ListItemText primary="Filing History" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1.5 }}>
          <ListItemButton component={RouteLink} to="/login" onClick={handleDrawerToggle} sx={{ borderRadius: 2 }}>
            <ListItemText primary="Login" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Box sx={{ mt: 4 }}>
        <Button
          component={RouteLink}
          to={startedLink}
          onClick={handleDrawerToggle}
          fullWidth
          variant="contained"
          sx={{
            py: 1.25,
            bgcolor: STYLE.colorPrimary,
            color: '#fff',
            borderRadius: 2.5,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: '#0B7A70' },
          }}
        >
          Start Filing
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: STYLE.colorBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header / AppBar */}
      <AppBar
        elevation={0}
        position="sticky"
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          borderBottom: `1px solid ${STYLE.colorBorder}`,
          backdropFilter: 'blur(12px)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 76 }, justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} component={RouteLink} to="/" sx={{ textDecoration: 'none' }}>
              {/* Premium geometric gold/teal logo accent */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.8,
                  bgcolor: STYLE.colorNavy,
                  display: 'grid',
                  placeItems: 'center',
                  borderLeft: `4px solid ${STYLE.colorGold}`,
                  borderRight: `4px solid ${STYLE.colorPrimary}`,
                }}
              >
                <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 900 }}>AE</Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: STYLE.colorNavy,
                  fontWeight: 900,
                  fontSize: { xs: '1.05rem', md: '1.25rem' },
                  letterSpacing: '-0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                UAE Tax <span style={{ color: STYLE.colorPrimary, fontWeight: 500 }}>Suite</span>
              </Typography>
            </Stack>

            {/* Desktop Navigation Links */}
            <Stack direction="row" spacing={3.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Box component={RouteLink} to="/vat/business-details" sx={navLinkStyle}>
                VAT Calculator
              </Box>
              <Box component={RouteLink} to="/tax/business-details" sx={navLinkStyle}>
                Corporate Tax
              </Box>
              <Box component={RouteLink} to="/dashboard" sx={navLinkStyle}>
                Filing Records
              </Box>
              <Box component={RouteLink} to="/login" sx={navLinkStyle}>
                Login
              </Box>
              <Button
                component={RouteLink}
                to={startedLink}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 3,
                  py: 1,
                  bgcolor: STYLE.colorNavy,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: `1px solid ${STYLE.colorNavy}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: STYLE.colorPrimary,
                    borderColor: STYLE.colorPrimary,
                  },
                }}
              >
                Get Started
              </Button>
            </Stack>

            {/* Mobile Menu Icon */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, color: STYLE.colorNavy }}
            >
              <Menu size={24} />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, border: 'none' },
        }}
      >
        {drawer}
      </Drawer>

      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 9 },
          bgcolor: '#ffffff',
          borderBottom: `1px solid ${STYLE.colorBorder}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7.5}>
              <Stack spacing={2.5}>
                {/* Slim premium badge */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 'fit-content' }}>
                  <Box
                    sx={{
                      bgcolor: '#E6F4F1',
                      px: 2,
                      py: 0.5,
                      borderRadius: 5,
                      border: `1px solid ${STYLE.colorPrimary}22`,
                    }}
                  >
                    <Typography
                      sx={{
                        color: STYLE.colorPrimary,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Federal Tax Compliance
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: '#FEF3C7',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 5,
                      border: `1px solid ${STYLE.colorGold}33`,
                    }}
                  >
                    <Typography
                      sx={{
                        color: STYLE.colorGold,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      9% CT READY
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="h1"
                  sx={{
                    color: STYLE.colorNavy,
                    fontSize: { xs: '2.2rem', md: '3.1rem' },
                    fontWeight: 900,
                    lineHeight: 1.15,
                    letterSpacing: '-1px',
                  }}
                >
                  UAE VAT & Corporate Tax <br />
                  <span style={{ color: STYLE.colorPrimary }}>Filing Assistant</span>
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    color: '#64748B',
                    fontSize: { xs: '1rem', md: '1.18rem' },
                    fontWeight: 400,
                    lineHeight: 1.6,
                    maxWidth: 680,
                  }}
                >
                  Calculate, save, review, and export VAT & Corporate Tax records with confidence. Formulated to fit the latest UAE Federal Tax Authority (FTA) specifications.
                </Typography>

                {/* Hero CTA Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1.5 }}>
                  <Button
                    component={RouteLink}
                    to="/vat/business-details"
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2.8,
                      px: 3.5,
                      py: 1.5,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      bgcolor: STYLE.colorPrimary,
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(13,148,136,0.15)',
                      '&:hover': {
                        bgcolor: '#0B7A70',
                        boxShadow: '0 6px 20px rgba(13,148,136,0.25)',
                      },
                    }}
                  >
                    Start VAT Return
                  </Button>
                  <Button
                    component={RouteLink}
                    to="/tax/business-details"
                    variant="outlined"
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2.8,
                      px: 3.5,
                      py: 1.5,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderColor: STYLE.colorNavy,
                      color: STYLE.colorNavy,
                      borderWidth: '1.5px',
                      '&:hover': {
                        borderColor: STYLE.colorPrimary,
                        color: STYLE.colorPrimary,
                        borderWidth: '1.5px',
                        bgcolor: 'rgba(13,148,136,0.03)',
                      },
                    }}
                  >
                    Corporate Tax Calculator
                  </Button>
                  <Button
                    component={RouteLink}
                    to="/login"
                    variant="text"
                    endIcon={<ArrowRight size={16} />}
                    sx={{
                      textTransform: 'none',
                      px: 2,
                      py: 1.5,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: STYLE.colorNavy,
                      justifyContent: 'center',
                      '&:hover': {
                        color: STYLE.colorPrimary,
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    Login
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            {/* Quick mini panel presentation grid */}
            <Grid item xs={12} md={4.5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  border: `1px solid ${STYLE.colorBorder}`,
                  borderRadius: 4,
                  bgcolor: '#ffffff',
                  p: 3,
                  boxShadow: '0 8px 30px rgba(15,23,42,0.02)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent geometric lines */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 6,
                    height: '100%',
                    bgcolor: STYLE.colorPrimary,
                  }}
                />
                <Typography variant="subtitle2" sx={{ color: STYLE.colorPrimary, fontWeight: 800, mb: 1, letterSpacing: '0.5px' }}>
                  COMPLIANCE METRICS
                </Typography>
                <Typography variant="h6" sx={{ color: STYLE.colorNavy, fontWeight: 800, mb: 2 }}>
                  Standard UAE Specifications
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <CheckCircle2 size={18} style={{ color: STYLE.colorPrimary }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      VAT Rate: 5% Standard Rate (Decree-Law No. 8)
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <CheckCircle2 size={18} style={{ color: STYLE.colorPrimary }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      Corporate Tax: 9% above AED 375,000 profit
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <CheckCircle2 size={18} style={{ color: STYLE.colorPrimary }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      Supports export format for FTA e-Filing
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Feature Grid Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Stack spacing={1.5} sx={{ textAlign: 'center', mb: 6, alignItems: 'center' }}>
          <Typography
            sx={{
              color: STYLE.colorPrimary,
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            Capabilities
          </Typography>
          <Typography
            variant="h3"
            sx={{
              color: STYLE.colorNavy,
              fontWeight: 900,
              fontSize: { xs: '1.75rem', md: '2.3rem' },
              letterSpacing: '-0.5px',
            }}
          >
            Engineered for UAE Business Excellence
          </Typography>
          <Typography sx={{ color: '#64748B', maxWidth: 640, fontSize: '1rem' }}>
            A powerful suite of modules tailored to manage your corporate and value-added tax accounts cleanly and securely.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {FEATURE_CARDS.map((card) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: `1px solid ${STYLE.colorBorder}`,
                  borderRadius: `${STYLE.radiusCard}px`,
                  bgcolor: '#ffffff',
                  transition: 'transform 0.25s ease, border-color 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: STYLE.colorPrimary,
                    cursor: 'pointer',
                  },
                }}
                component={RouteLink}
                to={card.to}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Circular badge container for icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3.5,
                      bgcolor: card.color,
                      display: 'grid',
                      placeItems: 'center',
                      mb: 2.2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: STYLE.colorNavy,
                      fontWeight: 800,
                      fontSize: '1rem',
                      mb: 1,
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748B',
                      lineHeight: 1.5,
                      fontSize: '0.88rem',
                    }}
                  >
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#ffffff', borderTop: `1px solid ${STYLE.colorBorder}` }}>
        <Container maxWidth="lg">
          <Stack spacing={1.5} sx={{ textAlign: 'center', mb: 7, alignItems: 'center' }}>
            <Typography
              sx={{
                color: STYLE.colorPrimary,
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Process Flow
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: STYLE.colorNavy,
                fontWeight: 900,
                fontSize: { xs: '1.75rem', md: '2.3rem' },
                letterSpacing: '-0.5px',
              }}
            >
              How It Works
            </Typography>
            <Typography sx={{ color: '#64748B', maxWidth: 580 }}>
              Prepare and organize your official UAE tax records in four standard, effortless steps.
            </Typography>
          </Stack>

          <Grid container spacing={3.5}>
            {STEPS.map((step, idx) => (
              <Grid item xs={12} sm={6} md={3} key={step.title}>
                <Box sx={{ position: 'relative' }}>
                  {/* Step counter badge */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: STYLE.colorPrimary,
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Divider sx={{ flexGrow: 1, borderColor: STYLE.colorBorder, display: { xs: 'none', md: 'block' } }} />
                  </Stack>
                  <Typography variant="h6" sx={{ color: STYLE.colorNavy, fontWeight: 800, fontSize: '0.98rem', mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.5 }}>
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action (CTA) Section */}
      <Container maxWidth="lg" sx={{ my: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${STYLE.colorNavy} 0%, #17253F 100%)`,
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${STYLE.colorGold}33`,
          }}
        >
          {/* Subtle elegant gold/emerald circle gradients in background */}
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              right: '-10%',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${STYLE.colorPrimary}11 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-15%',
              left: '-5%',
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${STYLE.colorGold}0F 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          <Stack spacing={2} alignItems="center">
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 900, fontSize: { xs: '1.5rem', md: '2.1rem' } }}>
              Start Preparing Your UAE Tax Records Today
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, fontSize: '0.98rem', mb: 1.5 }}>
              Use our guided interactive flow to structure compliant filings and keep a permanent digital ledger for your businesses.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: 'fit-content' }}>
              <Button
                component={RouteLink}
                to="/register"
                variant="contained"
                sx={{
                  py: 1.5,
                  px: 4,
                  bgcolor: STYLE.colorPrimary,
                  color: '#fff',
                  borderRadius: 2.8,
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  textTransform: 'none',
                  border: `1px solid ${STYLE.colorPrimary}`,
                  '&:hover': {
                    bgcolor: '#0B7A70',
                    borderColor: '#0B7A70',
                  },
                }}
              >
                Create Free Account
              </Button>
              <Button
                component={RouteLink}
                to="/login"
                variant="outlined"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  borderRadius: 2.8,
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                Login
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>

      {/* Footer Section */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#ffffff',
          borderTop: `1px solid ${STYLE.colorBorder}`,
          py: 4,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Stack spacing={0.5}>
              <Typography sx={{ color: STYLE.colorNavy, fontWeight: 800, fontSize: '0.95rem' }}>
                UAE Tax Suite
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                © 2026 UAE VAT & Corporate Tax Filing Assistant. All rights reserved.
              </Typography>
            </Stack>

            <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>
              Powered by eCashbiz ERP
            </Typography>

            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
              <Box
                component={RouteLink}
                to="/privacy-policy"
                sx={{
                  color: '#64748B',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { color: STYLE.colorPrimary },
                }}
              >
                Privacy Policy
              </Box>
              <Box
                component={RouteLink}
                to="/terms-and-conditions"
                sx={{
                  color: '#64748B',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { color: STYLE.colorPrimary },
                }}
              >
                Terms of Service
              </Box>
              <Box
                component={RouteLink}
                to="/documentation"
                sx={{
                  color: '#64748B',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { color: STYLE.colorPrimary },
                }}
              >
                Documentation
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
