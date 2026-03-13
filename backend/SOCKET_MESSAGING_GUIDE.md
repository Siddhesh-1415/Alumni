# 📱 Real-Time Socket Messaging Service

A production-ready WebSocket-based messaging system for your Alumni Portal with real-time delivery, read receipts, typing indicators, and online status.

## ✨ Features

- ✅ **Real-time messaging** - Instant message delivery using Socket.IO
- ✅ **Message persistence** - All messages saved to MongoDB
- ✅ **Read receipts** - See when messages are read
- ✅ **Typing indicators** - Know when someone is typing
- ✅ **Online status** - Track who's online/offline
- ✅ **Message delivery status** - Pending/Delivered indicators
- ✅ **Efficient targeting** - Messages only sent to intended recipient

---

## 🏗️ Architecture

### Backend Structure
```
backend/
├── socket/
│   └── messageSocket.js          # Socket.IO handlers
├── models/
│   └── Message.js                # Message schema with read status
├── controllers/
│   └── messageController.js       # REST API endpoints
├── routes/
│   └── messageRoutes.js           # Message routes
└── index.js                       # Main server with Socket.IO setup
```

---

## 🔧 Socket Events

### **Client → Server Events**

#### 1. User comes online
```javascript
socket.emit("user_online", userId)
```

#### 2. Send message
```javascript
socket.emit("send_message", {
  senderId: "user123",
  receiverId: "user456",
  message: "Hello!"
})
```

#### 3. Mark message as read
```javascript
socket.emit("mark_as_read", {
  messageId: "msg123",
  userId: "user123"
})
```

#### 4. Typing indicator (start)
```javascript
socket.emit("typing", {
  senderId: "user123",
  receiverId: "user456"
})
```

#### 5. Typing indicator (stop)
```javascript
socket.emit("stop_typing", {
  senderId: "user123",
  receiverId: "user456"
})
```

#### 6. Get all online users
```javascript
socket.emit("get_online_users")
```

---

### **Server → Client Events**

#### 1. User status changed
```javascript
socket.on("user_status", (data) => {
  // data = { userId, status: "online|offline", activeUsers: [...] }
})
```

#### 2. Message received
```javascript
socket.on("receive_message", (message) => {
  // message = { _id, sender, receiver, message, createdAt, read }
})
```

#### 3. Message sent confirmation
```javascript
socket.on("message_sent", (data) => {
  // data = { _id, status: "delivered|pending", createdAt }
})
```

#### 4. Message read confirmation
```javascript
socket.on("message_read", (data) => {
  // data = { messageId, readBy: userId }
})
```

#### 5. User is typing
```javascript
socket.on("user_typing", (data) => {
  // data = { userId }
})
```

#### 6. User stopped typing
```javascript
socket.on("user_stop_typing", (data) => {
  // data = { userId }
})
```

#### 7. Online users list
```javascript
socket.on("online_users", (userIds) => {
  // userIds = ["user123", "user456", ...]
})
```

---

## 📦 Installation

### 1. Install Socket.IO client (Frontend)
```bash
npm install socket.io-client
```

### 2. Backend is ready (Socket.IO already installed)

---

## 🚀 Frontend Implementation

### Step 1: Initialize Socket Connection (React/Vue)

```javascript
import { initializeSocket, onMessageReceived, onUserStatus } from './messageSocket'

// On app load or user login
useEffect(() => {
  const userId = localStorage.getItem('userId')
  initializeSocket(userId)

  // Listen for messages
  onMessageReceived((message) => {
    console.log("New message:", message)
    setMessages(prev => [...prev, message])
  })

  // Listen for user status
  onUserStatus((data) => {
    setOnlineUsers(data.activeUsers)
  })
}, [])
```

### Step 2: Send a Message

```javascript
import { sendMessage, markMessageAsRead } from './messageSocket'

const handleSendMessage = (receiverId, messageText) => {
  const senderId = localStorage.getItem('userId')
  sendMessage(senderId, receiverId, messageText)
}
```

### Step 3: Show Online Status

```javascript
import { onUserStatus } from './messageSocket'

onUserStatus(({ userId, status, activeUsers }) => {
  // userId came online/offline
  // activeUsers = list of all online user IDs
  
  if (status === "online") {
    console.log(`${userId} is online`)
  } else {
    console.log(`${userId} went offline`)
  }
})
```

### Step 4: Show Typing Indicator

```javascript
import { startTyping, stopTyping, onUserTyping } from './messageSocket'

// When user starts typing
const handleInputChange = (text) => {
  startTyping(currentUserId, selectedUserId)
}

// Listen for typing
onUserTyping(({ userId }) => {
  if (userId === selectedUserId) {
    showTypingIndicator()
  }
})
```

---

## 📊 Complete React Example

See `frontend_example/ChatComponent.jsx` for a full working example with:
- Real-time message display
- Typing indicators
- Online/offline status
- Message delivery status
- Auto-scroll to latest message

---

## 🔗 REST API Endpoints (Fallback)

### Get chat history
```bash
GET /api/messages/:userId
Authorization: Bearer <token>
```

### Send message (REST)
```bash
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiver": "userId456",
  "message": "Hello!"
}
```

---

## 📱 Message Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  sender: ObjectId (refs User),
  receiver: ObjectId (refs User),
  message: String,
  read: Boolean,
  attachment_url: String,
  attachment_type: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🧪 Testing with Postman/Insomnia

### WebSocket Testing with Socket.IO Client

1. Install: `npm install -g socketio-client`
2. Connect:
   ```bash
   socketio-client http://localhost:5000
   ```
3. Send event:
   ```
   > {"emit":"user_online","args":["user123"]}
   ```

---

## ⚡ Performance Tips

1. **Message Batching**: Group messages before sending (every 100ms)
2. **Connection Pooling**: Reuse socket connections
3. **Lazy Load History**: Load message history on demand
4. **Compress Messages**: Minify message payloads
5. **Unsubscribe Events**: Remove listeners when component unmounts

---

## 🔒 Security Considerations

- ✅ Auth middleware validates JWT tokens
- ✅ Messages persist to DB (recovery on disconnect)
- ✅ Efficient targeting (messages only to receiver)
- ⚠️ TODO: Add rate limiting to prevent spam
- ⚠️ TODO: Encrypt messages end-to-end
- ⚠️ TODO: Add message expiration

---

## 🐛 Debugging

### Enable Socket logging
```javascript
const socket = io("http://localhost:5000", {
  debug: true
})
```

### Check active connections
```javascript
// In browser console
socket.on("connect", () => console.log("Connected"))
socket.on("disconnect", () => console.log("Disconnected"))
```

### View server logs
```
✅ User connected: abc123xyz...
👤 Online users: user123, user456, user789
📨 Message: user123 → user456
👋 User offline: user123
```

---

## 📝 Example Usage Flow

```
1. User A logs in
   └─ emit "user_online" with userId
   └─ Server adds to activeUsers map

2. User A opens chat with User B
   └─ displays online status (if User B is in activeUsers)

3. User A types message
   └─ emit "typing" to notify User B
   └─ User B sees "User A is typing..."

4. User A sends message "Hello"
   └─ emit "send_message" with message
   └─ Server saves to MongoDB
   └─ Server emits "receive_message" to User B
   └─ Server emits "message_sent" to User A (status: delivered)

5. User B receives & marks message as read
   └─ emit "mark_as_read"
   └─ Server updates message.read = true
   └─ Server emits "message_read" to User A
   └─ User A sees double checkmark ✓✓

6. User A logs out
   └─ emit "disconnect"
   └─ Server removes from activeUsers
   └─ All users notified (user_status event)
```

---

## 🔄 Error Handling

All errors are caught and emitted as:
```javascript
socket.on("message_error", (error) => {
  console.error(error.error)
})
```

---

## 📞 Support

For issues or questions, check:
1. Browser console for client errors
2. Server terminal for backend logs
3. Network tab for WebSocket connection status

---

**Your Alumni Portal now has a bulletproof real-time messaging system! 🎉**
