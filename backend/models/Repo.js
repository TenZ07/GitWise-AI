const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  repoUrl: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  repoName: { type: String, required: true },
  description: String,
  stars: Number,
  forks: Number,
  languages: Object, // e.g., { "JavaScript": 4500, "CSS": 1200 }
  
  // AI Generated Fields (to be filled in Step 4)
  aiSummary: String,
  techStack: [String],
  codeHealthScore: Number,
  improvements: [String],
  generatedDocs: String,
  
  // Raw Data for Dashboard
  contributors: [{
    login: String,
    avatar_url: String,
    contributions: Number
  }],
  recentCommits: [{
    sha: String,
    message: String,
    author: String,
    avatar: String,
    date: Date
  }],
  
  lastFetched: { 
    type: Date, 
    default: Date.now,
    index: { expires: 86400 } // TTL: Auto-delete after 24 hours to save space
  }
});

module.exports = mongoose.model('Repo', repoSchema);