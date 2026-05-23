import React from 'react';
import { Box, Button, Card, CardContent, Chip, Container, Divider, Stack, Typography } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { RouteLink } from '../../components/Router';

type Section = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

type PublicInfoLayoutProps = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: Section[];
};

function PublicInfoLayout({ title, intro, lastUpdated, sections }: PublicInfoLayoutProps) {
  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: { xs: 4, md: 7 } }}>
      <Container maxWidth='md'>
        <Stack spacing={2} sx={{ mb: 2.5 }}>
          <Button
            component={RouteLink}
            to='/'
            startIcon={<ArrowLeft size={16} />}
            sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
          >
            Back to Home
          </Button>
          <Chip label={`Last updated: ${lastUpdated}`} sx={{ alignSelf: 'flex-start', fontWeight: 700 }} />
        </Stack>

        <Card variant='outlined' sx={{ borderRadius: 3, borderColor: '#E2E8F0' }}>
          <CardContent sx={{ p: { xs: 2.2, md: 3.5 } }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 900, color: '#0F172A', mb: 1.2 }}>
                  {title}
                </Typography>
                <Typography sx={{ color: '#475569' }}>{intro}</Typography>
              </Box>

              {sections.map((section) => (
                <Box key={section.heading}>
                  <Divider sx={{ mb: 2.2 }} />
                  <Typography variant='h6' sx={{ fontWeight: 800, color: '#0F172A', mb: 1.1 }}>
                    {section.heading}
                  </Typography>
                  {section.paragraphs?.map((paragraph) => (
                    <Typography key={paragraph} sx={{ color: '#475569', mb: 1.2 }}>
                      {paragraph}
                    </Typography>
                  ))}
                  {section.items?.map((item) => (
                    <Typography key={item} sx={{ color: '#475569', pl: 1, mb: 0.8 }}>
                      • {item}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PublicInfoLayout
      title='Privacy Policy'
      lastUpdated='May 23, 2026'
      intro='This policy explains how UAE Tax Suite collects, uses, and protects your information when you use VAT and Corporate Tax features.'
      sections={[
        {
          heading: 'Information We Collect',
          items: [
            'Account details such as name, email address, and role.',
            'Business profile information including TRN, address, and contact details.',
            'VAT and Corporate Tax filing records and reminder settings.',
            'Basic technical logs such as IP address and browser metadata for security and audit purposes.',
          ],
        },
        {
          heading: 'How We Use Information',
          items: [
            'To authenticate users and secure account access.',
            'To provide VAT, Corporate Tax, PDF export, history, and reminder functionality.',
            'To improve service reliability, security monitoring, and support troubleshooting.',
          ],
        },
        {
          heading: 'Data Security',
          paragraphs: [
            'We apply industry-standard safeguards including encrypted authentication credentials, role-based access control, and secure server configurations.',
            'Access to sensitive settings is restricted to authorized superadmin users.',
          ],
        },
        {
          heading: 'Your Choices',
          items: [
            'You can update your profile and business details from account settings.',
            'You can request deletion of your account and associated data through support channels.',
          ],
        },
      ]}
    />
  );
}

export function TermsOfServicePage() {
  return (
    <PublicInfoLayout
      title='Terms of Service'
      lastUpdated='May 23, 2026'
      intro='These terms govern use of UAE Tax Suite. By using the platform, you agree to the following conditions.'
      sections={[
        {
          heading: 'Service Scope',
          paragraphs: [
            'UAE Tax Suite is a filing assistance platform for VAT and Corporate Tax record management, calculation support, reminders, and exports.',
            'The platform supports workflows and reporting, but final filing responsibility remains with the user or business entity.',
          ],
        },
        {
          heading: 'Account Responsibilities',
          items: [
            'Provide accurate registration and business details.',
            'Keep login credentials confidential and report unauthorized access promptly.',
            'Use the platform in compliance with applicable UAE laws and regulations.',
          ],
        },
        {
          heading: 'Acceptable Use',
          items: [
            'Do not attempt unauthorized access, abuse, or disruption of the service.',
            'Do not upload unlawful or malicious content.',
            'Do not misuse administrator features or attempt privilege escalation.',
          ],
        },
        {
          heading: 'Limitation and Updates',
          paragraphs: [
            'Service features may evolve over time for security, legal, or technical reasons.',
            'These terms may be updated; continued use after updates means acceptance of revised terms.',
          ],
        },
      ]}
    />
  );
}

export function DocumentationPage() {
  return (
    <PublicInfoLayout
      title='Documentation'
      lastUpdated='May 23, 2026'
      intro='Quick product documentation to help you get started with VAT and Corporate Tax workflows in UAE Tax Suite.'
      sections={[
        {
          heading: 'Getting Started',
          items: [
            'Register a new account and sign in.',
            'Complete your Business Profile with legal name and TRN.',
            'Use Dashboard to access VAT, Corporate Tax, and reminders.',
          ],
        },
        {
          heading: 'VAT Workflow',
          items: [
            'Open VAT module and enter filing period details.',
            'Complete input values and review calculated summary.',
            'Preview and export VAT report, then save record to history.',
          ],
        },
        {
          heading: 'Corporate Tax Workflow',
          items: [
            'Open Corporate Tax module and set reporting period.',
            'Enter revenue and expenses, then review tax output.',
            'Export report and save final record for history reference.',
          ],
        },
        {
          heading: 'History and Reminders',
          items: [
            'Use VAT/Tax History pages to review previous records.',
            'Set reminders for filing deadlines and status tracking.',
            'Use admin modules (superadmin only) for users, SMTP, and audit logs.',
          ],
        },
      ]}
    />
  );
}
