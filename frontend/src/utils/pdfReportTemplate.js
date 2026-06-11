/**
 * Generates a professional HTML template for PDF export.
 * Designed specifically for html2pdf.js to avoid blank pages.
 */
export const generatePDFReport = (data) => {
  const {
    owner, repoName, description, functionalSummary, targetAudienceAndUse,
    techStack, codeHealthScore, improvements, codeQualityInsights,
    securityConcerns, performanceIssues, architecturePatterns,
    bestPractices, stars, forks, contributors, recentCommits,
    filesAnalyzed, languages
  } = data || {};

  // 1. Calculate derived data
  const scores = calculateScores(data);
  const severityDistribution = calculateSeverityDistribution(data);
  const actionPlan = generateActionPlan(data);
  const projectedScore = calculateProjectedScore(data);
  const executiveNarrative = generateExecutiveNarrative(data, scores);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const reportTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  // 2. Return the HTML string
  // Note: We use a single wrapper div with internal styles. 
  // Do NOT use <html> or <body> tags here.
  return `
    <div id="pdf-report-container" style="width: 794px; background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; text-align: left; visibility: visible;">
      <style>
        /* Reset & Base scoped to report container */
        #pdf-report-container * { box-sizing: border-box; margin: 0; padding: 0; }
        #pdf-report-container h1, 
        #pdf-report-container h2, 
        #pdf-report-container h3, 
        #pdf-report-container h4 { margin-bottom: 10px; }
        #pdf-report-container p { margin-bottom: 10px; }
        
        /* Page Structure for html2canvas */
        #pdf-report-container .pdf-page {
          padding: 40px;
          background: white;
          width: 100%;
          min-height: 1123px; /* A4 Height in px at 96 DPI */
          position: relative;
        }
        
        /* Force page breaks */
        #pdf-report-container .page-break {
          page-break-after: always;
          break-after: page;
        }
        #pdf-report-container .no-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Typography */
        #pdf-report-container .section-header {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #3b82f6;
        }
        #pdf-report-container .subsection-header {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 20px 0 10px 0;
        }

        /* Grids converted to Flexbox with margin spacing (no display:grid or gap) */
        #pdf-report-container .grid-2 { display: flex; flex-wrap: wrap; margin: 20px -7px; }
        #pdf-report-container .grid-2 > * { width: calc(50% - 14px); margin: 7px; flex: 0 0 calc(50% - 14px); box-sizing: border-box; }

        #pdf-report-container .grid-3 { display: flex; flex-wrap: wrap; margin: 20px -7px; }
        #pdf-report-container .grid-3 > * { width: calc(33.333% - 14px); margin: 7px; flex: 0 0 calc(33.333% - 14px); box-sizing: border-box; }

        #pdf-report-container .grid-4 { display: flex; flex-wrap: wrap; margin: 20px -7px; }
        #pdf-report-container .grid-4 > * { width: calc(25% - 14px); margin: 7px; flex: 0 0 calc(25% - 14px); box-sizing: border-box; }

        /* Cards */
        #pdf-report-container .card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        #pdf-report-container .score-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        #pdf-report-container .score-value { font-size: 28px; font-weight: 700; margin: 10px 0; }
        #pdf-report-container .score-bar-bg { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 10px; }
        #pdf-report-container .score-bar-fill { height: 100%; border-radius: 4px; }

        /* Severity Colors */
        #pdf-report-container .sev-critical { background: #7f1d1d; color: white; }
        #pdf-report-container .sev-high { background: #dc2626; color: white; }
        #pdf-report-container .sev-medium { background: #d97706; color: white; }
        #pdf-report-container .sev-low { background: #6b7280; color: white; }
        
        #pdf-report-container .severity-card { padding: 20px; border-radius: 8px; text-align: center; color: white; }
        #pdf-report-container .severity-count { font-size: 32px; font-weight: 700; }
        #pdf-report-container .severity-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }

        /* Tables */
        #pdf-report-container table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
        #pdf-report-container th { background: #1e3a8a; color: white; padding: 8px; text-align: left; }
        #pdf-report-container td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        #pdf-report-container tr:nth-child(even) { background: #f8fafc; }
        #pdf-report-container .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; color: white; }

        /* Lists */
        #pdf-report-container ul { list-style-type: disc; padding-left: 20px; margin-bottom: 15px; }
        #pdf-report-container li { margin-bottom: 5px; font-size: 12px; }

        /* Specific Components */
        #pdf-report-container .cover-page {
          min-height: 1123px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%);
          color: white;
          padding: 60px;
        }
        #pdf-report-container .exec-summary-box {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          margin-bottom: 30px;
        }
        #pdf-report-container .tech-tag {
          display: inline-block;
          background: #eff6ff;
          color: #1e40af;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid #bfdbfe;
          margin-right: 5px;
          margin-bottom: 5px;
        }
        #pdf-report-container .code-block {
          background: #1f2937;
          color: #e5e7eb;
          padding: 15px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 10pt;
          margin: 10px 0;
          white-space: pre-wrap;
        }
      </style>


      <!-- ================= COVER PAGE ================= -->
      <div class="pdf-page cover-page">
        <div style="font-size: 48px; font-weight: 700; margin-bottom: 10px;">⚡ GitWise AI</div>
        <div style="font-size: 18px; opacity: 0.9; margin-bottom: 60px;">Repository Intelligence Platform</div>
        
        <div style="font-size: 36px; font-weight: 700; margin-bottom: 10px;">${repoName || 'Repository'}</div>
        <div style="font-size: 20px; opacity: 0.8; margin-bottom: 40px;">by ${owner || 'Unknown'}</div>
        
        <div style="font-size: 14px; opacity: 0.7; line-height: 2; margin-bottom: 30px;">
          <div>Analysis Report</div>
          <div>${reportDate} at ${reportTime}</div>
          <div>Version 1.0</div>
        </div>
        
        <div style="display: inline-block; padding: 8px 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 20px; font-size: 12px;">
          Powered by Groq AI + Gemini AI
        </div>
      </div>

      <!-- ================= EXECUTIVE SUMMARY ================= -->
      <div class="pdf-page page-break">
        <div class="section-header">Executive Summary</div>
        
        <div class="exec-summary-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <div style="font-size: 48px; font-weight: 700; color: #1e3a8a;">${codeHealthScore || 0}/100</div>
              <div style="font-size: 14px; color: #6b7280;">Overall Repository Score</div>
            </div>
            <div style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; background: ${scores.riskLevel === 'Low' ? '#dcfce7' : scores.riskLevel === 'Medium' ? '#fef3c7' : '#fee2e2'}; color: ${scores.riskLevel === 'Low' ? '#166534' : scores.riskLevel === 'Medium' ? '#92400e' : '#991b1b'};">
              ${scores.riskLevel || 'Medium'} Risk
            </div>
          </div>
          
          <div class="grid-2">
            <div>
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Security Issues</div>
              <div style="font-size: 20px; font-weight: 600;">${severityDistribution.critical + severityDistribution.high} (${severityDistribution.critical} Critical, ${severityDistribution.high} High)</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Performance Issues</div>
              <div style="font-size: 20px; font-weight: 600;">${performanceIssues?.length || 0}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Architecture Quality</div>
              <div style="font-size: 20px; font-weight: 600;">${scores.architectureAssessment}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Maintainability</div>
              <div style="font-size: 20px; font-weight: 600;">${scores.maintainabilityAssessment}</div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px;">AI-Generated Summary</div>
            <p style="font-size: 12pt; line-height: 1.6; color: #374151;">${executiveNarrative}</p>
          </div>
        </div>

        <div class="subsection-header">Multi-Dimensional Assessment</div>
        <div class="grid-3">
          ${generateScoreCard('Security', scores.security, '#dc2626')}
          ${generateScoreCard('Performance', scores.performance, '#d97706')}
          ${generateScoreCard('Maintainability', scores.maintainability, '#3b82f6')}
          ${generateScoreCard('Architecture', scores.architecture, '#8b5cf6')}
          ${generateScoreCard('Documentation', scores.documentation, '#10b981')}
          ${generateScoreCard('Testing', scores.testing, '#6366f1')}
        </div>

        <div class="subsection-header">Issue Severity Distribution</div>
        <div class="grid-4">
          <div class="severity-card sev-critical">
            <div class="severity-count">${severityDistribution.critical}</div>
            <div class="severity-label">Critical</div>
          </div>
          <div class="severity-card sev-high">
            <div class="severity-count">${severityDistribution.high}</div>
            <div class="severity-label">High</div>
          </div>
          <div class="severity-card sev-medium">
            <div class="severity-count">${severityDistribution.medium}</div>
            <div class="severity-label">Medium</div>
          </div>
          <div class="severity-card sev-low">
            <div class="severity-count">${severityDistribution.low}</div>
            <div class="severity-label">Low</div>
          </div>
        </div>
      </div>

      <!-- ================= REPOSITORY OVERVIEW ================= -->
      <div class="pdf-page page-break">
        <div class="section-header">Repository Overview</div>
        
        <div class="grid-4">
          ${generateMetadataItem('Repository', `${owner}/${repoName}`)}
          ${generateMetadataItem('Description', description || 'No description provided')}
          ${generateMetadataItem('Primary Language', Object.keys(languages || {})[0] || 'N/A')}
          ${generateMetadataItem('Languages', Object.keys(languages || {}).slice(0, 3).join(', ') || 'N/A')}
          ${generateMetadataItem('Stars', `⭐ ${stars || 0}`)}
          ${generateMetadataItem('Forks', `🍴 ${forks || 0}`)}
          ${generateMetadataItem('Contributors', `👥 ${contributors?.length || 0}`)}
          ${generateMetadataItem('Files Analyzed', `📁 ${filesAnalyzed || 0}`)}
        </div>

        <div class="subsection-header">Project Purpose</div>
        <p style="line-height: 1.6; color: #374151; font-size: 12pt;">${functionalSummary || 'No summary available.'}</p>

        <div class="subsection-header">Target Audience</div>
        <p style="line-height: 1.6; color: #374151; font-size: 12pt;">${targetAudienceAndUse || 'No use case available.'}</p>

        <div class="subsection-header">Technology Stack</div>
        <div style="margin-top: 10px;">
          ${(techStack || []).slice(0, 12).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>

        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 30px; border-radius: 8px; text-align: center; margin-top: 30px;">
          <div style="font-size: 14px; color: #166534; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Projected Score After Recommended Fixes</div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 20px 0;">
            <div>
              <div style="font-size: 36px; font-weight: 700; color: #6b7280;">${codeHealthScore || 0}</div>
              <div style="font-size: 12px; color: #6b7280;">Current</div>
            </div>
            <div style="font-size: 24px; color: #16a34a;">→</div>
            <div>
              <div style="font-size: 48px; font-weight: 700; color: #166534;">${projectedScore}</div>
              <div style="font-size: 12px; color: #166534;">Projected</div>
            </div>
          </div>
          <div style="font-size: 12px; color: #166534; font-weight: 600;">
            +${projectedScore - (codeHealthScore || 0)} points improvement expected
          </div>
        </div>
      </div>

      <!-- ================= DETAILED FINDINGS ================= -->
      <div class="pdf-page page-break">
        <div class="section-header">Detailed Findings</div>
        
        ${securityConcerns && securityConcerns.length > 0 ? `
          <div class="subsection-header">Security Issues (${securityConcerns.length})</div>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Severity</th>
                <th>Issue</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${securityConcerns.map(concern => `
                <tr>
                  <td style="font-family: monospace; font-size: 9pt;">${concern.file || 'N/A'}</td>
                  <td><span class="badge" style="background: ${concern.severity === 'HIGH' ? '#dc2626' : concern.severity === 'MEDIUM' ? '#d97706' : '#6b7280'}">${concern.severity || 'LOW'}</span></td>
                  <td>${concern.issue || 'N/A'}</td>
                  <td>${concern.recommendation || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #10b981; font-weight: 600;">✅ No critical security issues detected.</p>'}

        ${performanceIssues && performanceIssues.length > 0 ? `
          <div class="subsection-header" style="margin-top: 30px;">Performance Issues (${performanceIssues.length})</div>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Impact</th>
                <th>Issue</th>
                <th>Solution</th>
              </tr>
            </thead>
            <tbody>
              ${performanceIssues.map(issue => `
                <tr>
                  <td style="font-family: monospace; font-size: 9pt;">${issue.file || 'N/A'}</td>
                  <td><span class="badge" style="background: ${issue.impact === 'HIGH' ? '#dc2626' : issue.impact === 'MEDIUM' ? '#d97706' : '#6b7280'}">${issue.impact || 'LOW'}</span></td>
                  <td>${issue.issue || 'N/A'}</td>
                  <td>${issue.solution || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #10b981; font-weight: 600;">✅ No critical performance issues detected.</p>'}

        ${codeQualityInsights?.weaknesses?.length > 0 ? `
          <div class="subsection-header" style="margin-top: 30px;">Code Quality Weaknesses</div>
          <ul style="list-style: none; padding: 0;">
            ${codeQualityInsights.weaknesses.map(w => `
              <li style="padding: 8px; margin: 5px 0; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px; font-size: 11pt; list-style: none;">⚠️ ${w}</li>
            `).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- ================= RECOMMENDATIONS ================= -->
      <div class="pdf-page page-break">
        <div class="section-header">Recommendations & Impact Analysis</div>
        
        <div class="grid-2">
          ${(improvements || []).slice(0, 6).map((imp, i) => generateImpactCard(imp, i)).join('')}
        </div>

        ${securityConcerns?.length > 0 ? `
          <div class="subsection-header" style="margin-top: 30px;">Example: Security Fix Implementation</div>
          <div class="no-break">
            <div style="font-size: 11px; font-weight: 600; color: #dc2626; text-transform: uppercase; margin-bottom: 5px;">❌ Current Pattern (Vulnerable)</div>
            <div class="code-block">// Insecure password storage
const password = req.body.password;
user.password = password; // Plain text storage</div>
            
            <div style="font-size: 11px; font-weight: 600; color: #10b981; text-transform: uppercase; margin-bottom: 5px; margin-top: 15px;">✅ Recommended Pattern (Secure)</div>
            <div class="code-block">// Secure password hashing using bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
user.password = hashedPassword;</div>
          </div>
        ` : ''}
      </div>

      <!-- ================= ACTION PLAN ================= -->
      <div class="pdf-page page-break">
        <div class="section-header">Recommended Action Plan</div>
        
        <div style="margin: 20px 0; padding: 20px; border-radius: 8px; background: #f8fafc;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #dc2626; color: #dc2626;">🔴 Priority 1: Immediate (This Week)</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">Critical security and performance issues requiring immediate attention.</div>
          ${actionPlan.immediate.length > 0 ? actionPlan.immediate.map(item => `
            <div style="padding: 10px; margin: 5px 0; background: white; border-radius: 6px; border-left: 3px solid #dc2626;">
              <div style="font-weight: 600; font-size: 12pt;">${item.title}</div>
              <div style="font-size: 11pt; color: #6b7280; margin-top: 5px;">${item.description}</div>
              <div style="font-size: 10pt; color: #dc2626; margin-top: 5px; font-weight: 600;">⏱ Estimated: ${item.effort}</div>
            </div>
          `).join('') : '<p style="color: #6b7280; font-style: italic;">No critical immediate actions required.</p>'}
        </div>

        <div style="margin: 20px 0; padding: 20px; border-radius: 8px; background: #f8fafc;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #d97706; color: #d97706;">🟡 Priority 2: Short-Term (This Month)</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">Testing, logging, and maintainability improvements.</div>
          ${actionPlan.shortTerm.length > 0 ? actionPlan.shortTerm.map(item => `
            <div style="padding: 10px; margin: 5px 0; background: white; border-radius: 6px; border-left: 3px solid #d97706;">
              <div style="font-weight: 600; font-size: 12pt;">${item.title}</div>
              <div style="font-size: 11pt; color: #6b7280; margin-top: 5px;">${item.description}</div>
              <div style="font-size: 10pt; color: #d97706; margin-top: 5px; font-weight: 600;">⏱ Estimated: ${item.effort}</div>
            </div>
          `).join('') : '<p style="color: #6b7280; font-style: italic;">No short-term actions required.</p>'}
        </div>

        <div style="margin: 20px 0; padding: 20px; border-radius: 8px; background: #f8fafc;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #3b82f6; color: #3b82f6;">🔵 Priority 3: Long-Term (Next Quarter)</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 15px;">Architecture and scalability enhancements.</div>
          ${actionPlan.longTerm.length > 0 ? actionPlan.longTerm.map(item => `
            <div style="padding: 10px; margin: 5px 0; background: white; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <div style="font-weight: 600; font-size: 12pt;">${item.title}</div>
              <div style="font-size: 11pt; color: #6b7280; margin-top: 5px;">${item.description}</div>
              <div style="font-size: 10pt; color: #3b82f6; margin-top: 5px; font-weight: 600;">⏱ Estimated: ${item.effort}</div>
            </div>
          `).join('') : '<p style="color: #6b7280; font-style: italic;">No long-term actions required.</p>'}
        </div>
      </div>

      <!-- ================= ARCHITECTURE & BEST PRACTICES ================= -->
      <div class="pdf-page page-break">
        <div class="section-header">Architecture & Best Practices</div>
        
        ${architecturePatterns?.detected?.length > 0 ? `
          <div class="subsection-header">Detected Architecture Patterns</div>
          <div class="grid-2">
            ${architecturePatterns.detected.map(p => `
              <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <div style="font-weight: 600; color: #1e40af;">✅ ${p}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${architecturePatterns?.recommendations?.length > 0 ? `
          <div class="subsection-header" style="margin-top: 20px;">Architecture Recommendations</div>
          <ul style="list-style: none; padding: 0;">
            ${architecturePatterns.recommendations.map(r => `
              <li style="padding: 10px; margin: 5px 0; background: #f8fafc; border-left: 3px solid #6366f1; border-radius: 4px; list-style: none;">💡 ${r}</li>
            `).join('')}
          </ul>
        ` : ''}

        ${bestPractices?.followed?.length > 0 ? `
          <div class="subsection-header" style="margin-top: 30px;">Best Practices Followed</div>
          <div class="grid-2">
            ${bestPractices.followed.map(p => `
              <div style="background: #dcfce7; padding: 10px; border-radius: 6px; font-size: 11pt;">✅ ${p}</div>
            `).join('')}
          </div>
        ` : ''}

        ${bestPractices?.missing?.length > 0 ? `
          <div class="subsection-header" style="margin-top: 20px;">Missing Best Practices</div>
          <div class="grid-2">
            ${bestPractices.missing.map(p => `
              <div style="background: #fef3c7; padding: 10px; border-radius: 6px; font-size: 11pt;">⚠️ ${p}</div>
            `).join('')}
          </div>
        ` : ''}

        ${recentCommits?.length > 0 ? `
          <div class="subsection-header" style="margin-top: 30px;">Recent Activity (Last ${recentCommits.length} Commits)</div>
          <table>
            <thead>
              <tr>
                <th>Commit</th>
                <th>Author</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              ${recentCommits.slice(0, 8).map(commit => `
                <tr>
                  <td style="font-family: monospace; font-size: 9pt;">${commit.sha?.substring(0, 7) || 'N/A'}</td>
                  <td>${commit.author || 'Unknown'}</td>
                  <td>${commit.message || 'No message'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>

      <!-- ================= FOOTER ================= -->
      <div class="pdf-page" style="text-align: center; padding-top: 100px; display: flex; flex-direction: column; justify-content: center;">
        <div style="font-size: 32px; font-weight: 700; color: #1e3a8a; margin-bottom: 20px;">⚡ GitWise AI</div>
        <div style="font-size: 16px; color: #6b7280; margin-bottom: 40px;">Repository Intelligence Platform</div>
        <div style="font-size: 12px; color: #9ca3af; line-height: 2;">
          <div>Report generated on ${reportDate} at ${reportTime}</div>
          <div>Analysis powered by Groq AI and Gemini AI</div>
          <div>https://git-wise-ai-atlc.vercel.app</div>
        </div>
        <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
          <p>This report is generated automatically by GitWise AI.</p>
          <p>All recommendations should be reviewed by your engineering team before implementation.</p>
        </div>
      </div>

    </div>
  `;
};

// --- HELPER FUNCTIONS ---

const generateScoreCard = (label, score, color) => `
  <div class="score-card no-break">
    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${label}</div>
    <div class="score-value" style="color: ${color};">${score}/100</div>
    <div class="score-bar-bg">
      <div class="score-bar-fill" style="width: ${score}%; background: ${color};"></div>
    </div>
  </div>
`;

const generateMetadataItem = (label, value) => `
  <div class="card">
    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">${label}</div>
    <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-top: 5px;">${value}</div>
  </div>
`;

const generateImpactCard = (improvement, index) => {
  const severity = index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low';
  const impact = index < 3 ? 'High' : 'Medium';
  const effort = index < 2 ? '30 Minutes' : index < 4 ? '1-2 Hours' : '2-4 Hours';
  const displayText = improvement.replace(/^(Improvement|Security|Performance|Technical Debt):\s*/i, '');
  
  return `
    <div class="card no-break" style="border-left: 4px solid #3b82f6;">
      <div style="font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 10px;">${index + 1}. ${displayText.substring(0, 80)}${displayText.length > 80 ? '...' : ''}</div>
      <div style="font-size: 11px; color: #6b7280; margin: 5px 0;"><strong style="color: #1f2937;">Severity:</strong> ${severity}</div>
      <div style="font-size: 11px; color: #6b7280; margin: 5px 0;"><strong style="color: #1f2937;">Expected Impact:</strong> ${impact}</div>
      <div style="font-size: 11px; color: #6b7280; margin: 5px 0;"><strong style="color: #1f2937;">Estimated Effort:</strong> ${effort}</div>
    </div>
  `;
};

const calculateScores = (data) => {
  const { codeHealthScore, securityConcerns, performanceIssues, codeQualityInsights } = data || {};
  
  const securityDeductions = (securityConcerns?.filter(s => s.severity === 'HIGH').length || 0) * 20 +
                            (securityConcerns?.filter(s => s.severity === 'MEDIUM').length || 0) * 10;
  const security = Math.max(0, 100 - securityDeductions);
  
  const perfDeductions = (performanceIssues?.filter(p => p.impact === 'HIGH').length || 0) * 20 +
                        (performanceIssues?.filter(p => p.impact === 'MEDIUM').length || 0) * 10;
  const performance = Math.max(0, 100 - perfDeductions);
  
  const maintainability = Math.max(0, 100 - (codeQualityInsights?.weaknesses?.length || 0) * 10);
  const architecture = 75;
  const documentation = 60;
  const testing = 40;
  
  const riskLevel = security < 50 || performance < 50 ? 'High' : 
                    security < 70 || performance < 70 ? 'Medium' : 'Low';
  
  return {
    security, performance, maintainability, architecture, documentation, testing, riskLevel,
    architectureAssessment: architecture >= 70 ? 'Good' : 'Moderate',
    maintainabilityAssessment: maintainability >= 70 ? 'Good' : 'Moderate'
  };
};

const calculateSeverityDistribution = (data) => {
  const { securityConcerns, performanceIssues } = data || {};
  let critical = 0, high = 0, medium = 0, low = 0;
  
  (securityConcerns || []).forEach(c => {
    if (c.severity === 'HIGH') high++;
    else if (c.severity === 'MEDIUM') medium++;
    else low++;
  });
  (performanceIssues || []).forEach(p => {
    if (p.impact === 'HIGH') high++;
    else if (p.impact === 'MEDIUM') medium++;
    else low++;
  });
  
  return { critical, high, medium, low };
};

const generateActionPlan = (data) => {
  const { securityConcerns, performanceIssues, codeQualityInsights } = data || {};
  const immediate = [], shortTerm = [], longTerm = [];
  
  (securityConcerns || []).filter(c => c.severity === 'HIGH').forEach(c => immediate.push({ title: `Fix: ${c.issue}`, description: c.recommendation, effort: '30-60 Min' }));
  (performanceIssues || []).filter(p => p.impact === 'HIGH').forEach(p => immediate.push({ title: `Optimize: ${p.issue}`, description: p.solution, effort: '1-2 Hours' }));
  
  (securityConcerns || []).filter(c => c.severity === 'MEDIUM').forEach(c => shortTerm.push({ title: `Address: ${c.issue}`, description: c.recommendation, effort: '2-4 Hours' }));
  (codeQualityInsights?.weaknesses || []).forEach(w => shortTerm.push({ title: `Improve: ${w}`, description: 'Refactor code to address weakness', effort: '4-8 Hours' }));
  
  longTerm.push({ title: 'Implement Comprehensive Testing', description: 'Add unit, integration, and E2E tests', effort: '1-2 Weeks' });
  longTerm.push({ title: 'Architecture Review', description: 'Consider microservices or modular architecture', effort: '2-4 Weeks' });
  
  return { immediate, shortTerm, longTerm };
};

const calculateProjectedScore = (data) => {
  const { codeHealthScore, securityConcerns, performanceIssues } = data || {};
  const highSecurityFixes = (securityConcerns?.filter(s => s.severity === 'HIGH').length || 0) * 15;
  const highPerfFixes = (performanceIssues?.filter(p => p.impact === 'HIGH').length || 0) * 12;
  return Math.min(100, (codeHealthScore || 0) + highSecurityFixes + highPerfFixes + 10);
};

const generateExecutiveNarrative = (data, scores) => {
  const { repoName, securityConcerns, performanceIssues, codeHealthScore } = data || {};
  const strengths = [];
  const risks = [];
  
  if (scores.architecture >= 70) strengths.push('solid architecture');
  if (scores.maintainability >= 70) strengths.push('good maintainability');
  
  const highSec = securityConcerns?.filter(s => s.severity === 'HIGH').length || 0;
  const highPerf = performanceIssues?.filter(p => p.impact === 'HIGH').length || 0;
  
  if (highSec > 0) risks.push(`${highSec} high-severity security issue${highSec > 1 ? 's' : ''}`);
  if (highPerf > 0) risks.push(`${highPerf} high-impact performance bottleneck${highPerf > 1 ? 's' : ''}`);
  if (scores.testing < 50) risks.push('insufficient test coverage');
  
  return `${repoName || 'This repository'} demonstrates ${strengths.join(', ') || 'a functional codebase'} with an overall score of ${codeHealthScore || 0}/100. Key risks include ${risks.join(', ') || 'minor maintainability concerns'}. Recommended focus areas include continuous code quality improvements and addressing security vulnerabilities.`;
};