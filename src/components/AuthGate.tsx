import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Gauge, KeyRound, Mail, UserPlus, LogIn, AlertCircle,
  Bike, Calendar, Palette, Fuel, Hash, ChevronRight, ChevronLeft, MapPin
} from 'lucide-react';

interface BikeProfile {
  bikeName: string;
  manufacturer: string;
  model: string;
  variant: string;
  year: string;
  color: string;
  fuelType: string;
  currentOdometer: string;
  registrationNumber: string;
  vin: string;
  purchaseDate: string;
  purchasePrice: string;
}

interface AuthGateProps {
  onAuthSuccess: () => void;
}

const defaultBikeProfile: BikeProfile = {
  bikeName: '',
  manufacturer: 'Jawa',
  model: 'Classic',
  variant: '300',
  year: '2023',
  color: 'Scarlet Red',
  fuelType: 'Petrol',
  currentOdometer: '0',
  registrationNumber: '',
  vin: '',
  purchaseDate: '',
  purchasePrice: '0',
};

const inputStyle: React.CSSProperties = {
  paddingLeft: '0.85rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  height: '40px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  marginBottom: '0.35rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const Field = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>
      {icon}
      <span>{label}</span>
    </label>
    {children}
  </div>
);

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 fields
  const [bike, setBike] = useState<BikeProfile>(defaultBikeProfile);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setBikeField = (field: keyof BikeProfile, value: string) =>
    setBike(prev => ({ ...prev, [field]: value }));

  const handleStep1Next = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) return;
    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (isSignUp) {
      setStep(2);
    } else {
      handleSignIn();
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onAuthSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!bike.bikeName.trim()) {
      setErrorMsg('Please enter a name for your bike.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            bike_name: bike.bikeName,
            manufacturer: bike.manufacturer,
            model: bike.model,
            variant: bike.variant,
            year: parseInt(bike.year) || 2023,
            color: bike.color,
            fuel_type: bike.fuelType,
            current_odometer: parseInt(bike.currentOdometer) || 0,
            registration_number: bike.registrationNumber,
            vin: bike.vin,
            purchase_date: bike.purchaseDate,
            purchase_price: parseFloat(bike.purchasePrice) || 0,
          }
        }
      });

      if (error) throw error;

      if (data.user && data.session === null) {
        setErrorMsg('Account created! Check your email to confirm registration, then sign in.');
        setIsSignUp(false);
        setStep(1);
        setPassword('');
        setConfirmPassword('');
      } else {
        onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setStep(1);
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
    setBike(defaultBikeProfile);
  };

  const totalSteps = isSignUp ? 2 : 1;

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '62px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--color-cyan)', borderRadius: '50%', animation: 'spin 2s linear infinite' }} />
          <Gauge size={26} style={{ color: 'var(--color-cyan)', opacity: 0.9 }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'white', marginBottom: '0.2rem' }}>
          Jawa RideLedger
        </h1>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Your personal ride logbook
        </span>
      </div>

      <div
        className="glass-card"
        style={{ borderRadius: '24px', padding: '1.6rem 1.4rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
            {isSignUp
              ? <UserPlus size={17} style={{ color: 'var(--color-cyan)' }} />
              : <LogIn size={17} style={{ color: 'var(--color-cyan)' }} />}
            <span>
              {isSignUp
                ? step === 1 ? 'Create Rider Account' : 'Register Your Motorcycle'
                : 'Sign In'}
            </span>
          </h2>
          {/* Step dots */}
          {isSignUp && (
            <div style={{ display: 'flex', gap: '5px' }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i + 1 === step ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i + 1 === step ? 'var(--color-cyan)' : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.25s',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{ display: 'flex', gap: '0.45rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ color: 'var(--color-crimson)', marginTop: '0.1rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.73rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: CREDENTIALS ── */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="Email Address" icon={<Mail size={11} />}>
              <input
                type="email"
                className="form-control"
                placeholder="rider@jawa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </Field>

            <Field label="Authorization Key" icon={<KeyRound size={11} />}>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </Field>

            {isSignUp && (
              <Field label="Confirm Key" icon={<KeyRound size={11} />}>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.83rem', marginTop: '0.4rem' }}
            >
              {loading ? (
                <div style={{ width: '15px', height: '15px', border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : isSignUp ? (
                <>Next — Bike Profile <ChevronRight size={14} /></>
              ) : (
                <>Sign In <LogIn size={14} /></>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: BIKE PROFILE ── */}
        {step === 2 && isSignUp && (
          <form onSubmit={handleStep2Submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {/* Row: Bike name */}
            <Field label="Bike Nickname" icon={<Bike size={11} />}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. My Classic 300"
                value={bike.bikeName}
                onChange={e => setBikeField('bikeName', e.target.value)}
                required
                disabled={loading}
                style={inputStyle}
              />
            </Field>

            {/* Row: Manufacturer + Model */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Field label="Manufacturer" icon={<Bike size={11} />}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Jawa"
                  value={bike.manufacturer}
                  onChange={e => setBikeField('manufacturer', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
              <Field label="Model" icon={<Bike size={11} />}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Classic"
                  value={bike.model}
                  onChange={e => setBikeField('model', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Row: Variant + Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Field label="Variant" icon={<Bike size={11} />}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="300"
                  value={bike.variant}
                  onChange={e => setBikeField('variant', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
              <Field label="Year" icon={<Calendar size={11} />}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="2023"
                  value={bike.year}
                  onChange={e => setBikeField('year', e.target.value)}
                  min="1900"
                  max="2030"
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Row: Color + Fuel Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Field label="Color" icon={<Palette size={11} />}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Scarlet Red"
                  value={bike.color}
                  onChange={e => setBikeField('color', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
              <Field label="Fuel Type" icon={<Fuel size={11} />}>
                <select
                  className="form-control"
                  value={bike.fuelType}
                  onChange={e => setBikeField('fuelType', e.target.value)}
                  disabled={loading}
                  style={{ ...inputStyle, paddingLeft: '0.75rem' }}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>CNG</option>
                </select>
              </Field>
            </div>

            {/* Current Odometer */}
            <Field label="Current Odometer (km)" icon={<Gauge size={11} />}>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={bike.currentOdometer}
                onChange={e => setBikeField('currentOdometer', e.target.value)}
                min="0"
                disabled={loading}
                style={inputStyle}
              />
            </Field>

            {/* Row: Reg Number + VIN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Field label="Reg. Number" icon={<MapPin size={11} />}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="MH01AB1234"
                  value={bike.registrationNumber}
                  onChange={e => setBikeField('registrationNumber', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
              <Field label="VIN / Chassis" icon={<Hash size={11} />}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="MD2..."
                  value={bike.vin}
                  onChange={e => setBikeField('vin', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Row: Purchase Date + Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <Field label="Purchase Date" icon={<Calendar size={11} />}>
                <input
                  type="date"
                  className="form-control"
                  value={bike.purchaseDate}
                  onChange={e => setBikeField('purchaseDate', e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
              <Field label="Purchase Price (₹)" icon={<Hash size={11} />}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="180000"
                  value={bike.purchasePrice}
                  onChange={e => setBikeField('purchasePrice', e.target.value)}
                  min="0"
                  disabled={loading}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setStep(1); setErrorMsg(null); }}
                disabled={loading}
                style={{ flex: '0 0 auto', height: '42px', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '12px', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.83rem' }}
              >
                {loading ? (
                  <div style={{ width: '15px', height: '15px', border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>Create Dashboard Link <UserPlus size={14} /></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Switch mode link */}
        <div style={{ textAlign: 'center', marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 500 }}
          >
            {isSignUp ? 'Already authorized? Sign in' : 'New owner? Create account'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .form-control:focus { border-color: var(--color-cyan) !important; box-shadow: 0 0 0 2px rgba(0, 210, 210, 0.12); }
      `}</style>
    </div>
  );
};
