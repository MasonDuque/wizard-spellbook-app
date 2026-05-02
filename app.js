const state = {
  profile: JSON.parse(localStorage.getItem("wizardProfile") || "{}"),
  spells: JSON.parse(localStorage.getItem("spells") || "[]"),
  currentPage: 0,
};

const refs = {
  coverView: document.getElementById("coverView"),
  bookView: document.getElementById("bookView"),
  coverName: document.getElementById("coverName"),
  coverMeta: document.getElementById("coverMeta"),
  openBookBtn: document.getElementById("openBookBtn"),
  pageContent: document.getElementById("pageContent"),
  pageLabel: document.getElementById("pageLabel"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
};

function preparedSlots(level) {
  return Math.max(1, Number(level) + 1);
}

function save() {
  localStorage.setItem("wizardProfile", JSON.stringify(state.profile));
  localStorage.setItem("spells", JSON.stringify(state.spells));
}

function defaultProfile() {
  return {
    name: state.profile.name || "Unnamed Wizard",
    class: state.profile.class || "Apprentice",
    level: state.profile.level || 1,
  };
}

function updateCover() {
  const profile = defaultProfile();
  refs.coverName.textContent = `${profile.name}'s Spellbook`;
  refs.coverMeta.textContent = `Level ${profile.level} ${profile.class}`;
}

function spellImageFromGuide(spell) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  const hue = (spell.level * 30 + spell.damageDiceSize * 5 + spell.targets * 11) % 360;
  const hue2 = (hue + 90 + spell.saveMod * 8) % 360;
  const radius = Math.max(40, spell.areaSize * 2);

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, `hsl(${hue}, 65%, 18%)`);
  bg.addColorStop(1, `hsl(${hue2}, 70%, 10%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < spell.targets; i += 1) {
    const x = (canvas.width / (spell.targets + 1)) * (i + 1);
    const y = canvas.height / 2 + Math.sin(i * 2.2) * 30;
    ctx.beginPath();
    ctx.arc(x, y, radius / 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue2 + i * 12}, 95%, 70%, 0.25)`;
    ctx.fill();
  }

  ctx.strokeStyle = `hsla(${hue + 180}, 100%, 80%, 0.7)`;
  ctx.lineWidth = Math.max(1, spell.damageDiceCount);
  ctx.beginPath();
  ctx.moveTo(40, canvas.height - 40);
  ctx.bezierCurveTo(canvas.width * 0.3, 60, canvas.width * 0.65, canvas.height, canvas.width - 40, 40);
  ctx.stroke();

  ctx.font = "28px Cinzel";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${spell.school} • L${spell.level} • ${spell.damageDiceCount}d${spell.damageDiceSize}`, 26, 42);

  return canvas.toDataURL("image/png");
}

function getPages() {
  const tocItems = state.spells.map((spell, i) => `<li>Page ${i + 4}: ${spell.name}</li>`).join("");
  const prepared = state.spells.filter((s) => s.prepared);
  const profile = defaultProfile();

  return [
    {
      title: "Table of Contents",
      body: `
        <ol>
          <li>Prepared Spells</li>
          <li>Learn a Spell</li>
          ${tocItems}
        </ol>
      `,
    },
    {
      title: "Prepared Spells",
      body: `
        <p><strong>${prepared.length} / ${preparedSlots(profile.level)}</strong> spells prepared</p>
        <ul>${prepared.map((spell) => `<li>${spell.name} (Level ${spell.level})</li>`).join("") || "<li>No spells prepared</li>"}</ul>
      `,
    },
    {
      title: "Learn a Spell",
      body: `
      <form id="spellForm" class="spell-form">
        <div class="form-grid">
          <label>Wizard Name <input name="wizardName" value="${profile.name}" required /></label>
          <label>Wizard Subclass <input name="wizardClass" value="${profile.class}" required /></label>
          <label>Wizard Level <input name="wizardLevel" type="number" min="1" max="20" value="${profile.level}" required /></label>
          <label>Spell Name <input name="name" required /></label>
          <label>School <input name="school" required /></label>
          <label>Spell Level <input name="level" type="number" min="0" max="9" required /></label>
          <label>Casting Time <input name="castingTime" required /></label>
          <label>Range <input name="range" required /></label>
          <label>Duration <input name="duration" required /></label>
          <label>Components <input name="components" required /></label>
        </div>
        <h3>Spell Writing Guide Numbers</h3>
        <div class="form-grid">
          <label>Damage Dice Count <input name="damageDiceCount" type="number" min="0" value="0" required /></label>
          <label>Damage Dice Size <input name="damageDiceSize" type="number" min="0" value="0" required /></label>
          <label>Targets Affected <input name="targets" type="number" min="1" value="1" required /></label>
          <label>Area Size (ft) <input name="areaSize" type="number" min="0" value="0" required /></label>
          <label>Save DC Modifier <input name="saveMod" type="number" value="0" required /></label>
          <label>Concentration Rounds <input name="concentrationRounds" type="number" min="0" value="0" required /></label>
        </div>
        <label>Description <textarea name="description" rows="4" required></textarea></label>
        <button type="submit">Learn Spell</button>
      </form>
      `,
    },
    ...state.spells.map((spell) => ({
      title: spell.name,
      body: `
        <img src="${spellImageFromGuide(spell)}" alt="Magic imagery generated from spell numbers" class="spell-art" />
        <p><strong>${spell.school}</strong> • Level ${spell.level}</p>
        <p><strong>Casting Time:</strong> ${spell.castingTime} | <strong>Range:</strong> ${spell.range}</p>
        <p><strong>Duration:</strong> ${spell.duration} | <strong>Components:</strong> ${spell.components}</p>
        <p>${spell.description}</p>
        <h3>Guide Numbers</h3>
        <ul>
          <li>Damage: ${spell.damageDiceCount}d${spell.damageDiceSize}</li>
          <li>Targets: ${spell.targets}</li>
          <li>Area: ${spell.areaSize} ft</li>
          <li>Save Modifier: ${spell.saveMod >= 0 ? "+" : ""}${spell.saveMod}</li>
          <li>Concentration: ${spell.concentrationRounds} rounds</li>
        </ul>
        <label><input type="checkbox" data-action="prepare" data-id="${spell.id}" ${spell.prepared ? "checked" : ""} /> Prepared</label>
        <button type="button" data-action="forget" data-id="${spell.id}" class="warn">Forget Spell</button>
      `,
    })),
  ];
}

function renderPage() {
  const pages = getPages();
  state.currentPage = Math.max(0, Math.min(state.currentPage, pages.length - 1));
  const page = pages[state.currentPage];

  refs.pageContent.innerHTML = `<h2>${page.title}</h2>${page.body}`;
  refs.pageLabel.textContent = `Page ${state.currentPage + 1} of ${pages.length}`;
  refs.prevBtn.disabled = state.currentPage === 0;
  refs.nextBtn.disabled = state.currentPage === pages.length - 1;

  const form = document.getElementById("spellForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      state.profile = {
        name: data.get("wizardName"),
        class: data.get("wizardClass"),
        level: Number(data.get("wizardLevel")) || 1,
      };
      state.spells.push({
        id: crypto.randomUUID(),
        name: data.get("name"),
        school: data.get("school"),
        level: Number(data.get("level")),
        castingTime: data.get("castingTime"),
        range: data.get("range"),
        duration: data.get("duration"),
        components: data.get("components"),
        damageDiceCount: Number(data.get("damageDiceCount")),
        damageDiceSize: Number(data.get("damageDiceSize")),
        targets: Number(data.get("targets")),
        areaSize: Number(data.get("areaSize")),
        saveMod: Number(data.get("saveMod")),
        concentrationRounds: Number(data.get("concentrationRounds")),
        description: data.get("description"),
        prepared: false,
      });
      save();
      updateCover();
      state.currentPage += 1;
      renderPage();
    });
  }

  refs.pageContent.querySelectorAll("[data-action='prepare']").forEach((box) => {
    box.addEventListener("change", () => {
      const id = box.dataset.id;
      const spell = state.spells.find((s) => s.id === id);
      const limit = preparedSlots(defaultProfile().level);
      const currentPrepared = state.spells.filter((s) => s.prepared).length;
      if (box.checked && currentPrepared >= limit) {
        box.checked = false;
        alert(`Only ${limit} spells can be prepared at this wizard level.`);
        return;
      }
      spell.prepared = box.checked;
      save();
      renderPage();
    });
  });

  refs.pageContent.querySelectorAll("[data-action='forget']").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.spells = state.spells.filter((s) => s.id !== btn.dataset.id);
      save();
      state.currentPage = 0;
      renderPage();
    });
  });
}

refs.openBookBtn.addEventListener("click", () => {
  refs.coverView.classList.remove("active");
  refs.bookView.classList.add("active");
  state.currentPage = 0;
  renderPage();
});

refs.prevBtn.addEventListener("click", () => {
  state.currentPage -= 1;
  renderPage();
});

refs.nextBtn.addEventListener("click", () => {
  state.currentPage += 1;
  renderPage();
});

updateCover();
