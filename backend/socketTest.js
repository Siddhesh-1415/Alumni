// socketTest.js - Simple Node.js Socket.IO client for testing

import io from "socket.io-client"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const socket = io("http://localhost:3000", {
  reconnection: true
})

let currentUserId = null
let targetUserId = null

// Helper function to validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return /^[0-9a-f]{24}$/i.test(id)
}

socket.on("connect", () => {
  console.log("\n✅ Connected to server!")
  console.log("📝 Commands:")
  console.log("  setuser <mongoObjectId>    - Set your user ID")
  console.log("  target <mongoObjectId>     - Set target user for messaging")
  console.log("  send <message>             - Send message to target user")
  console.log("  getusers                   - Get all online users")
  console.log("  status                     - Check connection status")
  console.log("  help                       - Show all commands")
  console.log("  quit                       - Exit\n")
  console.log("💡 Get your ObjectId from the login response or MongoDB Atlas\n")
  
  prompt()
})

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server")
})

socket.on("receive_message", (message) => {
  console.log(`\n📨 NEW MESSAGE from ${message.sender.name}:`)
  console.log(`   ${message.message}`)
  console.log(`   Time: ${new Date(message.createdAt).toLocaleTimeString()}\n`)
  prompt()
})

socket.on("message_sent", (data) => {
  console.log(`✓ Message sent (Status: ${data.status})\n`)
  prompt()
})

socket.on("user_status", (data) => {
  console.log(`\n👥 User Update: ${data.userId} is now ${data.status}`)
  console.log(`   Online users: ${data.activeUsers.join(", ")}\n`)
  prompt()
})

socket.on("user_typing", (data) => {
  console.log(`\n✍️  ${data.userId} is typing...\n`)
})

socket.on("user_stop_typing", (data) => {
  console.log(`   ${data.userId} stopped typing.\n`)
})

socket.on("online_users", (users) => {
  console.log(`\n👥 Online Users: ${users.join(", ")}\n`)
  prompt()
})

socket.on("error", (error) => {
  console.error(`⚠️  Error: ${error}\n`)
  prompt()
})

const prompt = () => {
  rl.question("> ", (input) => {
    const [command, ...args] = input.split(" ")

    switch (command.toLowerCase()) {
      case "setuser":
        if (args[0]) {
          if (!isValidObjectId(args[0])) {
            console.log("❌ Invalid ObjectId format. Must be 24 hex characters.")
            console.log("💡 Example: setuser 69b39af9a908a78f70aafb8f")
          } else {
            currentUserId = args[0]
            console.log(`✓ Your ID set to: ${currentUserId}`)
            socket.emit("user_online", currentUserId)
          }
        } else {
          console.log("❌ Usage: setuser <objectId>")
        }
        prompt()
        break

      case "target":
        if (args[0]) {
          if (!isValidObjectId(args[0])) {
            console.log("❌ Invalid ObjectId format. Must be 24 hex characters.")
          } else {
            targetUserId = args[0]
            console.log(`✓ Target user set to: ${targetUserId}`)
          }
        } else {
          console.log("❌ Usage: target <objectId>")
        }
        prompt()
        break

      case "send":
        if (!currentUserId) {
          console.log("❌ Set your user ID first: setuser <userId>")
        } else if (!targetUserId) {
          console.log("❌ Set target user first: target <userId>")
        } else if (args.length === 0) {
          console.log("❌ Usage: send <message>")
        } else {
          const message = args.join(" ")
          socket.emit("send_message", {
            senderId: currentUserId,
            receiverId: targetUserId,
            message: message
          })
          console.log("📤 Message sent...")
        }
        prompt()
        break

      case "getusers":
        socket.emit("get_online_users")
        break

      case "status":
        console.log(`Connected: ${socket.connected}`)
        console.log(`Your ID: ${currentUserId || "Not set"}`)
        console.log(`Target: ${targetUserId || "Not set"}`)
        prompt()
        break

      case "quit":
        socket.disconnect()
        rl.close()
        process.exit(0)
        break

      case "help":
        console.log("\n📝 Available Commands:")
        console.log("  setuser <objectId>  - Set your user ID (24 hex chars)")
        console.log("  target <objectId>   - Set recipient's ObjectId")
        console.log("  send <message>      - Send a message")
        console.log("  getusers            - List all online users")
        console.log("  status              - Show current connection status")
        console.log("  help                - Show this help information")
        console.log("  quit                - Disconnect and exit\n")
        prompt()
        break

      default:
        console.log("❌ Unknown command. Type 'help' for commands.")
        prompt()
    }
  })
}

console.log("🚀 Socket.IO Test Client")
console.log("📡 Connecting to http://localhost:5000...\n")
