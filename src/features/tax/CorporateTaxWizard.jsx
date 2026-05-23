import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import { Building2, CheckCircle2, ClipboardList, Eye, Upload } from 'lucide-react';
import { ExportActions, money } from './components/common.jsx';
import { CorporateTaxReport } from './components/CorporateTaxReport';
import { calculateCorporateTax } from './lib/corporateTaxCalculator';
import { downloadPdfReport } from './lib/pdfGenerator';
import { createBusinessProfile, listBusinessProfiles, updateBusinessProfile } from '../business/services/businessProfileApi';

const steps = [
  { key: 'company', label: 'Company Details', icon: Building2 },
  { key: 'input', label: 'Tax Input', icon: ClipboardList },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'export', label: 'Export', icon: Upload }
];

const EMIRATE_OPTIONS = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

export function CorporateTaxWizard({ data, setData, onSave, onReset, onProgressChange, forcedStep, navigateToStep }) {
  const [step, setStep] = React.useState(forcedStep || 1);
  const [businessProfiles, setBusinessProfiles] = React.useState([]);
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = React.useState('');
  const [businessProfilesError, setBusinessProfilesError] = React.useState('');
  const [businessProfileStatus, setBusinessProfileStatus] = React.useState('');
  const [autoSaveProfileEnabled, setAutoSaveProfileEnabled] = React.useState(true);
  const saveTimerRef = React.useRef(null);
  const lastSavedFingerprintRef = React.useRef('');
  const result = calculateCorporateTax(data);
  const stepToPath = React.useMemo(() => ({ 1: '/tax/details', 2: '/tax/input', 3: '/tax/preview', 4: '/tax/export' }), []);

  React.useEffect(() => {
    onProgressChange?.(step * 25);
  }, [step, onProgressChange]);

  React.useEffect(() => { if (forcedStep) setStep(forcedStep); }, [forcedStep]);

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
    const trn = String(data.taxRegistrationNumber || '').replace(/[^0-9]/g, '');
    return {
      businessName: String(data.companyName || '').trim(),
      trn,
      emirate: data.businessLocationEmirate || null,
      activity: data.businessActivity || null,
      vatFilingFrequency: null,
      defaultVatPricingMode: null,
      corporateTaxYearStart: data.financialYearStart || null,
      corporateTaxYearEnd: data.financialYearEnd || null,
      address: null,
      phone: null,
      email: null,
    };
  }, [data.companyName, data.taxRegistrationNumber, data.businessLocationEmirate, data.businessActivity, data.financialYearStart, data.financialYearEnd]);

  const canSaveBusinessProfile = React.useCallback(() => {
    const payload = buildBusinessProfilePayload();
    if (!payload.businessName || payload.businessName.length < 2) return false;
    if (payload.trn && !/^\d{5,20}$/.test(payload.trn)) return false;
    return true;
  }, [buildBusinessProfilePayload]);

  const saveBusinessProfileFromWizard = React.useCallback(
    async ({ forceNew = false, silent = false } = {}) => {
      if (!canSaveBusinessProfile()) {
        if (!silent) setBusinessProfileStatus('Enter valid company name and registration number to save profile.');
        return null;
      }

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
    data.companyName,
    data.taxRegistrationNumber,
    data.businessActivity,
    data.businessLocationEmirate,
    data.financialYearStart,
    data.financialYearEnd,
  ]);

  const importSelectedBusinessProfile = () => {
    if (!selectedBusinessProfileId || selectedBusinessProfileId === 'new') return;
    const selected = businessProfiles.find((profile) => profile.id === selectedBusinessProfileId);
    if (!selected) return;

    setData({
      ...data,
      businessProfileId: selected.id,
      companyName: selected.businessName || data.companyName,
      taxRegistrationNumber: selected.trn || data.taxRegistrationNumber,
      businessActivity: selected.activity || data.businessActivity,
      businessLocationEmirate: selected.emirate || data.businessLocationEmirate,
      financialYearStart: selected.corporateTaxYearStart || data.financialYearStart,
      financialYearEnd: selected.corporateTaxYearEnd || data.financialYearEnd,
    });
    setBusinessProfileStatus('Business profile imported.');
  };

  const fieldSx = {
    '& .MuiInputBase-root': { minHeight: { xs: 44, md: 48 }, height: { xs: 44, md: 48 }, borderRadius: '12px', color: '#071832', bgcolor: '#fff' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d7e3f0' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9cb7dc' },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb', borderWidth: '1px' },
    '& .Mui-focused': { boxShadow: '0 0 0 3px rgba(37,99,235,0.15)' },
    '& .MuiInputBase-input': { padding: '0 14px', fontSize: 14, lineHeight: 1.2 },
    '& .MuiSelect-select': { display: 'flex', alignItems: 'center', padding: '0 38px 0 14px !important', fontSize: 14, lineHeight: 1.2 },
    '& .MuiInputLabel-root': { fontSize: 12, lineHeight: 1.1 }
  };

  const missingRequired = !data.companyName || !data.taxRegistrationNumber || !data.businessActivity;
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

  const NumberField = ({ label, keyName, helperText }) => (
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField
        fullWidth
        type='number'
        label={label}
        value={data[keyName]}
        onChange={(e) => setData({ ...data, [keyName]: e.target.value })}
        placeholder='0.00'
        InputProps={{ startAdornment: <InputAdornment position='start'>AED</InputAdornment> }}
        helperText={helperText}
        sx={fieldSx}
      />
    </Grid>
  );

  const stepMeta = steps.map((stepItem, i) => {
    const stepNumber = i + 1;
    const status = stepNumber < step ? 'completed' : stepNumber === step ? 'active' : 'pending';
    return { ...stepItem, stepNumber, status };
  });

  return <div className='vat-wizard vatWizardPage'>
    <Button className='backHomeButton' onClick={() => (navigateToStep ? navigateToStep('/dashboard') : window.history.back())} startIcon={<ArrowLeftIcon fontSize='small' />}>
      Corporate Tax Module
    </Button>

    <Card className='wizardHeroCard'>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Box className='wizardHeroTop'>
            <Box>
              <Typography component='h1' sx={{ fontSize: { xs: 28, md: 32 }, fontWeight: 800, m: 0, color: '#0f172a' }}>UAE Corporate Tax Filing Assistant</Typography>
              <Typography sx={{ mt: 1, color: '#64748b', fontSize: 14 }}>Prepare, review and estimate your UAE Corporate Tax return with ease</Typography>
            </Box>
            <Typography className='wizardPercent' sx={{ fontSize: 14, color: '#1d4ed8', fontWeight: 700 }}>{step * 25}% Completed</Typography>
          </Box>
          <Box className='wizardStepper'>
            {stepMeta.map((item, idx) => <React.Fragment key={item.label}>
              <Button disableRipple onClick={() => (navigateToStep ? navigateToStep(stepToPath[item.stepNumber]) : setStep(item.stepNumber))} className={`stepCard ${item.status}`}>
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
        {step === 1 && <Box>
          <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 2.5 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#eaf1ff', color: 'primary.main', display: 'grid', placeItems: 'center' }}><BusinessOutlinedIcon /></Box>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.3 }}>Corporate Tax Wizard: Company Details</Typography>
              <Typography variant='body2' color='text.secondary'>Enter company profile details for UAE Corporate Tax workspace.</Typography>
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
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label='Company name' value={data.companyName} onChange={e => setData({ ...data, companyName: e.target.value })} sx={fieldSx} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label='Tax registration number' value={data.taxRegistrationNumber} onChange={e => setData({ ...data, taxRegistrationNumber: e.target.value })} sx={fieldSx} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label='Business activity' value={data.businessActivity} onChange={e => setData({ ...data, businessActivity: e.target.value })} sx={fieldSx} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Business location emirate</InputLabel>
                <Select label='Business location emirate' value={data.businessLocationEmirate || ''} onChange={e => setData({ ...data, businessLocationEmirate: e.target.value })}>
                  {EMIRATE_OPTIONS.map((emirate) => <MenuItem key={emirate} value={emirate}>{emirate}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required type='date' label='Financial year start' value={data.financialYearStart} onChange={e => setData({ ...data, financialYearStart: e.target.value })} InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required type='date' label='Financial year end' value={data.financialYearEnd} onChange={e => setData({ ...data, financialYearEnd: e.target.value })} InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label='Corporate tax period' value={data.financialYearStart && data.financialYearEnd ? `${data.financialYearStart} to ${data.financialYearEnd}` : ''} sx={fieldSx} slotProps={{ input: { readOnly: true } }} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label='Accounting / pricing mode' value='Standard' sx={fieldSx} slotProps={{ input: { readOnly: true } }} /></Grid>
            <Grid size={12}>
              <Box sx={{ mt: 0.5, border: '1px solid #93c5fd', bgcolor: '#eaf1ff', borderRadius: 3, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
                <CalendarMonthOutlinedIcon color='primary' fontSize='small' />
                <Typography color='primary.main' sx={{ fontWeight: 700 }}>Selected Tax Period: {data.financialYearStart || '--'} - {data.financialYearEnd || '--'}</Typography>
              </Box>
            </Grid>
            {missingRequired && <Grid size={12}><FormHelperText error>Company name, tax registration number, and business activity are required.</FormHelperText></Grid>}
          </Grid>
        </Box>}

        {step === 2 && <Box>
          <Alert icon={<InfoOutlinedIcon fontSize='inherit' />} severity='info' sx={{ mb: 2.5, borderRadius: 3, border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>Enter tax input values in AED for the selected financial period.</Alert>
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            <NumberField label='Total revenue' keyName='revenue' helperText='Gross turnover for the period.' />
            <NumberField label='Other income' keyName='otherIncome' helperText='Non-operating income and gains.' />
            <NumberField label='Exempt income' keyName='exemptIncome' helperText='Income treated as exempt from corporate tax.' />
            <NumberField label='Direct expenses' keyName='directExpenses' helperText='Cost of goods sold / service delivery.' />
            <NumberField label='Admin & general expenses' keyName='adminExpenses' helperText='Operating and overhead expenses.' />
            <NumberField label='Non-deductible expenses' keyName='nonDeductibleExpenses' helperText='Reference amount for disallowed expenses.' />
            <NumberField label='Accounting profit' keyName='accountingProfit' helperText='Leave zero to let calculator infer from income and expenses.' />
            <NumberField label='Add-back adjustments' keyName='addBackAdjustments' helperText='Items added back for tax computation.' />
            <NumberField label='Deductible adjustments' keyName='deductibleAdjustments' helperText='Additional deductible tax adjustments.' />
          </Grid>
        </Box>}

        {step === 3 && <Box>
          <Card sx={{ borderRadius: 4, border: '1px solid #dbe6f3', boxShadow: '0 10px 24px rgba(15,23,42,.06)', mb: 2 }}>
            <CardContent>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 1.6 }}>Corporate Tax Live Snapshot</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4,minmax(0,1fr))' }, gap: 1.2 }}>
                {[{ label: 'Profit Before Tax', value: money(result.profitBeforeTax), icon: <TrendingUpOutlinedIcon fontSize='small' /> }, { label: 'Taxable Income', value: money(result.taxableIncome), icon: <ReceiptLongOutlinedIcon fontSize='small' /> }, { label: 'Tax Above 0% Threshold', value: money(result.taxableAboveThreshold), icon: <CalculateOutlinedIcon fontSize='small' /> }, { label: 'Estimated Tax Payable', value: money(result.taxPayable), icon: <CalculateOutlinedIcon fontSize='small' />, badge: true }].map((item) => <Card key={item.label} sx={{ border: '1px solid #dbe6f3', borderRadius: 3, boxShadow: 'none' }}><CardContent sx={{ py: 1.4, '&:last-child': { pb: 1.4 } }}><Stack direction='row' spacing={1} alignItems='center'><Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#eaf1ff', color: 'primary.main', display: 'grid', placeItems: 'center' }}>{item.icon}</Box><Box><Typography variant='caption' color='text.secondary'>{item.label}</Typography><Typography variant='subtitle2' sx={{ fontWeight: 800 }}>{item.value}</Typography></Box>{item.badge && <Chip label='9%' color='success' size='small' sx={{ ml: 'auto' }} />}</Stack></CardContent></Card>)}
              </Box>
            </CardContent>
          </Card>
          <CorporateTaxReport data={data} />
        </Box>}

        {step === 4 && <Box>
          <CorporateTaxReport data={data} />
          <Box sx={{ mt: 2 }}>
            <ExportActions
              onSave={onSave}
              onReset={onReset}
              onPrint={() => window.print()}
              onPdf={async () => {
                try {
                  await downloadPdfReport({
                    reportId: 'corporate-tax-report',
                    reportType: 'corporate-tax',
                    companyName: data.companyName,
                    taxPeriod: data.financialYearStart && data.financialYearEnd ? `${data.financialYearStart}_to_${data.financialYearEnd}` : 'period'
                  });
                } catch (error) {
                  console.error('Corporate tax PDF generation failed', error);
                  window.alert('Unable to download Corporate Tax PDF right now. Please try again or use Print.');
                }
              }}
            />
          </Box>
        </Box>}
      </CardContent>
    </Card>

    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, p: { xs: 1.5, md: 2 }, borderRadius: 3, border: '1px solid #dbe6f3', bgcolor: '#fff', boxShadow: '0 8px 20px rgba(15,23,42,.05)' }}>
      <Button variant='outlined' onClick={back} disabled={step === 1} startIcon={<ArrowBackOutlinedIcon />}>Back</Button>
      <Button className='primary-gradient-btn' onClick={next} disabled={step === 4 || (step === 1 && missingRequired)} endIcon={<ArrowForwardOutlinedIcon />}>Continue</Button>
    </Stack>
  </div>;
}
