import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import { FiArrowLeft, FiBriefcase, FiUsers, FiLoader, FiUsers as FiUserGroup } from 'react-icons/fi'
import axios from 'axios'
import config from '../config/config'

const JobApplicantsPage = ({ user, setIsAuthenticated, setUser, notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications }) => {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplicant, setSelectedApplicant] = useState(null)

  useEffect(() => {
    fetchJobApplicants()
  }, [jobId])

  const fetchJobApplicants = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get(
        `${config.apiBaseUrl}${config.endpoints.jobs}/${jobId}/applicants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setJob(response.data)
      setApplicants(response.data.applicants || [])
    } catch (error) {
      console.error('Error fetching applicants:', error)
      if (error.response?.status === 403) {
        alert('You do not have permission to view this job\'s applicants')
      }
    } finally {
      setLoading(false)
    }
  }

  const ApplicantCard = ({ applicant }) => (
    <div
      onClick={() => setSelectedApplicant(selectedApplicant?.email === applicant.email ? null : applicant)}
      className={`bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border-l-4 ${
        selectedApplicant?.email === applicant.email
          ? 'border-l-blue-600 bg-blue-50'
          : 'border-l-gray-200 hover:border-l-blue-400'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <UserAvatar name={applicant.name} imageUrl={applicant.profileImage} />
            <div>
              <h3 className="font-bold text-gray-900">{applicant.name}</h3>
              <p className="text-sm text-gray-600">{applicant.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full capitalize">
              {applicant.role}
            </span>
          </div>
        </div>
      </div>

      {selectedApplicant?.email === applicant.email && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-2">
            <p><span className="font-semibold">Email:</span> {applicant.email}</p>
            <p><span className="font-semibold">Role:</span> <span className="capitalize">{applicant.role}</span></p>
            {applicant.createdAt && (
              <p><span className="font-semibold">Applied:</span> {new Date(applicant.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="lg:ml-64">
        <Navbar user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} deleteNotification={deleteNotification} clearAllNotifications={clearAllNotifications} />

        <div className="p-4 md:p-8 mt-16 lg:mt-0">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              <FiArrowLeft size={20} />
              <span>Back</span>
            </button>

            {job ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{job.jobTitle}</h1>
                    <p className="text-gray-600 mt-2">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-blue-600 text-2xl font-bold">
                      <FiUserGroup size={28} />
                      <span>{job.totalApplicants}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Total Applicants</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Applicants List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FiLoader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading applicants...</p>
              </div>
            </div>
          ) : applicants.length > 0 ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Applicants ({applicants.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applicants.map((applicant) => (
                  <ApplicantCard key={applicant._id || applicant.email} applicant={applicant} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FiBriefcase size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applicants Yet</h3>
              <p className="text-gray-600">No students have applied to this job yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobApplicantsPage
