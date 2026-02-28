const mongoose = require('mongoose');

const repoSchema = new mongoose.Schema({
  repoUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: String,
  repoName: String,
  description: String,
  stars: Number,
  forks: Number,
  languages: Object,
  contributors: Array,
  recentCommits: Array,
  fileTree: Array,
  
  // AI Generated Fields
  functionalSummary: String,
  targetAudienceAndUse: String,
  aiSummary: String,
  techStack: [String],
  codeHealthScore: Number,
  improvements: [String],
  riskAssessment: Array,
  architectureAssessment: Object,
  scoreJustification: String,
  
  lastFetched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create and export the model
const Repo = mongoose.model('Repo', repoSchema);

module.exports = Repo;