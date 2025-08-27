const form = document.getElementById("form");
const desc = document.getElementById("desc");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const list = document.getElementById("list");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const filterCategory = document.getElementById("filter-category");
const filterMonth = document.getElementById("filter-month");
const barContainer = document.getElementById("barChart").parentElement;

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// Graphique camembert
const ctx = document.getElementById("chart").getContext("2d");
let chart = new Chart(ctx, {
  type: "pie",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "#f87171",
          "#60a5fa",
          "#34d399",
          "#fbbf24",
          "#a78bfa",
        ],
      },
    ],
  },
  options: { plugins: { legend: { position: "left" } } },
});

// Graphique barres
const ctxBar = document.getElementById("barChart").getContext("2d");
let barChart = new Chart(ctxBar, {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      { label: "Revenus", backgroundColor: "#34d399", data: [] },
      { label: "Dépenses", backgroundColor: "#f87171", data: [] },
    ],
  },
  options: { responsive: true, scales: { y: { beginAtZero: true } } },
});

// Animation chiffres
function animateValue(el, start, end, duration) {
  let startTime = null;
  function step(time) {
    if (!startTime) startTime = time;
    let progress = Math.min((time - startTime) / duration, 1);
    el.textContent = (start + (end - start) * progress).toFixed(2);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Affichage
function render() {
  list.innerHTML = "";
  let balance = 0,
    totalIncome = 0,
    totalExpense = 0;
  let expenseCategories = {},
    monthlyData = {};

  let catFilter = filterCategory.value;
  let monthFilter = filterMonth.value;

  transactions.forEach((t, index) => {
    let date = new Date(t.date);
    let monthKey =
      date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

    if (
      (catFilter !== "all" && t.category !== catFilter) ||
      (monthFilter && monthKey !== monthFilter)
    )
      return;

    const li = document.createElement("li");
    li.className = `flex justify-between items-center p-3 rounded-lg ${
      t.type === "income" ? "bg-green-100" : "bg-red-100"
    }`;
    li.innerHTML = `
      <span>${t.desc} <span class="ml-2 px-2 py-1 text-xs rounded-full ${
      t.category === "Nourriture"
        ? "bg-orange-200"
        : t.category === "Logement"
        ? "bg-blue-200"
        : t.category === "Loisirs"
        ? "bg-purple-200"
        : t.category === "Transport"
        ? "bg-yellow-200"
        : "bg-gray-200"
    }">${t.category}</span></span>
      <span>
        ${t.type === "income" ? "+" : "-"}${t.amount} €
        <button onclick="edit(${index})" class="ml-2 text-blue-600">✏️</button>
        <button onclick="remove(${index})" class="ml-2 text-red-600">✖</button>
      </span>`;
    list.appendChild(li);

    if (t.type === "income") {
      balance += t.amount;
      totalIncome += t.amount;
    } else {
      balance -= t.amount;
      totalExpense += t.amount;
      expenseCategories[t.category] =
        (expenseCategories[t.category] || 0) + t.amount;
    }

    monthlyData[monthKey] = monthlyData[monthKey] || { income: 0, expense: 0 };
    if (t.type === "income") monthlyData[monthKey].income += t.amount;
    else monthlyData[monthKey].expense += t.amount;
  });

  animateValue(balanceEl, parseFloat(balanceEl.textContent) || 0, balance, 500);
  animateValue(
    incomeEl,
    parseFloat(incomeEl.textContent) || 0,
    totalIncome,
    500
  );
  animateValue(
    expenseEl,
    parseFloat(expenseEl.textContent) || 0,
    totalExpense,
    500
  );

  const months = Object.keys(monthlyData);
  if (months.length > 0) {
    barContainer.style.display = "block";
    barChart.data.labels = months;
    barChart.data.datasets[0].data = Object.values(monthlyData).map(
      (d) => d.income
    );
    barChart.data.datasets[1].data = Object.values(monthlyData).map(
      (d) => d.expense
    );
    barChart.update();
  } else {
    barContainer.style.display = "none";
  }

  localStorage.setItem("transactions", JSON.stringify(transactions));

  // Update pie
  chart.data.labels = Object.keys(expenseCategories);
  chart.data.datasets[0].data = Object.values(expenseCategories);
  chart.update();

  // Update bar
  barChart.data.labels = Object.keys(monthlyData);
  barChart.data.datasets[0].data = Object.values(monthlyData).map(
    (d) => d.income
  );
  barChart.data.datasets[1].data = Object.values(monthlyData).map(
    (d) => d.expense
  );
  barChart.update();
}

// Ajouter transaction
form.addEventListener("submit", (e) => {
  e.preventDefault();
  transactions.push({
    desc: desc.value,
    amount: parseFloat(amount.value),
    type: type.value,
    category: category.value,
    date: new Date().toISOString(),
  });
  desc.value = "";
  amount.value = "";
  render();
});

// Supprimer
function remove(i) {
  transactions.splice(i, 1);
  render();
}

// Éditer
function edit(i) {
  let t = transactions[i];
  desc.value = t.desc;
  amount.value = t.amount;
  type.value = t.type;
  category.value = t.category;
  transactions.splice(i, 1);
  render();
}

// Export
document.getElementById("export-csv").addEventListener("click", () => {
  let csv =
    "Description,Montant,Type,Catégorie,Date\n" +
    transactions
      .map((t) => `${t.desc},${t.amount},${t.type},${t.category},${t.date}`)
      .join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transactions.csv";
  a.click();
});
document.getElementById("export-json").addEventListener("click", () => {
  let blob = new Blob([JSON.stringify(transactions, null, 2)], {
    type: "application/json",
  });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transactions.json";
  a.click();
});

// Reset
document.getElementById("reset").addEventListener("click", () => {
  if (confirm("Effacer toutes les transactions ?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    render();
  }
});

// Dark mode
const toggleDark = document.getElementById("toggle-dark");
toggleDark.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");

  if (document.documentElement.classList.contains("dark")) {
    toggleDark.textContent = "☀️ Mode clair";
  } else {
    toggleDark.textContent = "🌙 Mode sombre";
  }
});

filterCategory.addEventListener("change", render);
filterMonth.addEventListener("change", render);

render();
