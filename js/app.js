// ── State ─────────────────────────────────────────────────────

let currentGroup = "year";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");

// ── Helpers ───────────────────────────────────────────────────

function formatDate(dateStr) {
  const [year, month] = dateStr.split("-");
  return MONTHS[parseInt(month, 10) - 1] + " " + year;
}

function yearOf(dateStr) {
  return dateStr.split("-")[0];
}

// ── Rendering ─────────────────────────────────────────────────

function createGroupHeader(label) {
  const el = document.createElement("div");
  el.className = "group-header";
  el.textContent = label;
  return el;
}

function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "project-card";

  // Thumbnail
  const thumbLink = document.createElement("a");
  thumbLink.className = "thumb-link";
  thumbLink.href = project.url;
  thumbLink.target = "_blank";
  thumbLink.rel = "noopener";
  const thumb = document.createElement("img");
  thumb.className = "project-thumb";
  thumb.src = project.image || PLACEHOLDER;
  thumb.alt = project.name;
  thumb.loading = "lazy";
  thumbLink.appendChild(thumb);
  card.appendChild(thumbLink);

  // Main info
  const main = document.createElement("div");
  main.className = "project-main";

  // Category (above title)
  const cat = document.createElement("div");
  cat.className = "project-category";
  cat.textContent = project.category;
  main.appendChild(cat);

  // Project name
  const name = document.createElement("a");
  name.className = "project-name";
  name.href = project.url;
  if (project.url !== "#") {
    name.target = "_blank";
    name.rel = "noopener";
  }
  name.textContent = project.name;
  main.appendChild(name);

  if (project.comingSoon) {
    const badge = document.createElement("span");
    badge.className = "badge-coming-soon";
    badge.textContent = "Coming soon";
    main.appendChild(badge);
  }

  if (project.vibecoded) {
    const wrapper = document.createElement("span");
    wrapper.className = "vibecoded-icon";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "currentColor");
    icon.style.width = "100%";
    icon.style.height = "100%";
    icon.innerHTML =
      '<path d="M10 2l1.5 3.5L15 7l-3.5 1.5L10 12l-1.5-3.5L5 7l3.5-1.5z"/>' +
      '<path d="M18 8l1 2.2L21.2 11l-2.2 1L18 14.2 17 12l-2.2-1L17 10.2z"/>';
    wrapper.appendChild(icon);
    const tip = document.createElement("span");
    tip.className = "vibecoded-tooltip";
    tip.textContent = "Mostly vibe-coded";
    wrapper.appendChild(tip);
    main.appendChild(wrapper);
  }

  // Description
  if (project.description) {
    const desc = document.createElement("p");
    desc.className = "project-desc";
    desc.textContent = project.description;
    main.appendChild(desc);
  }

  // Meta line (language + stars)
  if (project.language || project.stars > 0) {
    const meta = document.createElement("div");
    meta.className = "project-sub";

    if (project.language) {
      const lang = document.createElement("span");
      lang.className = "project-lang";
      const dot = document.createElement("span");
      dot.className = "lang-dot";
      dot.style.background = LANG_COLORS[project.language] || "#999";
      lang.appendChild(dot);
      lang.appendChild(document.createTextNode(project.language));
      meta.appendChild(lang);
    }

    if (project.stars > 0) {
      const stars = document.createElement("span");
      stars.className = "project-stars";
      stars.textContent = "\u2605 " + project.stars;
      meta.appendChild(stars);
    }

    main.appendChild(meta);
  }

  card.appendChild(main);

  return card;
}

function render() {
  const query = searchEl.value.trim().toLowerCase();
  listEl.innerHTML = "";

  let projects = PROJECTS;

  if (query) {
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  }

  if (projects.length === 0) {
    const msg = document.createElement("p");
    msg.className = "state-message";
    msg.textContent = "No projects found.";
    listEl.appendChild(msg);
    return;
  }

  // Flat list when searching
  if (query) {
    projects.forEach((p) => listEl.appendChild(createProjectCard(p)));
    return;
  }

  // Grouped rendering
  if (currentGroup === "year") {
    const groups = new Map();
    projects.forEach((p) => {
      const y = yearOf(p.date);
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push(p);
    });

    [...groups.keys()]
      .sort((a, b) => b - a)
      .forEach((year) => {
        listEl.appendChild(createGroupHeader(year));
        groups
          .get(year)
          .forEach((p) => listEl.appendChild(createProjectCard(p)));
      });
  } else {
    const groups = new Map();
    projects.forEach((p) => {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category).push(p);
    });

    CATEGORY_ORDER.forEach((cat) => {
      if (!groups.has(cat)) return;
      listEl.appendChild(createGroupHeader(cat));
      groups
        .get(cat)
        .sort((a, b) => (b.stars || 0) - (a.stars || 0))
        .forEach((p) => listEl.appendChild(createProjectCard(p)));
    });
  }
}

// ── Sort buttons ──────────────────────────────────────────────

document.querySelectorAll(".sort-buttons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelector(".sort-buttons .active")
      .classList.remove("active");
    btn.classList.add("active");
    currentGroup = btn.dataset.group;
    render();
    observeElements();
  });
});

// ── Search ────────────────────────────────────────────────────

searchEl.addEventListener("input", () => {
  render();
  observeElements();
});

// ── Scroll animations ────────────────────────────────────────

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0, rootMargin: "0px 0px 50px 0px" },
);

function observeElements() {
  const els = listEl.querySelectorAll(".project-card, .group-header");
  let visibleIndex = 0;
  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.style.transitionDelay = visibleIndex * 30 + "ms";
      visibleIndex++;
    } else {
      el.style.transitionDelay = "0ms";
    }
    observer.observe(el);
  });
}

// ── Init ──────────────────────────────────────────────────────

render();
observeElements();
