import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  InputBase,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DescriptionIcon from '@mui/icons-material/Description';
import PolicyIcon from '@mui/icons-material/Policy';
import GavelIcon from '@mui/icons-material/Gavel';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import { Building2, FileSpreadsheet, Bell, UserCircle2 } from 'lucide-react';
import { RouteLink } from '../../components/Router';
import { AppFooter } from '../layout/AppFooter';
import { useAuth } from '../../modules/auth/AuthContext';

const SHELL = {
  sidebarWidth: 270,
  radiusCard: '14px',
  colorPrimary: '#0D9488',
  colorNavy: '#0F172A',
  colorGold: '#D97706',
  colorBg: '#F8FAFC',
  colorBorder: '#E2E8F0',
};

const resourceItems = [
  { title: 'Documentation', to: '/documentation', icon: <DescriptionIcon fontSize='small' /> },
  { title: 'Privacy Policy', to: '/privacy-policy', icon: <PolicyIcon fontSize='small' /> },
  { title: 'Terms & Conditions', to: '/terms-and-conditions', icon: <GavelIcon fontSize='small' /> },
];

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { pathname } = window.location;
  const { user } = useAuth();
  const isSuperadmin = String(user?.role || '').toLowerCase() === 'superadmin';

  const navItem = (label: string, to: string, icon?: React.ReactNode) => {
    const active =
      pathname === to ||
      pathname.startsWith(`${to}/`) ||
      (to === '/vat/details' && pathname.startsWith('/vat/')) ||
      (to === '/tax/details' && pathname.startsWith('/tax/')) ||
      (to === '/history' && (pathname.startsWith('/history') || pathname.startsWith('/vat/history') || pathname.startsWith('/tax/history')));

    return (
      <Button
        key={label}
        component={RouteLink}
        to={to}
        onClick={onClose}
        fullWidth
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          color: SHELL.colorNavy,
          py: 1.2,
          px: 1.3,
          minHeight: 46,
          borderRadius: 2.2,
          fontSize: '0.9rem',
          fontWeight: 700,
          borderLeft: active ? `3px solid ${SHELL.colorPrimary}` : '3px solid transparent',
          bgcolor: active ? '#E6F4F1' : 'transparent',
          '&:hover': { bgcolor: active ? '#E6F4F1' : '#F1F5F9' },
        }}
      >
        <Stack direction='row' alignItems='center' spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ width: 22, height: 22, color: active ? SHELL.colorPrimary : SHELL.colorNavy, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, textAlign: 'left', color: SHELL.colorNavy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Typography>
        </Stack>
        <ChevronRightRoundedIcon sx={{ fontSize: 18, color: '#64748B', ml: 1 }} />
      </Button>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderRight: `1px solid ${SHELL.colorBorder}` }}>
      <Box sx={{ p: 2.2, borderBottom: `1px solid ${SHELL.colorBorder}` }}>
        <Box component='img' src='/logo.png' alt='FTA VAT & Tax' sx={{ width: '100%', maxWidth: 182, height: 40, objectFit: 'contain' }} />
      </Box>

      <Box sx={{ p: 1.8, display: 'grid', gap: 0.75 }}>
        {navItem('Dashboard', '/dashboard', <GridViewRoundedIcon fontSize='small' />)}

        <Typography sx={{ px: 1.2, pt: 1.8, pb: 0.8, color: '#64748B', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.06em' }}>TAX MODULES</Typography>
        {navItem('VAT Return', '/vat/details', <FileSpreadsheet size={18} />)}
        {navItem('Corporate Tax', '/tax/details', <Building2 size={18} />)}

        <Typography sx={{ px: 1.2, pt: 1.8, pb: 0.8, color: '#64748B', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.06em' }}>MANAGEMENT</Typography>
        {navItem('History', '/history', <FileSpreadsheet size={16} />)}
        {navItem('Reminders', '/reminders', <Bell size={16} />)}
        {navItem('Business Profile', '/business-profile', <Building2 size={16} />)}
        {navItem('Profile', '/profile', <UserCircle2 size={16} />)}

        {isSuperadmin && (
          <>
            <Typography sx={{ px: 1.2, pt: 1.8, pb: 0.8, color: '#64748B', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.06em' }}>ADMIN</Typography>
            {navItem('Admin Dashboard', '/admin', <AdminPanelSettingsRoundedIcon fontSize='small' />)}
            {navItem('Users', '/admin/users', <AdminPanelSettingsRoundedIcon fontSize='small' />)}
            {navItem('SMTP', '/admin/smtp', <AdminPanelSettingsRoundedIcon fontSize='small' />)}
            {navItem('Audit Logs', '/admin/audit', <AdminPanelSettingsRoundedIcon fontSize='small' />)}
          </>
        )}

        <Typography sx={{ px: 1.2, pt: 1.8, pb: 0.8, color: '#64748B', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.06em' }}>RESOURCES</Typography>
        {resourceItems.map((item) => navItem(item.title, item.to, item.icon))}
      </Box>

      <Box sx={{ mt: 'auto', p: 1.8 }}>
        <Box sx={{ border: `1px solid ${SHELL.colorBorder}`, borderRadius: 2.4, p: 1.6, bgcolor: '#F8FAFC' }}>
          <Typography sx={{ fontSize: '0.98rem', fontWeight: 800, color: SHELL.colorNavy }}>Need Help?</Typography>
          <Typography sx={{ fontSize: '0.86rem', color: '#64748B', mt: 0.8, mb: 1.3 }}>Watch official guides for VAT and corporate tax filing steps.</Typography>
          <Button fullWidth href='https://www.youtube.com/@uaetax' target='_blank' sx={{ minHeight: 42, border: `1px solid ${SHELL.colorBorder}`, borderRadius: 1.8, textTransform: 'none', color: SHELL.colorNavy, fontWeight: 700 }} startIcon={<HelpOutlineRoundedIcon fontSize='small' />}>
            Help Center
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function TopNavbar({ onMenuClick, mobile }: { onMenuClick: () => void; mobile: boolean }) {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: `1px solid ${SHELL.colorBorder}`, bgcolor: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ minHeight: 72, px: { xs: 1.5, sm: 2.4 }, gap: 1.2 }}>
        <Stack direction='row' alignItems='center' gap={1.1} sx={{ minWidth: 0, flex: 1 }}>
          <IconButton onClick={onMenuClick} sx={{ width: 42, height: 42, color: SHELL.colorNavy }}><MenuIcon /></IconButton>

          {!mobile && (
            <Stack direction='row' alignItems='center' sx={{ border: `1px solid ${SHELL.colorBorder}`, borderRadius: 2, px: 1.2, py: 0.7, width: 'min(440px,100%)', bgcolor: '#F8FAFC' }}>
              <SearchIcon sx={{ color: '#64748B', fontSize: 20 }} />
              <InputBase placeholder='Search records, profiles, reminders…' sx={{ ml: 1, fontSize: '0.92rem', flex: 1 }} />
            </Stack>
          )}
        </Stack>

        <Stack direction='row' alignItems='center' gap={1.2}>
          <IconButton sx={{ width: 40, height: 40, color: SHELL.colorNavy }}><NotificationsNoneRoundedIcon /></IconButton>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ color: '#64748B', fontSize: '0.74rem' }}>Signed in as</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.93rem', color: SHELL.colorNavy }}>{user?.fullName || user?.name || user?.email || 'User'}</Typography>
          </Box>

          <Stack direction='row' spacing={1} alignItems='center'>
            <Button component={RouteLink} to='/profile' variant='text' sx={{ textTransform: 'none', color: SHELL.colorNavy, fontWeight: 700 }}>Profile</Button>
            <Button
              onClick={async () => {
                await logout();
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              variant='outlined'
              size='small'
              sx={{ textTransform: 'none', borderColor: SHELL.colorBorder, color: SHELL.colorNavy, fontWeight: 700 }}
            >
              Logout
            </Button>
            <Avatar sx={{ bgcolor: SHELL.colorPrimary, width: 35, height: 35, fontSize: '0.88rem', fontWeight: 800 }}>
              {(user?.fullName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </Avatar>
          </Stack>
        </Stack>
      </Stack>

      {mobile && (
        <Box sx={{ px: 1.6, pb: 1.2 }}>
          <Stack direction='row' alignItems='center' sx={{ border: `1px solid ${SHELL.colorBorder}`, borderRadius: 1.8, px: 1.1, py: 0.7, bgcolor: '#F8FAFC' }}>
            <SearchIcon sx={{ color: '#64748B', fontSize: 19 }} />
            <InputBase placeholder='Search records, profiles, reminders…' sx={{ ml: 1, fontSize: '0.9rem', flex: 1 }} />
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function HomeContent() {
  return (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${SHELL.colorBorder}`, borderRadius: SHELL.radiusCard, p: { xs: 2, md: 3 } }}>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.6rem', md: '2rem' }, color: SHELL.colorNavy }}>
          UAE VAT & Corporate Tax Workspace
        </Typography>
        <Typography sx={{ color: '#64748B', maxWidth: 760 }}>
          Manage calculations, saved records, reminders, and exports from a single trusted interface.
        </Typography>
      </Stack>
    </Box>
  );
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ bgcolor: SHELL.colorBg, minHeight: '100vh', overflowX: 'hidden' }}>
      {!isMobile && (
        <Box sx={{ width: SHELL.sidebarWidth, position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 30 }}>
          <Sidebar />
        </Box>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 282 } }}>
        <Sidebar mobile onClose={() => setOpen(false)} />
      </Drawer>

      <Box sx={{ ml: { md: `${SHELL.sidebarWidth}px` }, minWidth: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopNavbar onMenuClick={() => setOpen(true)} mobile={isMobile} />
        <Box sx={{ flex: 1, maxWidth: 1320, width: '100%', mx: 'auto', p: { xs: 1.4, sm: 2.2, md: 2.8 }, display: 'grid', gap: 2.1 }}>
          {children}
        </Box>
        <AppFooter />
      </Box>
    </Box>
  );
}

export function PremiumHome() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}
