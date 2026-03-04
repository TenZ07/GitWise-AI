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
  
  // 🆕 Code Analysis Fields (Groq AI)
  codeAnalysis: {
    analyzedFiles: [String],
    codeQualityInsights: {
      strengths: [String],
      weaknesses: [String],
      codeSmells: [String]
    },
    securityConcerns: [{
      issue: String,
      severity: String,
      file: String,
      recommendation: String
    }],
    architecturePatterns: {
      detected: [String],
      recommendations: [String]
    },
    performanceIssues: [{
      issue: String,
      file: String,
      impact: String,
      solution: String
    }],
    bestPractices: {
      followed: [String],
      missing: [String]
    },
    technicalDebt: [String]
  },
  
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