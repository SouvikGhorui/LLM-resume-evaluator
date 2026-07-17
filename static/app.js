// ResumeMatch AI - Frontend Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('evaluation-form');
    const fileDropArea = document.getElementById('file-drop-area');
    const fileInput = document.getElementById('resumes');
    const fileList = document.getElementById('file-list');
    const submitBtn = document.getElementById('submit-btn');
    const jobDescTextarea = document.getElementById('job-description');
    
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const resultsContent = document.getElementById('results-content');
    const targetRoleBadge = document.getElementById('target-role-badge');
    const topCandidatesList = document.getElementById('top-candidates-list');
    const lowestCandidatesDivider = document.getElementById('lowest-candidates-divider');
    const lowestCandidatesSection = document.getElementById('lowest-candidates-section');
    const lowestCandidatesList = document.getElementById('lowest-candidates-list');

    // State
    let uploadedFiles = [];

    // ===========================
    // Drag & Drop Handlers
    // ===========================
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false); // Prevent browser default everywhere
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, () => fileDropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropArea.addEventListener(eventName, () => fileDropArea.classList.remove('dragover'), false);
    });

    fileDropArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFiles, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFiles(files);
        }
        // Clear input so same file can be re-selected
        fileInput.value = '';
    }

    function processFiles(fileList) {
        const validFiles = [];
        const invalidFiles = [];
        
        Array.from(fileList).forEach(file => {
            const ext = file.name.toLowerCase().split('.').pop();
            if (['pdf', 'docx'].includes(ext) && file.size <= 10 * 1024 * 1024) {
                validFiles.push(file);
            } else {
                invalidFiles.push({ file, reason: !['pdf', 'docx'].includes(ext) ? 'Invalid format (PDF/DOCX only)' : 'File too large (max 10MB)' });
            }
        });

        if (invalidFiles.length > 0) {
            showNotification(invalidFiles.map(f => `${f.file.name}: ${f.reason}`).join('\n'), 'error');
        }

        if (validFiles.length > 0) {
            // Add new files, avoiding duplicates by name+size
            validFiles.forEach(newFile => {
                const exists = uploadedFiles.some(f => f.name === newFile.name && f.size === newFile.size);
                if (!exists) {
                    uploadedFiles.push(newFile);
                }
            });
            updateFileList();
        }
    }

    function updateFileList() {
        fileList.innerHTML = '';
        if (uploadedFiles.length === 0) return;
        
        uploadedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">
                    <span class="file-icon">📄</span>
                    ${escapeHtml(file.name)}
                </span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button type="button" class="file-remove" data-index="${index}" aria-label="Remove file">✕</button>
            `;
            fileList.appendChild(li);
        });

        // Add remove handlers
        fileList.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.dataset.index, 10);
                uploadedFiles.splice(index, 1);
                updateFileList();
            });
        });
    }

    // ===========================
    // Form Submission
    // ===========================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (uploadedFiles.length === 0) {
            showNotification('Please upload at least one resume.', 'error');
            fileDropArea.focus();
            return;
        }

        const jobDesc = jobDescTextarea.value.trim();
        if (!jobDesc) {
            showNotification('Please enter a job description.', 'error');
            jobDescTextarea.focus();
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('job_description', jobDesc);
        uploadedFiles.forEach(file => {
            formData.append('resumes', file);
        });

        // UI Loading state
        setLoading(true);
        
        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errData.detail || `Server error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                renderResults(data);
                showNotification(`Evaluation complete! ${data.all_results.length} candidate(s) processed.`, 'success');
            } else {
                throw new Error(data.message || 'Evaluation failed');
            }
        } catch (error) {
            console.error('Evaluation error:', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.classList.toggle('loading', isLoading);
        submitBtn.disabled = isLoading;
        jobDescTextarea.disabled = isLoading;
        fileInput.disabled = isLoading;
        fileDropArea.style.pointerEvents = isLoading ? 'none' : 'auto';
        fileDropArea.style.opacity = isLoading ? '0.6' : '1';
    }

    // ===========================
    // Results Rendering
    // ===========================
    function renderResults(data) {
        // Switch views
        resultsPlaceholder.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        // Update role badge
        const minExp = data.minimum_experience !== null && data.minimum_experience !== undefined 
            ? `${data.minimum_experience} yrs` : 'Not specified';
        targetRoleBadge.textContent = `${data.target_role} (Min. ${minExp})`;

        // Clear previous
        topCandidatesList.innerHTML = '';
        lowestCandidatesList.innerHTML = '';

        // Render Top Candidates
        const topCandidates = data.top_candidates || [];
        if (topCandidates.length > 0) {
            topCandidates.forEach((cand, i) => {
                topCandidatesList.appendChild(createCandidateCard(cand, i));
            });
        } else {
            topCandidatesList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No matching candidates found.</p>';
        }

        // Render Other Candidates
        const lowestCandidates = data.lowest_candidates || [];
        const allResults = data.all_results || [];
        
        if (lowestCandidates.length > 0 && allResults.length > 2) {
            lowestCandidatesDivider.classList.remove('hidden');
            lowestCandidatesSection.classList.remove('hidden');
            lowestCandidates.forEach((cand, i) => {
                lowestCandidatesList.appendChild(createCandidateCard(cand, i + topCandidates.length));
            });
        } else {
            lowestCandidatesDivider.classList.add('hidden');
            lowestCandidatesSection.classList.add('hidden');
        }
    }

    function createCandidateCard(candidate, index) {
        const div = document.createElement('div');
        div.className = 'candidate-card';
        div.style.animationDelay = `${index * 0.05}s`;
        
        const score = candidate.Score ?? candidate.score ?? 0;
        let scoreClass = 'score-high';
        if (score < 50) scoreClass = 'score-low';
        else if (score < 75) scoreClass = 'score-medium';

        const details = candidate.details || {};
        const matchedSkills = details.matching_skills || details.matched_skills || [];
        const missingSkills = details.missing_important_skills || details.missing_skills || [];
        const verdict = details.final_verdict || details.verdict || 'No verdict available';

        div.innerHTML = `
            <div class="card-header">
                <h3>${escapeHtml(candidate.Name || candidate.name || 'Unknown Candidate')}</h3>
                <span class="score-badge ${scoreClass}">${score}%</span>
            </div>
            <div class="card-body">
                <p>${escapeHtml(verdict)}</p>
                
                ${matchedSkills.length > 0 ? `
                <div class="skills-section matched">
                    <h4>Matching Skills</h4>
                    <div class="skills-list">
                        ${matchedSkills.map(s => `<span class="skill-tag matched">${escapeHtml(s)}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${missingSkills.length > 0 ? `
                <div class="skills-section missing">
                    <h4>Missing Skills</h4>
                    <div class="skills-list">
                        ${missingSkills.map(s => `<span class="skill-tag missing">${escapeHtml(s)}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${matchedSkills.length === 0 && missingSkills.length === 0 ? `
                <div class="skills-section">
                    <h4>Skills</h4>
                    <div class="skills-list">
                        <span class="skill-tag empty">No skill data available</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        return div;
    }

    // ===========================
    // Utilities
    // ===========================
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Notification system
    let notificationContainer = null;
    
    function ensureNotificationContainer() {
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                pointer-events: none;
            `;
            document.body.appendChild(notificationContainer);
        }
        return notificationContainer;
    }

    function showNotification(message, type = 'info') {
        const container = ensureNotificationContainer();
        const notification = document.createElement('div');
        
        const colors = {
            success: { bg: 'rgba(16, 185, 129, 0.95)', border: 'rgba(16, 185, 129, 0.4)', icon: '✓' },
            error: { bg: 'rgba(239, 68, 68, 0.95)', border: 'rgba(239, 68, 68, 0.4)', icon: '✕' },
            info: { bg: 'rgba(139, 92, 246, 0.95)', border: 'rgba(139, 92, 246, 0.4)', icon: 'ℹ' },
            warning: { bg: 'rgba(245, 158, 11, 0.95)', border: 'rgba(245, 158, 11, 0.4)', icon: '⚠' }
        };
        
        const style = colors[type] || colors.info;
        
        notification.style.cssText = `
            background: ${style.bg};
            border: 1px solid ${style.border};
            border-radius: 10px;
            padding: 0.875rem 1.25rem;
            color: white;
            font-size: 0.875rem;
            line-height: 1.5;
            max-width: 350px;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            animation: slideIn 0.3s ease;
            pointer-events: auto;
            white-space: pre-wrap;
        `;
        
        notification.innerHTML = `
            <span style="flex-shrink: 0; font-weight: bold;">${style.icon}</span>
            <span>${escapeHtml(message)}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 6000 : 4000);
    }

    // Add notification animations
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Keyboard accessibility for file drop area
    fileDropArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
    fileDropArea.setAttribute('tabindex', '0');
    fileDropArea.setAttribute('role', 'button');
    fileDropArea.setAttribute('aria-label', 'Upload resumes');

    // Paste file support
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                files.push(items[i].getAsFile());
            }
        }
        if (files.length > 0) {
            processFiles(files);
            showNotification(`${files.length} file(s) pasted`, 'info');
        }
    });
});