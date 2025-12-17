document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("medicine-form");
  const tableBody = document.getElementById("medicine-table-body");

  // Per-user storage helpers
  const currentEmail = (localStorage.getItem("email") || "").toLowerCase().trim();
  const storageKey = currentEmail ? `medicines_user_${currentEmail}` : "medicines";

  // Load stored medicines (for this user)
  let medicines = JSON.parse(localStorage.getItem(storageKey) || "[]") || [];

  // Display existing medicines
  medicines.forEach(addRowToTable);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("medicineName").value.trim();
    const dosageAmount = document.getElementById("dosageAmount").value;
    const unit = document.getElementById("unit").value;

    const morning = document.getElementById("morningFood").value;
    const afternoon = document.getElementById("afternoonFood").value;
    const night = document.getElementById("nightFood").value;

    if (!name || !dosageAmount || !unit) {
      alert("Please fill all required fields.");
      return;
    }

    const medicine = {
      id: Date.now(),
      name,
      dosageAmount,
      unit,
      morning,
      afternoon,
      night,
      code: generateMedicineCode(name)
    };

    medicines.push(medicine);
    localStorage.setItem(storageKey, JSON.stringify(medicines));

    addRowToTable(medicine);
    form.reset();
  });

  function generateMedicineCode(name) {
    const initials = name
      .split(" ")
      .map((word) => word[0].toUpperCase())
      .join("");
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${initials}-${randomNum}`;
  }

  function addRowToTable(medicine) {
    const tr = document.createElement("tr");

    const timings = `
      ${medicine.morning !== "none" ? `M(${medicine.morning})` : ""}
      ${medicine.afternoon !== "none" ? ` A(${medicine.afternoon})` : ""}
      ${medicine.night !== "none" ? ` N(${medicine.night})` : ""}
    `.trim();

    tr.innerHTML = `
      <td>${medicine.name} (${medicine.dosageAmount} ${medicine.unit})</td>
      <td>${timings || "None"}</td>
      <td>${medicine.code}</td>
    `;

    tableBody.appendChild(tr);
  }

  // Cross-tab logout listener
  window.addEventListener("storage", function(e) {
    if (e && e.key === "global_logout") {
      const hasAuth = localStorage.getItem("email") || localStorage.getItem("token");
      if (hasAuth) {
        localStorage.removeItem("email");
        localStorage.removeItem("token");
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("doctorName");
        localStorage.removeItem("doctorProfile");
        window.location.href = "index.html";
      }
    }
  });
});
