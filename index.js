const STORAGE_KEYS = { profile: 'portfolio_profile', projects: 'portfolio_projects', settings: 'portfolio_settings' };

async function loadData(file, key) {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  const res = await fetch(`data/${file}.json`);
  return res.json();
}

function initTheme(settings) {
  const saved = localStorage.getItem('portfolio_theme') || settings.theme || 'dark';
  document.body.classList.toggle('light', saved === 'light');
  const btn = document.getElementById('themeToggle');
  btn?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('portfolio_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
}

function animateIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function projectCard(project) {
  return `
    <article class="project-card reveal">
      <div class="project-meta"><span>${project.category}</span><span>${project.year}</span></div>
      <h3>${project.title}</h3>
      <p>${project.shortDescription}</p>
      <div class="tag-wrap">${project.stack.map(item => `<span class="tag">${item}</span>`).join('')}</div>
      <div style="margin-top:1.3rem">
        <a class="text-link" href="project.html?id=${encodeURIComponent(project.id)}">Open project ↗</a>
      </div>
    </article>`;
}

(async function init() {
  const [profile, projects, settings] = await Promise.all([
    loadData('profile', STORAGE_KEYS.profile),
    loadData('projects', STORAGE_KEYS.projects),
    loadData('settings', STORAGE_KEYS.settings)
  ]);
fetch("data/projects.json")
  .then((res) => res.json())
  .then((projects) => {
    const container = document.getElementById("featured-projects");

    if (!container) return;

    // filter only featured projects
    const featured = projects
      .filter((p) => p.featured)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    if (featured.length === 0) {
      container.innerHTML = "<p>No featured projects yet.</p>";
      return;
    }

    container.innerHTML = "";

    featured.forEach((project) => {
      const card = document.createElement("div");
      card.className = "project-card";

      card.innerHTML = `
        <a href="project.html?id=${project.id}" class="card-link">
          <div class="card-image">
            <img src="${project.thumbnail}" alt="${project.title}">
          </div>

          <div class="card-content">
            <div class="card-meta">
              <span>${project.category}</span>
              <span>${project.year}</span>
            </div>

            <h3>${project.title}</h3>
            <p>${project.shortDescription}</p>

            <span class="card-link-text">View project ↗</span>
          </div>
        </a>
      `;

      // hide image if broken
      const img = card.querySelector("img");
      img.onerror = function () {
        this.style.display = "none";
      };

      container.appendChild(card);
    });
  })
  .catch((err) => console.error("Error loading projects:", err));
  initTheme(settings);
  animateIn();

  document.getElementById('heroName').textContent = profile.name;
  document.getElementById('heroRole').textContent = profile.role;
  document.getElementById('heroTagline').textContent = profile.tagline;
  document.getElementById('heroBio').textContent = profile.bio;
  document.getElementById('aboutBio').textContent = profile.bio;
  document.getElementById('contactEmail').textContent = profile.email;
  document.getElementById('contactEmail').href = `mailto:${profile.email}`;
  document.getElementById('contactLocation').textContent = profile.location;

  document.getElementById('highlightsList').innerHTML = profile.resumeHighlights.map(item => `<li>${item}</li>`).join('');
  document.getElementById('skillsList').innerHTML = profile.skills.map(item => `<span class="tag">${item}</span>`).join('');
  document.getElementById('heroStats').innerHTML = profile.heroStats.map(stat => `
    <div class="stat"><strong>${stat.value}</strong><span>${stat.label}</span></div>`).join('');

  const featured = [...projects].sort((a,b) => a.order - b.order).filter(p => p.featured).slice(0, settings.featuredLimit || 2);
  document.getElementById('featuredProjects').innerHTML = featured.map(projectCard).join('');
})();
