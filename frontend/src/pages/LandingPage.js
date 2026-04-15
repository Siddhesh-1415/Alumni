import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FiUsers, FiBriefcase, FiCalendar, FiMessageCircle,
  FiArrowRight, FiMenu, FiX, FiAward, FiGlobe,
  FiTrendingUp, FiShield, FiStar, FiChevronDown,
  FiMapPin, FiDollarSign, FiClock, FiLoader,
  FiZap, FiBook, FiHeart, FiLink, FiMail, FiPhone,
  FiSettings, FiLock, FiBell, FiCamera, FiCoffee,
} from 'react-icons/fi'
import config from '../config/config'

/* ─── Icon resolver map (icon name string → component) ──────────────────── */
const ICON_MAP = {
  FiUsers, FiBriefcase, FiCalendar, FiMessageCircle,
  FiAward, FiGlobe, FiShield, FiStar, FiTrendingUp,
  FiZap, FiBook, FiHeart, FiLink, FiMail, FiPhone,
  FiSettings, FiLock, FiBell, FiCamera, FiCoffee,
  FiArrowRight, FiMapPin,
}
function resolveIcon(name) {
  return ICON_MAP[name] || FiStar
}

const API = config.apiBaseUrl

/* ─── Animated counter hook ─────────────────────────────────────────────── */
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start || target === 0) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

/* ─── Intersection observer hook ─────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, inView]
}

/* ─── Stat card with animated counter ───────────────────────────────────── */
function StatCard({ number, suffix, label, icon: Icon, inView, loading }) {
  const count = useCounter(number, 2000, inView && !loading)
  return (
    <div className="text-center group">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 bg-opacity-20 mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="text-blue-300" size={28} />
      </div>
      <div className="text-5xl font-extrabold text-white mb-1 min-h-[3rem] flex items-center justify-center">
        {loading ? (
          <FiLoader className="animate-spin text-blue-300" size={32} />
        ) : (
          <>{count.toLocaleString()}{suffix}</>
        )}
      </div>
      <div className="text-blue-200 font-medium">{label}</div>
    </div>
  )
}

/* ─── Feature card (dynamic — resolves icon by string name) ─────────────── */
function FeatureCard({ iconName, title, description, gradient, route, buttonLabel, delay }) {
  const [ref, inView] = useInView(0.15)
  const Icon = resolveIcon(iconName)
  return (
    <div
      ref={ref}
      className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl border border-gray-100 hover:-translate-y-2 flex flex-col"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${gradient} mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={26} />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed flex-1">{description}</p>
      <Link
        to={route || '/login'}
        className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl ${gradient} text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-fit`}
      >
        {buttonLabel || 'Explore'}
        <FiArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

/* ─── Live Job card ──────────────────────────────────────────────────────── */
function JobCard({ job, delay }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-gray-100 hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-800 text-lg">{job.role}</h4>
          <p className="text-blue-600 font-medium">{job.company}</p>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Hiring</span>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <FiMapPin size={13} /> {job.location}
          </span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1">
            <FiDollarSign size={13} /> {job.salary}
          </span>
        )}
        <span className="flex items-center gap-1">
          <FiClock size={13} /> {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

/* ─── Live Event card ────────────────────────────────────────────────────── */
function EventCard({ event, delay }) {
  const [ref, inView] = useInView(0.1)
  const eventDate = new Date(event.date)
  const isPast = eventDate < new Date()
  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-gray-100 hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex flex-col items-center justify-center text-white shadow-md">
          <span className="text-xs font-semibold uppercase leading-none">
            {eventDate.toLocaleString('en-IN', { month: 'short' })}
          </span>
          <span className="text-xl font-extrabold leading-none">{eventDate.getDate()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
          {event.location && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <FiMapPin size={12} /> {event.location}
            </p>
          )}
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${isPast ? 'bg-gray-100 text-gray-500' : 'bg-violet-100 text-violet-700'
            }`}>
            {isPast ? 'Completed' : 'Upcoming'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Testimonial card ───────────────────────────────────────────────────── */
function TestimonialCard({ name, role, batch, text, avatar, delay }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-7 shadow-md hover:shadow-xl border border-gray-100 hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <FiStar key={i} className="text-yellow-400 fill-yellow-400" size={16} />
        ))}
      </div>
      <p className="text-gray-600 italic leading-relaxed mb-5">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {avatar}
        </div>
        <div>
          <div className="font-semibold text-gray-800">{name}</div>
          <div className="text-sm text-gray-500">{role} · Batch of {batch}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Floating particles (decorative) ───────────────────────────────────── */
function Particles() {
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 3,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
      duration: Math.random() * 8 + 8,
    }))
  ).current

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white opacity-10 animate-pulse"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Skeleton loader ────────────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  )
}

/* ─── Main Landing Page ──────────────────────────────────────────────────── */
const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [statsRef, statsInView] = useInView(0.3)

  // ── Dynamic data state ──────────────────────────────────────────────────
  const [liveData, setLiveData] = useState({
    stats: { alumni: 0, students: 0, total: 0, jobs: 0, events: 0 },
    recentJobs: [],
    recentEvents: [],
    latestAlumni: [],
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  // ── Features state ──────────────────────────────────────────────────────
  const [features, setFeatures] = useState([])
  const [featuresLoading, setFeaturesLoading] = useState(true)

  // Fetch public stats + features on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setDataLoading(true)
        const res = await fetch(`${API}/api/public/stats`)
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setLiveData(data)
      } catch (err) {
        console.error('Landing page stats fetch error:', err)
        setDataError(err.message)
      } finally {
        setDataLoading(false)
      }
    }

    const fetchFeatures = async () => {
      try {
        setFeaturesLoading(true)
        const res = await fetch(`${API}/api/public/features`)
        if (!res.ok) throw new Error('Failed to fetch features')
        const data = await res.json()
        setFeatures(data)
      } catch (err) {
        console.error('Landing page features fetch error:', err)
      } finally {
        setFeaturesLoading(false)
      }
    }

    fetchStats()
    fetchFeatures()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // features state is populated from API (see fetchFeatures above)

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Software Engineer @ Google',
      batch: '2021',
      text: 'The Alumni Portal helped me land my dream job at Google! A senior from my batch referred me and guided me through the interview.',
      avatar: 'P',
      delay: 0,
    },
    {
      name: 'Rahul Desai',
      role: 'Product Manager @ Flipkart',
      batch: '2019',
      text: 'I found 3 co-founders for my startup through this platform. The network is incredibly powerful and the team is super supportive.',
      avatar: 'R',
      delay: 150,
    },
    {
      name: 'Anjali Mehta',
      role: 'Data Scientist @ Microsoft',
      batch: '2020',
      text: 'The events section keeps me connected to college. We organized a virtual alumni meet with 200+ attendees — amazing experience!',
      avatar: 'A',
      delay: 300,
    },
  ]

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Live Jobs', href: '#live-jobs' },
    { label: 'Events', href: '#live-events' },
    { label: 'Testimonials', href: '#testimonials' },
  ]

  // Derived avatar labels from live alumni or fallback
  const avatarLabels = liveData.latestAlumni.length > 0
    ? liveData.latestAlumni.slice(0, 5).map(a => (a.name || '?')[0].toUpperCase())
    : ['P', 'R', 'A', 'S', 'K']

  return (
    <div className="min-h-screen font-sans bg-white overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
              <FiGlobe className="text-white" size={18} />
            </div>
            <span className={`text-xl font-extrabold tracking-tight ${scrolled ? 'text-gray-800' : 'text-white'}`}>
              Alumni<span className={scrolled ? 'text-blue-600' : 'text-blue-300'}>Portal</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className={`font-medium text-sm transition-colors duration-200 hover:text-blue-500 ${scrolled ? 'text-gray-600' : 'text-blue-100'
                  }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${scrolled
                  ? 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                  : 'text-white border border-white/40 hover:bg-white/10'
                }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Join Now
            </Link>
          </div>

          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl px-6 py-5 space-y-4">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="block text-gray-700 font-medium hover:text-blue-600" onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <Link to="/login" className="text-center py-2 border border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition">Sign In</Link>
              <Link to="/register" className="text-center py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow hover:shadow-md transition">Join Now</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 overflow-hidden">
        <Particles />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-pulse">
            <FiTrendingUp size={14} />
            <span>Connecting Alumni Across Generations</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            XIE MAHIM,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
              Reimagined
            </span>
          </h1>

          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Connect with alumni, discover career opportunities, attend events, and build lifelong relationships — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              Get Started Free
              <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={20} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all duration-200 text-lg backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>

          {/* Live social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex -space-x-3">
              {avatarLabels.map((l, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  style={{ zIndex: 5 - i }}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-blue-200 text-sm font-medium">
              {dataLoading ? (
                <span className="inline-block w-24 h-4 bg-white/20 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-white font-bold">{(liveData.stats.total).toLocaleString()}+</span> members already connected
                </>
              )}
            </p>
          </div>
        </div>

        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-blue-300 hover:text-white transition-colors animate-bounce">
          <FiChevronDown size={32} />
        </a>
      </section>

      {/* ── Live Stats Section ───────────────────────────────────────────── */}
      <section id="stats" className="relative py-24 bg-gradient-to-r from-blue-800 to-indigo-900 overflow-hidden">
        <div ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
          <StatCard
            number={liveData.stats.alumni}
            suffix="+"
            label="Active Alumni"
            icon={FiUsers}
            inView={statsInView}
            loading={dataLoading}
          />
          <StatCard
            number={liveData.stats.students}
            suffix="+"
            label="Students Enrolled"
            icon={FiAward}
            inView={statsInView}
            loading={dataLoading}
          />
          <StatCard
            number={liveData.stats.jobs}
            suffix="+"
            label="Jobs Posted"
            icon={FiBriefcase}
            inView={statsInView}
            loading={dataLoading}
          />
          <StatCard
            number={liveData.stats.events}
            suffix="+"
            label="Events Hosted"
            icon={FiCalendar}
            inView={statsInView}
            loading={dataLoading}
          />
        </div>
        {!dataLoading && (
          <p className="text-center text-blue-300 text-xs mt-8 opacity-70">
            ↑ Live numbers from our database · Updated in real-time
          </p>
        )}
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-100 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Everything You Need
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Powerful Features for<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Every Alumni</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From networking to career growth — our platform is built to keep your college community thriving.
            </p>
          </div>
          {featuresLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 space-y-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
              ))}
            </div>
          ) : features.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiStar size={48} className="mx-auto mb-3 opacity-30" />
              <p>Features coming soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <FeatureCard
                  key={f._id || f.title}
                  iconName={f.icon}
                  title={f.title}
                  description={f.description}
                  gradient={f.gradient}
                  route={f.route}
                  buttonLabel={f.buttonLabel}
                  delay={i * 100}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Live Recent Jobs ─────────────────────────────────────────────── */}
      <section id="live-jobs" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Live from the Portal
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Latest{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                Job Opportunities
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Real job postings from our alumni network — updated live.
            </p>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : dataError || liveData.recentJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiBriefcase size={48} className="mx-auto mb-3 opacity-30" />
              <p>No jobs posted yet. Be the first to share an opportunity!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveData.recentJobs.map((job, i) => (
                <JobCard key={job._id} job={job} delay={i * 100} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              View All Jobs
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Upcoming Events ──────────────────────────────────────────── */}
      <section id="live-events" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-violet-100 text-violet-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Live from the Portal
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Upcoming{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                Events
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              College events, alumni meets & webinars — happening right now.
            </p>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md flex items-start gap-4">
                  <Skeleton className="w-14 h-14 flex-shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : dataError || liveData.recentEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiCalendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No events scheduled yet. Stay tuned for upcoming events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveData.recentEvents.map((event, i) => (
                <EventCard key={event._id} event={event} delay={i * 100} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              View All Events
              <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Get Started in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">3 Steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200" />
            {[
              { step: '01', title: 'Register', desc: 'Sign up with your college email. Your account will be verified against college records.', color: 'from-blue-500 to-blue-700' },
              { step: '02', title: 'Build Profile', desc: 'Add your experience, skills, and education. Let alumni know who you are and where you are heading.', color: 'from-indigo-500 to-violet-700' },
              { step: '03', title: 'Connect & Grow', desc: 'Explore the directory, apply to jobs, attend events, and chat with your network instantly.', color: 'from-violet-500 to-purple-700' },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${item.color} mx-auto mb-6 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-white font-extrabold text-2xl">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-yellow-100 text-yellow-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Alumni Stories
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              What Our Alumni{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">Say</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Real stories from alumni who transformed their careers and connections through our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900" />
        <Particles />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Ready to Reconnect<br />with Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Alma Mater</span>?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join{' '}
            {dataLoading
              ? 'thousands of'
              : <strong>{liveData.stats.total.toLocaleString()}+</strong>
            }{' '}
            alumni and students who are networking, growing their careers, and giving back to their college community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-2xl shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg"
            >
              Join the Community
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-white/10 transition-all duration-200 text-lg"
            >
              Already a Member? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <FiGlobe className="text-white" size={18} />
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight">
                Alumni<span className="text-blue-400">Portal</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#live-jobs" className="hover:text-white transition-colors">Jobs</a>
              <a href="#live-events" className="hover:text-white transition-colors">Events</a>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Alumni Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
