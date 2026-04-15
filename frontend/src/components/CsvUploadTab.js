import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  FiUploadCloud, FiDownload, FiTrash2, FiCheckCircle,
  FiAlertCircle, FiFile, FiX, FiUsers, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiSearch, FiAlertTriangle,
} from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

const token = () => localStorage.getItem('authToken')

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = n => (n ?? 0).toLocaleString()

const Badge = ({ children, color }) => {
  const colors = {
    green:  { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    blue:   { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    red:    { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    yellow: { bg: '#fef9c3', text: '#854d0e', border: '#fde68a' },
    purple: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  }
  const c = colors[color] || colors.blue
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: '6px', padding: '2px 10px', fontSize: '12px', fontWeight: '600',
    }}>{children}</span>
  )
}


const CsvUploadTab = () => {
  // ── upload state ────────────────────────────────────────────────────────────
  const [dragging, setDragging]       = useState(false)
  const [file, setFile]               = useState(null)
  const [preview, setPreview]         = useState(null)   // { headers, rows }
  const [clearFirst, setClearFirst]   = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [result, setResult]           = useState(null)   // backend response
  const fileInputRef                  = useRef(null)

  // ── allowed-users table ─────────────────────────────────────────────────────
  const [allowedUsers, setAllowedUsers]   = useState([])
  const [auLoading, setAuLoading]         = useState(false)
  const [auPage, setAuPage]               = useState(1)
  const [auTotal, setAuTotal]             = useState(0)
  const [auPages, setAuPages]             = useState(1)
  const [auSearch, setAuSearch]           = useState('')
  const [clearing, setClearing]           = useState(false)
  const AU_LIMIT = 10

  // ── fetch allowed users ─────────────────────────────────────────────────────
  const fetchAllowedUsers = useCallback(async (page = 1) => {
    setAuLoading(true)
    try {
      const res = await axios.get(
        `${config.apiBaseUrl}${config.endpoints.admin.allowedUsers}?page=${page}&limit=${AU_LIMIT}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      )
      setAllowedUsers(res.data.users || [])
      setAuTotal(res.data.pagination?.total || 0)
      setAuPages(res.data.pagination?.pages || 1)
      setAuPage(page)
    } catch (e) {
      console.error(e)
    } finally {
      setAuLoading(false)
    }
  }, [])

  useEffect(() => { fetchAllowedUsers(1) }, [fetchAllowedUsers])

  // ── CSV preview parser ──────────────────────────────────────────────────────
  const parsePreview = (text) => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 1) return null
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows = lines.slice(1, 6).map(line =>   // show up to 5 preview rows
      line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    )
    return { headers, rows, total: lines.length - 1 }
  }

  // ── file selection ──────────────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setResult({ success: false, message: 'Only CSV (.csv) files are accepted.' })
      return
    }
    setFile(f); setResult(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(parsePreview(e.target.result))
    reader.readAsText(f)
  }

  const onInputChange = e => handleFile(e.target.files[0])
  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }
  const clearFile = () => { setFile(null); setPreview(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  // ── upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = `${config.apiBaseUrl}${config.endpoints.admin.uploadStudents}${clearFirst ? '?clearFirst=true' : ''}`
      const res = await axios.post(url, fd, {
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'multipart/form-data' }
      })
      setResult({ ...res.data, success: true })
      clearFile()
      fetchAllowedUsers(1)
    } catch (e) {
      setResult({ success: false, message: e.response?.data?.message || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  // ── clear collection ────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (!window.confirm('⚠️ This will permanently delete ALL allowed users. Continue?')) return
    setClearing(true)
    try {
      await axios.delete(
        `${config.apiBaseUrl}${config.endpoints.admin.allowedUsers}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      )
      fetchAllowedUsers(1)
    } catch (e) {
      alert('Failed to clear: ' + e.response?.data?.message)
    } finally {
      setClearing(false)
    }
  }

  // ── download template ───────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv = 'uid,college_id,email,name\n2022010001,CS2022001,student1@example.com,John Doe\n2022010002,CS2022002,jane@example.com,Jane Smith'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'allowed_users_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── filtered users (client-side search on current page) ──────────────────────
  const filtered = auSearch
    ? allowedUsers.filter(u =>
        u.name?.toLowerCase().includes(auSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(auSearch.toLowerCase()) ||
        u.uid?.toLowerCase().includes(auSearch.toLowerCase()) ||
        u.college_id?.toLowerCase().includes(auSearch.toLowerCase())
      )
    : allowedUsers

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ══════ UPLOAD CARD ══════ */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: 0 }}>
              📤 Upload Allowed Users CSV
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '4px 0 0' }}>
              Only listed users can register on the portal
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', borderRadius: '8px', padding: '8px 14px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'background .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <FiDownload size={15} /> Download Template
          </button>
        </div>

        <div style={{ padding: '28px' }}>

          {/* ── Instructions ── */}
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px',
            fontSize: '13px', color: '#1e40af', lineHeight: '1.7',
          }}>
            <strong>Required columns:</strong> <code style={{ background: '#dbeafe', borderRadius: '4px', padding: '1px 6px' }}>uid</code>{' '}
            <code style={{ background: '#dbeafe', borderRadius: '4px', padding: '1px 6px' }}>college_id</code>{' '}
            <code style={{ background: '#dbeafe', borderRadius: '4px', padding: '1px 6px' }}>email</code>{' '}
            &nbsp;|&nbsp; <strong>Optional:</strong> <code style={{ background: '#dbeafe', borderRadius: '4px', padding: '1px 6px' }}>name</code> and any extra fields
            &nbsp;|&nbsp; Duplicates (by uid) are <strong>automatically updated</strong> &nbsp;|&nbsp; Max size: <strong>10 MB</strong>
          </div>

          {/* ── Drag & Drop Zone ── */}
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#3b82f6' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '52px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#eff6ff' : '#f8fafc',
                transition: 'all .2s',
                marginBottom: '20px',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".csv" onChange={onInputChange} style={{ display: 'none' }} />
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: dragging ? '#dbeafe' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                transition: 'background .2s',
              }}>
                <FiUploadCloud size={26} color={dragging ? '#3b82f6' : '#64748b'} />
              </div>
              <p style={{ fontWeight: '700', fontSize: '16px', color: dragging ? '#2563eb' : '#334155', margin: '0 0 6px' }}>
                {dragging ? 'Drop it here!' : 'Drag & drop your CSV file'}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                or <span style={{ color: '#3b82f6', fontWeight: '600' }}>browse to upload</span> — CSV files only (.csv)
              </p>
            </div>
          ) : (
            /* ── File selected card ── */
            <div style={{
              border: '1px solid #bfdbfe', borderRadius: '12px',
              background: '#f0f9ff', padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FiFile size={22} color="#2563eb" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '700', color: '#1e3a5f', fontSize: '15px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  {(file.size / 1024).toFixed(1)} KB
                  {preview && ` · ${fmt(preview.total)} data rows detected`}
                </p>
              </div>
              <button onClick={clearFile} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', padding: '2px',
              }} title="Remove file">
                <FiX size={20} />
              </button>
            </div>
          )}

          {/* ── CSV Preview Table ── */}
          {preview && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Preview (first {Math.min(5, preview.rows.length)} rows of {fmt(preview.total)}):
              </p>
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {preview.headers.map((h, i) => (
                        <th key={i} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri} style={{ borderTop: '1px solid #f1f5f9' }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '8px 14px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Clear-first toggle ── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '20px',
          }}>
            <input
              type="checkbox" id="clearFirst"
              checked={clearFirst} onChange={e => setClearFirst(e.target.checked)}
              style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#d97706', cursor: 'pointer' }}
            />
            <label htmlFor="clearFirst" style={{ cursor: 'pointer', color: '#92400e', fontSize: '13px', lineHeight: '1.5' }}>
              <strong>⚠️ Clear existing records before uploading</strong>
              <span style={{ display: 'block', color: '#b45309', marginTop: '2px' }}>
                All current allowed users will be deleted and replaced with this CSV data.
              </span>
            </label>
          </div>

          {/* ── Upload button ── */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              width: '100%', padding: '13px',
              background: !file || uploading
                ? '#94a3b8'
                : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontWeight: '700', fontSize: '15px',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: !file || uploading ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
              transition: 'all .2s',
            }}
          >
            {uploading ? (
              <>
                <span style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                  borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block',
                }} />
                Processing...
              </>
            ) : (
              <><FiUploadCloud size={18} />Upload & Process CSV</>
            )}
          </button>

          {/* ── Result banner ── */}
          {result && (
            <div style={{
              marginTop: '20px',
              background: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {result.success
                  ? <FiCheckCircle size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
                  : <FiAlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', margin: '0 0 10px', color: result.success ? '#166534' : '#991b1b' }}>
                    {result.message}
                  </p>
                  {result.summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {[
                        { icon: '📄', label: 'Total rows', val: result.summary.total, color: '#1e40af' },
                        { icon: '✅', label: 'Inserted',   val: result.summary.inserted, color: '#166534' },
                        { icon: '🔄', label: 'Updated',    val: result.summary.updated, color: '#92400e' },
                        { icon: '⊘',  label: 'Skipped',    val: result.summary.skipped, color: '#dc2626' },
                      ].map(({ icon, label, val, color }) => (
                        <div key={label} style={{
                          background: '#fff', borderRadius: '8px', padding: '10px 14px',
                          border: '1px solid #e2e8f0',
                        }}>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px' }}>{icon} {label}</p>
                          <p style={{ fontSize: '20px', fontWeight: '800', color, margin: 0 }}>{fmt(val)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.summary?.clearedBeforeInsert && (
                    <p style={{ color: '#92400e', fontSize: '13px', marginTop: '10px', margin: '10px 0 0' }}>
                      🗑️ Collection was cleared before this upload.
                    </p>
                  )}
                  {result.errors?.length > 0 && (
                    <div style={{
                      marginTop: '14px', background: '#fff1f2',
                      border: '1px solid #fecaca', borderRadius: '8px', padding: '12px',
                    }}>
                      <p style={{ fontWeight: '700', color: '#991b1b', fontSize: '13px', margin: '0 0 8px' }}>
                        <FiAlertTriangle size={13} style={{ marginRight: '4px' }} />
                        Row errors ({result.errors.length}):
                      </p>
                      {result.errors.map((err, i) => (
                        <p key={i} style={{ color: '#dc2626', fontSize: '12px', margin: '2px 0' }}>
                          Row {err.row}: {err.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════ ALLOWED USERS TABLE ══════ */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiUsers size={18} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Allowed Users
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                {fmt(auTotal)} total records
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* search */}
            <div style={{ position: 'relative' }}>
              <FiSearch size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text" placeholder="Search..."
                value={auSearch} onChange={e => setAuSearch(e.target.value)}
                style={{
                  paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
                  border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px',
                  outline: 'none', width: '180px', color: '#374151',
                }}
              />
            </div>
            {/* refresh */}
            <button onClick={() => fetchAllowedUsers(auPage)} title="Refresh" style={{
              background: '#f1f5f9', border: 'none', borderRadius: '8px',
              padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              <FiRefreshCw size={16} color="#64748b" />
            </button>
            {/* clear all */}
            {auTotal > 0 && (
              <button onClick={handleClearAll} disabled={clearing} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', borderRadius: '8px', padding: '8px 14px',
                fontSize: '13px', fontWeight: '600', cursor: clearing ? 'not-allowed' : 'pointer',
              }}>
                <FiTrash2 size={14} />
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>
        </div>

        {/* Table body */}
        {auLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <div style={{
              width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6',
              borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px',
            }} />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <FiUsers size={28} color="#94a3b8" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#475569', margin: '0 0 6px' }}>No records found</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {auSearch ? 'Try a different search term.' : 'Upload a CSV file to populate allowed users.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['#', 'Name', 'Email', 'UID', 'College ID', 'Added'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontWeight: '600', color: '#475569', fontSize: '12px',
                      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                      {(auPage - 1) * AU_LIMIT + idx + 1}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>
                      {u.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ background: '#f1f5f9', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', color: '#1e40af' }}>
                        {u.uid}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ background: '#f0fdf4', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', color: '#166534' }}>
                        {u.college_id}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {auPages > 1 && !auSearch && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px', borderTop: '1px solid #f1f5f9',
            fontSize: '13px', color: '#64748b',
          }}>
            <span>
              Showing {(auPage - 1) * AU_LIMIT + 1}–{Math.min(auPage * AU_LIMIT, auTotal)} of {fmt(auTotal)}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fetchAllowedUsers(auPage - 1)}
                disabled={auPage === 1}
                style={{
                  border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px',
                  background: auPage === 1 ? '#f8fafc' : '#fff',
                  cursor: auPage === 1 ? 'default' : 'pointer',
                  color: auPage === 1 ? '#cbd5e1' : '#374151',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <FiChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(auPages, 5) }, (_, i) => {
                const page = i + 1
                return (
                  <button key={page} onClick={() => fetchAllowedUsers(page)} style={{
                    border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px',
                    background: auPage === page ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : '#fff',
                    color: auPage === page ? '#fff' : '#374151',
                    fontWeight: auPage === page ? '700' : '400',
                    cursor: 'pointer', fontSize: '13px',
                  }}>{page}</button>
                )
              })}
              <button
                onClick={() => fetchAllowedUsers(auPage + 1)}
                disabled={auPage === auPages}
                style={{
                  border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px',
                  background: auPage === auPages ? '#f8fafc' : '#fff',
                  cursor: auPage === auPages ? 'default' : 'pointer',
                  color: auPage === auPages ? '#cbd5e1' : '#374151',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default CsvUploadTab
