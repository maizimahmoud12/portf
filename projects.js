const STORAGE_KEYS = {
  projects: "portfolio_projects",
  settings: "portfolio_settings"
};

let allProjects = [];
let activeCategory = "All";

async function loadData(file, key) {
  const res = await fetch(`data/${file}.json?v=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load data/${file}.json`);
  const freshData = await res.json();

  localStorage.setItem(key, JSON.stringify(freshData));
  return freshData;
}

function initTheme(settings = {}) {
  const saved = localStorage.getItem("portfolio_theme") || settings.theme || "dark";
  document.body.classList.toggle("light", saved === "light");

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      "portfolio_theme",
      document.body.classList.contains("light") ? "light" : "dark"
    );
  });
}

function animateIn() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function renderFilters() {
  const categories = ["All", ...new Set(allProjects.map((p) => p.category).filter(Boolean))];
  const bar = document.getElementById("filterBar");
  if (!bar) return;

  bar.innerHTML = categories
    .map(
      (category) => `
        <button
          class="filter-btn ${category === activeCategory ? "active" : ""}"
          data-category="${category}">
          ${category}
        </button>
      `
    )
    .join("");

  bar.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderFilters();
      renderProjects();
    });
  });
}

function renderProjects() {
  const searchInput = document.getElementById("searchInput");
  const grid = document.getElementById("projectsGrid");
  const emptyState = document.getElementById("emptyState");

  if (!grid) return;

  const query = (searchInput?.value || "").trim().toLowerCase();

  const filtered = [...allProjects]
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .filter((project) => activeCategory === "All" || project.category === activeCategory)
    .filter((project) =>
      [
        project.title || "",
        project.shortDescription || "",
        ...(Array.isArray(project.stack) ? project.stack : [])
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );

  if (emptyState) {
    emptyState.classList.toggle("hidden", filtered.length !== 0);
  }

  grid.innerHTML = filtered
    .map((project) => {
      const tags = Array.isArray(project.stack)
        ? project.stack.map((item) => `<span class="tag">${item}</span>`).join("")
        : "";

      return `
        <article class="project-card reveal">
          <a class="card-link" href="project.html?id=${encodeURIComponent(project.id)}">
            <div class="card-image">
              <img src="${project.thumbnail || ""}" alt="${project.title || "Project image"}" loading="lazy">
            </div>

            <div class="card-content">
              <div class="card-meta">
                <span>${project.category || ""}</span>
                <span>${project.year || ""}</span>
              </div>

              <h3>${project.title || ""}</h3>
              <p>${project.shortDescription || ""}</p>

              <div class="tag-wrap">
                ${tags}
              </div>

              <div style="margin-top:1rem">
                <span class="card-link-text">Open project ↗</span>
              </div>
            </div>
          </a>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll(".card-image img").forEach((img) => {
    img.addEventListener("error", function () {
      this.style.display = "none";
      if (this.parentElement) {
        this.parentElement.style.background =
          "linear-gradient(135deg, rgba(181,140,255,.18), rgba(123,231,255,.12))";
      }
    });
  });

  animateIn();
}

(async function init() {
  try {
    const [projects, settings] = await Promise.all([
      loadData("projects", STORAGE_KEYS.projects),
      loadData("settings", STORAGE_KEYS.settings)
    ]);

    allProjects = Array.isArray(projects) ? projects : [];
    initTheme(settings || {});
    renderFilters();
    renderProjects();
    animateIn();

    document.getElementById("searchInput")?.addEventListener("input", renderProjects);
  } catch (error) {
    console.error("Failed to initialize projects page:", error);
  }
})();