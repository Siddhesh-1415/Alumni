# 🎓 Alumni Portal - React Frontend Setup Guide

## 📋 Project Structure

```
Alumni/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── socket/
│   ├── package.json
│   └── index.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   └── Navbar.js
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── Dashboard.js
    │   │   ├── ProfilePage.js
    │   │   ├── AlumniDirectory.js
    │   │   ├── JobsPage.js
    │   │   ├── EventsPage.js
    │   │   └── ChatPage.js
    │   ├── styles/
    │   │   └── index.css
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Installation & Setup

### Step 1: Install Node.js (if not already installed)
```bash
# Download from https://nodejs.org/
# LTS version recommended
```

### Step 2: Install Frontend Dependencies
```bash
cd Alumni/frontend
npm install
```

### Step 3: Start Frontend Development Server
```bash
npm start
```

The frontend will open at `http://localhost:3000`

---

## 🔧 Configuration

### Backend URL
Update the API base URL if your backend runs on a different port:

**File**: `src/App.js` and all page files

Change:
```javascript
'http://localhost:3000/api/...'
```

To your backend URL if different.

---

## 📱 Available Pages & Features

### 1. **Login Page** (`/login`)
- Email and password fields
- Modern gradient background
- Demo credentials: `demo@example.com` / `password123`
- Remember me checkbox
- Link to registration

### 2. **Register Page** (`/register`)
- Two registration paths:
  - College Student (with College ID)
  - Old Alumni (no College ID)
- Form validation
- Password visibility toggle

### 3. **Dashboard** (`/dashboard`)
- Welcome message
- 4 stat cards (Total Alumni, Jobs, Events, Connections)
- Recent activity feed
- Quick action links
- Responsive grid layout

### 4. **My Profile** (`/profile`)
- View user profile information
- Edit profile modal
- All profile fields editable
- Profile avatar with initial
- Read-only fields (email, passout year)

### 5. **Alumni Directory** (`/alumni`)
- Search by name or company
- Filter by branch
- Alumni cards with hover effects
- Message button for each alumnus
- Responsive grid (1-4 columns)

### 6. **Jobs** (`/jobs`)
- Browse job listings
- Job cards with salary and location
- Post Job feature (for alumni/admin)
- Apply button for each job
- Date posted badge

### 7. **Events** (`/events`)
- Upcoming events listing
- Event cards with date badges
- Create Event feature (admin only)
- Event status (Upcoming/Past)
- Location and time information

### 8. **Chat** (`/chat`)
- WhatsApp-style messaging interface
- Left panel: Conversation list with search
- Right panel: Chat messages
- Message bubbles (sent/received)
- Online status indicator
- Typing indicator animation
- Message timestamps

---

## 🎨 Design Features

### Color Palette
- **Primary**: Blue (#2563eb)
- **Secondary**: Dark Blue (#1e40af)
- **Accent**: Cyan (#0ea5e9)
- **Danger**: Red
- **Success**: Green
- **Warning**: Orange
- **Info**: Purple

### Components Used
- **Sidebar**: Fixed navigation with collapsible mobile menu
- **Navbar**: Top bar with search and user profile
- **Cards**: Stat cards, job cards, alumni cards, event cards
- **Forms**: Login, registration, profile edit, job post, event create
- **Messages**: Chat bubbles with timestamps

### Responsive Design
- Desktop: Full layout with sidebar and navbar
- Tablet: Collapsible sidebar
- Mobile: Full-screen sidebar with overlay

---

## 🔌 Socket.IO Integration

The chat page uses Socket.IO for real-time messaging:

```javascript
import io from 'socket.io-client'

socket = io('http://localhost:3000')
socket.emit('user_online', userId)
socket.emit('send_message', { senderId, receiverId, message })
socket.on('receive_message', (message) => { ... })
```

**Events Used:**
- `user_online`: User comes online
- `send_message`: Send a message
- `receive_message`: Receive a message
- `typing`: User is typing
- `user_status`: User status changed

---

## 📦 Dependencies

### Main Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2",
  "socket.io-client": "^4.8.3",
  "react-icons": "^4.12.0",
  "tailwindcss": "^3.4.1"
}
```

### What Each Does:
- **React**: UI library
- **React Router**: Page navigation
- **Axios**: HTTP requests to backend
- **Socket.IO Client**: Real-time messaging
- **React Icons**: Icon library
- **Tailwind CSS**: Utility-first styling

---

## 🧪 Testing

### Test Workflow:

```bash
# Terminal 1: Start Backend
cd Alumni/backend
npm start
# Runs on http://localhost:3000

# Terminal 2: Start Frontend
cd Alumni/frontend
npm start
# Runs on http://localhost:3000

# Test in Browser
1. Go to http://localhost:3000
2. Click "Register here" on login page
3. Choose "College Student" path
4. Fill in form and submit
5. Try different pages: Dashboard, Profile, Jobs, Events, Chat
6. Test chat with another user (open in another browser tab)
```

---

## 🔐 Authentication

Authentication uses **JWT tokens** stored in localStorage:

```javascript
// Login stores:
localStorage.setItem('authToken', token)
localStorage.setItem('user', JSON.stringify(user))

// Used in all API requests:
headers: { Authorization: `Bearer ${token}` }

// Logout:
localStorage.removeItem('authToken')
localStorage.removeItem('user')
```

---

## 🐛 Troubleshooting

### Issue: Cannot connect to backend
```
Solution: Ensure backend is running on port 5000
$ cd backend && npm start
```

### Issue: Tailwind CSS not working
```
Solution: Make sure index.css is imported in index.js
Import: import './styles/index.css'
```

### Issue: Socket.IO not working in chat
```
Solution: Check backend Socket.IO is initialized
Backend: npm install socket.io
Message: Check browser console for connection logs
```

### Issue: Images/avatars not loading
```
Solution: Currently using initials instead of images
To add real avatars:
1. Add profile_pic_url to User model
2. Upload images to cloud storage (AWS S3, Cloudinary)
3. Update image URLs in components
```

---

## 📝 Customization Guide

### Change Primary Color
**File**: `tailwind.config.js`
```javascript
colors: {
  primary: '#YOUR_COLOR',
}
```

### Change Sidebar Background
**File**: `src/components/Sidebar.js`
```javascript
className="bg-gradient-to-b from-YOUR_COLOR to-YOUR_COLOR"
```

### Add New Page
1. Create file in `src/pages/YourPage.js`
2. Import in `src/App.js`
3. Add route: `<Route path="/yourpage" element={<YourPage />} />`
4. Add menu item in Sidebar

### Add Avatar Images
Replace avatar divs with:
```javascript
<img 
  src={user?.profile_pic || '/default-avatar.png'} 
  alt="Avatar"
  className="w-10 h-10 rounded-full object-cover"
/>
```

---

## 🚢 Deployment

### Deploy Frontend (Vercel/Netlify)

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Netlify:**
```bash
# Build production
npm run build

# Deploy 'build' folder to Netlify
```

### Build Production
```bash
npm run build
# Creates optimized bundle in 'build' folder
```

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [React Router Docs](https://reactrouter.com)
- [Socket.IO Client Docs](https://socket.io/docs/client-api/)
- [Axios Docs](https://axios-http.com)

---

## ✨ Features Checklist

- ✅ Login & Registration (Both paths)
- ✅ Dashboard with stats
- ✅ User Profile (View & Edit)
- ✅ Alumni Directory (Search & Filter)
- ✅ Job Listings & Posting
- ✅ Events (View & Create)
- ✅ Real-time Chat
- ✅ Responsive Design
- ✅ Authentication (JWT)
- ✅ Modern UI with Tailwind CSS
- ✅ Socket.IO Integration
- ✅ Role-based Access Control

---

## 🎯 Next Steps

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd frontend && npm start`
3. **Test Login**: Use demo credentials
4. **Explore Features**: Try all pages
5. **Test Chat**: Open 2 browser tabs and chat
6. **Customize**: Change colors, add features
7. **Deploy**: Follow deployment instructions

---

**Your Professional Alumni Portal is Ready! 🎉**

Questions? Refer to individual component files for detailed implementation.
