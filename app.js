
const form = document.getElementById("personForm");
const showFormButton = document.getElementById("showFormButton");
const cancelButton = document.getElementById("cancelButton");
const peopleList = document.getElementById("peopleList");

let people = JSON.parse(localStorage.getItem("silsilahPeople") || "[]");

function savePeople() {
  localStorage.setItem("silsilahPeople", JSON.stringify(people));
}

function updateStats() {
  document.getElementById("totalPeople").textContent = people.length;
  document.getElementById("totalRelations").textContent =
    people.filter(person => person.father || person.mother).length;
  document.getElementById("totalSources").textContent =
    people.filter(person => person.source).length;
}

function renderPeople() {
  if (people.length === 0) {
    peopleList.innerHTML = `
      <div class="empty-state">
        <span>🌱</span>
        <h3>Belum ada data tokoh</h3>
        <p>Mulailah dengan menambahkan data leluhur atau tokoh pertama.</p>
      </div>
    `;
    updateStats();
    return;
  }

  peopleList.innerHTML = people.map((person, index) => `
    <article class="person-card">
      <h3>${escapeHTML(person.fullName)}</h3>
      <p>${escapeHTML(person.nickname || "Belum ada nama panggilan")}</p>
      <p>Tempat lahir: ${escapeHTML(person.birthPlace || "-")}</p>
      <p>Ayah: ${escapeHTML(person.father || "-")}</p>
      <p>Ibu: ${escapeHTML(person.mother || "-")}</p>
      <p>Status: ${escapeHTML(person.verification)}</p>
      <button type="button" onclick="deletePerson(${index})">
        Hapus data
      </button>
    </article>
  `).join("");

  updateStats();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

showFormButton.addEventListener("click", () => {
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
});

cancelButton.addEventListener("click", () => {
  form.reset();
  form.classList.add("hidden");
});

form.addEventListener("submit", event => {
  event.preventDefault();

  const person = {
    id: Date.now().toString(),
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

  if (!person.fullName) {
    alert("Nama lengkap harus diisi.");
    return;
  }

  people.push(person);
  savePeople();
  renderPeople();
  form.reset();
  form.classList.add("hidden");

  alert("Data tokoh berhasil disimpan di browser ini.");
});

function deletePerson(index) {
  if (!confirm("Apakah kamu yakin ingin menghapus data ini?")) {
    return;
  }

  people.splice(index, 1);
  savePeople();
  renderPeople();
}

renderPeople();
