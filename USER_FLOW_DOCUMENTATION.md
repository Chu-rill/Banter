# Banter - User Flow Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication Flows](#authentication-flows)
4. [User Profile & Settings](#user-profile--settings)
5. [Friend System](#friend-system)
6. [Messaging Features](#messaging-features)
7. [Room Management](#room-management)
8. [Video & Voice Calls](#video--voice-calls)
9. [File Sharing](#file-sharing)
10. [Notifications](#notifications)
11. [Complete User Journey Examples](#complete-user-journey-examples)

---

## Introduction

**Banter** is a modern, full-stack real-time communication platform that enables users to engage in instant messaging, HD video/voice calls, file sharing, and collaborative room management. This document provides detailed user flows explaining how to use every feature of the application.

### Tech Stack Overview
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS with Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO (WebSockets)
- **Authentication**: JWT + Google OAuth 2.0

### Access Points
- **Application URL**: `http://localhost:3000` (Development)
- **API Endpoint**: `http://localhost:5000/api/v1`
- **API Documentation**: `http://localhost:5000/api` (Swagger)

---

## Getting Started

### 1. Landing Page

When you first visit Banter, you'll see the landing page with:
- Application overview and features
- "Get Started" button
- "Sign In" button for existing users
- Theme toggle (Dark/Light mode)

**Actions Available:**
- Click **"Get Started"** → Takes you to Registration page
- Click **"Sign In"** → Takes you to Login page
- Toggle **Theme** → Switch between dark and light mode

---

## Authentication Flows

### 2. User Registration

**How to Register:**

1. **Navigate to Registration**
   - Click "Get Started" from landing page
   - Or visit `/register` directly

2. **Fill Out the Registration Form**
   - **Username**: 3-20 characters, alphanumeric and underscores only
   - **Email**: Valid email address
   - **Password**: Minimum 8 characters, must include:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
   - **Confirm Password**: Must match the password

3. **Password Strength Indicator**
   - As you type, you'll see a real-time strength indicator:
     - Very Weak (red)
     - Weak (orange)
     - Fair (yellow)
     - Strong (light green)
     - Very Strong (dark green)

4. **Submit Registration**
   - Click "Sign Up" button
   - System validates your input
   - If successful, you're redirected to the email verification page

5. **Email Verification Page** (`/check-email`)
   - You'll see a message: "Check your email"
   - Instructions to verify your email address
   - The email address you registered with is displayed
   - "Resend Email" button (available after 60-second cooldown)
   - "Back to Login" link

**What Happens Behind the Scenes:**
- Password is securely hashed before storage
- Verification email is sent to your email address
- Verification token is generated with expiration (24 hours)
- User account is created but not yet verified

**Key Files:**
- Registration Form: `client/src/app/register/page.tsx`
- Email Check Page: `client/src/app/check-email/page.tsx`

---

### 3. Email Verification

**How to Verify Your Email:**

1. **Check Your Email Inbox**
   - Look for email from Banter
   - Subject: "Verify your email address"
   - Check spam folder if not found

2. **Click Verification Link**
   - Email contains a verification link
   - Link format: `https://localhost:3000/verify-email?token=<TOKEN>&refreshToken=<REFRESH_TOKEN>`
   - Clicking opens the verification page

3. **Automatic Verification** (`/verify-email`)
   - Page automatically processes the token
   - Shows "Verifying your email..." message
   - On success:
     - You're automatically logged in
     - Redirected to `/chat` (main chat interface)
   - On failure:
     - Error message displayed
     - Option to resend verification email

4. **If Token Expired**
   - Return to `/check-email` page
   - Click "Resend Email" button
   - New verification email sent
   - Wait for new email and repeat process

**Key Files:**
- Verification Page: `client/src/app/verify-email/page.tsx`
- Auth Context: `client/src/contexts/AuthContext.tsx`

---

### 4. User Login

**How to Log In:**

1. **Navigate to Login**
   - Click "Sign In" from landing page
   - Or visit `/login` directly

2. **Enter Credentials**
   - **Email**: Your registered email address
   - **Password**: Your account password
   - Toggle password visibility with eye icon

3. **Submit Login**
   - Click "Sign In" button
   - System validates credentials
   - On success: Redirected to `/chat`
   - On failure: Error message displayed

4. **Alternative: Google OAuth**
   - Click "Sign in with Google" button
   - Redirected to Google consent screen
   - Authorize Banter to access your Google account
   - Automatically logged in and redirected to `/chat`

**Additional Options:**
- **"Forgot Password?"** link → Password reset flow
- **"Don't have an account? Sign up"** → Registration page

**What Happens Behind the Scenes:**
- Credentials validated against database
- JWT access token and refresh token generated
- Tokens stored in browser localStorage
- User data cached locally
- WebSocket connections established

**Key Files:**
- Login Page: `client/src/app/login/page.tsx`
- Google OAuth Button: Component in login page
- OAuth Redirect: `client/src/app/oauth-redirect/page.tsx`

---

### 5. Forgot Password & Password Reset

**How to Reset Your Password:**

**Step 1: Request Password Reset**

1. **Navigate to Forgot Password**
   - Click "Forgot Password?" from login page
   - Or visit `/forgot-password` directly

2. **Enter Email Address**
   - Type your registered email
   - Click "Send Reset Link"

3. **Confirmation**
   - Success message displayed
   - Check email for reset link
   - Rate limited: Max 3 requests per 15 minutes

**Step 2: Reset Password**

4. **Check Email**
   - Look for "Password Reset" email
   - Click the reset link
   - Link format: `/reset-password?token=<TOKEN>`

5. **Enter New Password** (`/reset-password`)
   - **New Password**: Same requirements as registration
   - **Confirm Password**: Must match
   - Password strength indicator shown
   - Click "Reset Password"

6. **Success**
   - Password updated in database
   - Confirmation message displayed
   - Redirected to login page
   - Log in with new password

**Security Notes:**
- Reset tokens expire after 1 hour
- Tokens are single-use only
- Old password immediately invalidated
- Rate limiting prevents abuse

**Key Files:**
- Forgot Password: `client/src/app/forgot-password/page.tsx`
- Reset Password: `client/src/app/reset-password/page.tsx`

---

## User Profile & Settings

### 6. Viewing & Editing Your Profile

**How to Access Your Profile:**

1. **From Chat Interface**
   - Look at top of sidebar
   - You'll see your profile section with:
     - Avatar image
     - Username
     - Online status indicator (green dot)

2. **View Profile Details**
   - Click on your profile area
   - Profile modal/panel opens showing:
     - Profile picture
     - Username
     - Email address
     - Bio (if set)
     - Account creation date
     - Online status

**How to Edit Your Profile:**

1. **Open Profile Editor**
   - Click "Edit Profile" button in profile view
   - Or access through settings

2. **Editable Fields:**
   - **Avatar/Profile Picture**:
     - Click on current avatar
     - Upload new image (JPG, PNG, GIF)
     - Image automatically resized and optimized

   - **Username**:
     - Must be unique
     - 3-20 characters
     - Alphanumeric and underscores only

   - **Bio**:
     - Optional description
     - Max 500 characters
     - Displayed on your profile

   - **Email**:
     - Cannot be changed (requires re-verification)
     - Contact support if needed

3. **Save Changes**
   - Click "Save" button
   - Changes immediately reflected
   - Profile updated across all user interactions

**Key Components:**
- User Profile: `client/src/components/user/UserProfile.tsx`
- User Details: `client/src/components/user/UserDetails.tsx`

---

### 7. Theme Customization

**How to Change Theme:**

1. **Quick Toggle**
   - **In Sidebar**: Click moon/sun icon at bottom
   - **In Navbar**: Theme toggle button
   - Instantly switches between dark and light mode

2. **Advanced Theme Customization**
   - Open Theme Customizer (if available)
   - Customize:
     - Accent colors
     - Background colors
     - Text colors
     - Border colors
   - Changes saved to localStorage
   - Applied immediately across entire app

**Theme Persistence:**
- Your theme preference is saved
- Automatically applied on next visit
- Syncs across browser tabs

**Key Components:**
- Theme Customizer: `client/src/components/ui/ThemeCustomizer.tsx`
- Theme toggle in ChatSidebar and navigation

---

## Friend System

### 8. Finding & Adding Friends

**How to Search for Users:**

1. **Navigate to Friends Tab**
   - In chat sidebar, click "Friends" tab
   - Search bar appears at top

2. **Search for Users**
   - Type username or email in search field
   - Results appear as you type (autocomplete)
   - Shows matching users with:
     - Profile picture
     - Username
     - Online status

**How to Send Friend Request:**

1. **From Search Results**
   - Click on user you want to add
   - User details panel opens
   - Click "Add Friend" button

2. **Request Sent**
   - Button changes to "Request Sent"
   - Notification sent to recipient
   - Request appears in your "Sent Requests" section

**Key Features:**
- Search is case-insensitive
- Shows online/offline status
- Can't send duplicate requests
- Can cancel pending requests

**Key Components:**
- Friends Panel: `client/src/components/user/Friends/FriendsPanel.tsx`
- Friends Tabs: `client/src/components/user/Friends/FriendsTabs.tsx`
- API: `client/src/lib/api/friendApi.ts`

---

### 9. Managing Friend Requests

**How to View Friend Requests:**

1. **Navigate to Requests Tab**
   - In Friends panel, click "Requests" tab
   - See two sections:
     - **Received**: Requests sent to you
     - **Sent**: Requests you've sent

**How to Accept Friend Request:**

1. **View Received Requests**
   - Each request shows:
     - Requester's profile picture
     - Username
     - Time sent
     - Accept/Decline buttons

2. **Accept Request**
   - Click "Accept" button
   - Friendship status changes to "ACCEPTED"
   - Both users added to each other's friends list
   - Both receive notification
   - Can now:
     - Send direct messages
     - Make voice/video calls
     - See online status

**How to Decline Friend Request:**

1. **Click "Decline" button**
   - Request removed from list
   - Requester not notified (privacy)
   - Can send new request later if desired

**How to Cancel Sent Request:**

1. **View Sent Requests**
   - Click "Sent" sub-tab
   - Find request you want to cancel
   - Click "Cancel" button
   - Request removed
   - Recipient's request disappears

**Friend Statuses:**
- **PENDING**: Request awaiting response
- **ACCEPTED**: Active friendship
- **DECLINED**: Request rejected
- **BLOCKED**: User blocked (advanced feature)

---

### 10. Viewing & Managing Friends

**How to View Friends List:**

1. **Navigate to Friends Tab**
   - Default view shows all accepted friends
   - Each friend card displays:
     - Profile picture
     - Username
     - Online status (green = online, gray = offline)
     - Last seen time (if offline)

2. **Friend Actions**
   - **Click friend card**: Opens direct message chat
   - **View profile**: Click info icon or right-click
   - **Remove friend**: Click remove/unfriend button

**How to Remove a Friend:**

1. **Open Friend Options**
   - Click three dots (⋯) on friend card
   - Or right-click friend

2. **Select "Remove Friend"**
   - Confirmation dialog appears
   - Confirm removal
   - Friendship deleted
   - Both users notified (optional)
   - Direct message history retained but chat disabled

**Key Features:**
- Real-time online status updates
- Sort by: Online, Alphabetical, Recent
- Filter friends
- Quick action buttons

---

## Messaging Features

### 11. Main Chat Interface Overview

**Chat Interface Layout:**

```
┌─────────────────────────────────────────┐
│  SIDEBAR           │  CHAT WINDOW       │
├────────────────────┼────────────────────┤
│ Profile Section    │ Chat Header        │
│  • Avatar          │  • Friend/Room Name│
│  • Username        │  • Status/Members  │
│  • Status          │  • Call Buttons    │
│                    │  • Settings Icon   │
├────────────────────┼────────────────────┤
│ Search Bar         │ Messages Area      │
│                    │  • Message history │
├────────────────────┤  • Auto-scroll     │
│ Tabs:              │  • Typing indicator│
│  • Rooms           │                    │
│  • Friends         │                    │
│                    │                    │
├────────────────────┼────────────────────┤
│ Create Room Button │ Message Input      │
│ Theme Toggle       │  • Text field      │
│ Logout Button      │  • File upload     │
│                    │  • Emoji picker    │
└────────────────────┴────────────────────┘
```

**Key Sections:**

1. **Sidebar** (Left)
   - Profile section at top
   - Search functionality
   - Tabs for Rooms and Friends
   - Action buttons (Create Room, Theme, Logout)

2. **Chat Window** (Right)
   - Header with conversation info
   - Messages display area
   - Input area with rich features

**Key Components:**
- Chat Page: `client/src/app/chat/page.tsx`
- Sidebar: `client/src/components/chat/ChatSidebar.tsx`
- Chat Window: `client/src/components/chat/ChatWindow.tsx`
- Messages: `client/src/components/chat/ChatMessages.tsx`
- Input: `client/src/components/chat/ChatInput.tsx`

---

### 12. Direct Messaging (One-on-One Chat)

**How to Start a Direct Message:**

**Method 1: From Friends List**
1. Go to Friends tab in sidebar
2. Click on friend's name/card
3. Direct message chat opens in main window
4. Start typing and send messages

**Method 2: From Search**
1. Use search bar at top of sidebar
2. Type friend's name
3. Click on friend in results
4. Direct chat opens

**Sending Messages:**

1. **Text Messages**
   - Type in message input field at bottom
   - Press Enter to send (or Shift+Enter for new line)
   - Or click Send button
   - Message appears immediately

2. **Message Features**
   - **Character Counter**: Shows remaining characters
   - **Auto-resize**: Input grows with content
   - **Emoji Support**: Use emoji picker or type emoji directly
   - **Line Breaks**: Shift+Enter for multi-line messages

**Real-Time Features:**

1. **Typing Indicator**
   - When friend types, you see: "John is typing..."
   - Appears below messages
   - Auto-clears after 2 seconds of inactivity

2. **Message Delivery**
   - Messages appear instantly (WebSocket)
   - Timestamp shown for each message
   - Your messages aligned right (blue bubble)
   - Friend's messages aligned left (gray bubble)

3. **Online Status**
   - Green dot in header = friend online
   - Gray dot = friend offline
   - "Last seen" time displayed if offline

**Offline Messaging:**
- Messages sent to offline friends are queued
- Delivered when friend comes online
- No message lost
- Friend sees all messages in order

**Key Features:**
- Real-time delivery via WebSocket
- Message persistence in database
- Typing indicators
- Read receipts (optional)
- Emoji support
- File attachment support

**Key Components:**
- Direct Chat Hook: `client/src/hooks/useDirectChat.ts`
- WebSocket Gateway: `server/src/direct-message/direct-message.gateway.ts`

---

### 13. Group Chat (Room Messages)

**How to Send Messages in a Room:**

1. **Select Room**
   - Go to Rooms tab in sidebar
   - Click on room name
   - Room chat opens in main window

2. **Compose Message**
   - Type message in input field
   - Use same features as direct messages:
     - Text formatting
     - Emojis
     - Files
     - Multi-line support

3. **Send Message**
   - Press Enter or click Send
   - Message visible to all room members
   - Your message highlighted differently

**Room Chat Features:**

1. **Multi-User Typing Indicators**
   - Shows who is typing: "John and Jane are typing..."
   - Updates in real-time
   - Max 3 users shown, then "and X others"

2. **Message Display**
   - Each message shows:
     - Sender's profile picture
     - Sender's username
     - Message content
     - Timestamp
     - Read receipts (who read the message)

3. **Room Header Information**
   - Room name
   - Number of members (e.g., "12 members")
   - Room mode (Chat, Video, or Both)
   - Settings icon for room options

**Message Search:**

1. **Search in Room**
   - Click search icon in room header
   - Type keywords to search
   - Results show matching messages
   - Click result to jump to message

**Real-Time Updates:**

- New members joining announced
- Members leaving announced
- Message edits reflected instantly (future feature)
- Room settings changes broadcasted

**Key Components:**
- Room Chat Hook: `client/src/hooks/useRoomChat.ts`
- WebSocket Gateway: `server/src/room-message/room-message.gateway.ts`

---

### 14. Emojis & Reactions

**How to Use Emoji Picker:**

1. **Open Emoji Picker**
   - Click emoji icon (😊) in message input
   - Emoji picker panel opens

2. **Select Emoji**
   - Browse emoji categories:
     - Smileys & People
     - Animals & Nature
     - Food & Drink
     - Travel & Places
     - Activities
     - Objects
     - Symbols
     - Flags
   - Click emoji to insert into message
   - Continue typing or send

3. **Search Emojis**
   - Use search bar in picker
   - Type keyword (e.g., "smile", "heart")
   - Matching emojis displayed

**Message Reactions (Future Feature):**
- React to messages with emojis
- Click reaction icon on message
- Select emoji
- Your reaction appears below message
- See who reacted

**Key Components:**
- Emoji Picker: Integrated in ChatInput
- Reactions: `client/src/components/chat/ChatReactions.tsx`

---

### 15. Message History & Pagination

**How Messages Load:**

1. **Initial Load**
   - When opening chat, most recent messages load
   - Default: Last 50 messages
   - Automatically scrolls to bottom

2. **Load Older Messages**
   - Scroll to top of message area
   - System automatically loads previous messages
   - Pagination in batches of 50
   - Loading indicator shown

3. **Scroll Behavior**
   - New messages auto-scroll to bottom (if at bottom)
   - If scrolled up, new message indicator appears
   - Click indicator to scroll to newest message

**Message Persistence:**
- All messages stored in database
- Available across devices
- Retrievable anytime
- Search through history

---

## Room Management

### 16. Creating a Room

**How to Create a New Room:**

1. **Open Create Room Dialog**
   - Click "Create Room" button in sidebar
   - Modal/dialog opens with form

2. **Fill Room Details**

   **Room Name** (Required)
   - Enter unique room name
   - 1-50 characters
   - Displayed in room list and header

   **Description** (Optional)
   - Describe room purpose
   - Max 500 characters
   - Visible to members and in room info

   **Room Type** (Required)
   - **Public**: Anyone can view and join
   - **Private**: Invite-only, requires approval

   **Room Mode** (Required)
   - **Chat**: Text messaging only
   - **Video**: Video call focused
   - **Both**: Text and video capabilities

   **Max Participants** (Optional)
   - Slider or input: 1-100
   - Default: 50
   - Limits room size

   **Profile Picture** (Optional)
   - Upload room avatar/icon
   - Displayed in room list
   - Supports JPG, PNG, GIF

3. **Create Room**
   - Click "Create" button
   - Validation performed
   - Room created in database
   - You're automatically added as member and creator

4. **Post-Creation**
   - Room appears in your Rooms list
   - Room chat automatically opens
   - Can immediately start messaging
   - Invite friends or share room

**What Happens Behind the Scenes:**
- Room record created in database
- You become the room creator (special permissions)
- You're added as first participant
- WebSocket room created for real-time messaging
- Room visible to others based on type (public/private)

**Key Components:**
- Create Room: `client/src/components/room/CreateRoom.tsx`
- Room Modal: `client/src/components/room/RoomModal.tsx`
- API: `client/src/lib/api/roomApi.ts`

---

### 17. Joining a Room

**How to Join Public Rooms:**

**Method 1: Browse Public Rooms**
1. Look for "Browse Rooms" or "Discover" section
2. List of public rooms displayed with:
   - Room name
   - Description
   - Member count
   - Room mode
3. Click on room to view details
4. Click "Join" button
5. Instantly added to room
6. Room appears in your Rooms list

**Method 2: Search for Room**
1. Use search functionality
2. Type room name or keywords
3. Matching public rooms shown
4. Click to join

**Method 3: Direct Link**
1. Someone shares room link
2. Click link (requires authentication)
3. Automatically joined (if public)
4. Or prompted to request access (if private)

**How to Join Private Rooms:**

1. **Request to Join**
   - Find private room (via search or link)
   - Click "Request to Join"
   - Request sent to room creator

2. **Wait for Approval**
   - Room creator receives notification
   - Creator can approve or deny
   - You receive notification of decision

3. **Approved**
   - Room appears in your Rooms list
   - Can start participating immediately

**Key Components:**
- Join Room: `client/src/components/room/JoinRoom.tsx`
- Join Button: `client/src/components/room/JoinButton.tsx`
- Join Requests Panel: `client/src/components/room/JoinRequestsPanel.tsx`

---

### 18. Room Information & Settings

**How to View Room Info:**

1. **Open Room Info**
   - In room chat header, click info icon (ⓘ) or room name
   - Group Info modal opens

2. **Tabs Available:**
   - **Details**: Room information
   - **Members**: Participant list
   - **Settings**: Room configuration (creator only)

**Details Tab:**

Shows:
- Room name
- Description
- Room type (Public/Private)
- Room mode (Chat/Video/Both)
- Created date
- Creator information
- Participant count
- Max participants

**Members Tab:**

1. **View All Members**
   - List of all room participants
   - Each shows:
     - Profile picture
     - Username
     - Online status
     - Join date

2. **Member Actions (Creator/Admin Only)**
   - **Remove Member**:
     - Click remove icon next to member
     - Confirmation dialog
     - Member removed from room
     - Member notified

   - **Promote to Admin** (Future Feature):
     - Give admin permissions to member

3. **Search Members**
   - Search bar to filter members
   - Type username to find specific member

**Settings Tab (Creator Only):**

1. **Edit Room Details**
   - Change room name
   - Update description
   - Modify max participants
   - Change room mode
   - Update profile picture

2. **Advanced Settings**
   - Toggle public/private
   - Enable/disable features:
     - File sharing
     - Calls
     - Invites

3. **Danger Zone**
   - **Leave Room**:
     - Click "Leave Room"
     - Confirmation required
     - Removed from room
     - Room remains for others

   - **Delete Room** (Creator Only):
     - Click "Delete Room"
     - Final confirmation with warning
     - Room permanently deleted
     - All members removed
     - Message history deleted
     - Cannot be undone

**Join Requests (Private Rooms):**

1. **View Pending Requests**
   - Creator sees notification badge
   - Click to view requests
   - Each request shows:
     - Requester's profile
     - Request time
     - Approve/Deny buttons

2. **Approve Request**
   - Click "Approve"
   - User added to room
   - User notified
   - User can now access room

3. **Deny Request**
   - Click "Deny"
   - Request removed
   - User not notified (privacy)

**Key Components:**
- Group Info: `client/src/components/room/GroupInfo/GroupInfo.tsx`
- Members Tab: `client/src/components/room/GroupInfo/MembersTab.tsx`
- Details Tab: `client/src/components/room/GroupInfo/DetailsTab.tsx`

---

### 19. Leaving or Deleting a Room

**How to Leave a Room:**

1. **Open Room Settings**
   - Click room info icon
   - Go to Settings tab or scroll to bottom

2. **Leave Room**
   - Click "Leave Room" button
   - Confirmation dialog: "Are you sure you want to leave this room?"
   - Click "Confirm"

3. **What Happens:**
   - Removed from room's member list
   - Room disappears from your Rooms list
   - Can't send/receive messages
   - Can rejoin later if public
   - Message history retained in database

**How to Delete a Room (Creator Only):**

1. **Open Room Settings**
   - Must be room creator
   - Navigate to Settings → Danger Zone

2. **Delete Room**
   - Click "Delete Room" button (red)
   - Warning message: "This action cannot be undone. All messages and data will be permanently deleted."
   - Type room name to confirm
   - Click "Delete Permanently"

3. **What Happens:**
   - Room immediately deleted from database
   - All members removed
   - All messages and files deleted
   - All participants notified
   - Room disappears from all users
   - Cannot be recovered

**Important Notes:**
- Only room creator can delete
- Leaving transfers ownership (if sole creator, room may be deleted)
- Backup important data before deletion

---

## Video & Voice Calls

### 20. Understanding Call System

**Call Capabilities:**

Banter supports:
- **One-on-One Calls**: Voice or video with a friend
- **Group Calls**: Multiple participants in a room
- **Screen Sharing**: Share your screen during calls
- **Call History**: Track call duration and statistics

**Call Types:**
- **Voice Call**: Audio only, no video
- **Video Call**: Audio + video with camera
- **Screen Share**: Share your screen (in addition to video/voice)

**WebSocket Architecture:**
- Dedicated Socket.IO namespace: `/call`
- Real-time signaling for WebRTC
- Handles connection negotiation
- Manages participant state

---

### 21. Making a Call

**How to Initiate a Voice or Video Call:**

**From Friend Chat:**

1. **Open Direct Message**
   - Click friend in Friends list
   - Direct chat opens

2. **Start Call**
   - Look at chat header
   - Click:
     - **Phone icon** (📞) for voice call
     - **Video icon** (🎥) for video call

3. **Call Initiated**
   - "Calling..." indicator shown
   - Ringing sound (optional)
   - Waiting for friend to accept

**From Room:**

1. **Open Room Chat**
   - Select room from Rooms list

2. **Start Call**
   - Click phone or video icon in header
   - Call initiated for all room members

3. **Multiple Participants**
   - All members receive call notification
   - Those who accept join the call

**Browser Permission Request:**

When initiating call, browser asks:
- "Allow Banter to use your microphone?"
- "Allow Banter to use your camera?" (for video)
- Click "Allow" to proceed
- Permissions saved for future calls

**Key Components:**
- Call Notification Context: `client/src/contexts/CallNotificationContext.tsx`
- Call Gateway: `server/src/call/call.gateway.ts`

---

### 22. Receiving a Call

**How Incoming Calls Work:**

1. **Call Notification Popup**
   - When someone calls you, a popup appears:
     ```
     ┌─────────────────────────┐
     │   [Avatar]              │
     │   John Doe is calling...│
     │   [Video Call Icon]     │
     │                         │
     │  [Accept]  [Decline]    │
     └─────────────────────────┘
     ```

2. **Popup Details:**
   - Caller's profile picture
   - Caller's name
   - Call type indicator (voice/video)
   - Accept and Decline buttons
   - Ringing animation

3. **Accept Call**
   - Click "Accept" button
   - Browser requests mic/camera permissions (if not granted)
   - Grant permissions
   - Call window opens
   - Connected to caller

4. **Decline Call**
   - Click "Decline" button
   - Popup closes
   - Caller not explicitly notified (privacy)
   - Call notification dismissed

**Multiple Incoming Calls:**
- If in a call, incoming calls show notification
- Can decline current call to accept new one
- Or ignore new call

**Notification Persistence:**
- Popup remains until action taken
- Can minimize and call notification persists
- Dismissible

**Key Components:**
- Call Notification Popup: `client/src/components/call/CallNotificationPopup.tsx`
- Global Call Handler: `client/src/components/call/GlobalCallHandler.tsx`

---

### 23. During a Call

**Video Call Interface:**

```
┌─────────────────────────────────────┐
│  Remote Video Stream                │
│  (Participant's camera)             │
│                                     │
│  ┌─────────────────┐                │
│  │ Your Video (PiP)│                │
│  │                 │                │
│  └─────────────────┘                │
├─────────────────────────────────────┤
│  Controls:                          │
│  [🎥 Video] [🎤 Mute] [📺 Share]   │
│  [☰ Participants] [⊗ End Call]     │
└─────────────────────────────────────┘
```

**Media Controls:**

1. **Toggle Video** (🎥)
   - Click to turn camera on/off
   - Icon changes: Red = off, Blue = on
   - Other participants see black screen when off

2. **Mute/Unmute** (🎤)
   - Click to mute microphone
   - Icon changes: Red = muted, Blue = unmuted
   - Other participants can't hear you when muted
   - Visual indicator for others: "John is muted"

3. **Share Screen** (📺)
   - Click to start screen sharing
   - Browser asks which screen/window to share
   - Select and confirm
   - Screen visible to all participants
   - Click again to stop sharing

4. **View Participants** (☰)
   - Click to see list of call participants
   - Shows:
     - Each participant's name
     - Their media state (video on/off, muted/unmuted)
     - Connection status
   - For group calls with multiple people

5. **End Call** (⊗)
   - Click to disconnect from call
   - Confirmation: "Are you sure you want to end the call?"
   - Call terminates for you
   - Others remain connected (in group calls)

**Call States:**

1. **Connecting**
   - Shows "Connecting..." spinner
   - Establishing WebRTC connection
   - Exchanging media

2. **Connected**
   - Video/audio streaming
   - All controls active
   - Real-time communication

3. **Call Ended**
   - Message: "Call ended"
   - Duration displayed
   - Returns to normal chat
   - Call statistics saved

**Visual Indicators:**

- **Connection Quality**: Icon showing connection strength
- **Bandwidth**: May show bandwidth usage
- **Participants Joining/Leaving**: Notifications
- **Media Changes**: When someone mutes/unmutes or toggles video

**Key Components:**
- Video Call: `client/src/components/chat/VideoCall.tsx`
- Call Context: `client/src/contexts/CallNotificationContext.tsx`

---

### 24. Group Calls (Multiple Participants)

**How Group Calls Work:**

1. **Initiating Group Call**
   - Start call from room (not direct message)
   - All room members receive notification
   - Each member can choose to join

2. **Participants Joining**
   - As members accept, they appear in call
   - Grid layout for multiple video streams:
     - 2 people: Side by side
     - 3-4 people: 2x2 grid
     - 5+ people: Scrollable grid
   - Active speaker highlighted (border)

3. **Participant Management**
   - View participants list
   - See who's speaking (audio indicator)
   - See media state (video on/muted)
   - Admin can remove participants (future feature)

4. **Call Quality Optimization**
   - Bandwidth adjusted based on participants
   - Lower quality for more participants
   - Priority to active speaker

**Key Features:**
- Up to 100 participants (configurable by room settings)
- Screen sharing available
- Individual media controls per participant
- Participant join/leave notifications

---

### 25. Screen Sharing

**How to Share Your Screen:**

1. **During Call**
   - Click "Share Screen" button (📺)
   - Browser dialog appears: "Choose what to share"

2. **Select What to Share**
   - **Entire Screen**: Share all monitors
   - **Application Window**: Share specific app
   - **Browser Tab**: Share specific tab

3. **Sharing Active**
   - Your screen visible to all participants
   - Red border indicates sharing
   - "You're sharing your screen" indicator
   - Click "Stop Sharing" to end

4. **Stop Sharing**
   - Click "Stop Sharing" button
   - Or close shared window/tab (auto-stops)
   - Others see notification: "John stopped sharing"

**What Others See:**
- Your screen in main video area
- Your camera video in smaller picture-in-picture (if enabled)
- Option to view full screen

**Privacy & Security:**
- Only share what you select
- Can hide specific windows
- Pause sharing without ending call
- Browser ensures you're aware what's shared

---

### 26. Call History & Statistics

**How to View Call History:**

1. **Access Call History**
   - Click profile menu
   - Select "Call History" or "Statistics"

2. **Call History List**
   - Shows all past calls:
     - Date and time
     - Participant(s) name(s)
     - Duration
     - Call type (voice/video)
     - Room name (if room call)

3. **Statistics**
   - Total calls made
   - Total call duration
   - Average call length
   - Most called contacts

**Call Session Tracking:**
- Only actual room calls tracked (not friend calls with dynamic IDs)
- Duration calculated automatically
- Cost tracked (if paid rooms enabled)
- History accessible across devices

**Key Features:**
- Search call history
- Filter by date, participant, duration
- Export history (future feature)

**Database Model:**
```typescript
CallSession {
  id: string
  roomId: string
  userId: string
  duration: number    // in seconds
  cost: number        // in cents (if applicable)
  createdAt: DateTime
}
```

---

## File Sharing

### 27. Uploading & Sharing Files

**How to Share Files:**

1. **In Chat Message Input**
   - Look for paperclip or file icon (📎)
   - Click to open file picker

2. **Select File(s)**
   - Browser file dialog opens
   - Navigate to file location
   - Select one or multiple files
   - Click "Open"

3. **File Validation**
   - System checks:
     - File type (must be allowed)
     - File size (max 50MB per file)
     - Total number of files
   - Invalid files rejected with error message

4. **Upload Progress**
   - Progress bar shown for each file
   - Percentage and speed displayed
   - Can cancel upload mid-way

5. **File Sent**
   - Once uploaded, file appears in chat
   - Message sent with file attachment
   - Recipients can view/download

**Alternative: Drag & Drop**

1. **Drag File**
   - Drag file from desktop/folder
   - Hover over chat input area

2. **Drop Zone Highlights**
   - Chat input highlights (blue border)
   - "Drop file to upload" message

3. **Drop File**
   - Release mouse
   - File automatically starts uploading
   - Same validation and progress as manual upload

**Supported File Types:**

- **Images**: JPG, JPEG, PNG, GIF, WebP, SVG
- **Videos**: MP4, WebM, AVI, MOV, MKV
- **Audio**: MP3, WAV, OGG, M4A, FLAC
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **Archives**: ZIP, RAR, 7Z, TAR, GZ
- **Code**: JS, TS, PY, JAVA, C, CPP, etc.

**File Size Limits:**
- Single file: 50MB (configurable)
- Total per message: 200MB (configurable)

**Key Components:**
- File Upload: `client/src/components/chat/FileUpload.tsx`
- File Controller: `server/src/file/file.controller.ts`
- File Service: `server/src/file/file.service.ts`

---

### 28. Viewing & Downloading Files

**How Files Appear in Chat:**

**Images:**
- Displayed as inline thumbnails
- Click to view full size
- Lightbox viewer opens
- Options:
  - Zoom in/out
  - Download
  - Close

**Videos:**
- Embedded video player
- Click play to watch
- Controls: Play/pause, volume, full screen
- Download option

**Audio:**
- Audio player with waveform
- Play/pause, seek, volume controls
- Duration displayed
- Download option

**Documents & Other Files:**
- File icon with type indicator
- File name and size displayed
- Click to download
- Opens in browser (if supported) or downloads

**How to Download Files:**

1. **Click Download Icon**
   - Hover over file in chat
   - Download icon appears (⬇)
   - Click to download

2. **File Downloads**
   - Browser's default download behavior
   - File saved to Downloads folder
   - Notification shown

**File Management:**
- Files stored securely on server
- URLs generated for access
- Access controlled (only chat participants)
- Files persist indefinitely (unless room deleted)

---

## Notifications

### 29. In-App Notifications

**Types of Notifications You'll Receive:**

1. **Friend Requests**
   - "John Doe sent you a friend request"
   - Click to view and respond

2. **Friend Accepted**
   - "Jane accepted your friend request"
   - Click to open chat

3. **Room Invites**
   - "You were added to Project Discussion"
   - Click to join room

4. **Message Notifications** (when app not focused)
   - "New message from John"
   - Preview of message content
   - Click to open chat

5. **Call Notifications**
   - Separate call notification system (see Calls section)

6. **System Notifications**
   - Account updates
   - Security alerts
   - Feature announcements

**Notification Display:**

- **Toast Notifications**:
  - Appear in top-right corner
  - Auto-dismiss after 5 seconds
  - Can manually close
  - Color-coded:
    - Green: Success
    - Red: Error
    - Blue: Info
    - Yellow: Warning

- **Badge Indicators**:
  - Unread count on tabs/buttons
  - Red dot on profile icon
  - Number badge on Friends tab

**Managing Notifications:**

1. **View All Notifications**
   - Click bell icon (if available)
   - Notification center opens
   - List of all recent notifications

2. **Mark as Read**
   - Click notification to mark as read
   - Badge count decreases
   - Notification removed from list

3. **Clear All**
   - "Clear All" button in notification center
   - All notifications marked as read
   - Badge reset to zero

**Notification Settings** (Future Feature):
- Toggle notification types
- Set quiet hours
- Customize sounds
- Enable/disable desktop notifications

**Key Components:**
- Notification System: Referenced in chat components
- Toast notifications: Integrated UI component

---

### 30. Browser Notifications

**Desktop Notifications:**

When Banter is not active tab:

1. **Permission Request**
   - On first use, browser asks: "Allow notifications?"
   - Click "Allow" to enable

2. **Notification Triggers**
   - New direct message
   - New room message
   - Friend request
   - Incoming call

3. **Notification Content**
   - Sender's name
   - Message preview (first 50 chars)
   - Banter icon
   - Click to focus app and open chat

**Managing Browser Notifications:**

- **Enable/Disable**: Browser settings
- **Do Not Disturb**: OS-level controls (Mac/Windows)
- **Sound**: Configurable in browser

**Privacy:**
- Message content only shown if granted permission
- Generic "New message" if permission denied
- Full content in-app regardless

---

## Complete User Journey Examples

### 31. New User Onboarding Journey

**Scenario**: Sarah wants to use Banter for team communication.

**Step-by-Step:**

1. **Discovery** (Day 1, 2:00 PM)
   - Sarah visits `https://banter.example.com`
   - Sees landing page explaining features
   - Clicks "Get Started"

2. **Registration** (2:02 PM)
   - Fills registration form:
     - Username: sarah_smith
     - Email: sarah@company.com
     - Password: SecurePass123!
   - Clicks "Sign Up"
   - Redirected to "Check Email" page

3. **Email Verification** (2:05 PM)
   - Checks email inbox
   - Opens "Verify Your Email" email
   - Clicks verification link
   - Automatically logged in
   - Redirected to `/chat` interface

4. **First Look at Chat** (2:06 PM)
   - Sees empty chat interface
   - Explores sidebar:
     - Profile section at top
     - Rooms tab (empty)
     - Friends tab (empty)
   - Notices "Create Room" button
   - Reads interface tooltips

5. **Adding First Friend** (2:10 PM)
   - Clicks Friends tab
   - Uses search: types "john"
   - Finds coworker: John Doe
   - Clicks "Add Friend"
   - Request sent notification appears

6. **Creating First Room** (2:15 PM)
   - Clicks "Create Room" button
   - Fills form:
     - Name: "Marketing Team"
     - Description: "Daily team collaboration"
     - Type: Private
     - Mode: Both
   - Clicks "Create"
   - Room appears in Rooms list
   - Room chat opens

7. **First Message** (2:20 PM)
   - Types: "Hey team, I set up our Banter room!"
   - Presses Enter
   - Message appears in chat
   - Realizes no one else in room yet

8. **Inviting Team Members** (2:22 PM)
   - Clicks room info icon
   - Goes to Members tab
   - Sees only herself listed
   - Waits for friend request acceptance to invite John

9. **Friend Request Accepted** (2:30 PM)
   - John accepts friend request
   - Notification: "John accepted your friend request"
   - John now in Friends list
   - Green dot shows he's online

10. **First Direct Message** (2:31 PM)
    - Clicks John in Friends list
    - Direct chat opens
    - Types: "Hey John! Just set up Banter for our team"
    - John replies instantly
    - Real-time conversation starts

11. **First Video Call** (2:45 PM)
    - In chat with John, clicks video icon
    - Browser asks for camera/mic permission
    - Grants permissions
    - John receives call notification
    - John accepts
    - Video call established
    - They discuss Banter features
    - 10-minute call
    - Clicks "End Call"

12. **Adding John to Room** (3:00 PM)
    - Returns to Marketing Team room
    - Realizes she can't add John directly (needs different flow)
    - Shares room link with John via direct message
    - John clicks link and joins room

13. **Team Collaboration Begins** (Day 2)
    - Entire team joins room
    - Daily messages exchanged
    - Files shared (meeting notes, designs)
    - Quick voice calls for urgent discussions
    - Team fully onboarded

**Sarah's First Day Summary:**
- Account created and verified: ✓
- Friend added: ✓
- Room created: ✓
- First messages sent: ✓
- First call made: ✓
- Team collaboration started: ✓

---

### 32. Daily Active User Journey

**Scenario**: Mike, an existing user, using Banter for daily work.

**Morning Routine** (9:00 AM)

1. **Open Banter**
   - Types `banter.example.com` in browser
   - Already logged in (session persisted)
   - Chat interface loads immediately

2. **Check Overnight Messages**
   - Sees notification badges:
     - Friends: 2 new messages
     - Rooms: 15 new messages
   - Clicks "Dev Team" room (most active)
   - Scrolls through overnight discussion
   - Reads important update from team lead

3. **Respond to Messages**
   - Types response to team discussion
   - Tags colleague: "@jane what do you think?"
   - Sends message
   - Switches to direct messages

4. **Direct Message Follow-up**
   - Clicks friend "Emma" with notification badge
   - Reads her question from last night
   - Types detailed response
   - Attaches file: Design mockup (PNG)
   - Sends message
   - Emma replies instantly (she's online)
   - Brief back-and-forth discussion

**Mid-Morning** (10:30 AM)

5. **Daily Standup Call**
   - 10:28 AM: Notification "Dev Team standup starting soon"
   - Opens Dev Team room
   - At 10:30, team lead starts video call
   - Mike clicks "Join"
   - 10 team members on call
   - Everyone shares updates
   - Mike shares screen to show code
   - 15-minute call
   - Ends call, continues in chat

**Afternoon Work** (2:00 PM)

6. **Quick Voice Call**
   - Working on bug, needs help
   - Opens DM with senior dev "Alex"
   - Clicks phone icon for voice call
   - Alex accepts
   - Explains issue over audio
   - Alex screen shares solution
   - 5-minute call resolves issue

7. **File Sharing**
   - Needs to share debug logs with team
   - Opens Dev Team room
   - Drags log file into chat
   - File uploads (2MB, instant)
   - Adds message: "Debug logs from issue #123"
   - Team downloads and investigates

**Late Afternoon** (4:30 PM)

8. **Create New Room**
   - Starting new project, needs separate channel
   - Clicks "Create Room"
   - Name: "Mobile App Redesign"
   - Type: Private
   - Mode: Both
   - Invites 5 teammates
   - Posts initial project brief
   - Attaches design document

9. **Friend Request**
   - New developer joined company
   - Searches: "sophia_new"
   - Sends friend request
   - Sophia accepts within minutes
   - Sends welcome message

**End of Day** (6:00 PM)

10. **Final Check**
    - Scans all rooms for mentions
    - Marks important messages for follow-up
    - Leaves quick replies where needed
    - Sets status to "Away" (future feature)
    - Closes browser tab
    - Session persists for next day

**Mike's Daily Stats:**
- Messages sent: 47
- Files shared: 3
- Calls: 2 (1 video, 1 voice)
- Total call time: 20 minutes
- Rooms active in: 4
- Direct chats: 7

---

### 33. Team Collaboration Journey

**Scenario**: Design team uses Banter for project collaboration.

**Project Kickoff** (Week 1)

1. **Team Lead Sets Up**
   - Creates room: "Website Redesign 2024"
   - Description: "All discussions for Q1 website redesign project"
   - Type: Private
   - Invites: 8 team members
   - Pins important message: "Project brief and timeline"
   - Uploads: Project proposal (PDF)

2. **Team Members Join**
   - All 8 receive notifications
   - Join room throughout the day
   - Introduce themselves
   - React with emojis to proposal

3. **Initial Discussion**
   - Brainstorming in chat
   - Rapid message exchange
   - Ideas shared
   - Links to inspiration boards
   - Typing indicators keep conversation flowing

**Week 2: Daily Work**

4. **Daily Standups**
   - Every morning, 9:30 AM voice call
   - 15-minute check-in
   - Team shares progress
   - Blockers discussed
   - Action items noted in chat after call

5. **Design Reviews**
   - Designer shares mockup (PNG, 5MB)
   - Team reviews in chat
   - Suggestions via messages
   - Questions answered in real-time
   - Decision made: Schedule video call for detailed review

6. **Video Review Session**
   - 2:00 PM: Team lead starts video call
   - 6 designers join
   - Designer shares screen
   - Goes through mockup details
   - Live feedback and edits
   - Recording saved (future feature)
   - 1-hour call
   - Action items posted in chat

**Week 3: Intensive Collaboration**

7. **Multiple Parallel Discussions**
   - Main room: General updates
   - Sub-room 1: "Redesign - Frontend Dev"
   - Sub-room 2: "Redesign - Design Assets"
   - Direct messages: One-on-one questions
   - Team seamlessly switches between contexts

8. **File Repository**
   - Room fills with files:
     - 45+ design mockups
     - 12 PDF documents
     - 8 video demos
   - File search helps find specific assets
   - Critical files pinned to top

9. **Crisis Management**
   - Major issue discovered
   - Urgent message in room: "@everyone critical bug found"
   - Team lead starts immediate video call
   - 10 people join within 2 minutes
   - Screen sharing to demonstrate issue
   - Collaborative problem-solving
   - Resolution found in 30 minutes
   - Follow-up tasks assigned in chat

**Week 4: Launch Preparation**

10. **Final Review**
    - Comprehensive review call
    - Screen sharing: Final website walkthrough
    - Checklist reviewed item-by-item
    - Sign-offs collected
    - Celebration messages in chat

11. **Launch Day**
    - Team stays in video call during launch
    - Monitoring messages in chat
    - Real-time updates on progress
    - Issue tracking
    - Success celebration with reactions and GIFs

**Project Completion**

12. **Room Archive** (Future Feature)
    - Project complete
    - Room archived but accessible
    - All messages and files preserved
    - Reference for future projects

**Collaboration Statistics:**
- Duration: 4 weeks
- Messages: 2,847
- Files shared: 156
- Calls: 32 (25 video, 7 voice)
- Total call time: 18 hours
- Team members: 8
- Success: Project launched on time

**Key Success Factors:**
- Real-time communication eliminated email delays
- Screen sharing accelerated design reviews
- File sharing kept everything centralized
- Call integration made meetings seamless
- Persistent chat provided complete project history

---

## Tips & Best Practices

### 34. Communication Best Practices

**For Effective Messaging:**

1. **Use Rooms for Topics**
   - Create separate rooms for different projects/topics
   - Avoid mixing discussions
   - Name rooms clearly

2. **Use Direct Messages for 1-on-1**
   - Personal conversations
   - Sensitive topics
   - Quick questions
   - Less formal discussions

3. **Tag People Appropriately**
   - Use @mentions to notify specific people
   - Use @everyone sparingly (only for critical announcements)
   - Respect people's time and attention

4. **Share Files Contextually**
   - Add description when sharing files
   - Name files clearly before uploading
   - Use appropriate file formats

5. **Use Calls for Complex Discussions**
   - Long explanations better on call
   - Debates and brainstorming
   - Quick decision-making
   - Screen sharing when needed

**For Better Collaboration:**

1. **Keep Teams Organized**
   - Regular room cleanup
   - Archive old discussions
   - Pin important messages
   - Use room descriptions

2. **Respect Response Times**
   - Don't expect instant replies
   - Use calls for urgent matters
   - Set expectations for availability

3. **Maintain Professionalism**
   - Be respectful in all communications
   - Use appropriate language
   - Consider tone in written messages

---

### 35. Privacy & Security Tips

**Protecting Your Account:**

1. **Use Strong Password**
   - 12+ characters
   - Mix of letters, numbers, symbols
   - Unique to Banter (don't reuse)
   - Change periodically

2. **Verify Email**
   - Always verify your email address
   - Enables password recovery
   - Ensures account security

3. **Be Careful with Links**
   - Don't click suspicious links in messages
   - Verify sender before downloading files
   - Report suspicious activity

4. **Use Private Rooms**
   - Sensitive discussions in private rooms
   - Carefully manage room membership
   - Review members periodically

5. **Log Out on Shared Devices**
   - Always log out on public computers
   - Don't save passwords on shared devices
   - Clear browser cache after use

**During Calls:**

1. **Check Your Background**
   - Use appropriate background for calls
   - Consider virtual background (future feature)
   - Mute when not speaking

2. **Control Your Screen Share**
   - Close sensitive windows before sharing
   - Share specific window, not entire screen
   - Stop sharing when done

3. **Manage Permissions**
   - Grant camera/mic access only to Banter
   - Review browser permissions regularly
   - Revoke if suspicious activity

---

### 36. Troubleshooting Common Issues

**Connection Problems:**

- **"Cannot connect to server"**
  - Check internet connection
  - Refresh browser
  - Clear cache and cookies
  - Try different browser

- **"Messages not sending"**
  - Check connection status (icon in top-right)
  - Wait for reconnection
  - Refresh page if persists

**Call Issues:**

- **"Call won't connect"**
  - Check browser permissions (Settings → Privacy → Camera/Mic)
  - Grant access if blocked
  - Restart browser
  - Try voice-only if video fails

- **"Can't hear/see other person"**
  - Check your volume and mic
  - Check their video/audio settings
  - Ask them to toggle media controls
  - Refresh and rejoin call

**Login Issues:**

- **"Invalid credentials"**
  - Double-check email and password
  - Use "Forgot Password" if needed
  - Ensure email is verified

- **"Email verification expired"**
  - Request new verification email
  - Check spam folder
  - Verify within 24 hours

**File Upload Issues:**

- **"File too large"**
  - Max file size: 50MB
  - Compress large files
  - Use external file sharing for huge files

- **"File type not supported"**
  - Check supported file types (see File Sharing section)
  - Convert to supported format
  - Contact support for special needs

---

## Appendix

### A. Keyboard Shortcuts (Future Feature)

**Global Shortcuts:**
- `Ctrl/Cmd + K`: Quick room/friend search
- `Ctrl/Cmd + /`: Show shortcuts help
- `Esc`: Close modal/dialog

**In Chat:**
- `Enter`: Send message
- `Shift + Enter`: New line
- `Ctrl/Cmd + B`: Bold text
- `Ctrl/Cmd + I`: Italic text
- `@`: Mention someone
- `/`: Slash commands

**Navigation:**
- `Ctrl/Cmd + 1-9`: Switch between rooms/chats
- `Alt + Up/Down`: Navigate message history
- `Ctrl/Cmd + F`: Search in chat

### B. System Requirements

**Browser Requirements:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**For Video Calls:**
- Webcam (720p or higher recommended)
- Microphone
- Speakers/headphones
- Stable internet: 2+ Mbps for video

**For Screen Sharing:**
- Browser version supporting Screen Capture API
- Operating system permissions granted

**For Optimal Performance:**
- 4GB+ RAM
- Modern processor (multi-core recommended)
- Stable broadband internet

### C. Glossary

- **Room**: Group chat space for multiple participants
- **Direct Message (DM)**: One-on-one private chat
- **Friend**: Accepted connection between two users
- **WebSocket**: Technology enabling real-time communication
- **Token**: Secure authentication credential
- **Typing Indicator**: Shows when someone is composing a message
- **Read Receipt**: Confirmation that message was read
- **Call Session**: Instance of voice/video call
- **Participant**: Member of a room or call
- **Creator**: User who created a room (with admin permissions)

### D. Support & Feedback

**Getting Help:**
- Documentation: This file
- API Docs: `http://localhost:5000/api`
- Support Email: support@banter.example.com (configure)

**Reporting Issues:**
- In-app: Settings → Report Issue
- Email: bugs@banter.example.com
- GitHub: [Repository issues](https://github.com/yourcompany/banter/issues)

**Feature Requests:**
- Email: features@banter.example.com
- Community forum: [Forum link]

---

## Document Information

**Version**: 1.0
**Last Updated**: November 13, 2025
**Application**: Banter Communication Platform
**Codebase**: `/Users/churchill/Developer/Banter`

**Contributing to Documentation:**
This documentation is maintained alongside the codebase. To suggest improvements:
1. Identify outdated or unclear sections
2. Propose changes via pull request
3. Update document version number
4. Submit for review

**Related Documentation:**
- API Documentation: `/server/README.md`
- Frontend Setup: `/client/README.md`
- Deployment Guide: `/DEPLOYMENT.md` (if exists)
- Contributing Guide: `/CONTRIBUTING.md` (if exists)

---

**End of User Flow Documentation**

Thank you for using Banter! We hope this guide helps you make the most of the platform's features. For questions or support, please contact the development team.