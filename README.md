# GitWise AI

<div align="center">

![GitWise AI Banner](https://img.shields.io/badge/GitWise-AI-8b5cf6?style=for-the-badge&logo=github&logoColor=white)

**An AI-powered repository analyzer and architectural assistant.**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20API-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-FF6B6B?style=flat-square)](https://openrouter.ai/)

</div>

---

##  Overview

GitWise AI is a full-stack application that analyzes GitHub repositories to provide architectural insights, code health scores, and actionable improvements. It leverages **Google Gemini** for structural analysis and **OpenRouter** to enable natural language chatting with repository context.

The application fetches repository metadata, file structures, and commit history, then processes this data through AI models to generate summaries, risk assessments, and contributor statistics. Results are cached in MongoDB to optimize performance and reduce API costs.

---

##  Features

-  Repository Analysis: Automated extraction of tech stack, file structure, and commit history
-  Code Health Scoring: Algorithmic scoring (0-100) based on maintainability and structure
-  AI Chatbot: Context-aware chat interface powered by OpenRouter
-  Contributor Insights: Visualization of top contributors and recent activity
-  Actionable Improvements: AI-generated suggestions referencing specific file paths
-  Smart Caching: MongoDB-based caching strategy (24h) to reduce API costs
-  Dynamic Model Selection: Switch AI providers via environment variables without code changes
-  Responsive UI: Glassmorphic design with purple theme optimized for desktop and mobile
-  Secure: API keys stored server-side only, never exposed to frontend

---

##  Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** (free tier sufficient) - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **GitHub Personal Access Token** - [Generate here](https://github.com/settings/tokens) (needs `repo` scope)
- **Google Gemini API Key** - [Get key key](https://makersuite.google.com/app/apikey)
- **OpenRouter API Key** - [Get key here](https://openrouter.ai/keys)

---

##  Installation

### 1. Clone the repository

```bash
git clone https://github.com/TenZ07/GitWise-AI.git
cd GitWise-AI
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configuration

#### Backend Environment Variables

Create a file named `backend/.env` and add the following:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# MongoDB Atlas Connection
MONGO_URI=mongodb_url

# GitHub API Token
GITHUB_TOKEN=ghp_your_github_personal_access_token

# Google Gemini API (Primary AI for Analysis)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=model_name

# OpenRouter API (For Chat Feature)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=model_name

```

#### Frontend Environment Variables

Create a file named `frontend/.env` and add:

```env
VITE_API_URL=http://localhost:5000
```

---

##  Usage

### 1. Start the backend server

```bash
cd backend
npm run dev
```

The backend will run on **http://localhost:5000**

### 2. Start the frontend development server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will run on **http://localhost:5173**

### 3. Analyze a repository

1. Open your browser and navigate to **http://localhost:5173**
2. Enter a public GitHub repository URL (e.g., `https://github.com/facebook/react`)
3. Click **Analyze** and wait for the AI to process the repository
4. View the dashboard with insights, health score, and improvements
5. Use the **AI Chat** to ask questions about the repository

---

##  Project Structure

```
GitWise-AI/
│
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── gemini.js              # Gemini AI initialization
│   ├── controllers/
│   │   └── repoController.js      # Analysis logic
│   ├── models/
│   │   └── Repo.js                # MongoDB schema
│   ├── routes/
│   │   └── repo.js                # API routes
│   ├── services/
│   │   ├── geminiService.js       # Gemini AI service
│   │   ├── githubService.js       # GitHub API client
│   │   └── openrouterService.js   # OpenRouter chat service
│   ├── middleware/                # (Future: Auth middleware)
│   ├── socket/                    # (Future: Real-time features)
│   ├── .env                       # Environment variables
│   ├── server.js                  # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBox.jsx        # AI chat interface
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   └── Dashboard.jsx      # Analysis dashboard
│   │   ├── services/
│   │   │   └── api.js             # Axios API client
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # Entry point
│   ├── .env                       # Frontend environment
│   ├── tailwind.config.js         # Tailwind configuration
│   ├── vite.config.js             # Vite configuration
│   └── package.json
│
├── .gitignore
├── package.json                   # Root dependencies
└── README.md                      # This file
```

---

##  Technical Notes

### Data Flow

1. **Frontend** sends a repository URL to the backend
2. **Backend** checks MongoDB cache (24h validity)
3. If not cached:
   - Fetches metadata from **GitHub API** (repo info, commits, contributors, languages, file tree)
   - Processes data with **Google Gemini** for AI analysis
   - Stores result in **MongoDB** with timestamp
4. Returns structured data to frontend
5. **Frontend** displays interactive dashboard

### Chat Context

The chatbot injects the following into the system prompt for context-aware responses:
- Repository overview (name, description, tech stack)
- File structure (top 50 files)
- Contributor statistics (top 15 contributors)
- Recent commit history (last 15 commits)
- AI-identified risks and improvements

### Caching Strategy

- Analysis results are cached for **24 hours**
- Subsequent requests within this window return cached data instantly
- Use the **Re-analyze** button to force a fresh analysis
- Cache key: Repository URL


---


##  API Endpoints

### Analyze Repository

```http
POST /api/repo/analyze
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repo"
}

# Force refresh (bypass cache)
POST /api/repo/analyze?force=true
```

### Chat with Repository

```http
POST /api/repo/chat
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repo",
  "message": "What does this project do?"
}
```

### Get Repository by ID

```http
GET /api/repo/:id
```

### Get Repository by URL

```http
GET /api/repo/url/:encodedUrl
```

### Refresh Cache

```http
POST /api/repo/refresh
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repo"
}
```

### Health Check

```http
GET /
```

---

##  Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/improvement
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add improvement'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/improvement
   ```
5. **Open a Pull Request**

Please include:
- Clear description of changes
- Screenshots for UI changes
- Test results or manual verification steps

---

##  Tech Stack

### Frontend
- React 19.2 - UI library
- Vite 7.3 - Build tool
- React Router 6 - Routing
- Tailwind CSS 3.4 - Styling
- Lucide React - Icons
- React Hot Toast - Notifications
- React Circular Progressbar - Health score visualization
- React Markdown - Chat formatting
- Axios - HTTP client

### Backend
- Node.js - Runtime
- Express 5.2 - Web framework
- MongoDB + Mongoose - Database
- Google Generative AI - Gemini integration
- OpenRouter SDK - Multi-model AI
- Axios - GitHub API client
- CORS - Cross-origin support
- dotenv - Environment config


---

##  License

This project is licensed under the **MIT License**.

---


<div align="center">

**⭐ Star this repo if you find it useful!**

**Author: [TenZ07](https://github.com/TenZ07)**


*Peace ;)*

</div>
