import React from 'react';
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';

export const money=(v)=>new Intl.NumberFormat('en-AE',{style:'currency',currency:'AED'}).format(Number(v)||0);
export function TaxSummaryCard({label,value}){return <Card className='premium-card'><CardContent><Typography variant='body2' color='text.secondary'>{label}</Typography><Typography variant='h6' sx={{fontWeight:700}}>{value}</Typography></CardContent></Card>;}
export function WorkspaceHeader({ title: _title, progress = 0, centerContent }) {
  return <Card sx={{ mb: 2, borderRadius: '28px', border: '1px solid #dbe6f3', bgcolor: '#fff', boxShadow: '0 10px 28px rgba(15, 23, 42, 0.07)' }}><CardContent sx={{ py: { xs: 1.4, md: 1.65 }, px: { xs: 1.4, md: 1.8 } }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(230px, 290px)' }, alignItems: 'center', gap: { xs: 1.2, sm: 1.4, lg: 1.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', lg: 'center' }, width: '100%' }}>
        {centerContent}
      </Box>
      <Card sx={{ borderRadius: 4, border: '1px solid #dbe6f3', background: '#fff', boxShadow: '0 3px 10px rgba(15, 23, 42, 0.06)', minWidth: { xs: '100%', sm: 180 }, justifySelf: { lg: 'end' } }}>
        <CardContent sx={{ py: 0.9, px: 1.1, '&:last-child': { pb: 0.9 } }}>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Box sx={{ color: 'primary.main', display: 'flex' }}><AutoGraphRoundedIcon fontSize='small' /></Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.15 }}>Progress</Typography>
              <Typography variant='body2' sx={{ fontWeight: 700, lineHeight: 1.25 }}>{progress}%</Typography>
              <LinearProgress variant='determinate' value={progress} sx={{ mt: 0.6, height: 6, borderRadius: 999, backgroundColor: '#e8eef7', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: 999 } }} />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  </CardContent></Card>;
}
export function FormSection({title,children}){return <Card className='premium-card' sx={{ borderRadius: '22px', border: '1px solid #dbe6f3', background: '#fff', boxShadow: '0 10px 28px rgba(15, 23, 42, 0.07)' }}><CardContent sx={{ p: { xs: '18px', md: '32px' } }}><Typography variant='h6' sx={{mb:2, color:'#071832'}}>{title}</Typography>{children}</CardContent></Card>;}
export function ExportActions({
  onBack,
  onSave,
  onReset,
  onPrint,
  onPdf,
  saveLabel = 'Save',
  saveDisabled,
  pdfLoading,
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} className='wizard-action-group wizard-action-group-right'>
      {onBack ? <Button variant='outlined' onClick={onBack}>Back</Button> : null}
      <Button className='danger-soft-btn' variant='outlined' onClick={onReset}>Reset</Button>
      <Button variant='outlined' onClick={onSave} disabled={saveDisabled}>{saveLabel}</Button>
      <Button variant='outlined' onClick={onPrint}>Print</Button>
      <Button className='primary-gradient-btn' variant='contained' onClick={onPdf} disabled={pdfLoading}>{pdfLoading ? 'Generating PDF…' : 'Download PDF'}</Button>
    </Stack>
  );
}
