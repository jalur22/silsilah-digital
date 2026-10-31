
const form = document.getElementById("personForm");
const showFormButton = document.getElementById("showFormButton");
const cancelButton = document.getElementById("cancelButton");
const peopleList = document.getElementById("peopleList");

let people = JSON.parse(localStorage.getItem("silsilahPeople") || "[]");
let relationships = JSON.parse(localStorage.getItem("silsilahRelationships") || "[]");
let selectedPersonId = null;

function saveData() {
  localStorage.setItem("silsilahPeople", JSON.stringify(people));
  localStorage.setItem("silsilahRelationships", JSON.stringify(relationships));
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[c]);
}

function getPerson(id) {
  return people.find(person => String(person.id) === String(id));
}

function updateStats() {
  document.getElementById("totalPeople").textContent = people.length;
  document.getElementById("totalRelations").textContent = relationships.length;
  document.getElementById("totalSources").textContent =
    people.filter(person => person.source).length;
}

function renderPeople() {
  if (!people.length) {
    peopleList.innerHTML = `
      <div class="empty-state">
        <span>🌱</span>
        <h3>Belum ada data tokoh</h3>
        <p>Tambahkan tokoh pertama untuk memulai silsilah.</p>
      </div>`;
    updateStats();
    return;
  }

  peopleList.innerHTML = `
    <div class="people-grid">
      ${people.map(person => `
        <article class="person-card">
          <button class="person-avatar"
            type="button"
            data-person-id="${escapeHTML(person.id)}"
            aria-label="Buka tindakan untuk ${escapeHTML(person.fullName)}">
            ${person.photo
              ? `<img src="${escapeHTML(person.photo)}" alt="">`
              : `<span>${escapeHTML((person.fullName || "?").charAt(0).toUpperCase())}</span>`}
          </button>
          <h3>${escapeHTML(person.fullName)}</h3>
          <p>${escapeHTML(person.nickname || "Tokoh keluarga")}</p>
          <button class="open-actions"
            type="button"
            data-person-id="${escapeHTML(person.id)}">
            Buka tindakan
          </button>
        </article>
      `).join("")}
    </div>`;

  updateStats();
}

function closeRadialMenu() {
  document.getElementById("radialOverlay")?.remove();
  selectedPersonId = null;
}

function openRadialMenu(id) {
  const person = getPerson(id);
  if (!person) return;

  closeRadialMenu();
  selectedPersonId = id;

  const overlay = document.createElement("div");
  overlay.id = "radialOverlay";
  overlay.className = "radial-overlay";

  const actions = [
    ["delete", "🗑️", "Hapus"],
    ["parents", "👨‍👩‍👦", "Tambah orang tua"],
    ["partner", "💑", "Tambah pasangan"],
    ["child", "👶", "Tambah anak"],
    ["disconnect", "🔗", "Putuskan"],
    ["connect", "🧷", "Hubungkan"],
    ["edit", "✏️", "Edit"]
  ];

  overlay.innerHTML = `
    <div class="radial-menu" role="dialog" aria-modal="true">
      <button class="radial-center" type="button">
        <span class="radial-avatar">
          ${person.photo
            ? `<img src="${escapeHTML(person.photo)}" alt="">`
            : "👤"}
        </span>
        <strong>${escapeHTML(person.fullName)}</strong>
        <small>Profil tokoh</small>
      </button>
      ${actions.map((action, index) => `
        <button class="radial-action"
          type="button"
          data-action="${action[0]}"
          style="--angle:${index * (360 / actions.length)}deg">
          <span>${action[1]}</span>
          <small>${action[2]}</small>
        </button>
      `).join("")}
      <button class="radial-close" type="button" aria-label="Tutup">×</button>
    </div>`;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", event => {
    if (event.target === overlay ||
        event.target.closest(".radial-close") ||
        event.target.closest(".radial-center")) {
      closeRadialMenu();
      return;
    }

    const button = event.target.closest("[data-action]");
    if (button) runAction(button.dataset.action);
  });
}

function addPerson(name, type, relatedId) {
  name = name.trim();
  if (!name) return;

  const person = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    fullName: name,
    nickname: "",
    birthPlace: "",
    birthDate: "",
    father: "",
    mother: "",
    biography: "",
    source: "",
    verification: "Belum diverifikasi"
  };

  people.push(person);

  relationships.push({
    id: Date.now().toString(),
    from: type === "parent" ? person.id : relatedId,
    to: type === "parent" ? relatedId : person.id,
    type
  });

  saveData();
  renderPeople();
}

function runAction(action) {
  const person = getPerson(selectedPersonId);
  if (!person) return;

  const id = person.id;
  closeRadialMenu();

  if (action === "edit") {
    const name = prompt("Ubah nama lengkap:", person.fullName);
    if (name === null) return;
    if (!name.trim()) {
      alert("Nama tidak boleh kosong.");
      return;
    }

    person.fullName = name.trim();
    const bio = prompt("Ubah riwayat hidup:", person.biography || "");
    if (bio !== null) person.biography = bio;

    saveData();
    renderPeople();
    return;
  }

  if (action === "delete") {
    if (!confirm(`Hapus data ${person.fullName}? Hubungan tokoh ini juga akan dihapus.`)) return;
    people = people.filter(p => String(p.id) !== String(id));
    relationships = relationships.filter(r =>
      String(r.from) !== String(id) && String(r.to) !== String(id)
    );
    saveData();
    renderPeople();
    return;
  }

  if (action === "parents") {
    const choice = prompt("Tambah orang tua:\n1 = Ayah\n2 = Ibu\n3 = Keduanya");
    if (!choice) return;

    if (choice === "1" || choice === "3") {
      const father = prompt("Masukkan nama ayah:");
      if (father) addPerson(father, "parent", id);
    }
    if (choice === "2" || choice === "3") {
      const mother = prompt("Masukkan nama ibu:");
      if (mother) addPerson(mother, "parent", id);
    }
    return;
  }

  if (action === "partner") {
    const name = prompt("Masukkan nama pasangan:");
    if (name) addPerson(name, "spouse", id);
    return;
  }

  if (action === "child") {
    const name = prompt("Masukkan nama anak:");
    if (name) addPerson(name, "child", id);
    return;
  }

  if (action === "connect") {
    const name = prompt("Ketik nama tokoh yang sudah ada:");
    if (!name) return;

    const target = people.find(p =>
      p.fullName.toLowerCase() === name.trim().toLowerCase() &&
      String(p.id) !== String(id)
    );

    if (!target) {
      alert("Tokoh tidak ditemukan. Tambahkan tokoh tersebut terlebih dahulu.");
      return;
    }

    const type = prompt(
      "Jenis hubungan:\n1 = Guru\n2 = Murid\n3 = Kerabat\n4 = Hubungan sejarah"
    );

    const types = {
      "1": "guru",
      "2": "murid",
      "3": "kerabat",
      "4": "sejarah"
    };

    if (!types[type]) return;

    relationships.push({
      id: Date.now().toString(),
      from: id,
      to: target.id,
      type: types[type]
    });

    saveData();
    renderPeople();
    alert("Hubungan berhasil ditambahkan.");
    return;
  }

  if (action === "disconnect") {
    const related = relationships.filter(r =>
      String(r.from) === String(id) || String(r.to) === String(id)
    );

    if (!related.length) {
      alert("Belum ada hubungan yang tercatat.");
      return;
    }

    const choices = related.map((r, i) => {
      const otherId = String(r.from) === String(id) ? r.to : r.from;
      const other = getPerson(otherId);
      return `${i + 1}. ${other?.fullName || "Tokoh"} — ${r.type}`;
    }).join("\n");

    const number = Number(prompt("Pilih hubungan yang ingin diputus:\n" + choices));
    if (!Number.isInteger(number) || number < 1 || number > related.length) return;

    const selected = related[number - 1];
    relationships = relationships.filter(r => r.id !== selected.id);
    saveData();
    renderPeople();
    alert("Hubungan berhasil diputus.");
  }
}

showFormButton.addEventListener("click", () => {
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth" });
});

cancelButton.addEventListener("click", () => {
  form.reset();
  form.classList.add("hidden");
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const person = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    fullName: document.getElementById("fullName").value.trim(),
    nickname: document.getElementById("nickname").value.trim(),
    birthPlace: document.getElementById("birthPlace").value.trim(),
    birthDate: document.getElementById("birthDate").value,
    father: document.getElementById("father").value.trim(),
    mother: document.getElementById("mother").value.trim(),
    biography: document.getElementById("biography").value.trim(),
    source: document.getElementById("source").value.trim(),
    verification: document.getElementById("verification").value
  };

  if (!person.fullName) return alert("Nama lengkap harus diisi.");

  people.push(person);
  saveData();
  renderPeople();
  form.reset();
  form.classList.add("hidden");
  alert("Tokoh berhasil ditambahkan.");
});

peopleList.addEventListener("click", event => {
  const button = event.target.closest("[data-person-id]");
  if (button) openRadialMenu(button.dataset.personId);
});

renderPeople();
