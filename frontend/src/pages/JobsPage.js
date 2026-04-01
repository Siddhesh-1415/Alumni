import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { FiBriefcase, FiMapPin, FiDollarSign, FiPlus, FiSearch, FiLoader, FiUsers } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config/config'

const JobsPage = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [showPostForm, setShowPostForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    description: '',
    salary: '',
    location: '',
  })

  // ✅ DEFINE ONLY ONCE
  const canPostJob = ['alumni', 'admin'].includes(user?.role)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(`${config.apiBaseUrl}${config.endpoints.jobs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setJobs(response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.role && job.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesLocation = !locationFilter || job.location === locationFilter

    return matchesSearch && matchesLocation
  })

  const locations = [...new Set(jobs.map(job => job.location))]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.jobs}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setJobs([response.data, ...jobs])
      setFormData({
        company: '',
        role: '',
        description: '',
        salary: '',
        location: '',
      })
      setShowPostForm(false)
    } catch (error) {
      console.error('Error posting job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyJob = async (jobId) => {
    setApplyingJobId(jobId)
    try {
      const token = localStorage.getItem('authToken')
      await axios.post(
        `${config.apiBaseUrl}${config.endpoints.jobs}/${jobId}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Error applying to job:', error)
      alert('Error applying to job. Please try again.')
    } finally {
      setApplyingJobId(null)
    }
  }

  const JobCard = ({ job }) => {
    const hasApplied = job.applications?.some(app => app._id === user._id)
    const isPostedByMe = job.posted_by?._id === user._id || job.posted_by === user._id

    return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-6">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{job.role}</h3>
          <p className="text-blue-600 font-semibold mt-1">{job.company}</p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-gray-700">
          <FiDollarSign size={18} className="text-green-600" />
          <span>{job.salary}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-700">
          <FiMapPin size={18} className="text-red-600" />
          <span>{job.location}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">Posted by {job.posted_by?.name || 'Unknown'}</p>
        
        {isPostedByMe ? (
          <button
            onClick={() => navigate(`/jobs/${job._id}/applicants`)}
            className="px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center space-x-2"
          >
            <FiUsers size={16} />
            <span>View Applicants ({job.applications?.length || 0})</span>
          </button>
        ) : (
          <button
            onClick={() => handleApplyJob(job._id)}
            disabled={applyingJobId === job._id || hasApplied}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2 ${
              hasApplied 
                ? 'bg-green-600 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {applyingJobId === job._id ? (
              <>
                <FiLoader size={16} className="animate-spin" />
                <span>Applying...</span>
              </>
            ) : hasApplied ? (
              <span>Applied</span>
            ) : (
              <span>Apply Now</span>
            )}
          </button>
        )}
      </div>
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="lg:ml-64">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="p-4 md:p-8 mt-16 lg:mt-0">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
              <p className="text-gray-600 mt-1">Find and apply to great opportunities</p>
            </div>

            {canPostJob && (
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                <FiPlus size={20} />
                <span>Post Job</span>
              </button>
            )}
          </div>

          {/* Post Form */}
          {showPostForm && canPostJob && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input name="company" placeholder="Company" value={formData.company} onChange={handleChange} required />
                <input name="role" placeholder="Role" value={formData.role} onChange={handleChange} required />
                <input name="salary" placeholder="Salary" value={formData.salary} onChange={handleChange} required />
                <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
                <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />

                <button type="submit" disabled={loading}>
                  {loading ? 'Posting...' : 'Post Job'}
                </button>
              </form>
            </div>
          )}

          {/* Jobs */}
          {loading ? (
            <p>Loading jobs...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          ) : (
            <p>No jobs found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobsPage