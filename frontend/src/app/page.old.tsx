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
} from '@ant-design/icons';

const { Title, Link, Paragraph } = Typography;

/**
 * Home — Login / Register + 2FA + expiration de mot de passe (6 mois) + renouvellement de mot de passe
 *
 * Back-end (OpenFaaS)
 *   • POST https://api.cofrap.instantresa.fr/function/signup-user          { email }
 *   • POST https://api.cofrap.instantresa.fr/function/authenticate-user   { email, password }
 *       ↳ { status: "password-validated" }      → écran OTP
 *       ↳ { status: "password-expired" }        → écran réinitialisation / message d’expiration
 *   • POST https://api.cofrap.instantresa.fr/function/verify-2fa           { email, password, 2fa }
 *   • POST https://api.cofrap.instantresa.fr/function/renew-password       { email }
 */
export default function Home() {
  /* ========================= State ========================= */
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<
    'credentials' | '2fa' | 'expired' | 'renewed' | 'done'
  >('credentials');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();

  /* ========================= Helper ========================= */
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

  /* ========================= Handlers ========================= */
  // Connexion (identifiants)
  const handleCredentialsFinish = async (values: {
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const data = await postJSON(
        'https://api.cofrap.instantresa.fr/function/authenticate-user',
        { email: values.email, password: values.password },
      );

      setEmail(values.email);
      setPassword(values.password);

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

  // Vérification OTP
  const handleOtpFinish = async (values: { otp: string }) => {
    setLoading(true);
    try {
      await postJSON('https://api.cofrap.instantresa.fr/function/verify-2fa', {
        email,
        password,
        code_totp: values.otp,
      });
      messageApi.success('Connexion réussie ✔');
      setStep('done');
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Renouvellement mot de passe
  const handlePasswordRenewal = async () => {
    setLoading(true);
    try {
      const data = await postJSON(
        'https://api.cofrap.instantresa.fr/function/renew-password',
        { email },
      );
      // { status: "password-reset", password: "..." }
      setNewPassword(data.password);
      messageApi.success('Nouveau mot de passe généré');
      setStep('renewed');
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const handleRegisterFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await postJSON(
        'https://api.cofrap.instantresa.fr/function/signup-user',
        { email: values.email },
      );
      setEmail(values.email);
      messageApi.success(
        'Inscription réussie — vérifiez votre mail pour le mot de passe',
      );
      setMode('login');
      setStep('credentials');
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setStep('credentials');
    setNewPassword(null);
  };

  /* ========================= UI ========================= */
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
          style={{ width: 420, textAlign: 'center' }}
          styles={{ body: { padding: '40px 32px' } }}
        >
          {/* ===== Titre ===== */}
          <Title level={3} style={{ marginBottom: 32 }}>
            {mode === 'register'
              ? 'Inscription'
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

          {/* ===== Formulaire Login ===== */}
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
                  {
                    required: true,
                    message: 'Veuillez entrer votre adresse mail',
                  },
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

          {/* ===== Formulaire 2FA ===== */}
          {mode === 'login' && step === '2fa' && (
            <Form
              name="otp"
              layout="vertical"
              onFinish={handleOtpFinish}
              autoComplete="off"
            >
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

          {/* ===== Écran mot de passe expiré ===== */}
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

          {/* ===== Écran nouveau mot de passe ===== */}
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
              <Paragraph
                copyable
                style={{ fontWeight: 'bold', fontSize: 16 }}
              >
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

          {/* ===== Écran succès ===== */}
          {mode === 'login' && step === 'done' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <CheckCircleTwoTone
                twoToneColor={token.colorSuccess}
                style={{ fontSize: 72 }}
              />
              <Title level={4} style={{ margin: 0 }}>
                Connecté !
              </Title>
            </div>
          )}

          {/* ===== Formulaire Inscription ===== */}
          {mode === 'register' && (
            <Form
              name="register"
              layout="vertical"
              onFinish={handleRegisterFinish}
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

          {/* ===== Lien bascule ===== */}
          {mode === 'login' && step !== 'done' && step !== 'expired' ? (
            step === '2fa' ? null : (
              <Link onClick={switchMode} style={{ cursor: 'pointer' }}>
                Inscription
              </Link>
            )
          ) : mode === 'register' ? (
            <Link onClick={switchMode} style={{ cursor: 'pointer' }}>
              Déjà un compte ? Se connecter
            </Link>
          ) : null}
        </Card>
      </div>
    </Layout>
  );
}
