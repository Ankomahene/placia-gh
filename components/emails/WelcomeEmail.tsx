import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { EmailLogo } from './EmailLogo';

interface WelcomeEmailProps {
  userEmail: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({
  userEmail,
  dashboardUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to PlaciaGH - Start Discovering Amazing Places in Ghana!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={logoContainer}>
            <EmailLogo size="md" />
          </div>
          <Heading style={heading}>Welcome to PlaciaGH!</Heading>
          <Section style={section}>
            <Text style={text}>Hi {userEmail.split('@')[0]},</Text>
            <Text style={text}>
              Thank you for joining PlaciaGH, your ultimate guide to discovering amazing places in Ghana.
              We're excited to help you explore the best locations our country has to offer!
            </Text>
            <Text style={text}>
              You can now start exploring local restaurants, hotels, attractions, and more.
              Use our AI-powered search to find exactly what you're looking for in your area.
            </Text>
            <Button style={button} href={dashboardUrl}>
              Visit your dashboard
            </Button>
            <Text style={text}>
              Looking for recommendations? Our local experts are here to help you
              discover the perfect spots. Just reply to this email!
            </Text>
            <Text style={text}>
              Best regards,
              <br />
              The PlaciaGH Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f9f9f9',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
  width: '100%',
};

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '16px',
  padding: '0 24px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#1a1a1a',
  padding: '24px 0 8px',
  textAlign: 'center' as const,
  margin: '0',
};

const section = {
  padding: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid #eaeaea',
};

const text = {
  margin: '0 0 16px',
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#666666',
};

const button = {
  backgroundColor: '#611cca',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  margin: '24px 0',
  padding: '14px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

export default WelcomeEmail;
