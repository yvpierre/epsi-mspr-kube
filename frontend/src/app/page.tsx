'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Layout,
  Typography,
  theme,
  message,
} from 'antd';
import {
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
  SafetyCertificateTwoTone,
  QrcodeOutlined,
} from '@ant-design/icons';

const { Title, Link, Paragraph } = Typography;

export default function Home() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<
    'credentials' | '2fa' | 'expired' | 'renewed' | 'signup-success' | 'done'
  >('credentials');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const [signupPassword, setSignupPassword] = useState<string | null>(null);
  const [qrPass, setQrPass] = useState<string | null>(null);
  const [qr2fa, setQr2fa] = useState<string | null>(null);

  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();

  const postJSON = async (url: string, payload: Record<string, any>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const { message: msg } =
        (await res.json().catch(() => ({ message: res.statusText }))) as {
          message?: string;
        };
      throw new Error(msg || 'Erreur serveur');
    }
    return res.json();
  };

  const handleCredentialsFinish = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const data = await postJSON(
        'https://api.cofrap.instantresa.fr/function/authenticate-user',
        { email, password },
      );

      setEmail(email);
      setPassword(password);

      switch (data.status) {
        case 'password-validated':
          setStep('2fa');
          break;
        case 'password-expired':
          messageApi.warning(
            'Votre mot de passe a expiré ; veuillez le réinitialiser.',
          );
          setStep('expired');
          break;
        default:
          messageApi.success('Connecté ✔');
          setStep('done');
      }
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpFinish = async ({ otp }: { otp: string }) => {
    setLoading(true);
    try {
      await postJSON('https://api.cofrap.instantresa.fr/function/verify-2fa', {
        email,
        password,
        code_totp: otp,
      });
      messageApi.success('Connexion réussie ✔');
      setStep('done');
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRenewal = async () => {
    setLoading(true);
    try {
      const data = await postJSON(
        'https://api.cofrap.instantresa.fr/function/renew-password',
        { email },
      );
      setNewPassword(data.password);
      messageApi.success('Nouveau mot de passe généré');
      setStep('renewed');
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFinish = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      const data = await postJSON(
        'https://api.cofrap.instantresa.fr/function/signup-user',
        { email },
      );
      setEmail(data.email);
      setSignupPassword(data.password);
      setQrPass(data.qr_password_base64);
      setQr2fa(data.qr_2fa_base64);
      messageApi.success('Compte créé ✔');
      setStep('signup-success');
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setStep('credentials');
    setNewPassword(null);
  };

  return (
    <Layout>
      {contextHolder}

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #ff2a2a 0%, #8e2de2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <Card
          style={{ width: 440, textAlign: 'center' }}
          styles={{ body: { padding: '40px 32px' } }}
        >
          <Title level={3} style={{ marginBottom: 32 }}>
            {mode === 'register'
              ? step === 'signup-success'
                ? 'Compte créé'
                : 'Inscription'
              : step === 'credentials'
              ? 'Bon retour'
              : step === '2fa'
              ? 'Authentification 2FA'
              : step === 'expired'
              ? 'Mot de passe expiré'
              : step === 'renewed'
              ? 'Nouveau mot de passe'
              : 'Connecté !'}
          </Title>

          {mode === 'login' && step === 'credentials' && (
            <Form
              key={email || 'login'}
              name="login"
              layout="vertical"
              onFinish={handleCredentialsFinish}
              initialValues={{ email }}
              autoComplete="off"
            >
              <Form.Item
                label="Adresse mail"
                name="email"
                rules={[
                  { required: true, message: 'Veuillez entrer votre adresse mail' },
                  { type: 'email', message: 'Adresse mail invalide' },
                ]}
              >
                <Input placeholder="Adresse mail" size="large" />
              </Form.Item>

              <Form.Item
                label="Mot de passe"
                name="password"
                rules={[
                  { required: true, message: 'Veuillez entrer votre mot de passe' },
                ]}
              >
                <Input.Password placeholder="Mot de passe" size="large" />
              </Form.Item>

              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <Link href="#" style={{ fontSize: 12 }}>
                  Mot de passe oublié&nbsp;?
                </Link>
              </div>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Se connecter
                </Button>
              </Form.Item>
            </Form>
          )}

          {mode === 'login' && step === '2fa' && (
            <Form name="otp" layout="vertical" onFinish={handleOtpFinish}>
              <Form.Item
                label="Code de vérification"
                name="otp"
                rules={[
                  { required: true, message: 'Veuillez entrer le code' },
                  { len: 6, message: 'Le code doit contenir 6 chiffres' },
                ]}
              >
                {Input?.OTP ? (
                  <Input.OTP length={6} autoFocus size="large" />
                ) : (
                  <Input placeholder="••••••" maxLength={6} size="large" />
                )}
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Valider
                </Button>
              </Form.Item>
            </Form>
          )}

          {mode === 'login' && step === 'expired' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <ExclamationCircleTwoTone
                twoToneColor={token.colorWarning}
                style={{ fontSize: 72 }}
              />
              <Paragraph>
                Votre mot de passe a expiré après 6 mois. Cliquez ci-dessous
                pour générer un nouveau mot de passe.
              </Paragraph>
              <Button
                type="primary"
                block
                loading={loading}
                onClick={handlePasswordRenewal}
              >
                Réinitialiser mon mot de passe
              </Button>
            </div>
          )}

          {mode === 'login' && step === 'renewed' && newPassword && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <SafetyCertificateTwoTone
                twoToneColor={token.colorSuccess}
                style={{ fontSize: 72 }}
              />
              <Paragraph>Votre nouveau mot de passe&nbsp;:</Paragraph>
              <Paragraph copyable style={{ fontWeight: 'bold', fontSize: 16 }}>
                {newPassword}
              </Paragraph>
              <Button
                type="primary"
                block
                onClick={() => setStep('credentials')}
              >
                Retour à la connexion
              </Button>
            </div>
          )}

          {mode === 'register' && step === 'signup-success' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <CheckCircleTwoTone
                twoToneColor={token.colorSuccess}
                style={{ fontSize: 72 }}
              />
              <Paragraph>Votre compte a été créé avec succès.</Paragraph>

              {signupPassword && (
                <>
                  <Paragraph strong style={{ marginBottom: 8 }}>
                    Mot de passe initial&nbsp;:
                  </Paragraph>
                  <Paragraph copyable style={{ fontWeight: 'bold' }}>
                    {signupPassword}
                  </Paragraph>
                </>
              )}

              <div style={{ display: 'flex', gap: 24 }}>
                {qrPass && (
                  <div>
                    <Paragraph style={{ marginBottom: 4 }}>
                      <QrcodeOutlined /> Mot de passe
                    </Paragraph>
                    <img
                      src={`data:image/png;base64,${qrPass}`}
                      alt="QR Mot de passe"
                      style={{ width: 140 }}
                    />
                  </div>
                )}

                {qr2fa && (
                  <div>
                    <Paragraph style={{ marginBottom: 4 }}>
                      <QrcodeOutlined /> 2FA
                    </Paragraph>
                    <img
                      src={`data:image/png;base64,${qr2fa}`}
                      alt="QR 2FA"
                      style={{ width: 140 }}
                    />
                  </div>
                )}
              </div>

              <Button
                type="primary"
                block
                onClick={() => {
                  setMode('login');
                  setStep('credentials');
                }}
              >
                Aller à la connexion
              </Button>
            </div>
          )}

          {mode === 'register' && step !== 'signup-success' && (
            <Form
              name="register"
              layout="vertical"
              onFinish={handleRegisterFinish}
            >
              <Form.Item
                label="Adresse mail"
                name="email"
                rules={[
                  { required: true, message: 'Veuillez entrer votre adresse mail' },
                  { type: 'email', message: 'Adresse mail invalide' },
                ]}
              >
                <Input placeholder="Adresse mail" size="large" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Créer mon compte
                </Button>
              </Form.Item>
            </Form>
          )}

          {mode === 'login' && step !== 'done' && step !== 'expired' ? (
            step === '2fa' ? null : (
              <Link onClick={switchMode} style={{ cursor: 'pointer' }}>
                Inscription
              </Link>
            )
          ) : mode === 'register' && step !== 'signup-success' ? (
            <Link onClick={switchMode} style={{ cursor: 'pointer' }}>
              Déjà un compte ? Se connecter
            </Link>
          ) : null}
        </Card>
      </div>
    </Layout>
  );
}
