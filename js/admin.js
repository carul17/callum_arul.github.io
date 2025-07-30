class PortfolioAdmin {
    constructor() {
        this.isAuthenticated = false;
        this.currentTheme = 'dark-purple';
        this.portfolioData = {};
        this.adminPassword = 'admin123'; // Change this to a secure password
    }
    
    async init() {
        await this.loadPortfolioData();
        this.setupEventListeners();
        this.checkAuthentication();
    }
    
    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        // Admin controls
        document.getElementById('theme-selector').addEventListener('click', () => {
            this.toggleThemeSelector();
        });
        
        document.getElementById('save-changes').addEventListener('click', () => {
            this.saveChanges();
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectTheme(e.currentTarget.dataset.theme);
            });
        });
        
        // Add buttons
        document.getElementById('add-experience').addEventListener('click', () => {
            this.addExperienceItem();
        });
        
        document.getElementById('add-project').addEventListener('click', () => {
            this.addProjectItem();
        });
        
        document.getElementById('add-skill-category').addEventListener('click', () => {
            this.addSkillCategory();
        });
    }
    
    async checkAuthentication() {
        const isAuth = localStorage.getItem('portfolio_admin_auth');
        if (isAuth === 'true') {
            this.isAuthenticated = true;
            await this.showAdminPanel();
        } else {
            this.showLoginModal();
        }
    }
    
    async handleLogin() {
        const password = document.getElementById('admin-password').value;
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            localStorage.setItem('portfolio_admin_auth', 'true');
            await this.showAdminPanel();
        } else {
            this.showMessage('Invalid password', 'error');
        }
    }
    
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('portfolio_admin_auth');
        this.showLoginModal();
    }
    
    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
    }
    
    async showAdminPanel() {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        
        // Force reload data to ensure we have the latest
        console.log('Showing admin panel, reloading data...');
        await this.loadPortfolioData();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.populateFields();
        }, 100);
    }
    
    toggleThemeSelector() {
        const selector = document.getElementById('theme-options');
        selector.classList.toggle('hidden');
    }
    
    selectTheme(theme) {
        this.currentTheme = theme;
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        const selectedOption = document.querySelector(`[data-theme="${theme}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
        this.applyTheme(theme);
    }
    
    applyTheme(theme) {
        // Apply theme to the admin panel itself
        const themes = {
            'dark-purple': {
                '--primary-bg': '#0a0a0f',
                '--secondary-bg': '#1a0a1f',
                '--card-bg': '#1a1625',
                '--accent-color': '#a855f7',
                '--text-color': '#e2e8f0'
            },
            'blue-ocean': {
                '--primary-bg': '#0f172a',
                '--secondary-bg': '#1e3a8a',
                '--card-bg': '#1e40af',
                '--accent-color': '#3b82f6',
                '--text-color': '#e2e8f0'
            },
            'green-forest': {
                '--primary-bg': '#064e3b',
                '--secondary-bg': '#166534',
                '--card-bg': '#15803d',
                '--accent-color': '#22c55e',
                '--text-color': '#f0fdf4'
            }
        };
        
        const root = document.documentElement;
        const themeColors = themes[theme] || themes['dark-purple'];
        
        Object.entries(themeColors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        // Save theme preference
        localStorage.setItem('portfolio_theme', theme);
        
        // Also update the main portfolio if it's open
        this.updateMainPortfolio();
    }
    
    async loadPortfolioData() {
        // Always load from the original parsed resume data first
        await this.loadOriginalResumeData();
        
        // Then check if there are any saved changes in localStorage
        const savedData = localStorage.getItem('portfolio_data');
        if (savedData) {
            try {
                const localData = JSON.parse(savedData);
                console.log('Found saved local changes, merging with original data...');
                // Merge saved changes with original data
                this.portfolioData = { ...this.portfolioData, ...localData };
            } catch (e) {
                console.error('Error parsing saved data:', e);
            }
        }
        
        console.log('Final portfolio data after loading:', this.portfolioData);
    }
    
    async loadOriginalResumeData() {
        try {
            console.log('Attempting to fetch parsed_resume.json...');
            const response = await fetch('parsed_resume.json');
            
            if (response.ok) {
                const data = await response.json();
                console.log('Raw loaded data:', data);
                
                this.portfolioData = data;
                
                // Ensure all required sections exist with proper fallbacks
                if (!this.portfolioData.personal_info) {
                    this.portfolioData.personal_info = {};
                }
                
                // Set defaults for personal info if missing
                if (!this.portfolioData.personal_info.name) {
                    this.portfolioData.personal_info.name = 'Your Name';
                }
                if (!this.portfolioData.personal_info.title) {
                    this.portfolioData.personal_info.title = 'Your Title';
                }
                if (!this.portfolioData.personal_info.hero_description) {
                    this.portfolioData.personal_info.hero_description = 'Building software solutions and bringing ideas to life through code.';
                }
                if (!this.portfolioData.personal_info.about_description) {
                    this.portfolioData.personal_info.about_description = 'I work with modern technologies to create software solutions that solve real problems.';
                }
                
                // Ensure arrays exist
                if (!this.portfolioData.work_experience) {
                    this.portfolioData.work_experience = [];
                }
                if (!this.portfolioData.projects) {
                    this.portfolioData.projects = [];
                }
                if (!this.portfolioData.skills) {
                    this.portfolioData.skills = {};
                }
                
                console.log('Final structured data:', this.portfolioData);
                console.log('Work experience count:', this.portfolioData.work_experience.length);
                console.log('Projects count:', this.portfolioData.projects.length);
                console.log('Skills keys:', Object.keys(this.portfolioData.skills));
                
            } else {
                console.error('Failed to fetch parsed_resume.json, status:', response.status);
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading resume data:', error);
            // Set completely empty fallback
            this.portfolioData = {
                personal_info: {
                    name: 'Your Name',
                    title: 'Your Title',
                    hero_description: 'Building software solutions and bringing ideas to life through code.',
                    about_description: 'I work with modern technologies to create software solutions that solve real problems.'
                },
                work_experience: [],
                projects: [],
                skills: {}
            };
        }
    }
    
    populateFields() {
        console.log('=== POPULATING FIELDS ===');
        console.log('Portfolio data:', this.portfolioData);
        
        const personal = this.portfolioData.personal_info || {};
        
        // Populate personal info fields
        const nameField = document.getElementById('edit-name');
        const titleField = document.getElementById('edit-title');
        const heroField = document.getElementById('edit-hero-description');
        const aboutField = document.getElementById('edit-about-description');
        
        if (nameField) {
            nameField.value = personal.name || '';
            console.log('Set name field to:', personal.name);
        }
        if (titleField) {
            titleField.value = personal.title || '';
            console.log('Set title field to:', personal.title);
        }
        if (heroField) {
            heroField.value = personal.hero_description || '';
            console.log('Set hero field to:', personal.hero_description);
        }
        if (aboutField) {
            aboutField.value = personal.about_description || '';
            console.log('Set about field to:', personal.about_description);
        }
        
        // Populate sections with detailed logging
        console.log('About to populate experience with:', this.portfolioData.work_experience);
        this.populateExperience();
        
        console.log('About to populate projects with:', this.portfolioData.projects);
        this.populateProjects();
        
        console.log('About to populate skills with:', this.portfolioData.skills);
        this.populateSkills();
        
        // Load and apply saved theme
        const savedTheme = localStorage.getItem('portfolio_theme') || 'dark-purple';
        this.currentTheme = savedTheme;
        this.selectTheme(savedTheme);
        
        console.log('=== FIELDS POPULATION COMPLETE ===');
    }
    
    populateExperience() {
        const container = document.getElementById('experience-list');
        container.innerHTML = '';
        
        const experiences = this.portfolioData.work_experience || [];
        console.log('Populating experiences:', experiences);
        
        if (experiences.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No work experience found. Click "Add Experience" to add entries.</p>';
            return;
        }
        
        experiences.forEach((exp, index) => {
            this.createExperienceItem(exp, index, container);
        });
    }
    
    createExperienceItem(exp, index, container) {
        const item = document.createElement('div');
        item.className = 'experience-item';
        
        // Handle description - convert arrays to strings and clean up formatting
        let description = exp.description || '';
        if (Array.isArray(description)) {
            description = description.join('\n• ');
            if (description) description = '• ' + description;
        } else if (typeof description === 'string') {
            // Clean up HTML tags and format nicely
            description = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
        }
        
        item.innerHTML = `
            <div class="item-header">
                <span class="item-title">${exp.position || exp.title || 'New Experience'}</span>
                <div class="item-controls">
                    <button class="item-btn delete" onclick="admin.removeExperience(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-fields">
                <div class="item-field">
                    <label>Position</label>
                    <input type="text" value="${exp.position || exp.title || ''}" onchange="admin.updateExperience(${index}, 'position', this.value)">
                </div>
                <div class="item-field">
                    <label>Company</label>
                    <input type="text" value="${exp.company || ''}" onchange="admin.updateExperience(${index}, 'company', this.value)">
                </div>
                <div class="item-field">
                    <label>Duration</label>
                    <input type="text" value="${exp.duration || exp.dates || ''}" onchange="admin.updateExperience(${index}, 'duration', this.value)">
                </div>
                <div class="item-field">
                    <label>Location</label>
                    <input type="text" value="${exp.location || ''}" onchange="admin.updateExperience(${index}, 'location', this.value)">
                </div>
                <div class="item-field" style="grid-column: 1 / -1;">
                    <label>Description</label>
                    <textarea rows="4" onchange="admin.updateExperience(${index}, 'description', this.value)">${description}</textarea>
                </div>
            </div>
        `;
        container.appendChild(item);
    }
    
    populateProjects() {
        const container = document.getElementById('projects-list');
        container.innerHTML = '';
        
        const projects = this.portfolioData.projects || [];
        console.log('Populating projects:', projects);
        
        if (projects.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No projects found. Click "Add Project" to add entries.</p>';
            return;
        }
        
        projects.forEach((project, index) => {
            this.createProjectItem(project, index, container);
        });
    }
    
    createProjectItem(project, index, container) {
        const item = document.createElement('div');
        item.className = 'project-item';
        
        // Handle technologies array
        let technologies = project.technologies || project.tech_stack || [];
        if (Array.isArray(technologies)) {
            technologies = technologies.join(', ');
        } else if (typeof technologies === 'string') {
            technologies = technologies;
        } else {
            technologies = '';
        }
        
        // Handle description - convert arrays to strings and clean up formatting
        let description = project.description || '';
        if (Array.isArray(description)) {
            description = description.join('\n• ');
            if (description) description = '• ' + description;
        } else if (typeof description === 'string') {
            // Clean up HTML tags and format nicely
            description = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
        }
        
        item.innerHTML = `
            <div class="item-header">
                <span class="item-title">${project.name || project.title || 'New Project'}</span>
                <div class="item-controls">
                    <button class="item-btn delete" onclick="admin.removeProject(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-fields">
                <div class="item-field">
                    <label>Name</label>
                    <input type="text" value="${project.name || project.title || ''}" onchange="admin.updateProject(${index}, 'name', this.value)">
                </div>
                <div class="item-field">
                    <label>GitHub URL</label>
                    <input type="text" value="${project.github || project.repository || ''}" onchange="admin.updateProject(${index}, 'github', this.value)">
                </div>
                <div class="item-field">
                    <label>Live URL</label>
                    <input type="text" value="${project.link || project.url || ''}" onchange="admin.updateProject(${index}, 'link', this.value)">
                </div>
                <div class="item-field">
                    <label>Technologies (comma separated)</label>
                    <input type="text" value="${technologies}" onchange="admin.updateProject(${index}, 'technologies', this.value.split(',').map(t => t.trim()).filter(t => t))">
                </div>
                <div class="item-field" style="grid-column: 1 / -1;">
                    <label>Description</label>
                    <textarea rows="4" onchange="admin.updateProject(${index}, 'description', this.value)">${description}</textarea>
                </div>
            </div>
        `;
        container.appendChild(item);
    }
    
    populateSkills() {
        const container = document.getElementById('skills-list');
        container.innerHTML = '';
        
        const skills = this.portfolioData.skills || {};
        console.log('Populating skills:', skills);
        
        // Handle different skill formats
        let skillsToDisplay = {};
        
        if (Array.isArray(skills)) {
            // If skills is an array, create a default category
            skillsToDisplay = { "Technical Skills": skills };
        } else if (typeof skills === 'object' && skills !== null) {
            skillsToDisplay = skills;
        }
        
        if (Object.keys(skillsToDisplay).length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No skills found. Click "Add Skill Category" to add entries.</p>';
            return;
        }
        
        Object.entries(skillsToDisplay).forEach(([category, skillList]) => {
            this.createSkillCategoryItem(category, skillList, container);
        });
    }
    
    createSkillCategoryItem(category, skills, container) {
        const item = document.createElement('div');
        item.className = 'skill-category-item';
        
        // Handle skills array/string
        let skillsString = '';
        if (Array.isArray(skills)) {
            skillsString = skills.join(', ');
        } else if (typeof skills === 'string') {
            skillsString = skills;
        } else {
            skillsString = '';
        }
        
        // Escape category name for use in onclick handlers
        const escapedCategory = category.replace(/'/g, "\\'");
        
        item.innerHTML = `
            <div class="item-header">
                <span class="item-title">${category}</span>
                <div class="item-controls">
                    <button class="item-btn delete" onclick="admin.removeSkillCategory('${escapedCategory}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-fields">
                <div class="item-field">
                    <label>Category Name</label>
                    <input type="text" value="${category}" onchange="admin.updateSkillCategory('${escapedCategory}', 'name', this.value)">
                </div>
                <div class="item-field" style="grid-column: 1 / -1;">
                    <label>Skills (comma separated)</label>
                    <input type="text" value="${skillsString}" onchange="admin.updateSkillCategory('${escapedCategory}', 'skills', this.value.split(',').map(s => s.trim()).filter(s => s))">
                </div>
            </div>
        `;
        container.appendChild(item);
    }
    
    addExperienceItem() {
        if (!this.portfolioData.work_experience) {
            this.portfolioData.work_experience = [];
        }
        
        const newExp = {
            position: '',
            company: '',
            duration: '',
            location: '',
            description: ''
        };
        
        this.portfolioData.work_experience.push(newExp);
        this.populateExperience();
    }
    
    addProjectItem() {
        if (!this.portfolioData.projects) {
            this.portfolioData.projects = [];
        }
        
        const newProject = {
            name: '',
            description: '',
            technologies: [],
            github: '',
            link: ''
        };
        
        this.portfolioData.projects.push(newProject);
        this.populateProjects();
    }
    
    addSkillCategory() {
        const categoryName = prompt('Enter category name:');
        if (categoryName) {
            if (!this.portfolioData.skills) {
                this.portfolioData.skills = {};
            }
            this.portfolioData.skills[categoryName] = [];
            this.populateSkills();
        }
    }
    
    updateExperience(index, field, value) {
        if (this.portfolioData.work_experience[index]) {
            this.portfolioData.work_experience[index][field] = value;
        }
    }
    
    updateProject(index, field, value) {
        if (this.portfolioData.projects[index]) {
            this.portfolioData.projects[index][field] = value;
        }
    }
    
    updateSkillCategory(oldCategory, field, value) {
        if (field === 'name' && value !== oldCategory) {
            const skills = this.portfolioData.skills[oldCategory];
            delete this.portfolioData.skills[oldCategory];
            this.portfolioData.skills[value] = skills;
            this.populateSkills();
        } else if (field === 'skills') {
            this.portfolioData.skills[oldCategory] = value;
        }
    }
    
    removeExperience(index) {
        if (confirm('Are you sure you want to remove this experience?')) {
            this.portfolioData.work_experience.splice(index, 1);
            this.populateExperience();
        }
    }
    
    removeProject(index) {
        if (confirm('Are you sure you want to remove this project?')) {
            this.portfolioData.projects.splice(index, 1);
            this.populateProjects();
        }
    }
    
    removeSkillCategory(category) {
        if (confirm('Are you sure you want to remove this skill category?')) {
            delete this.portfolioData.skills[category];
            this.populateSkills();
        }
    }
    
    saveChanges() {
        // Update personal info
        this.portfolioData.personal_info = {
            ...this.portfolioData.personal_info,
            name: document.getElementById('edit-name').value,
            title: document.getElementById('edit-title').value,
            hero_description: document.getElementById('edit-hero-description').value,
            about_description: document.getElementById('edit-about-description').value
        };
        
        // Save to localStorage
        localStorage.setItem('portfolio_data', JSON.stringify(this.portfolioData));
        localStorage.setItem('portfolio_theme', this.currentTheme);
        
        // Also save to a downloadable JSON file
        this.downloadUpdatedData();
        
        this.showMessage('Changes saved successfully! Download the updated JSON file and regenerate your portfolio.', 'success');
        
        // Update the main portfolio if it's open in another tab
        this.updateMainPortfolio();
    }
    
    downloadUpdatedData() {
        const dataStr = JSON.stringify(this.portfolioData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'updated_resume_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    updateMainPortfolio() {
        // Send message to main portfolio window to update
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
                type: 'portfolio_update',
                data: this.portfolioData,
                theme: this.currentTheme
            }, '*');
        }
        
        // Also try to update any other portfolio windows
        try {
            const portfolioWindows = window.parent !== window ? [window.parent] : [];
            portfolioWindows.forEach(win => {
                if (win && !win.closed) {
                    win.postMessage({
                        type: 'portfolio_update',
                        data: this.portfolioData,
                        theme: this.currentTheme
                    }, '*');
                }
            });
        } catch (e) {
            // Ignore cross-origin errors
        }
    }
    
    showMessage(text, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        document.querySelector('.admin-header').after(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Initialize admin panel
let admin;

// Initialize admin panel asynchronously
(async function() {
    admin = new PortfolioAdmin();
    await admin.init();
    
    // Make admin globally available for onclick handlers
    window.admin = admin;
})();
