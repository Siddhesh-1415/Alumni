import User from "../models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import AlumniData from "../models/AlumniData.js"


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

        // CHECK IF USER EXISTS IN AUTHORIZED DATABASE (AlumniData)
        const isAuthorized = await AlumniData.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${email}$`, 'i') } },
                { college_id: { $regex: new RegExp(`^${college_id}$`, 'i') } },
                { UID_No_: { $regex: new RegExp(`^${uid}$`, 'i') } },
                { name: { $regex: new RegExp(`^${name}$`, 'i') } }
            ]
        })

        if (!isAuthorized) {
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
            return res.status(400).json({ message: "User already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // CALCULATE ROLE AUTOMATICALLY based on college_id (First 4 digits = Admission Year)
        let calculatedRole = "student"
        const admissionYear = parseInt(college_id.substring(0, 4), 10)
        const currentYear = new Date().getFullYear()

        if (!isNaN(admissionYear)) {
            if (currentYear - admissionYear >= 4) {
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

        // CHECK IF USER EXISTS IN AUTHORIZED DATABASE (AlumniData)
        const isAuthorized = await AlumniData.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${email}$`, 'i') } },
                { college_id: { $regex: new RegExp(`^${college_id}$`, 'i') } },
                { UID_No_: { $regex: new RegExp(`^${uid}$`, 'i') } },
                { name: { $regex: new RegExp(`^${name}$`, 'i') } }
            ]
        })

        if (!isAuthorized) {
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