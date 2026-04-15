import User from "../models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import AlumniData from "../models/AlumniData.js"
import AllowedUser from "../models/AllowedUser.js"
import nodemailer from "nodemailer"
import twilio from "twilio"

// ─── Lazy nodemailer transporter ─────────────────────────────────────────────
const getTransporter = () =>
    nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

// ─── Lazy Twilio client ───────────────────────────────────────────────────────
const getTwilioClient = () =>
    twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

// REGISTER USER

export const registerUser = async (req, res) => {

    try {

        const { name, uid, email, password, college_id } = req.body

        // VALIDATE REQUIRED FIELDS
        if (!name || !uid || !email || !password || !college_id) {
            return res.status(400).json({
                message: "Please provide name, uid, email, password, and college_id"
            })
        }

        // CHECK IF USER IS AUTHORIZED
        // Source 1: Legacy AlumniData collection (old Excel data)
        const inAlumniData = await AlumniData.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${email}$`, 'i') } },
                { college_id: { $regex: new RegExp(`^${college_id}$`, 'i') } },
                { UID_No_: { $regex: new RegExp(`^${uid}$`, 'i') } },
                { name: { $regex: new RegExp(`^${name}$`, 'i') } }
            ]
        })

        // Source 2: New AllowedUser collection (CSV upload)
        const inAllowedUsers = await AllowedUser.findOne({
            $or: [
                { email: email.toLowerCase() },
                { college_id: college_id.trim() },
                { uid: uid.trim() }
            ]
        })

        if (!inAlumniData && !inAllowedUsers) {
            return res.status(403).json({
                message: "You are not authorized to register. Ensure your details match the university records."
            })
        }

        const userExists = await User.findOne({
            $or: [
                { uid },
                { email },
                { college_id }
            ]
        })
        console.log(userExists)


        if (userExists) {
            return res.status(400).json({ message: "User already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // CALCULATE ROLE AUTOMATICALLY based on college_id (First 4 digits = Admission Year)
        let calculatedRole = "student"
        const admissionYear = parseInt(college_id.substring(0, 4), 10)
        const currentYear = new Date().getFullYear()

        if (!isNaN(admissionYear)) {
            if (currentYear - admissionYear > 4) {
                calculatedRole = "alumni"
            }
        }

        const user = await User.create({
            name,
            uid,
            email,
            password: hashedPassword,
            college_id,
            role: calculatedRole
        })

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                uid: user.uid,
                email: user.email,
                college_id: user.college_id,
                role: user.role
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}


// LOGIN USER

export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({
            email
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        console.log(password, user.password)
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            token,
            user
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }


}

export const searchAlumni = async (req, res) => {
    try {
        const { query } = req.query
        const users = await User.find({
            role: { $in: ["alumni", "student"] },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { company: { $regex: query, $options: 'i' } },
                { branch: { $regex: query, $options: 'i' } }
            ]
        }).select('-password')
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getAllAlumni = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ["alumni", "student"] } }).select('-password')
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const registerOldAlumni = async (req, res) => {

    try {

        const { name, uid, email, password, college_id } = req.body

        // VALIDATE REQUIRED FIELDS
        if (!name || !uid || !email || !password || !college_id) {
            return res.status(400).json({
                message: "Please provide name, uid, email, password, and college_id"
            })
        }

        // CHECK USER ALREADY EXISTS

        // CHECK IF USER IS AUTHORIZED
        // Source 1: Legacy AlumniData collection (old Excel data)
        const inAlumniData = await AlumniData.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${email}$`, 'i') } },
                { college_id: { $regex: new RegExp(`^${college_id}$`, 'i') } },
                { UID_No_: { $regex: new RegExp(`^${uid}$`, 'i') } },
                { name: { $regex: new RegExp(`^${name}$`, 'i') } }
            ]
        })

        // Source 2: New AllowedUser collection (CSV upload)
        const inAllowedUsers = await AllowedUser.findOne({
            $or: [
                { email: email.toLowerCase() },
                { college_id: college_id.trim() },
                { uid: uid.trim() }
            ]
        })

        if (!inAlumniData && !inAllowedUsers) {
            return res.status(403).json({
                message: "You are not authorized to register. Ensure your details match the university records."
            })
        }

        const userExists = await User.findOne({
            $or: [
                { uid },
                { email },
                { college_id }
            ]
        })

        if (userExists) {
            return res.status(400).json({
                message: "User already registered"
            })
        }

        // HASH PASSWORD

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // CREATE ACCOUNT

        const user = await User.create({
            name,
            uid,
            email,
            password: hashedPassword,
            college_id,
            role: "alumni"
        })

        res.status(201).json({
            message: "Old alumni registered successfully",
            user: {
                id: user._id,
                name: user.name,
                uid: user.uid,
                email: user.email,
                college_id: user.college_id,
                role: user.role
            }
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}


// GET PROFILE
export const getProfile = async (req, res) => {

    try {

        const user = await User.findById(req.user._id).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json(user)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}

// UPDATE PROFILE
export const updateProfile = async (req, res) => {

    try {

        const { name, bio, linkedin, company, job_role, location, profile_pic } = req.body

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                name: name || req.user.name,
                bio: bio || req.user.bio,
                linkedin: linkedin || req.user.linkedin,
                company: company || req.user.company,
                job_role: job_role || req.user.job_role,
                location: location || req.user.location,
                profile_pic: profile_pic || req.user.profile_pic
            },
            { new: true }
        ).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json({
            message: "Profile updated successfully",
            user
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}


// ─── FORGOT PASSWORD: STEP 1 – Send OTP ─────────────────────────────────────

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: "Email is required" })

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user) return res.status(404).json({ message: "No account found with this email" })

        const otp = generateOtp()
        const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

        user.resetOtp = otp
        user.resetOtpExpiry = expiry
        await user.save()

        await getTransporter().sendMail({
            from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔐 Password Reset OTP – Alumni Portal",
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                    <h2 style="color:#2563eb;margin-bottom:8px;">Password Reset Request</h2>
                    <p style="color:#475569;margin-bottom:24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
                    <div style="background:#1e293b;color:#f1f5f9;font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:20px 32px;border-radius:8px;margin-bottom:24px;">
                        ${otp}
                    </div>
                    <p style="color:#94a3b8;font-size:13px;">If you didn't request this, please ignore this email. Your account is safe.</p>
                </div>
            `
        })

        res.json({ message: "OTP sent to your email" })
    } catch (error) {
        console.error("sendOtp error:", error)
        res.status(500).json({ message: "Failed to send OTP. Check email configuration." })
    }
}


// ─── FORGOT PASSWORD: STEP 2 – Verify OTP (email OR phone) ──────────────────

export const verifyOtp = async (req, res) => {
    try {
        const { email, phone, otp } = req.body
        if ((!email && !phone) || !otp) {
            return res.status(400).json({ message: "Email or phone, and OTP are required" })
        }

        const query = email
            ? { email: email.toLowerCase().trim() }
            : { phone: phone.trim() }

        const user = await User.findOne(query)
        if (!user) return res.status(404).json({ message: "User not found" })

        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" })
        }

        if (new Date() > user.resetOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." })
        }

        res.json({ message: "OTP verified. You may now reset your password." })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


// ─── FORGOT PASSWORD: STEP 3 – Reset Password (email OR phone) ───────────────

export const resetPassword = async (req, res) => {
    try {
        const { email, phone, otp, newPassword } = req.body
        if ((!email && !phone) || !otp || !newPassword) {
            return res.status(400).json({ message: "Identifier, OTP and new password are required" })
        }

        const query = email
            ? { email: email.toLowerCase().trim() }
            : { phone: phone.trim() }

        const user = await User.findOne(query)
        if (!user) return res.status(404).json({ message: "User not found" })

        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" })
        }

        if (new Date() > user.resetOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(newPassword, salt)
        user.resetOtp = null
        user.resetOtpExpiry = null
        await user.save()

        res.json({ message: "Password reset successfully. You can now log in." })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


// ─── FORGOT PASSWORD: PHONE OTP – Send SMS via Twilio ────────────────────────

export const sendPhoneOtp = async (req, res) => {
    try {
        const { phone } = req.body
        if (!phone) return res.status(400).json({ message: "Phone number is required" })

        // Normalize: ensure +91 country code for India if not present
        const normalized = phone.trim().startsWith('+')
            ? phone.trim()
            : `+91${phone.trim().replace(/^0/, '')}`

        const user = await User.findOne({ phone: normalized })
        if (!user) {
            return res.status(404).json({
                message: "No account found with this phone number. Please ensure your phone is saved in your profile."
            })
        }

        const otp = generateOtp()
        const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

        user.resetOtp = otp
        user.resetOtpExpiry = expiry
        await user.save()

        await getTwilioClient().messages.create({
            body: `Your Alumni Portal password reset OTP is: ${otp}\nValid for 10 minutes. Do not share this with anyone.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: normalized,
        })

        res.json({ message: "OTP sent to your mobile number", phone: normalized })
    } catch (error) {
        console.error("sendPhoneOtp error:", error)
        res.status(500).json({ message: "Failed to send SMS OTP. Check Twilio configuration." })
    }
}