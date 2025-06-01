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

interface PasswordResetConfirmationEmailProps {
  userEmail: string;
  loginUrl: string;
}

export const PasswordResetConfirmationEmail = ({
  userEmail,
  loginUrl,
}: PasswordResetConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your password has been successfully reset</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={logoContainer}>
            <EmailLogo size="md" />
          </div>
          <Heading style={heading}>Password Reset Successful</Heading>
          <Section style={section}>
            <Text style={text}>Hi {userEmail.split('@')[0]},</Text>
            <Text style={text}>
              Your password has been successfully reset. You can now log in and
              continue exploring amazing places across Ghana.
            </Text>
            <Button style={button} href={loginUrl}>
              Log In
            </Button>
            <Text style={text}>
              If you didn&apos;t request this password change, please contact
              our support team immediately at security@placiagh.com.
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

export default PasswordResetConfirmationEmail;
