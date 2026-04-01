import mongoose from "mongoose"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import User from "./models/User.js"

dotenv.config()

mongoose.connect(process.env.MONGO_URI)

const createAdmin = async () => {

    try {

        // Check if admin exists
        const existingAdmin = await User.findOne({ role: "admin" })
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("123", 10)

            const admin = new User({
                uid: "admin001",
                college_id: "ADMIN001",
                name: "Super Admin",
                email: "admin@admin.com",
                password: hashedPassword,
                role: "admin"
            })

            await admin.save()
            console.log("Admin created")
        } else {
            console.log("Admin already exists")
        }

        // Check if sample alumni exist
        const existingAlumni = await User.findOne({ role: "alumni" })
        if (!existingAlumni) {
            // Create sample alumni
            const alumniData = [
                {
                    uid: "alumni001",
                    college_id: "CS001",
                    name: "Rajesh Kumar",
                    email: "rajesh@gmail.com",
                    password: await bcrypt.hash("password123", 10),
                    role: "alumni",
                    branch: "Computer Science",
                    passout_year: 2020,
                    company: "Google",
                    job_role: "Senior Software Engineer",
                    location: "Mountain View, USA"
                },
                {
                    uid: "alumni002",
                    college_id: "CS002",
                    name: "Priya Singh",
                    email: "priya@gmail.com",
                    password: await bcrypt.hash("password123", 10),
                    role: "alumni",
                    branch: "Computer Science",
                    passout_year: 2019,
                    company: "Microsoft",
                    job_role: "Product Manager",
                    location: "Seattle, USA"
                },
                {
                    uid: "alumni003",
                    college_id: "EC001",
                    name: "Amit Patel",
                    email: "amit@gmail.com",
                    password: await bcrypt.hash("password123", 10),
                    role: "alumni",
                    branch: "Electronics",
                    passout_year: 2021,
                    company: "Amazon",
                    job_role: "Data Scientist",
                    location: "Bangalore, India"
                }
            ]

            for (const data of alumniData) {
                const alumni = new User(data)
                await alumni.save()
            }
            console.log("Sample alumni created")
        } else {
            console.log("Sample alumni already exist")
        }

        console.log("Seeding completed successfully")
        process.exit()

    } catch (error) {

        console.log(error)
        process.exit()

    }

}

createAdmin()