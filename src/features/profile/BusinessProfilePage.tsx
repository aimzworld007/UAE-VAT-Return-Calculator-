import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ApiError } from '../../shared/utils/apiClient';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  createBusinessProfile,
  deleteBusinessProfile,
  listBusinessProfiles,
  setDefaultBusinessProfile,
  updateBusinessProfile,
  type BusinessProfile,
} from '../business/services/businessProfileApi';

type BusinessProfileForm = {
  businessName: string;
  trn: string;
  emirate: string;
  address: string;
  phone: string;
  email: string;
  activity: string;
  vatFilingFrequency: string;
  corporateTaxYearStart: string;
  corporateTaxYearEnd: string;
  defaultVatPricingMode: string;
};

const initialState: BusinessProfileForm = {
  businessName: '',
  trn: '',
  emirate: '',
  address: '',
  phone: '',
  email: '',
  activity: '',
  vatFilingFrequency: 'Quarterly',
  corporateTaxYearStart: '',
  corporateTaxYearEnd: '',
  defaultVatPricingMode: 'Tax Exclusive',
};

const emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

function mapProfileToForm(profile?: BusinessProfile | null): BusinessProfileForm {
  if (!profile) return initialState;
  return {
    businessName: profile.businessName || '',
    trn: profile.trn || '',
    emirate: profile.emirate || '',
    address: profile.address || '',
    phone: profile.phone || '',
    email: profile.email || '',
    activity: profile.activity || '',
    vatFilingFrequency: profile.vatFilingFrequency || 'Quarterly',
    corporateTaxYearStart: profile.corporateTaxYearStart ? String(profile.corporateTaxYearStart).slice(0, 10) : '',
    corporateTaxYearEnd: profile.corporateTaxYearEnd ? String(profile.corporateTaxYearEnd).slice(0, 10) : '',
    defaultVatPricingMode: profile.defaultVatPricingMode || 'Tax Exclusive',
  };
}

export function BusinessProfilePage() {
  const [profiles, setProfiles] = React.useState<BusinessProfile[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>('new');
  const [form, setForm] = React.useState<BusinessProfileForm>(initialState);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const loadProfiles = React.useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const nextProfiles = await listBusinessProfiles();
      setProfiles(nextProfiles);
      const defaultProfile = nextProfiles.find((p) => p.isDefault) || nextProfiles[0];
      if (defaultProfile) {
        setSelectedId(defaultProfile.id);
        setForm(mapProfileToForm(defaultProfile));
      } else {
        setSelectedId('new');
        setForm(initialState);
      }
    } catch (error: any) {
      const message = error instanceof ApiError ? error.message : 'Unable to load business profiles.';
      setNotice({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const completionFields = Object.values(form).filter((v) => String(v || '').trim().length > 0).length;
  const completion = Math.round((completionFields / Object.keys(form).length) * 100);

  const setField = (key: keyof BusinessProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSelectProfile = (id: string) => {
    setSelectedId(id);
    if (id === 'new') {
      setForm(initialState);
      return;
    }
    const profile = profiles.find((p) => p.id === id);
    setForm(mapProfileToForm(profile));
  };

  const onCreateNew = () => {
    setSelectedId('new');
    setForm(initialState);
    setNotice(null);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const payload = {
        ...form,
        trn: form.trn.replace(/[^0-9]/g, ''),
      };

      if (selectedId === 'new') {
        await createBusinessProfile(payload);
        setNotice({ type: 'success', text: 'Business profile created successfully.' });
      } else {
        await updateBusinessProfile(selectedId, payload);
        setNotice({ type: 'success', text: 'Business profile updated successfully.' });
      }

      await loadProfiles();
    } catch (error: any) {
      const message = error instanceof ApiError ? error.message : 'Unable to save profile right now.';
      setNotice({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const onMakeDefault = async () => {
    if (!selectedId || selectedId === 'new') return;
    setSaving(true);
    setNotice(null);
    try {
      await setDefaultBusinessProfile(selectedId);
      setNotice({ type: 'success', text: 'Default profile updated successfully.' });
      await loadProfiles();
    } catch (error: any) {
      const message = error instanceof ApiError ? error.message : 'Unable to set default profile.';
      setNotice({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selectedId || selectedId === 'new') return;

    setSaving(true);
    setNotice(null);
    try {
      await deleteBusinessProfile(selectedId);
      setNotice({ type: 'success', text: 'Business profile deleted successfully.' });
      await loadProfiles();
    } catch (error: any) {
      const message = error instanceof ApiError ? error.message : 'Unable to delete profile.';
      setNotice({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            Business Profiles
          </Typography>
          <Typography color='text.secondary'>Maintain one or more business profiles and reuse them in VAT and Corporate Tax forms.</Typography>
        </Box>

        {notice && <Alert severity={notice.type}>{notice.text}</Alert>}

        <Card variant='outlined'>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='h6'>Profile Completion</Typography>
                <Typography sx={{ fontWeight: 700 }}>{completion}%</Typography>
              </Stack>
              <LinearProgress variant='determinate' value={completion} sx={{ height: 8, borderRadius: 99 }} />
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Alert severity='info'>Loading business profiles…</Alert>
        ) : (
          <Card variant='outlined'>
            <CardContent>
              <Stack component='form' onSubmit={onSave} spacing={2.2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                  <TextField
                    select
                    fullWidth
                    label='Saved Profiles'
                    value={selectedId}
                    onChange={(e) => onSelectProfile(e.target.value)}
                  >
                    <MenuItem value='new'>+ Create new business profile</MenuItem>
                    {profiles.map((profile) => (
                      <MenuItem key={profile.id} value={profile.id}>
                        {profile.businessName || 'Unnamed Business'} {profile.isDefault ? '(Default)' : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button variant='outlined' onClick={onCreateNew}>
                    New
                  </Button>
                  <Button variant='outlined' onClick={onMakeDefault} disabled={selectedId === 'new' || saving}>
                    Set Default
                  </Button>
                  <Button variant='outlined' color='error' onClick={() => setDeleteConfirmOpen(true)} disabled={selectedId === 'new' || saving}>
                    Delete
                  </Button>
                </Stack>

                <Typography variant='h6'>Business Identity</Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label='Business Name'
                      required
                      fullWidth
                      value={form.businessName}
                      onChange={(e) => setField('businessName', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label='TRN' fullWidth value={form.trn} onChange={(e) => setField('trn', e.target.value)} helperText='Numbers only' />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField select label='Emirate' fullWidth value={form.emirate} onChange={(e) => setField('emirate', e.target.value)}>
                      {emirates.map((emirate) => (
                        <MenuItem key={emirate} value={emirate}>
                          {emirate}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label='Address' fullWidth value={form.address} onChange={(e) => setField('address', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label='Business Activity'
                      fullWidth
                      value={form.activity}
                      onChange={(e) => setField('activity', e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Typography variant='h6'>Tax Settings</Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      label='VAT Filing Frequency'
                      fullWidth
                      value={form.vatFilingFrequency}
                      onChange={(e) => setField('vatFilingFrequency', e.target.value)}
                    >
                      <MenuItem value='Monthly'>Monthly</MenuItem>
                      <MenuItem value='Quarterly'>Quarterly</MenuItem>
                      <MenuItem value='Yearly'>Yearly</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      type='date'
                      fullWidth
                      label='Corporate Tax Year Start'
                      InputLabelProps={{ shrink: true }}
                      value={form.corporateTaxYearStart}
                      onChange={(e) => setField('corporateTaxYearStart', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      type='date'
                      fullWidth
                      label='Corporate Tax Year End'
                      InputLabelProps={{ shrink: true }}
                      value={form.corporateTaxYearEnd}
                      onChange={(e) => setField('corporateTaxYearEnd', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label='Default VAT Pricing Mode'
                      value={form.defaultVatPricingMode}
                      onChange={(e) => setField('defaultVatPricingMode', e.target.value)}
                    >
                      <MenuItem value='Tax Inclusive'>Tax Inclusive</MenuItem>
                      <MenuItem value='Tax Exclusive'>Tax Exclusive</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Typography variant='h6'>Contact</Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label='Phone' fullWidth value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField label='Email' type='email' fullWidth value={form.email} onChange={(e) => setField('email', e.target.value)} />
                  </Grid>
                </Grid>

                <Box>
                  <Button type='submit' variant='contained' disabled={saving}>
                    {saving ? 'Saving...' : selectedId === 'new' ? 'Create Profile' : 'Save Profile'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete business profile</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this business profile?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            color='error'
            variant='contained'
            onClick={async () => {
              setDeleteConfirmOpen(false);
              await onDelete();
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
