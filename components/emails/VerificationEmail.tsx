import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { EmailLogo } from './EmailLogo';

interface VerificationEmailProps {
  otp: string;
  isPasswordReset?: boolean;
}

export const VerificationEmail = ({
  otp,
  isPasswordReset = false,
}: VerificationEmailProps) => {
  const title = isPasswordReset
    ? 'Reset Your Password'
    : 'Verify Your Email Address';

  const previewText = isPasswordReset
    ? 'Use this code to reset your password'
    : 'Use this code to verify your email address';

  const instruction = isPasswordReset
    ? 'To reset your password, enter this verification code in the password reset page:'
    : 'To verify your email address, enter this verification code in the verification page:';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={logoContainer}>
            <EmailLogo size="md" />
          </div>
          <Heading style={heading}>{title}</Heading>
          <Section style={section}>
            <Text style={text}>{instruction}</Text>
            <Text style={codeContainer}>{otp}</Text>
            <Text style={text}>
              If you didn't request this verification, please ignore this email or contact our support team at support@placiagh.com for assistance.
            </Text>
            <Text style={text}>
              Get ready to discover the best places Ghana has to offer!
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

const codeContainer = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#f5f5f5',
  borderRadius: '6px',
  fontFamily: 'monospace',
  fontSize: '28px',
  textAlign: 'center' as const,
  letterSpacing: '4px',
  fontWeight: 'bold',
  color: '#611cca',
};

export default VerificationEmail;
