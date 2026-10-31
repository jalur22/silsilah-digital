
/* =====================================================
   SILSILAH DIGITAL
   APLIKASI UTAMA - VERSI 1
===================================================== */

"use strict";

/* ---------- PENYIMPANAN DATA ---------- */

const PEOPLE_KEY = "silsilahPeople";
const RELATIONS_KEY = "silsilahRelationships";

let people = [];
let relations = [];
let selectedPersonId = null;
let zoomLevel = 1;
let currentPhotoData = null;

function loadData() {
  try {
    people = JSON.parse(localStorage.getItem(PEOPLE_KEY)) || [];
    relations = JSON.parse(localStorage.getItem(RELATIONS_KEY)) || [];
  } catch (error) {
    people = [];
    relations = [];
  }

  if (!Array.isArray(people)) people = [];
  if (!Array.isArray(relations)) relations = [];
}

function saveData() {
  try {
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
    localStorage.setItem(RELATIONS_KEY, JSON.stringify(relations));
    updateSummary();
    return true;
  } catch (error) {
    showToast("Penyimpanan penuh. Coba gunakan foto yang lebih kecil.", true);
    return false;
  }
}

/* ---------- FUNGSI BANTU ---------- */

const $ = (id) => document.getElementById(id);

function makeId() {
  return "tokoh-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getPerson(id) {
  return people.find(person => String(person.id) === String(id));
}

function showToast(message, isError = false) {
  const container = $("toastContainer");
  const toast = document.createElement("div");

  toast.className = "toast" + (isError ? " error" : "");
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

/* ---------- NAVIGASI HALAMAN ---------- */

function navigateTo(page) {
  document.querySelectorAll(".page-section").forEach(section => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const pageElement = $(page + "Page");
  if (pageElement) pageElement.classList.add("active");

  const titles = {
    tree: ["Pohon Silsilah", "Telusuri hubungan keluarga dan jejak leluhur."],
    people: ["Daftar Tokoh", "Seluruh tokoh yang tercatat dalam arsip."],
    sources: ["Arsip & Sumber", "Dokumen dan referensi sejarah."],
    about: ["Tentang Arsip", "Mengenal Silsilah Digital."]
  };

  $("pageTitle").textContent = titles[page][0];
  $("pageSubtitle").textContent = titles[page][1];

  $("sidebar").classList.remove("open");
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => navigateTo(button.dataset.page));
});

$("mobileMenuButton").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

/* ---------- RINGKASAN DATA ---------- */

function updateSummary() {
  $("totalPeople").textContent = people.length;
  $("totalRelations").textContent = relations.length;

  const sourceCount = people.filter(person => person.source).length;
  $("totalSources").textContent = sourceCount;
}

/* ---------- FORMULIR TOKOH ---------- */

function openPersonForm(person = null) {
  closeRadialMenu();
  currentPhotoData = person?.photo || null;

  $("personForm").reset();
  $("personId").value = person?.id || "";
  $("formAction").value = person ? "edit" : "add";

  $("modalTitle").textContent = person ? "Edit Tokoh" : "Tambah Tokoh";
  $("modalDescription").textContent = person
    ? "Perbarui informasi tokoh."
    : "Masukkan informasi tokoh ke dalam arsip.";

  $("fullName").value = person?.fullName || "";
  $("nickname").value = person?.nickname || "";
  $("gender").value = person?.gender || "";
  $("birthPlace").value = person?.birthPlace || "";
  $("birthDate").value = person?.birthDate || "";
  $("deathPlace").value = person?.deathPlace || "";
  $("deathDate").value = person?.deathDate || "";
  $("biography").value = person?.biography || "";
  $("verification").value = person?.verification || "Belum diverifikasi";
  $("source").value = person?.source || "";

  $("modalOverlay").hidden = false;
}

function closePersonForm() {
  $("modalOverlay").hidden = true;
  currentPhotoData = null;
}

$("addPersonButton").addEventListener("click", () => openPersonForm());
$("emptyAddButton").addEventListener("click", () => openPersonForm());
$("closeModalButton").addEventListener("click", closePersonForm);
$("cancelModalButton").addEventListener("click", closePersonForm);

$("modalOverlay").addEventListener("click", event => {
  if (event.target === $("modalOverlay")) closePersonForm();
});

/* Foto tokoh: disimpan sebagai data lokal */

$("personPhoto").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("File harus berupa gambar.", true);
    event.target.value = "";
    return;
  }

  if (file.size > 1200000) {
    showToast("Ukuran foto maksimal 1,2 MB. Kompres dahulu.", true);
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    currentPhotoData = reader.result;
  };

  reader.onerror = () => showToast("Foto gagal dibaca.", true);
  reader.readAsDataURL(file);
});

$("personForm").addEventListener("submit", event => {
  event.preventDefault();

  const fullName = $("fullName").value.trim();

  if (!fullName) {
    showToast("Nama lengkap harus diisi.", true);
    return;
  }

  const id = $("personId").value;
  const existing = id ? getPerson(id) : null;

  const person = {
    id: id || makeId(),
    fullName,
    nickname: $("nickname").value.trim(),
    gender: $("gender").value,
    birthPlace: $("birthPlace").value.trim(),
    birthDate: $("birthDate").value,
    deathPlace: $("deathPlace").value.trim(),
    deathDate: $("deathDate").value,
    biography: $("biography").value.trim(),
    verification: $("verification").value,
    source: $("source").value.trim(),
    photo: currentPhotoData || existing?.photo || ""
  };

  if (existing) {
    people = people.map(item => item.id === id ? person : item);
    showToast("Data tokoh berhasil diperbarui.");
  } else {
    people.push(person);
    showToast("Tokoh berhasil ditambahkan.");
  }

  if (saveData()) {
    closePersonForm();
    renderAll();
  }
});

/* ---------- MENU RADIAL 7 SEKTOR ---------- */

const radialActions = [
  { key: "parent", label: "Tambah Orang Tua", icon: "♙", color: "#32634a" },
  { key: "spouse", label: "Tambah Pasangan", icon: "♡", color: "#a17b37" },
  { key: "child", label: "Tambah Anak", icon: "♧", color: "#477b65" },
  { key: "connect", label: "Hubungkan", icon: "↗", color: "#54779b" },
  { key: "disconnect", label: "Putuskan", icon: "⛓", color: "#777d80" },
  { key: "edit", label: "Edit", icon: "✎", color: "#92744a" },
  { key: "delete", label: "Hapus", icon: "×", color: "#a94d48" }
];

function polarPoint(cx, cy, radius, angle) {
  const rad = angle * Math.PI / 180;

  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

function sectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const p1 = polarPoint(cx, cy, outerRadius, startAngle);
  const p2 = polarPoint(cx, cy, outerRadius, endAngle);
  const p3 = polarPoint(cx, cy, innerRadius, endAngle);
  const p4 = polarPoint(cx, cy, innerRadius, startAngle);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${p4.x} ${p4.y}`,
    "Z"
  ].join(" ");
}

function renderRadialSectors() {
  const svg = $("radialSectors");
  const cx = 200;
  const cy = 200;
  const inner = 72;
  const outer = 194;
  const angleSize = 360 / radialActions.length;

  svg.innerHTML = "";

  radialActions.forEach((action, index) => {
    const start = -90 + index * angleSize + 1.5;
    const end = -90 + (index + 1) * angleSize - 1.5;
    const middle = (start + end) / 2;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", sectorPath(cx, cy, inner, outer, start, end));
    path.setAttribute("fill", action.color);
    path.setAttribute("class", "radial-sector");
    path.setAttribute("role", "button");
    path.setAttribute("tabindex", "0");
    path.setAttribute("aria-label", action.label);

    const iconPosition = polarPoint(cx, cy, 125, middle);
    const labelPosition = polarPoint(cx, cy, 153, middle);

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
    icon.setAttribute("x", iconPosition.x);
    icon.setAttribute("y", iconPosition.y + 6);
    icon.setAttribute("class", "radial-sector-icon");
    icon.textContent = action.icon;

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", labelPosition.x);
    label.setAttribute("y", labelPosition.y + 4);
    label.setAttribute("class", "radial-sector-label");

    const words = action.label.split(" ");
    if (words.length > 2) {
      const first = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      first.setAttribute("x", labelPosition.x);
      first.setAttribute("dy", "-4");
      first.textContent = words.slice(0, 2).join(" ");

      const second = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      second.setAttribute("x", labelPosition.x);
      second.setAttribute("dy", "14");
      second.textContent = words.slice(2).join(" ");

      label.append(first, second);
    } else {
      label.textContent = action.label;
    }

    path.addEventListener("click", () => handleRadialAction(action.key));
    path.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleRadialAction(action.key);
      }
    });

    svg.append(path, icon, label);
  });
}

function openRadialMenu(personId) {
  const person = getPerson(personId);
  if (!person) return;

  selectedPersonId = personId;

  $("radialPersonName").textContent = person.fullName;
  $("radialPersonInfo").textContent = person.nickname || "Pilih tindakan";

  $("radialPersonPhoto").style.backgroundImage = person.photo
    ? `url("${person.photo}")`
    : "";

  $("radialPersonPhoto").textContent = person.photo
    ? ""
    : person.fullName.charAt(0).toUpperCase();

  $("radialOverlay").hidden = false;
  renderRadialSectors();
}

function closeRadialMenu() {
  $("radialOverlay").hidden = true;
  selectedPersonId = null;
}

$("radialBackdrop").addEventListener("click", closeRadialMenu);

/* ---------- HUBUNGAN ANTARTOKOH ---------- */

function openRelationForm(action, sourceId) {
  const source = getPerson(sourceId);
  if (!source) return;

  closeRadialMenu();

  $("relationForm").reset();
  $("relationAction").value = action;
  $("relationSourceId").value = sourceId;

  const descriptions = {
    parent: "Pilih orang tua dari tokoh ini.",
    child: "Pilih anak dari tokoh ini.",
    spouse: "Pilih pasangan dari tokoh ini.",
    connect: "Pilih tokoh yang akan dihubungkan.",
    disconnect: "Pilih hubungan yang akan diputuskan."
  };

  const titles = {
    parent: "Tambah Orang Tua",
    child: "Tambah Anak",
    spouse: "Tambah Pasangan",
    connect: "Hubungkan Tokoh",
    disconnect: "Putuskan Hubungan"
  };

  $("relationModalTitle").textContent = titles[action];
  $("relationModalDescription").textContent = descriptions[action];

  const select = $("relationTargetId");
  select.innerHTML = '<option value="">Pilih tokoh...</option>';

  let availablePeople = people.filter(person => person.id !== sourceId);

  if (action === "disconnect") {
    const connectedIds = relations
      .filter(relation =>
        relation.from === sourceId || relation.to === sourceId
      )
      .map(relation =>
        relation.from === sourceId ? relation.to : relation.from
      );

    availablePeople = availablePeople.filter(person =>
      connectedIds.includes(person.id)
    );
  }

  availablePeople.forEach(person => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.fullName;
    select.appendChild(option);
  });

  $("relationTypeField").hidden = action !== "connect";
  $("relationRoleField").hidden = action !== "connect";

  if (action === "connect") {
    $("relationType").value = "knowledge";
    $("relationRole").value = "teacher";
  }

  if (action === "disconnect" && availablePeople.length === 0) {
    showToast("Tokoh ini belum memiliki hubungan.", true);
    return;
  }

  if (availablePeople.length === 0 && action !== "disconnect") {
    showToast("Tambahkan tokoh lain terlebih dahulu.", true);
    return;
  }

  $("relationModalOverlay").hidden = false;
}

function addRelation(sourceId, targetId, type, role) {
  if (sourceId === targetId) {
    showToast("Tokoh tidak dapat dihubungkan dengan dirinya sendiri.", true);
    return false;
  }

  const exists = relations.some(relation =>
    relation.from === sourceId &&
    relation.to === targetId &&
    relation.type === type &&
    relation.role === role
  );

  if (exists) {
    showToast("Hubungan tersebut sudah tercatat.", true);
    return false;
  }

  relations.push({
    id: makeId(),
    from: sourceId,
    to: targetId,
    type,
    role
  });

  return saveData();
}

$("relationForm").addEventListener("submit", event => {
  event.preventDefault();

  const action = $("relationAction").value;
  const sourceId = $("relationSourceId").value;
  const targetId = $("relationTargetId").value;

  if (!targetId) {
    showToast("Pilih tokoh terlebih dahulu.", true);
    return;
  }

  if (!getPerson(sourceId) || !getPerson(targetId)) {
    showToast("Data tokoh tidak ditemukan.", true);
    return;
  }

  if (action === "disconnect") {
    const before = relations.length;

    relations = relations.filter(relation => !(
      (relation.from === sourceId && relation.to === targetId) ||
      (relation.from === targetId && relation.to === sourceId)
    ));

    if (before === relations.length) {
      showToast("Hubungan tidak ditemukan.", true);
      return;
    }

    saveData();
    showToast("Hubungan berhasil diputuskan.");
  } else {
    let type = "biological";
    let role = action;

    if (action === "spouse") {
      type = "spouse";
      role = "spouse";
    }

    if (action === "connect") {
      type = $("relationType").value;
      role = $("relationRole").value;
    }

    if (!addRelation(sourceId, targetId, type, role)) return;

    showToast("Hubungan berhasil ditambahkan.");
  }

  $("relationModalOverlay").hidden = true;
  renderAll();
});

$("closeRelationModalButton").addEventListener("click", () => {
  $("relationModalOverlay").hidden = true;
});

$("cancelRelationButton").addEventListener("click", () => {
  $("relationModalOverlay").hidden = true;
});

$("relationModalOverlay").addEventListener("click", event => {
  if (event.target === $("relationModalOverlay")) {
    $("relationModalOverlay").hidden = true;
  }
});

/* ---------- AKSI MENU RADIAL ---------- */

function handleRadialAction(action) {
  const id = selectedPersonId;
  const person = getPerson(id);

  if (!person) return;

  switch (action) {
    case "parent":
    case "child":
    case "spouse":
    case "connect":
    case "disconnect":
      openRelationForm(action, id);
      break;

    case "edit":
      openPersonForm(person);
      break;

    case "delete":
      closeRadialMenu();
      askDeletePerson(id);
      break;
  }
}

/* ---------- KONFIRMASI HAPUS ---------- */

function askDeletePerson(id) {
  const person = getPerson(id);
  if (!person) return;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const dialog = document.createElement("div");
  dialog.className = "modal-dialog";

  const heading = document.createElement("h3");
  heading.textContent = "Hapus Tokoh?";

  const message = document.createElement("p");
  message.textContent =
    `Apakah Anda yakin ingin menghapus ${person.fullName}? Hubungan yang tercatat dengan tokoh ini juga akan dihapus.`;

  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const cancel = document.createElement("button");
  cancel.className = "button button-secondary";
  cancel.textContent = "Batal";

  const confirm = document.createElement("button");
  confirm.className = "button";
  confirm.style.background = "#a94d48";
  confirm.style.color = "white";
  confirm.textContent = "Ya, Hapus";

  cancel.addEventListener("click", () => overlay.remove());

  confirm.addEventListener("click", () => {
    people = people.filter(item => item.id !== id);

    relations = relations.filter(relation =>
      relation.from !== id && relation.to !== id
    );

    saveData();
    renderAll();
    overlay.remove();
    showToast("Tokoh berhasil dihapus.");
  });

  footer.append(cancel, confirm);
  dialog.append(heading, message, footer);
  overlay.append(dialog);
  document.body.append(overlay);
}

/* ---------- GAMBAR POHON SILSILAH ---------- */

function getTreePositions() {
  const positions = new Map();
  const placed = new Set();

  const biological = relations.filter(relation =>
    relation.type === "biological" &&
    getPerson(relation.from) &&
    getPerson(relation.to)
  );

  let roots = people.filter(person =>
    !biological.some(relation =>
      relation.to === person.id && relation.role === "child"
    )
  );

  if (roots.length === 0 && people.length) {
    roots = [people[0]];
  }

  const levels = new Map();
  const queue = roots.map(person => ({ id: person.id, level: 0 }));

  while (queue.length) {
    const current = queue.shift();

    if (placed.has(current.id)) continue;

    placed.add(current.id);
    levels.set(current.id, current.level);

    biological
      .filter(relation =>
        relation.from === current.id && relation.role === "child"
      )
      .forEach(relation => {
        queue.push({ id: relation.to, level: current.level + 1 });
      });
  }

  people.forEach(person => {
    if (!placed.has(person.id)) {
      levels.set(person.id, 0);
    }
  });

  const groups = new Map();

  people.forEach(person => {
    const level = levels.get(person.id) || 0;
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push(person);
  });

  const sortedLevels = [...groups.keys()].sort((a, b) => a - b);
  const canvasWidth = Math.max(900, ...[...groups.values()].map(group => group.length * 180 + 100));
  const rowHeight = 175;

  sortedLevels.forEach(level => {
    const group = groups.get(level);
    const spacing = canvasWidth / (group.length + 1);

    group.forEach((person, index) => {
      positions.set(person.id, {
        x: spacing * (index + 1),
        y: 100 + level * rowHeight
      });
    });
  });

  return {
    positions,
    width: canvasWidth,
    height: Math.max(470, (sortedLevels.length + 1) * rowHeight)
  };
}

function renderTree() {
  const canvas = $("treeCanvas");
  const empty = $("emptyTree");

  canvas.querySelectorAll(".person-node, .tree-lines").forEach(element => {
    element.remove();
  });

  if (!people.length) {
    empty.hidden = false;
    canvas.style.width = "100%";
    canvas.style.height = "470px";
    return;
  }

  empty.hidden = true;

  const tree = getTreePositions();
  const positions = tree.positions;

  canvas.style.width = tree.width + "px";
  canvas.style.height = tree.height + "px";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "tree-lines");
  svg.setAttribute("viewBox", `0 0 ${tree.width} ${tree.height}`);

  relations.forEach(relation => {
    const from = positions.get(relation.from);
    const to = positions.get(relation.to);

  
