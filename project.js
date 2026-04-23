const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

fetch("data/projects.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load projects.json");
    }
    return response.json();
  })
  .then((projects) => {
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      document.body.innerHTML = `
        <main style="padding:40px;font-family:Arial,sans-serif;color:white;background:#0b0b12;min-height:100vh;">
          <h1>Project not found</h1>
          <p>The project you are looking for does not exist.</p>
          <a href="projects.html" style="color:#7dd3fc;">Back to projects</a>
        </main>
      `;
      return;
    }

    renderProject(project);
    renderRelatedProjects(projects, project);
    document.title = `${project.title} | Portfolio`;
  })
  .catch((error) => {
    console.error("Error:", error);
    document.body.innerHTML = `
      <main style="padding:40px;font-family:Arial,sans-serif;color:white;background:#0b0b12;min-height:100vh;">
        <h1>Error loading project</h1>
        <p>Please check your JSON file and paths.</p>
      </main>
    `;
  });

function renderProject(project) {
  const titleEl = document.querySelector("[data-project-title]");
  const categoryEl = document.querySelector("[data-project-category]");
  const yearEl = document.querySelector("[data-project-year]");
  const shortEl = document.querySelector("[data-project-short]");
  const clientEl = document.querySelector("[data-project-client]");
  const descEl = document.querySelector("[data-project-description]");
  const coverEl = document.querySelector("[data-project-cover]");
  const galleryEl = document.querySelector("[data-project-gallery]");
  const stackEl = document.querySelector("[data-project-stack]");
  const repoEl = document.querySelector("[data-project-repo]");
  const liveEl = document.querySelector("[data-project-live]");
  const repoEmptyEl = document.querySelector("[data-project-repo-empty]");
  const liveEmptyEl = document.querySelector("[data-project-live-empty]");
  const videoWrapperEl = document.querySelector("[data-project-video-wrapper]");
  const videoEl = document.querySelector("[data-project-video]");

  if (titleEl) titleEl.textContent = project.title || "";
  if (categoryEl) categoryEl.textContent = project.category || "";
  if (yearEl) yearEl.textContent = project.year || "";
  if (shortEl) shortEl.textContent = project.shortDescription || "";
  if (clientEl) clientEl.textContent = project.client || "";
  if (descEl) descEl.textContent = project.description || "";

  if (coverEl) {
    const coverSrc = project.thumbnail || "";
    coverEl.src = coverSrc;
    coverEl.alt = project.title || "Project image";

    coverEl.onerror = function () {
      this.style.display = "none";
    };
  }

  if (galleryEl) {
    galleryEl.innerHTML = "";

    const galleryImages = Array.isArray(project.gallery) ? project.gallery : [];
    const uniqueImages = galleryImages.filter(Boolean);

    uniqueImages.forEach((src, index) => {
      const item = document.createElement("div");
      item.className = "gallery-item";

      const img = document.createElement("img");
      img.src = src;
      img.alt = `${project.title} gallery image ${index + 1}`;
      img.className = "gallery-image";

      img.onerror = function () {
        item.remove();
      };

      item.appendChild(img);
      galleryEl.appendChild(item);
    });
  }

  if (stackEl) {
    stackEl.innerHTML = "";

    if (Array.isArray(project.stack)) {
      project.stack.forEach((tech) => {
        const tag = document.createElement("span");
        tag.className = "stack-tag";
        tag.textContent = tech;
        stackEl.appendChild(tag);
      });
    }
  }

  if (repoEl && repoEmptyEl) {
    if (project.repoUrl && project.repoUrl.trim() !== "" && project.repoUrl !== "#") {
      repoEl.href = project.repoUrl;
      repoEl.style.display = "inline-block";
      repoEmptyEl.style.display = "none";
    } else {
      repoEl.style.display = "none";
      repoEmptyEl.style.display = "inline";
    }
  }

  if (liveEl && liveEmptyEl) {
    if (project.liveUrl && project.liveUrl.trim() !== "" && project.liveUrl !== "#") {
      liveEl.href = project.liveUrl;
      liveEl.style.display = "inline-block";
      liveEmptyEl.style.display = "none";
    } else {
      liveEl.style.display = "none";
      liveEmptyEl.style.display = "inline";
    }
  }

  if (videoWrapperEl && videoEl) {
    if (project.video && project.video.trim() !== "") {
      videoEl.src = project.video;
      videoWrapperEl.style.display = "block";
    } else {
      videoWrapperEl.style.display = "none";
    }
  }
}

function renderRelatedProjects(projects, currentProject) {
  const relatedContainer = document.querySelector("[data-related-projects]");
  if (!relatedContainer) return;

  relatedContainer.innerHTML = "";

  const related = projects
    .filter((p) => p.id !== currentProject.id)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .slice(0, 3);

  related.forEach((project) => {
    const article = document.createElement("article");
    article.className = "related-card";

    article.innerHTML = `
      <img class="related-thumb" src="${project.thumbnail || ""}" alt="${project.title}">
      <div class="related-content">
        <div class="related-meta">
          <span>${project.category || ""}</span>
          <span>${project.year || ""}</span>
        </div>
        <h3>${project.title || ""}</h3>
        <p>${project.shortDescription || ""}</p>
        <a href="project.html?id=${project.id}">Open project ↗</a>
      </div>
    `;

    const img = article.querySelector("img");
    if (img) {
      img.onerror = function () {
        this.style.display = "none";
      };
    }

    relatedContainer.appendChild(article);
  });
}