import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiArrowLeft, FiCheck, FiRefreshCw, FiPhone,
} from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

const STEPS = ['Contact', 'Verify OTP', 'New Password']

// ─── Shared input style ──────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px', padding: '12px 14px 12px 42px',
  color: '#f1f5f9', fontSize: '15px', outline: 'none',
  transition: 'border-color .2s',
}
const inputFocus = e => (e.target.style.borderColor = '#6366f1')
const inputBlur  = e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')

const btnStyle = (loading) => ({
  width: '100%', padding: '13px',
  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
  border: 'none', borderRadius: '10px', color: '#fff',
  fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'all .2s',
  boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
})

const Spinner = () => (
  <span style={{
    width: '18px', height: '18px', flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
    borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  }} />
)

// ─── Main Component ──────────────────────────────────────────────────────────
const ForgotPasswordPage = () => {
  const navigate = useNavigate()

  // mode: 'email' | 'phone'
  const [mode, setMode]           = useState('email')
  const [step, setStep]           = useState(0)

  // identifiers
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')

  // OTP
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const otpRefs                   = useRef([])

  // password
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)

  // UI state
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // ── resend countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // ── OTP helpers ───────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]; next[index] = value.slice(-1); setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus()
  }
  const handleOtpPaste = e => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const resetMessages = () => { setError(''); setSuccess('') }

  // ── STEP 0: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async e => {
    e.preventDefault(); resetMessages()
    setLoading(true)
    try {
      if (mode === 'email') {
        if (!email) { setError('Please enter your email address.'); return }
        const res = await axios.post(
          `${config.apiBaseUrl}${config.endpoints.auth.forgotPasswordSendOtp}`,
          { email }
        )
        setSuccess(res.data.message)
      } else {
        if (!phone) { setError('Please enter your mobile number.'); return }
        const res = await axios.post(
          `${config.apiBaseUrl}${config.endpoints.auth.forgotPasswordSendPhoneOtp}`,
          { phone }
        )
        setSuccess(res.data.message)
      }
      setStep(1); setResendTimer(60)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.')
    } finally { setLoading(false) }
  }

  // ── STEP 1: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async e => {
    e.preventDefault(); resetMessages()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter the complete 6-digit OTP.'); return }
    setLoading(true)
    try {
      const payload = mode === 'email'
        ? { email, otp: code }
        : { phone, otp: code }
      const res = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.auth.forgotPasswordVerifyOtp}`,
        payload
      )
      setSuccess(res.data.message); setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.')
    } finally { setLoading(false) }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    resetMessages(); setLoading(true)
    try {
      if (mode === 'email') {
        await axios.post(
          `${config.apiBaseUrl}${config.endpoints.auth.forgotPasswordSendOtp}`,
          { email }
        )
      } else {
        await axios.post(
          `${config.apiBaseUrl}${config.endpoints.auth.forgotPasswordSendPhoneOtp}`,
          { phone }
        )
      }
      setSuccess('New OTP sent!'); setOtp(['', '', '', '', '', ''])
      setResendTimer(60); otpRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.')
    } finally { setLoading(false) }
  }

  // ── STEP 2: Reset Password ───────────────────────────────────────────────
  const handleResetPassword = async e => {
    e.preventDefault(); resetMessages()
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const payload = mode === 'email'
        ? { email, otp: otp.join(''), newPassword }
        : { phone, otp: otp.join(''), newPassword }
      const res = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.auth.forgotPasswordReset}`,
        payload
      )
      setSuccess(res.data.message)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.')
    } finally { setLoading(false) }
  }

  // switch mode resets flow
  const switchMode = (m) => {
    if (m === mode) return
    setMode(m); setStep(0)
    setEmail(''); setPhone('')
    setOtp(['', '', '', '', '', ''])
    setError(''); setSuccess('')
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Inter', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Back link */}
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#94a3b8', fontSize: '14px', marginBottom: '24px',
          textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
        >
          <FiArrowLeft size={16} /> Back to Login
        </Link>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '40px 36px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 0 40px rgba(99,102,241,0.4)',
            }}>
              <FiLock color="white" size={28} />
            </div>
            <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: '700', margin: '0 0 6px' }}>
              Forgot Password
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              {step === 0 && 'Choose how to receive your OTP'}
              {step === 1 && (mode === 'email' ? `OTP sent to ${email}` : `OTP sent to ${phone}`)}
              {step === 2 && 'Create a new secure password'}
            </p>
          </div>

          {/* ── Mode Toggle (only on Step 0) ── */}
          {step === 0 && (
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.06)',
              borderRadius: '10px', padding: '4px', marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {[
                { key: 'email', icon: <FiMail size={15} />, label: 'Email OTP' },
                { key: 'phone', icon: <FiPhone size={15} />, label: 'Phone OTP' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '7px',
                    padding: '10px 0', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                    transition: 'all .25s',
                    background: mode === key
                      ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                      : 'transparent',
                    color: mode === key ? '#fff' : '#64748b',
                    boxShadow: mode === key ? '0 2px 12px rgba(99,102,241,0.5)' : 'none',
                  }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          )}

          {/* ── Stepper ── */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < 2 ? '0 0 auto' : undefined }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '13px', transition: 'all .3s',
                    background: i < step ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                      : i === step ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                    border: i < step ? 'none'
                      : i === step ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.12)',
                    color: i < step ? '#fff' : i === step ? '#818cf8' : '#475569',
                    boxShadow: i === step ? '0 0 20px rgba(99,102,241,0.5)' : 'none',
                  }}>
                    {i < step ? <FiCheck size={14} /> : i + 1}
                  </div>
                  <span style={{
                    fontSize: '10px', marginTop: '4px', whiteSpace: 'nowrap',
                    color: i <= step ? '#c7d2fe' : '#475569',
                    fontWeight: i === step ? '600' : '400',
                  }}>{label}</span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 8px', marginBottom: '16px',
                    background: i < step
                      ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                      : 'rgba(255,255,255,0.08)',
                    borderRadius: '2px', transition: 'background .3s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── Alerts ── */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '18px',
              color: '#fca5a5', fontSize: '14px',
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '18px',
              color: '#86efac', fontSize: '14px',
            }}>{success}</div>
          )}

          {/* ══════════════ STEP 0: Email or Phone Input ══════════════ */}
          {step === 0 && (
            <form onSubmit={handleSendOtp}>
              {mode === 'email' ? (
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={inputStyle}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Mobile Number
                  </label>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <FiPhone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                    <input
                      id="fp-phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="9876543210"
                      required
                      style={inputStyle}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                    />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
                    ℹ️ Your phone must be saved in your profile for SMS OTP to work.
                  </p>
                </div>
              )}

              <button id="fp-send-otp" type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? <><Spinner /> Sending...</> : (
                  mode === 'email' ? '📧 Send Email OTP' : '📱 Send SMS OTP'
                )}
              </button>
            </form>
          )}

          {/* ══════════════ STEP 1: OTP Input ══════════════ */}
          {step === 1 && (
            <form onSubmit={handleVerifyOtp}>
              {/* Mode indicator badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: mode === 'email' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${mode === 'email' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
                borderRadius: '20px', padding: '4px 12px', marginBottom: '18px',
                color: mode === 'email' ? '#818cf8' : '#34d399', fontSize: '13px', fontWeight: '500',
              }}>
                {mode === 'email' ? <FiMail size={13} /> : <FiPhone size={13} />}
                {mode === 'email' ? `via Email: ${email}` : `via SMS: ${phone}`}
              </div>

              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '16px', textAlign: 'center' }}>
                Enter 6-digit OTP
              </label>

              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (otpRefs.current[i] = el)}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: '48px', height: '56px', textAlign: 'center',
                      fontSize: '22px', fontWeight: '700',
                      background: digit ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                      border: digit ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px', color: '#f1f5f9', outline: 'none',
                      transition: 'all .2s',
                      boxShadow: digit ? '0 0 12px rgba(99,102,241,0.35)' : 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 16px rgba(99,102,241,0.5)' }}
                    onBlur={e => { if (!digit) { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' } }}
                  />
                ))}
              </div>

              <button id="fp-verify-otp" type="submit" disabled={loading} style={{ ...btnStyle(loading), marginBottom: '14px' }}>
                {loading ? <><Spinner />Verifying...</> : 'Verify OTP'}
              </button>

              {/* Resend */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button" onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{
                    background: 'none', border: 'none',
                    cursor: resendTimer > 0 ? 'default' : 'pointer',
                    color: resendTimer > 0 ? '#475569' : '#818cf8',
                    fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <FiRefreshCw size={14} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ══════════════ STEP 2: New Password ══════════════ */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                  <input
                    id="fp-new-password" type={showPassword ? 'text' : 'password'}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters" required
                    style={{ ...inputStyle, padding: '12px 44px 12px 42px' }}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                  }}>
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                  <input
                    id="fp-confirm-password" type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password" required
                    style={{
                      ...inputStyle,
                      padding: '12px 44px 12px 42px',
                      background: confirmPassword && confirmPassword !== newPassword
                        ? 'rgba(239,68,68,0.06)'
                        : confirmPassword && confirmPassword === newPassword
                        ? 'rgba(34,197,94,0.06)'
                        : 'rgba(255,255,255,0.06)',
                      border: confirmPassword && confirmPassword !== newPassword
                        ? '1px solid rgba(239,68,68,0.4)'
                        : confirmPassword && confirmPassword === newPassword
                        ? '1px solid rgba(34,197,94,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                  }}>
                    {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>Passwords don't match</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p style={{ color: '#4ade80', fontSize: '12px', marginTop: '4px' }}>✓ Passwords match</p>
                )}
              </div>

              <button id="fp-reset-password" type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? <><Spinner />Resetting...</> : '🔐 Reset Password'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '13px', marginTop: '24px' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '600' }}>
            Sign in
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default ForgotPasswordPage
