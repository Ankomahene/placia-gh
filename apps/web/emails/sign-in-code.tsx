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

const BRAND = { primary: '#006d47', onPrimary: '#f9fdfb', accent: '#f2bb3b', bg: '#fcfcfa' };

/** The sign-in email: a 6-digit code to type, and a button for people reading on the same phone. */
export function SignInCodeEmail({ code, link }: { code: string; link: string }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${code} is your Placia code`}</Preview>
      <Body
        style={{ backgroundColor: BRAND.bg, fontFamily: 'Helvetica, Arial, sans-serif', margin: 0 }}
      >
        <Container style={{ maxWidth: 440, margin: '0 auto', padding: '32px 24px' }}>
          <Text style={{ fontSize: 20, fontWeight: 700, color: BRAND.primary, margin: '0 0 24px' }}>
            Placia
          </Text>
          <Heading
            as="h1"
            style={{ fontSize: 18, fontWeight: 600, color: '#1b211e', margin: '0 0 16px' }}
          >
            Your sign-in code
          </Heading>
          <Section
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e3e7e4',
              borderRadius: 12,
              padding: '20px 0',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: 8,
                color: '#1b211e',
                margin: 0,
                fontFamily: 'Menlo, Consolas, monospace',
              }}
            >
              {code}
            </Text>
          </Section>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button
              href={link}
              style={{
                backgroundColor: BRAND.primary,
                color: BRAND.onPrimary,
                borderRadius: 999,
                padding: '12px 28px',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Sign in
            </Button>
          </Section>
          <Text style={{ fontSize: 13, color: '#69736d', margin: 0 }}>
            Expires in 1 hour. If you didn't ask for this, ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default SignInCodeEmail;
