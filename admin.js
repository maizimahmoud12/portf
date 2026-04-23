const STORAGE_KEYS = {
  profile: 'portfolio_profile',
  projects: 'portfolio_projects',
  settings: 'portfolio_settings'
};

let profileData = null;
let projectsData = [];
let settingsData = null;

async function loadData(file, key) {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  const res = await fetch(`data/${file}.json`);
  return res.json();
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profileData));
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projectsData));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settingsData));
}

function initTheme(settings) {
  const saved = localStorage.getItem('portfolio_theme') || settings.theme || 'dark';
  document.body.classList.toggle('light', saved === 'light');
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('portfolio_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
}

function animateIn() {
  const observer = new IntersectionObserver((entries) => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function field(label, name, value = '', type = 'text') {
  const input = type === 'textarea'
    ? `<textarea name="${name}">${value || ''}</textarea>`
    : `<input type="${type}" name="${name}" value="${value || ''}" />`;
  return `<label><span>${label}</span>${input}</label>`;
}

function renderProfileForm() {
  const form = document.getElementById('profileForm');
  form.innerHTML = `
    ${field('Name', 'name', profileData.name)}
    ${field('Role', 'role', profileData.role)}
    ${field('Tagline', 'tagline', profileData.tagline, 'textarea')}
    ${field('Bio', 'bio', profileData.bio, 'textarea')}
    ${field('Location', 'location', profileData.location)}
    ${field('Email', 'email', profileData.email, 'email')}
    ${field('Skills (comma separated)', 'skills', (profileData.skills || []).join(', '), 'textarea')}
    ${field('CV Highlights (one per line)', 'resumeHighlights', (profileData.resumeHighlights || []).join('\n'), 'textarea')}
    <div class="save-row"><button class="btn btn-primary" type="submit">Save Profile</button></div>
  `;

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(form);
    profileData = {
      ...profileData,
      name: data.get('name'),
      role: data.get('role'),
      tagline: data.get('tagline'),
      bio: data.get('bio'),
      location: data.get('location'),
      email: data.get('email'),
      skills: String(data.get('skills')).split(',').map(v => v.trim()).filter(Boolean),
      resumeHighlights: String(data.get('resumeHighlights')).split('\n').map(v => v.trim()).filter(Boolean)
    };
    saveAll();
    alert('Profile saved to localStorage.');
  };
}

function projectFields(project) {
  return [
    field('ID / Slug', 'id', project.id),
    field('Title', 'title', project.title),
    field('Category', 'category', project.category),
    field('Year', 'year', project.year),
    field('Client', 'client', project.client),
    field('Short Description', 'shortDescription', project.shortDescription, 'textarea'),
    field('Description', 'description', project.description, 'textarea'),
    field('Stack (comma separated)', 'stack', (project.stack || []).join(', ')),
    field('Thumbnail Path', 'thumbnail', project.thumbnail),
    field('Video Path', 'video', project.video || ''),
    field('Gallery Paths (one per line)', 'gallery', (project.gallery || []).join('\n'), 'textarea'),
    field('Live URL', 'liveUrl', project.liveUrl || '#'),
    field('Repo URL', 'repoUrl', project.repoUrl || '#')
  ].join('');
}

function renderProjectsList() {
  const wrap = document.getElementById('projectList');
  wrap.innerHTML = '';
  const template = document.getElementById('projectEditorTemplate');

  projectsData.sort((a, b) => a.order - b.order).forEach((project, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.editor-title').textContent = project.title || 'Untitled Project';
    node.querySelector('.editor-grid').innerHTML = projectFields(project);

    node.querySelector('.move-up').onclick = () => moveProject(index, -1);
    node.querySelector('.move-down').onclick = () => moveProject(index, 1);
    node.querySelector('.delete-project').onclick = () => {
      projectsData.splice(index, 1);
      normalizeOrder();
      saveAll();
      renderProjectsList();
    };

    node.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => {
        const name = input.name;
        const value = input.value;
        if (name === 'stack') project.stack = value.split(',').map(v => v.trim()).filter(Boolean);
        else if (name === 'gallery') project.gallery = value.split('\n').map(v => v.trim()).filter(Boolean);
        else project[name] = value;
        if (name === 'title') node.querySelector('.editor-title').textContent = value || 'Untitled Project';
        saveAll();
      });
    });

    wrap.appendChild(node);
  });
}

function normalizeOrder() {
  projectsData.forEach((project, i) => { project.order = i + 1; });
}

function moveProject(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= projectsData.length) return;
  [projectsData[index], projectsData[target]] = [projectsData[target], projectsData[index]];
  normalizeOrder();
  saveAll();
  renderProjectsList();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify({ profile: profileData, projects: projectsData, settings: settingsData }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio-data-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed.profile) profileData = parsed.profile;
      if (parsed.projects) projectsData = parsed.projects;
      if (parsed.settings) settingsData = parsed.settings;
      saveAll();
      renderProfileForm();
      renderProjectsList();
      alert('Import successful.');
    } catch {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
}

(async function init() {
  [profileData, projectsData, settingsData] = await Promise.all([
    loadData('profile', STORAGE_KEYS.profile),
    loadData('projects', STORAGE_KEYS.projects),
    loadData('settings', STORAGE_KEYS.settings)
  ]);

  initTheme(settingsData);
  animateIn();

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    if (password === settingsData.adminPassword) {
      sessionStorage.setItem('portfolio_admin_auth', 'true');
      document.getElementById('loginCard').classList.add('hidden');
      document.getElementById('adminPanel').classList.remove('hidden');
      renderProfileForm();
      renderProjectsList();
    } else {
      document.getElementById('loginMessage').textContent = 'Incorrect password.';
    }
  });

  if (sessionStorage.getItem('portfolio_admin_auth') === 'true') {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderProfileForm();
    renderProjectsList();
  }

  document.getElementById('addProjectBtn').addEventListener('click', () => {
    projectsData.push({
      id: `project-${Date.now()}`,
      title: 'New Project',
      category: 'New Category',
      featured: false,
      year: new Date().getFullYear().toString(),
      client: 'Personal',
      stack: ['HTML', 'CSS', 'JavaScript'],
      shortDescription: 'Short summary here.',
      description: 'Detailed description here.',
      thumbnail: 'assets/images/placeholder.jpg',
      gallery: [],
      video: '',
      liveUrl: '#',
      repoUrl: '#',
      order: projectsData.length + 1
    });
    saveAll();
    renderProjectsList();
  });

  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('resetBtn').addEventListener('click', () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('portfolio_admin_auth');
    window.location.reload();
  });
  document.getElementById('importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importJSON(file);
  });
})();
