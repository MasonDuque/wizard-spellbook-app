const state = {
  profile: JSON.parse(localStorage.getItem("wizardProfile") || "{}"),
  spells: JSON.parse(localStorage.getItem("spells") || "[]"),
};

const refs = {
  wizardName: document.getElementById("wizardName"),
  wizardClass: document.getElementById("wizardClass"),
  wizardLevel: document.getElementById("wizardLevel"),
  preparedRule: document.getElementById("preparedRule"),
  preparedCount: document.getElementById("preparedCount"),
  preparedList: document.getElementById("preparedList"),
  tocList: document.getElementById("tocList"),
  spellForm: document.getElementById("spellForm"),
  spellPages: document.getElementById("spellPages"),
  spellTemplate: document.getElementById("spellTemplate"),
};

function preparedSlots(level) {
  return Math.max(1, Number(level) + 1);
}

function save() {
  localStorage.setItem("wizardProfile", JSON.stringify(state.profile));
  localStorage.setItem("spells", JSON.stringify(state.spells));
}

function renderProfile() {
  refs.wizardName.value = state.profile.name || "";
  refs.wizardClass.value = state.profile.class || "";
  refs.wizardLevel.value = state.profile.level || 1;
  refs.preparedRule.textContent = `Prepared spells available: ${preparedSlots(refs.wizardLevel.value)}`;
}

function renderPrepared() {
  const limit = preparedSlots(state.profile.level || 1);
  const prepared = state.spells.filter((s) => s.prepared);
  refs.preparedCount.textContent = `${prepared.length} / ${limit} prepared`;
  refs.preparedList.innerHTML = prepared.map((s) => `<li>${s.name} (Level ${s.level})</li>`).join("") || "<li>No spells prepared</li>";
}

function renderToc() {
  refs.tocList.innerHTML = "<li>Prepared Spells</li><li>Learn a Spell</li>" +
    state.spells.map((s, i) => `<li>Spell Page ${i + 1}: ${s.name}</li>`).join("");
}

function renderSpells() {
  refs.spellPages.innerHTML = "";
  state.spells.forEach((spell) => {
    const node = refs.spellTemplate.content.cloneNode(true);
    node.querySelector(".spell-title").textContent = spell.name;
    node.querySelector(".spell-school").textContent = spell.school;
    node.querySelector(".spell-level").textContent = spell.level;
    node.querySelector(".spell-casting").textContent = spell.castingTime;
    node.querySelector(".spell-range").textContent = spell.range;
    node.querySelector(".spell-duration").textContent = spell.duration;
    node.querySelector(".spell-components").textContent = spell.components;
    node.querySelector(".spell-description").textContent = spell.description;
    node.querySelector(".spell-image").src = spell.image || "https://picsum.photos/seed/arcana/400/400";

    const guide = node.querySelector(".guide-list");
    guide.innerHTML = `
      <li>Damage: ${spell.damageDiceCount}d${spell.damageDiceSize}</li>
      <li>Targets: ${spell.targets}</li>
      <li>Area: ${spell.areaSize} ft</li>
      <li>Save Modifier: ${spell.saveMod >= 0 ? "+" : ""}${spell.saveMod}</li>
      <li>Concentration: ${spell.concentrationRounds} rounds</li>
    `;

    const checkbox = node.querySelector(".prepare-checkbox");
    checkbox.checked = !!spell.prepared;
    checkbox.addEventListener("change", () => {
      const limit = preparedSlots(state.profile.level || 1);
      const current = state.spells.filter((s) => s.prepared).length;
      if (checkbox.checked && current >= limit) {
        checkbox.checked = false;
        alert(`You can only prepare ${limit} spells at this level.`);
        return;
      }
      spell.prepared = checkbox.checked;
      save();
      renderPrepared();
    });

    node.querySelector(".remove-btn").addEventListener("click", () => {
      state.spells = state.spells.filter((s) => s.id !== spell.id);
      save();
      renderAll();
    });

    refs.spellPages.appendChild(node);
  });
}

function renderAll() {
  renderProfile();
  renderPrepared();
  renderToc();
  renderSpells();
}

[refs.wizardName, refs.wizardClass, refs.wizardLevel].forEach((input) => {
  input.addEventListener("input", () => {
    state.profile = {
      name: refs.wizardName.value,
      class: refs.wizardClass.value,
      level: Number(refs.wizardLevel.value) || 1,
    };
    save();
    renderPrepared();
    renderProfile();
  });
});

refs.spellForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(refs.spellForm);
  state.spells.push({
    id: crypto.randomUUID(),
    name: form.get("name"),
    school: form.get("school"),
    level: Number(form.get("level")),
    castingTime: form.get("castingTime"),
    range: form.get("range"),
    duration: form.get("duration"),
    components: form.get("components"),
    image: form.get("image"),
    damageDiceCount: Number(form.get("damageDiceCount")),
    damageDiceSize: Number(form.get("damageDiceSize")),
    targets: Number(form.get("targets")),
    areaSize: Number(form.get("areaSize")),
    saveMod: Number(form.get("saveMod")),
    concentrationRounds: Number(form.get("concentrationRounds")),
    description: form.get("description"),
    prepared: false,
  });

  refs.spellForm.reset();
  save();
  renderAll();
});

renderAll();
