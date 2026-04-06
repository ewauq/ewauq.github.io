let currentGroup = "year";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");

function formatDate(dateStr) {
  const [year, month] = dateStr.split("-");
  return MONTHS[parseInt(month, 10) - 1] + " " + year;
}

function yearOf(dateStr) {
  return dateStr.split("-")[0];
}

function createGroupHeader(label) {
  const el = document.createElement("div");
  el.className = "group-header";
  el.textContent = label;
  return el;
}

function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "project-card";

  const thumbLink = document.createElement("a");
  thumbLink.className = "thumb-link";
  thumbLink.href = project.url;
  if (project.url !== "#") {
    thumbLink.target = "_blank";
    thumbLink.rel = "noopener";
  }
  const thumb = document.createElement("img");
  thumb.className = "project-thumb";
  thumb.src = project.image;
  thumb.alt = project.name;
  thumb.loading = "lazy";
  thumbLink.appendChild(thumb);
  card.appendChild(thumbLink);

  const main = document.createElement("div");
  main.className = "project-main";

  const cat = document.createElement("div");
  cat.className = "project-category";
  cat.textContent = project.category;
  main.appendChild(cat);

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

  if (project.description) {
    const desc = document.createElement("p");
    desc.className = "project-desc";
    desc.textContent = project.description;
    main.appendChild(desc);
  }

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

function groupBy(projects, keyFn) {
  const groups = new Map();
  projects.forEach((p) => {
    const key = keyFn(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });
  return groups;
}

function renderGroups(groups, orderedKeys, sortItems) {
  orderedKeys.forEach((key) => {
    if (!groups.has(key)) return;
    listEl.appendChild(createGroupHeader(key));
    const items = sortItems ? groups.get(key).sort(sortItems) : groups.get(key);
    items.forEach((p) => listEl.appendChild(createProjectCard(p)));
  });
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

    if (projects.length === 0) {
      const msg = document.createElement("p");
      msg.className = "state-message";
      msg.textContent = "No projects found.";
      listEl.appendChild(msg);
      return;
    }

    projects.forEach((p) => listEl.appendChild(createProjectCard(p)));
    return;
  }

  if (currentGroup === "year") {
    const groups = groupBy(projects, (p) => yearOf(p.date));
    renderGroups(groups, [...groups.keys()].sort((a, b) => b - a));
  } else {
    const groups = groupBy(projects, (p) => p.category);
    renderGroups(groups, CATEGORY_ORDER, (a, b) => (b.stars || 0) - (a.stars || 0));
  }
}

document.querySelectorAll(".sort-buttons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".sort-buttons .active").classList.remove("active");
    btn.classList.add("active");
    currentGroup = btn.dataset.group;
    render();
    observeElements();
  });
});

searchEl.addEventListener("input", () => {
  render();
  observeElements();
});

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
  let visibleIndex = 0;
  listEl.querySelectorAll(".project-card, .group-header").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.style.transitionDelay = visibleIndex * 30 + "ms";
      visibleIndex++;
    } else {
      el.style.transitionDelay = "0ms";
    }
    observer.observe(el);
  });
}

render();
observeElements();
