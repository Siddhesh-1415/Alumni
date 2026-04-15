import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff,
  FiHash, FiCreditCard, FiArrowRight, FiGlobe,
  FiCheckCircle, FiShield, FiTrendingUp,
} from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

/* ── tiny floating blob ──────────────────────────────────────────────────── */
const Blob = ({ className }) => (
  <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />
)

/* ── password strength meter ─────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const score = (() => {
    let s = 0
    if (password.length >= 6) s++
    if (password.length >= 10) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500']
  const textColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-600', 'text-emerald-600']
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  )
}

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    email: '',
    password: '',
    college_id: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${config.apiBaseUrl}${config.endpoints.auth.register}`, {
        name: formData.name,
        uid: formData.uid,
        email: formData.email,
        password: formData.password,
        college_id: formData.college_id,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    { icon: FiCheckCircle, text: 'Free forever — no credit card required' },
    { icon: FiShield,       text: 'Verified via your college records' },
    { icon: FiTrendingUp,   text: 'Access jobs, events & alumni network' },
  ]

  const fields = [
    { id: 'reg-name',      name: 'name',       label: 'Full Name',      type: 'text',     placeholder: 'John Doe',        icon: FiUser },
    { id: 'reg-uid',       name: 'uid',        label: 'UID Number',     type: 'text',     placeholder: 'e.g. 2022010001', icon: FiHash },
    { id: 'reg-college',   name: 'college_id', label: 'College ID',     type: 'text',     placeholder: 'e.g. CS001',      icon: FiCreditCard },
    { id: 'reg-email',     name: 'email',      label: 'Email Address',  type: 'email',    placeholder: 'you@example.com', icon: FiMail },
  ]

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-indigo-700 via-blue-800 to-blue-900 flex-col items-center justify-center p-12 overflow-hidden">
        <Blob className="w-96 h-96 bg-indigo-400 -top-24 -left-24" />
        <Blob className="w-80 h-80 bg-blue-400 bottom-0 -right-10" />
        <Blob className="w-56 h-56 bg-cyan-400 top-1/2 left-1/2" />

        <div className="relative z-10 max-w-sm text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <FiGlobe className="text-white" size={24} />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              Alumni<span className="text-blue-300">Portal</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Join Thousands of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Alumni & Students
            </span>
          </h2>
          <p className="text-blue-100 leading-relaxed mb-10 text-sm">
            Your college community is waiting. Register once, connect forever.
          </p>

          <div className="space-y-3 text-left">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="text-white" size={16} />
                </div>
                <span className="text-blue-50 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Step indicator */}
          <div className="mt-10 p-5 bg-white/10 backdrop-blur-sm rounded-2xl text-left">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">How it works</p>
            {['Register with your college ID', 'Complete your profile', 'Connect & explore the network'].map((step, i) => (
              <div key={step} className="flex items-center gap-3 mb-2 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-blue-100 text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center bg-white px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow">
              <FiGlobe className="text-white" size={18} />
            </div>
            <span className="text-xl font-extrabold text-gray-800 tracking-tight">
              Alumni<span className="text-blue-600">Portal</span>
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Create your account</h1>
            <p className="text-gray-500">
              Already have one?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 2-column grid for first 4 fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {fields.map(({ id, name, label, type, placeholder, icon: Icon }) => (
                <div key={name}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      id={id}
                      type={type}
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Password — full width */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              <PasswordStrength password={formData.password} />
            </div>

            {/* Info note */}
            <div className="mb-5 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <FiShield className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-blue-700 text-sm leading-relaxed">
                Your role (Student / Alumni) is automatically assigned based on your College ID and UID. You can complete your profile after signing up.
              </p>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-400">Already have an account?</span>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            Sign In Instead
          </Link>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Alumni Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
