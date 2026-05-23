import React from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, FormControl, FormControlLabel, FormHelperText, Grid, InputAdornment, InputLabel, LinearProgress, MenuItem, Select, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import SouthOutlinedIcon from '@mui/icons-material/SouthOutlined';
import PlaylistAddCheckCircleOutlinedIcon from '@mui/icons-material/PlaylistAddCheckCircleOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import SouthWestOutlinedIcon from '@mui/icons-material/SouthWestOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import BalanceOutlinedIcon from '@mui/icons-material/BalanceOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { Building2, CheckCircle2, ClipboardList, Eye, Upload } from 'lucide-react';
import { buildMonthlyEntries, calculateVat } from './lib/vatCalculator';
import { validateBusinessName, validateTrn, validateRequired, validateVatPeriodSelection } from './lib/taxValidation';
import { TAX_CONFIG } from './lib/taxConfig';
import { money } from './components/common.jsx';
import { Vat201Report } from './components/Vat201Report.jsx';
import { MONTHS, formatVatPeriodLabel, getPeriodFromSelection } from './lib/vatPeriod';
import { VAT_PRICING_MODES, splitVatFromAmount } from './lib/vatPricing';
import { downloadPdf, generateVatPdfBlob } from './services/vatPdfApi';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { createBusinessProfile, listBusinessProfiles, updateBusinessProfile } from '../business/services/businessProfileApi';

const steps = [
  { key: 'business', label: 'Business Details', icon: Building2 },
  { key: 'input', label: 'VAT Input', icon: ClipboardList },
  { key: 'preview', label: 'VAT Return Review', icon: Eye },
  { key: 'export', label: 'Export', icon: Upload }
];
const n = (v) => Number(v) || 0;
const clampInput = (v) => Math.max(0, n(v));
const parseAdjustmentInput = (v) => {
  if (v === '' || v === '-' || v === '.' || v === '-.') return v;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
};
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

const EMIRATE_OPTIONS = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const EMIRATE_BOX_MAP = {
  'Abu Dhabi': '1a',
  Dubai: '1b',
  Sharjah: '1c',
  Ajman: '1d',
  'Umm Al Quwain': '1e',
  'Ras Al Khaimah': '1f',
  Fujairah: '1g'
};

export function VatWizard({ data, setData, onSave, onReset, onProgressChange, forcedStep, navigateToStep }) {
  const fieldSx = { '& .MuiInputBase-root': { minHeight: { xs: 44, md: 48 }, height: { xs: 44, md: 48 }, borderRadius: '12px', color: '#071832', bgcolor: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7e3f0' }, '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9cb7dc' }, '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb', borderWidth: '1px' }, '& .Mui-focused': { boxShadow: '0 0 0 3px rgba(37,99,235,0.15)' }, '& .MuiInputBase-input': { padding: '0 14px', fontSize: 14, lineHeight: 1.2 }, '& .MuiSelect-select': { display: 'flex', alignItems: 'center', padding: '0 38px 0 14px !important', fontSize: 14, lineHeight: 1.2 }, '& .MuiInputLabel-root': { fontSize: 12, lineHeight: 1.1 }, '@media (max-width:768px)': { '& .MuiInputBase-input': { padding: '0 12px' }, '& .MuiSelect-select': { padding: '0 36px 0 12px !important' } } };
  const [step, setStep] = React.useState(forcedStep || 1);
  const stepToPath = React.useMemo(() => ({ 1: '/vat/business-details', 2: '/vat/input', 3: '/vat/preview', 4: '/vat/export' }), []);
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  const [businessProfiles, setBusinessProfiles] = React.useState([]);
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = React.useState('');
  const [businessProfilesError, setBusinessProfilesError] = React.useState('');
  const [businessProfileStatus, setBusinessProfileStatus] = React.useState('');
  const [autoSaveProfileEnabled, setAutoSaveProfileEnabled] = React.useState(true);
  const saveTimerRef = React.useRef(null);
  const lastSavedFingerprintRef = React.useRef('');
  const [recordSaveStatus, setRecordSaveStatus] = React.useState('');
  const [recordSaving, setRecordSaving] = React.useState(false);
  const result = calculateVat(data);
  const reqErr = validateBusinessName(data.businessName) || validateTrn(data.trn) || validateRequired(data.businessLocationEmirate, 'Business location emirate') || validateVatPeriodSelection(data);

  React.useEffect(() => {
    const period = getPeriodFromSelection(data);
    const nextEntries = buildMonthlyEntries({ ...data, ...period });
    if (JSON.stringify(nextEntries) !== JSON.stringify(data.monthlyEntries || []) || period.taxPeriodStart !== data.taxPeriodStart || period.taxPeriodEnd !== data.taxPeriodEnd) {
      setData({ ...data, ...period, monthlyEntries: nextEntries });
    }
  }, [data.filingFrequency, data.filingYear, data.filingMonth, data.filingQuarter, data.filingStartMonth]);

  React.useEffect(() => {
    let alive = true;
    listBusinessProfiles()
      .then((profiles) => {
        if (!alive) return;
        setBusinessProfiles(Array.isArray(profiles) ? profiles : []);
        const defaultProfile = (profiles || []).find((p) => p?.isDefault) || (profiles || [])[0];
        if (defaultProfile?.id) setSelectedBusinessProfileId(defaultProfile.id);
        else setSelectedBusinessProfileId('new');
      })
      .catch(() => {
        if (!alive) return;
        setBusinessProfilesError('Unable to load saved business profiles.');
      });
    return () => {
      alive = false;
    };
  }, []);

  const buildBusinessProfilePayload = React.useCallback(() => {
    const trn = String(data.trn || '').replace(/[^0-9]/g, '');
    return {
      businessName: String(data.businessName || '').trim(),
      trn,
      emirate: data.businessLocationEmirate || null,
      activity: null,
      vatFilingFrequency: data.filingFrequency || null,
      defaultVatPricingMode: data.vatPricingMode === VAT_PRICING_MODES.INCLUSIVE ? 'Tax Inclusive' : 'Tax Exclusive',
      corporateTaxYearStart: null,
      corporateTaxYearEnd: null,
      address: null,
      phone: null,
      email: null,
    };
  }, [data.businessName, data.trn, data.businessLocationEmirate, data.filingFrequency, data.vatPricingMode]);

  const canSaveBusinessProfile = React.useCallback(() => {
    const payload = buildBusinessProfilePayload();
    if (!payload.businessName || payload.businessName.length < 2) return false;
    if (payload.trn && !/^\d{5,20}$/.test(payload.trn)) return false;
    return true;
  }, [buildBusinessProfilePayload]);

  const saveBusinessProfileFromWizard = React.useCallback(
    async ({ forceNew = false, silent = false } = {}) => {
      if (!canSaveBusinessProfile()) {
        if (!silent) setBusinessProfileStatus('Enter valid business name and TRN to save profile.');
        return null;
      }

      try {
        const payload = buildBusinessProfilePayload();
        const targetId = !forceNew && selectedBusinessProfileId && selectedBusinessProfileId !== 'new' ? selectedBusinessProfileId : null;
        const fingerprint = JSON.stringify({ targetId: targetId || 'new', payload });
        if (silent && fingerprint === lastSavedFingerprintRef.current) return null;

        let saved;
        if (targetId) {
          saved = await updateBusinessProfile(targetId, payload);
        } else {
          saved = await createBusinessProfile(payload);
        }

        if (!saved?.id) return null;

        setBusinessProfiles((prev) => {
          const next = prev.filter((p) => p.id !== saved.id);
          return [saved, ...next];
        });
        setSelectedBusinessProfileId(saved.id);
        setData((prev) => ({ ...prev, businessProfileId: saved.id }));
        lastSavedFingerprintRef.current = JSON.stringify({ targetId: saved.id, payload });
        setBusinessProfileStatus(silent ? 'Business profile auto-saved.' : forceNew ? 'Business profile saved as new.' : 'Business profile saved.');
        return saved;
      } catch (error) {
        if (!silent) {
          setBusinessProfileStatus(error?.message || 'Unable to save profile right now.');
        }
        return null;
      }
    },
    [buildBusinessProfilePayload, canSaveBusinessProfile, selectedBusinessProfileId, setData]
  );

  React.useEffect(() => {
    if (step !== 1 || !autoSaveProfileEnabled) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveBusinessProfileFromWizard({ silent: true }).catch(() => {});
    }, 1200);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    step,
    autoSaveProfileEnabled,
    saveBusinessProfileFromWizard,
    selectedBusinessProfileId,
    data.businessName,
    data.trn,
    data.businessLocationEmirate,
    data.filingFrequency,
    data.vatPricingMode,
  ]);

  const importSelectedBusinessProfile = () => {
    if (!selectedBusinessProfileId || selectedBusinessProfileId === 'new') return;
    const selected = businessProfiles.find((profile) => profile.id === selectedBusinessProfileId);
    if (!selected) return;

    const nextVatMode =
      String(selected.defaultVatPricingMode || '').toLowerCase().includes('inclusive')
        ? VAT_PRICING_MODES.INCLUSIVE
        : VAT_PRICING_MODES.EXCLUSIVE;

    setData({
      ...data,
      businessProfileId: selected.id,
      businessName: selected.businessName || data.businessName,
      trn: selected.trn || data.trn,
      businessLocationEmirate: selected.emirate || data.businessLocationEmirate,
      filingFrequency: selected.vatFilingFrequency || data.filingFrequency,
      vatPricingMode: nextVatMode,
    });
    setBusinessProfileStatus('Business profile imported.');
  };

  const next = () => {
    const nextStep = Math.min(4, step + 1);
    if (navigateToStep) navigateToStep(stepToPath[nextStep]);
    else setStep(nextStep);
  };
  const back = () => {
    const prevStep = Math.max(1, step - 1);
    if (navigateToStep) navigateToStep(stepToPath[prevStep]);
    else setStep(prevStep);
  };

  React.useEffect(() => {
    onProgressChange?.(step * 25);
  }, [step, onProgressChange]);

  React.useEffect(() => { if (forcedStep) setStep(forcedStep); }, [forcedStep]);

  const updateEntry = (month, key, value) => {
    const nextValue = key === 'adjustment' ? parseAdjustmentInput(value) : clampInput(value);
    const updated = buildMonthlyEntries(data).map((entry) => (entry.month === month ? { ...entry, [key]: nextValue } : entry));
    const totalAdjustment = updated.reduce((sum, entry) => sum + n(entry.adjustment), 0);
    setData({ ...data, monthlyEntries: updated, previousAdjustment: totalAdjustment });
  };

  const monthCount = buildMonthlyEntries(data).length;
  const entries = buildMonthlyEntries(data);

  const getEntryOutputVat = (entry, vatMode) => splitVatFromAmount(n(entry.sales), vatMode).vat;

  const getEntryRecoverableVat = (entry, vatMode) => {
    const base = n(entry.purchases) + n(entry.expenses);
    return splitVatFromAmount(base, vatMode).vat;
  };

  const getEntryNetVat = (entry, vatMode) => getEntryOutputVat(entry, vatMode) - getEntryRecoverableVat(entry, vatMode);

  const totals = entries.reduce((acc, entry) => ({
    sales: acc.sales + n(entry.sales),
    purchases: acc.purchases + n(entry.purchases),
    expenses: acc.expenses + n(entry.expenses),
    adjustments: acc.adjustments + n(entry.adjustment)
  }), { sales: 0, purchases: 0, expenses: 0, adjustments: 0 });



  const getVatPdfPayload = () => ({
    businessName: data.businessName,
    trn: data.trn,
    businessLocationEmirate: data.businessLocationEmirate,
    vatPeriod: formatVatPeriodLabel(data),
    preparedBy: 'UAE VAT & Tax Filing Assistant',
    preparedDate: new Date().toISOString().slice(0, 10),
    vatMode: data.vatPricingMode === VAT_PRICING_MODES.INCLUSIVE ? 'Inclusive' : 'Exclusive',
    summary: { taxableSales: result.salesBreakdown.net, outputVat: result.outputVat, recoverableVat: result.inputVat, zeroRated: Number(data.zeroRatedSales) || 0, exempt: Number(data.exemptSales) || 0, netVat: result.netVat },
    monthly: buildMonthlyEntries(data)
  });
  const buildVatPdfFileName = () => `UAE-VAT201-Return-Summary-${(data.businessName || 'business').replace(/\s+/g, '-')}-${formatVatPeriodLabel(data).replace(/\s+/g, '-')}.pdf`;
  const handleDownloadPdf = async () => {
    setDownloadLoading(true);
    try {
      const blob = await generateVatPdfBlob(getVatPdfPayload());
      downloadPdf(blob, buildVatPdfFileName());
    } finally {
      setDownloadLoading(false);
    }
  };
  const saveRecord = async (status) => {
    if (!onSave) return;
    setRecordSaving(true);
    setRecordSaveStatus('');
    try {
      await onSave(status);
      setRecordSaveStatus(status === 'final' ? 'Final record saved successfully.' : 'Draft saved successfully.');
    } catch (error) {
      setRecordSaveStatus('Unable to save record right now.');
    } finally {
      setRecordSaving(false);
    }
  };
  const continueDisabled = (step === 1 && Boolean(reqErr)) || step === 4;
  const stepMeta = steps.map((stepItem, i) => {
    const stepNumber = i + 1;
    const status = stepNumber < step ? 'completed' : stepNumber === step ? 'active' : 'pending';
    return { ...stepItem, stepNumber, status };
  });
  return <div className='vat-wizard vatWizardPage'>
    <Button
      className='backHomeButton'
      onClick={() => navigateToStep?.('/')}
      startIcon={<ArrowLeftIcon fontSize='small' />}
    >
      VAT Return Module
    </Button>
    <Card className='wizardHeroCard vat-export-header'>
      <CardContent className='vat-export-header-content' sx={{ p: { xs: 1.5, md: 2.25 } }}>
        <Stack spacing={2}>
          <Box className='wizardHeroTop'>
            <Box>
              <Typography component='h1' sx={{ fontSize: { xs: 28, md: 32 }, fontWeight: 800, m: 0, color: '#0f172a' }}>FTA VAT Filing Assistant</Typography>
              <Typography sx={{ mt: 1, color: '#64748b', fontSize: 14 }}>Create, review and file your VAT returns with ease</Typography>
            </Box>
            <Typography className='wizardPercent' sx={{ fontSize: 14, color: '#1d4ed8', fontWeight: 700 }}>{step * 25}% Completed</Typography>
          </Box>
          <Box className='wizardStepper'>
            {stepMeta.map((item, idx) => <React.Fragment key={item.label}>
              <Button disableRipple onClick={() => navigateToStep ? navigateToStep(stepToPath[item.stepNumber]) : setStep(item.stepNumber)} className={`stepCard ${item.status}`}>
                <Stack spacing={1} alignItems='center'>
                  <Box className='stepIconWrap'>
                    {item.status === 'completed' ? <CheckCircle2 size={28} strokeWidth={2.2} /> : <item.icon size={25} strokeWidth={2.2} />}
                    <Box className={`stepNumberBadge ${item.status}`}>{item.stepNumber}</Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, textAlign: 'center', textTransform: 'none', color: 'inherit' }}>{item.label}</Typography>
                    <Chip label={item.status === 'completed' ? 'Completed' : item.status === 'active' ? 'In Progress' : 'Pending'} size='small' sx={{ mt: 0.5, height: 20, borderRadius: '999px', bgcolor: item.status === 'completed' ? 'rgba(255,255,255,.18)' : item.status === 'active' ? '#dbeafe' : '#f1f5f9', color: item.status === 'completed' ? '#e2e8f0' : item.status === 'active' ? '#1d4ed8' : '#64748b', '& .MuiChip-label': { px: 1, fontSize: 10, fontWeight: 700 } }} />
                  </Box>
                </Stack>
              </Button>
              {idx < stepMeta.length - 1 && <Box className={`stepConnector ${idx + 1 < step ? 'completed' : ''}`} />}
            </React.Fragment>)}
          </Box>
        </Stack>
      </CardContent>
    </Card>
    <Card className='businessCard' sx={{ borderRadius: '14px', border: '1px solid #e5e7eb', bgcolor: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
      <CardContent sx={{ p: { xs: 1.5, md: 2.2 } }}>
    {recordSaveStatus && <Alert severity={recordSaveStatus.toLowerCase().includes('unable') ? 'error' : 'success'} sx={{ mb: 1.2 }}>{recordSaveStatus}</Alert>}
    {step === 1 && <Box>
      <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 2.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#eaf1ff', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
          <BusinessOutlinedIcon />
        </Box>
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.3 }}>VAT Wizard: Business Details</Typography>
          <Typography variant='body2' color='text.secondary'>Provide your business information to get started</Typography>
        </Box>
      </Stack>
      <Grid container spacing={{ xs: 1.5, md: 2 }}>
      <Grid size={12}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <FormControl fullWidth sx={fieldSx}>
            <InputLabel>Import from Saved Business Profile</InputLabel>
            <Select
              label='Import from Saved Business Profile'
              value={selectedBusinessProfileId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedBusinessProfileId(nextId);
                setData({
                  ...data,
                  businessProfileId: nextId === 'new' ? null : nextId,
                });
              }}
            >
              <MenuItem value='new'>Create from current form input</MenuItem>
              {businessProfiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.businessName || 'Unnamed Business'} {profile.isDefault ? '(Default)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant='outlined' onClick={importSelectedBusinessProfile} disabled={!selectedBusinessProfileId || selectedBusinessProfileId === 'new'}>
            Import Profile
          </Button>
          <Button variant='outlined' onClick={() => saveBusinessProfileFromWizard({ forceNew: false, silent: false })}>
            Save Profile
          </Button>
          <Button variant='outlined' onClick={() => saveBusinessProfileFromWizard({ forceNew: true, silent: false })}>
            Save as New
          </Button>
        </Stack>
        <FormControlLabel
          sx={{ mt: 0.5 }}
          control={<Switch checked={autoSaveProfileEnabled} onChange={(e) => setAutoSaveProfileEnabled(e.target.checked)} />}
          label='Auto-save as business profile while typing'
        />
        {businessProfileStatus && <FormHelperText>{businessProfileStatus}</FormHelperText>}
        {businessProfilesError && <FormHelperText error>{businessProfilesError}</FormHelperText>}
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label='Business name' value={data.businessName} onChange={e => setData({ ...data, businessName: e.target.value })} sx={fieldSx} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label='TRN' value={data.trn} onChange={e => setData({ ...data, trn: e.target.value.replace(/[^0-9]/g, '') })} sx={fieldSx} /></Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth required sx={fieldSx}>
          <InputLabel>Business Location Emirate *</InputLabel>
          <Select label='Business Location Emirate *' value={data.businessLocationEmirate || ''} onChange={e => setData({ ...data, businessLocationEmirate: e.target.value })}>
            {EMIRATE_OPTIONS.map((emirate) => <MenuItem key={emirate} value={emirate}>{emirate}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth sx={fieldSx}><InputLabel>Filing frequency</InputLabel><Select label='Filing frequency' value={data.filingFrequency} onChange={e => setData({ ...data, filingFrequency: e.target.value })}>{TAX_CONFIG.filingFrequencies.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}</Select></FormControl></Grid>
      <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth sx={fieldSx}><InputLabel>Filing year</InputLabel><Select label='Filing year' value={data.filingYear} onChange={e => setData({ ...data, filingYear: Number(e.target.value) })}>{years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select></FormControl></Grid>
      {data.filingFrequency === 'Monthly' && <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth sx={fieldSx}><InputLabel>Filing month</InputLabel><Select label='Filing month' value={data.filingMonth} onChange={e => setData({ ...data, filingMonth: e.target.value })}>{MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl></Grid>}
      {data.filingFrequency === 'Quarterly' && <Grid size={{ xs: 12, md: 6 }}><FormControl fullWidth sx={fieldSx}><InputLabel>Quarter start month</InputLabel><Select label='Quarter start month' value={data.filingStartMonth} onChange={e => setData({ ...data, filingStartMonth: e.target.value })}>{MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}</Select></FormControl></Grid>}
      {data.filingFrequency === 'Yearly' && <Grid size={12}><Typography variant='body2' color='text.secondary'>Full year selected.</Typography></Grid>}
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth sx={fieldSx}>
          <InputLabel>VAT Pricing Mode</InputLabel>
          <Select label='VAT Pricing Mode' value={data.vatPricingMode} onChange={e => setData({ ...data, vatPricingMode: e.target.value })}>
            {Object.values(VAT_PRICING_MODES).map(mode => <MenuItem key={mode} value={mode}>{mode === VAT_PRICING_MODES.INCLUSIVE ? 'Inclusive (amount entered includes VAT)' : 'Exclusive (amount entered excludes VAT)'}</MenuItem>)}
          </Select>
          <FormHelperText>This controls how sales and costs are converted into VAT return values.</FormHelperText>
        </FormControl>
      </Grid>
      <Grid size={12}>
        <Box sx={{ mt: 0.5, border: '1px solid #93c5fd', bgcolor: '#eaf1ff', borderRadius: 3, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
          <CalendarMonthOutlinedIcon color='primary' fontSize='small' />
          <Typography color='primary.main' sx={{ fontWeight: 700 }}>
            Selected Tax Period: {formatVatPeriodLabel(data)}
          </Typography>
        </Box>
      </Grid>
      {(reqErr) && <Grid size={12}><FormHelperText error>{reqErr}</FormHelperText></Grid>}
    </Grid>
    </Box>}
    {step === 2 && <section className='vat-input-layout vat-input-premium vat-main-card vat-input-card wizard-card'>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>VAT Input</Typography>
            <Typography variant='body2' color='text.secondary'>Enter sales, purchases, and expenses for the selected VAT period.</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, color: '#2563eb' }}>{step * 25}%</Typography>
        </Box>
        <LinearProgress variant='determinate' value={step * 25} sx={{ height: 8, borderRadius: 2 }} />
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Chip size='small' label={`VAT Mode: ${data.vatPricingMode === VAT_PRICING_MODES.INCLUSIVE ? 'Inclusive' : 'Exclusive'}`} />
          <Chip size='small' label={`Period: ${formatVatPeriodLabel(data)}`} />
        </Stack>
        <Typography variant='caption' color='text.secondary'>VAT is automatically calculated at 5% based on entered values.</Typography>
      </Stack>
      <section className='vat-breakdown-card quarterly-breakdown'>
        <header><h3>{data.filingFrequency} Breakdown</h3><span className='currency-pill'>Currency: <strong>AED</strong></span></header>
        <div className='vat-monthly-wrap vat-desktop-table table-wrapper'><table className='vat-input-table'><thead><tr><th>Month</th><th>Sales</th><th>Purchases</th><th>Expenses</th><th>Adjustment <Tooltip title='Optional VAT adjustment for corrections or manual VAT adjustments.'><HelpOutlineOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'middle', ml: 0.5 }} /></Tooltip></th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.month}><td data-label='Month'><span className='month-cell'><CalendarMonthOutlinedIcon fontSize='small' />{entry.month}</span></td><td data-label='Sales'><input type='number' min='0' placeholder='0.00' value={entry.sales} onChange={e => updateEntry(entry.month, 'sales', e.target.value)} /></td><td data-label='Purchases'><input type='number' min='0' placeholder='0.00' value={entry.purchases} onChange={e => updateEntry(entry.month, 'purchases', e.target.value)} /></td><td data-label='Expenses'><input type='number' min='0' placeholder='0.00' value={entry.expenses} onChange={e => updateEntry(entry.month, 'expenses', e.target.value)} /></td><td data-label='Adjustment'><input type='number' placeholder='0.00' value={entry.adjustment ?? ''} onChange={e => updateEntry(entry.month, 'adjustment', e.target.value)} /></td></tr>)}</tbody></table></div>
      </section>
      <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mt: 1 }}>{[
        { label: 'Total Sales', value: totals.sales },
        { label: 'Total Purchases', value: totals.purchases },
        { label: 'Total Expenses', value: totals.expenses },
        { label: 'Total Adjustments', value: totals.adjustments }
      ].map((item) => <Box key={item.label} sx={{ px: 1.2, py: 0.7, border: '1px solid #dbe3ef', borderRadius: 2, bgcolor: '#f8fafc', minWidth: 170 }}><Typography sx={{ fontSize: 12, color: '#64748b' }}>{item.label}</Typography><Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{money(item.value)}</Typography></Box>)}</Stack>
    </section>}
    {false && step === 99 && <Box>
      <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 2.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#eaf1ff', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
          <PlaylistAddCheckCircleOutlinedIcon />
        </Box>
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.3 }}>VAT Wizard: Adjustments</Typography>
          <Typography variant='body2' color='text.secondary'>Enter optional VAT adjustments before generating your return summary.</Typography>
        </Box>
      </Stack>

      <Alert icon={<InfoOutlinedIcon fontSize='inherit' />} severity='info' sx={{ mb: 2.5, borderRadius: 3, border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>
        Use this section only for VAT adjustments, corrections, or additional notes required for your VAT201 records.
      </Alert>

      <Card sx={{ borderRadius: 4, border: '1px solid #dbe6f3', boxShadow: '0 10px 24px rgba(15,23,42,.06)' }}>
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1.2 }}>Adjustment Amounts</Typography>
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth type='number' label='Previous period adjustment' value={data.previousAdjustment} onChange={e => setData({ ...data, previousAdjustment: e.target.value })} placeholder='0.00' sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position='start'>AED</InputAdornment> }} helperText='Output VAT-side adjustment from previous VAT period.' />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth type='number' label='Bad debt relief' value={data.badDebtRelief} onChange={e => setData({ ...data, badDebtRelief: e.target.value })} placeholder='0.00' sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position='start'>AED</InputAdornment> }} helperText='Recoverable VAT-side correction based on bad debt relief.' />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth type='number' label='Zero-rated sales' value={data.zeroRatedSales} onChange={e => setData({ ...data, zeroRatedSales: e.target.value })} placeholder='0.00' sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position='start'>AED</InputAdornment> }} helperText='Used in VAT201 report Box 4 (0% supplies).' />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth type='number' label='Exempt sales' value={data.exemptSales} onChange={e => setData({ ...data, exemptSales: e.target.value })} placeholder='0.00' sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position='start'>AED</InputAdornment> }} helperText='Used in VAT201 report Box 5 (exempt supplies).' />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth type='number' label='Non-recoverable VAT' value={data.nonRecoverableVat} onChange={e => setData({ ...data, nonRecoverableVat: e.target.value })} placeholder='0.00' sx={fieldSx}
                    InputProps={{ startAdornment: <InputAdornment position='start'>AED</InputAdornment> }} helperText='Reference value for records and export.' />
                </Grid>
              </Grid>

              <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 2.2, mb: 1.2, display: 'flex', alignItems: 'center', gap: 0.8 }}><NotesOutlinedIcon fontSize='small' />Adjustment Notes</Typography>
              <TextField fullWidth multiline minRows={4} maxRows={7} label='Other adjustment notes' placeholder='Add optional notes for records, corrections, or audit references.' value={data.adjustmentNotes} onChange={e => setData({ ...data, adjustmentNotes: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7e3f0' }, '& .MuiInputBase-inputMultiline': { fontSize: 14, lineHeight: 1.4 } }} helperText='These notes are stored with your VAT wizard data and export records.' />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid #dbe6f3', bgcolor: '#f8fbff', height: '100%' }}>
                <CardContent>
                  <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1.4 }}>Adjustment Impact Summary</Typography>
                  <Stack spacing={1.2}>
                    <Stack direction='row' justifyContent='space-between'><Typography variant='body2' color='text.secondary'>Output adjustment</Typography><Typography variant='body2' sx={{ fontWeight: 600 }}>{money(n(data.previousAdjustment))}</Typography></Stack>
                    <Stack direction='row' justifyContent='space-between'><Typography variant='body2' color='text.secondary'>Recoverable adjustment</Typography><Typography variant='body2' sx={{ fontWeight: 600 }}>{money(n(data.badDebtRelief))}</Typography></Stack>
                    <Box sx={{ borderTop: '1px dashed #d7e3f0', pt: 1 }}>
                      <Stack direction='row' justifyContent='space-between' alignItems='center'>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>Net adjustment impact</Typography>
                        {(() => {
                          const netAdjustmentImpact = n(data.previousAdjustment) - n(data.badDebtRelief);
                          const colorSx = netAdjustmentImpact > 0 ? { color: '#b91c1c', bgcolor: '#fef2f2' } : netAdjustmentImpact < 0 ? { color: '#166534', bgcolor: '#f0fdf4' } : { color: '#1d4ed8', bgcolor: '#eff6ff' };
                          return <Box sx={{ px: 1.2, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 13, ...colorSx }}>{money(netAdjustmentImpact)}</Box>;
                        })()}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>}
    {step === 3 && <Card sx={{ borderRadius: '14px', border: '1px solid #e5e7eb', bgcolor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: { xs: 1.5, md: 2.2 } }}>
        <Typography sx={{ fontSize: 28, lineHeight: 1.2, fontWeight: 700, color: '#111827' }}>FTA VAT Return Summary</Typography>
        <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.5, mb: 1.5 }}>Review your VAT return values before moving to Export.</Typography>
        <Alert icon={<InfoOutlinedIcon fontSize='inherit' />} severity='info' sx={{ mb: 1.8, borderRadius: '10px', border: '1px solid #dbeafe', bgcolor: '#f8fbff', color: '#1e40af', py: 0.2 }}>This summary is generated from your entered VAT sales, purchases, expenses, and adjustments.</Alert>
        <Grid container spacing={1.2} sx={{ mb: 1.6, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(auto-fit, minmax(160px, 1fr))' }, display: 'grid' }}>
          {[
              { label: 'Taxable Sales', value: result.salesBreakdown.net, helper: 'Total taxable sales', icon: <AssessmentOutlinedIcon fontSize='small' />, color: '#2563eb', bg: '#eff6ff' },
              { label: 'Output VAT (5%)', value: result.outputVat, helper: 'VAT on sales', icon: <TrendingUpOutlinedIcon fontSize='small' />, color: '#16a34a', bg: '#ecfdf3' },
              { label: 'Recoverable VAT', value: result.inputVat, helper: 'Input VAT claims', icon: <SouthWestOutlinedIcon fontSize='small' />, color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Adjustments', value: result.adjustments, helper: 'VAT adjustments', icon: <TuneOutlinedIcon fontSize='small' />, color: '#ea580c', bg: '#fff7ed' },
              { label: 'Net VAT Result', value: Math.abs(result.netVat), helper: 'Payable / (Refundable)', icon: <BalanceOutlinedIcon fontSize='small' />, color: result.netVat > 0 ? '#dc2626' : result.netVat < 0 ? '#16a34a' : '#2563eb', bg: result.netVat > 0 ? '#fef2f2' : result.netVat < 0 ? '#f0fdf4' : '#eff6ff' },
              { label: 'VAT Status', value: result.netVat > 0 ? 'PAYABLE' : result.netVat < 0 ? 'REFUNDABLE' : 'NEUTRAL', helper: result.netVat > 0 ? 'Payment due' : result.netVat < 0 ? 'Refund expected' : 'No payment due', icon: <GppGoodOutlinedIcon fontSize='small' />, color: '#2563eb', bg: '#eff6ff', badge: true }
          ].map((item) => <Box key={item.label}><Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}><CardContent sx={{ p: 1.5 }}><Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: item.bg, color: item.color, display: 'grid', placeItems: 'center', mb: 1, alignSelf: 'flex-start' }}>{item.icon}</Box><Typography variant='body2' sx={{ color: '#334155', mb: 0.5 }}>{item.label}</Typography>{item.badge ? <Box sx={{ display: 'inline-block', px: 1.1, py: 0.35, borderRadius: '10px', bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 800, fontSize: 12, mb: 0.8 }}>{item.value}</Box> : <Typography variant='h6' sx={{ fontWeight: 800, color: item.color, mb: 0.6 }}>{money(item.value)}</Typography>}<Typography variant='caption' color='text.secondary'>{item.helper}</Typography></CardContent></Card></Box>)}
        </Grid>
        <Card sx={{ borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <Typography variant='h6' sx={{ fontWeight: 700, px: 1.8, py: 1.2 }}>VAT Breakdown</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}><Box component='table' sx={{ width: '100%', borderCollapse: 'collapse' }}><Box component='thead' sx={{ bgcolor: '#f8fafc' }}><Box component='tr'><Box component='th' sx={{ textAlign: 'left', p: 1.2 }}>Description</Box><Box component='th' sx={{ textAlign: 'right', p: 1.2 }}>Amount (AED)</Box><Box component='th' sx={{ textAlign: 'center', p: 1.2 }}>Status</Box></Box></Box><Box component='tbody'>{[
              { label: 'Total Sales (Input/Gross)', helper: 'Total value of taxable sales', amount: result.salesBreakdown.total, icon: <AssessmentOutlinedIcon fontSize='small' />, status: '—' },
              { label: 'VAT 5% (Output VAT)', helper: 'VAT calculated on taxable sales', amount: result.outputVat, icon: <PercentOutlinedIcon fontSize='small' />, status: '—' },
              { label: 'Input VAT (Recoverable VAT)', helper: 'VAT paid on purchases & expenses', amount: result.inputVat, icon: <SouthOutlinedIcon fontSize='small' />, status: '—' },
              { label: 'Adjustments', helper: 'Adjustments and corrections', amount: result.adjustments, icon: <TuneOutlinedIcon fontSize='small' />, status: '—' },
              { label: 'Final VAT Payable', helper: 'Amount payable to FTA or refundable', amount: result.netVat, icon: <BalanceOutlinedIcon fontSize='small' />, status: result.netVat > 0 ? 'PAYABLE' : result.netVat < 0 ? 'REFUNDABLE' : 'NEUTRAL', final: true }
            ].map((row) => <Box component='tr' key={row.label} sx={{ borderTop: '1px solid #eef2f7', bgcolor: row.final ? '#f8fbff' : '#fff', '&:hover': { bgcolor: row.final ? '#f3f8ff' : '#f9fbfd' } }}><Box component='td' sx={{ p: 1.2 }}><Stack direction='row' spacing={1} alignItems='center'><Box sx={{ width: 28, height: 28, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#eff6ff', color: '#2563eb' }}>{row.icon}</Box><Box><Typography sx={{ fontWeight: 700, fontSize: 14 }}>{row.label}</Typography><Typography variant='caption' color='text.secondary'>{row.helper}</Typography></Box></Stack></Box><Box component='td' sx={{ p: 1.2, textAlign: 'right', fontWeight: 700, color: row.final ? '#2563eb' : '#0f172a', whiteSpace: 'nowrap' }}>{money(row.amount)}</Box><Box component='td' sx={{ p: 1.2, textAlign: 'center' }}><Box sx={{ display: 'inline-block', px: 1, py: 0.3, borderRadius: '10px', bgcolor: row.status === 'PAYABLE' ? '#fee2e2' : row.status === 'REFUNDABLE' ? '#dcfce7' : '#e2e8f0', color: row.status === 'PAYABLE' ? '#b91c1c' : row.status === 'REFUNDABLE' ? '#166534' : '#475569', fontSize: 11, fontWeight: 800 }}>{row.status}</Box></Box></Box>)}</Box></Box></Box>
        </Card>
        <Alert icon={<InfoOutlinedIcon fontSize='inherit' />} severity='info' sx={{ mt: 1.6, borderRadius: '10px', border: '1px solid #dbeafe', bgcolor: '#f8fbff' }}><Typography sx={{ fontWeight: 700 }}>Important Notice</Typography>For preparation assistance only. Please verify all values before official UAE FTA submission.</Alert>
      </CardContent>
    </Card>}
    {step === 4 && <div className='vat-export-preview-wrap'><Vat201Report data={{ ...data, monthlyEntries: buildMonthlyEntries(data) }} result={result} /></div>}
      </CardContent>
    </Card>
    {step < 4 && <Card sx={{ mt: 1.4, borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ py: 1.1, px: { xs: 1, md: 1.8 }, '&:last-child': { pb: 1.1 } }}>
        <div className='wizard-action-bar'>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%' }}>
            <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-start' } }}>
              <Button className='wizardNavBtn' fullWidth variant='outlined' startIcon={<ArrowBackOutlinedIcon />} onClick={back} disabled={step === 1}>Back</Button>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
              <Stack direction='row' spacing={1} sx={{ width: '100%' }}>
                <Button fullWidth variant='outlined' onClick={() => saveRecord('draft')} disabled={recordSaving}>
                  {recordSaving ? 'Saving…' : 'Save Draft'}
                </Button>
                <Button fullWidth className='primary-gradient-btn wizardNavBtn' endIcon={<ArrowForwardOutlinedIcon />} onClick={next} disabled={continueDisabled}>Continue</Button>
              </Stack>
            </Box>
          </Box>
        </div>
      </CardContent>
    </Card>}
    {step === 4 && <div className='export-action-bar'>
      <Button className='wizardNavBtn export-action-back' variant='outlined' startIcon={<ArrowBackOutlinedIcon />} onClick={back}>Back</Button>
      <div className='export-action-right'>
        <Button className='danger-soft-btn' variant='outlined' onClick={onReset}>Reset</Button>
        <Button variant='outlined' startIcon={<SaveOutlinedIcon />} onClick={() => saveRecord('final')} disabled={recordSaving}>
          {recordSaving ? 'Saving…' : 'Save Final'}
        </Button>
        <Button variant='outlined' startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>Print</Button>
        <Button className='primary-gradient-btn' variant='contained' startIcon={<DownloadOutlinedIcon />} onClick={handleDownloadPdf} disabled={downloadLoading}>{downloadLoading ? 'Downloading PDF…' : 'Download PDF'}</Button>
      </div>
    </div>}
  </div>;
}
