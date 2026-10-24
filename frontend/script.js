// Names used to save data in the browser

const USER_KEY = "expense-tracker:user";
const TOKEN_KEY = "expense-tracker:token";

// Expense categories
const CATEGORIES = {
  Food: { name: "Food", icon: "🍔", color: "#488286" },
  Transport: { name: "Transport", icon: "🚌", color: "#6689A1" },
  Shopping: { name: "Shopping", icon: "🛍️", color: "#BFCC94" },
  Bills: { name: "Bills", icon: "🧾", color: "#344966" },
  Entertainment: { name: "Entertainment", icon: "🎬", color: "#916C80" },
  Health: { name: "Health", icon: "💊", color: "#558564" },
  Education: { name: "Education", icon: "📚", color: "#326771" },
  Other: { name: "Other", icon: "✨", color: "#305252" },
};

// Shows amounts in rupees
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

// Short helper to find an element by its id
const $ = (id) => document.getElementById(id);

// Things the app keeps track of
let records = [];
let budgets = {};
let user = loadUser();
let currentScreen = "records";
let editingId = null;
const today = new Date();
let shown = { year: today.getFullYear(), month: today.getMonth() };


// Address of the server
const API = "/api";

 
// Sends a request to the server with the login pass and gives back the answer
async function callServer(path, method, body) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(API + path, {
    method: method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // The login pass is missing or has ended, so go back to the login page
  if (response.status === 401) {
    signOut();
    throw new Error("Please sign in");
  }
  if (!response.ok) throw new Error("Server error");
  return response.json();
}


 
// Load expenses and budgets from the server and draw the screen
async function loadData() {
  try {
    const expenses = await callServer("/expenses");
    records = expenses.map((r) => ({ ...r, id: r._id }));

    const list = await callServer("/budgets");
    budgets = {};
    list.forEach((b) => {
      budgets[b.month] = b.amount;
    });
  } catch (error) {
    if (error.message !== "Please sign in") {
      alert("Could not reach the server. Please start it and refresh the page.");
    }
  }
  render();
}


// Read the signed in user, or null if nobody is signed in
function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

// Small helpers for dates, totals and safe text
function pad(n) {
  return String(n).padStart(2, "0");
}

function dateText(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// Each month gets its own key made from the year and month so it has its own budget
function monthKey(year, month) {
  return year + "-" + pad(month + 1);
}

function shownKey() {
  return monthKey(shown.year, shown.month);
}

function monthName() {
  return new Date(shown.year, shown.month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function monthRecords() {
  return records.filter((r) => r.date.startsWith(shownKey()));
}

function sumOf(list) {
  return list.reduce((sum, r) => sum + r.amount, 0);
}

function safe(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function categoryOf(name) {
  return CATEGORIES[name] || CATEGORIES.Other;
}

function iconHtml(c) {
  return '<span class="row-icon" style="background:' + c.color + '33">' + c.icon + "</span>";
}

// Draw everything that depends on records and budgets
function render() {
  drawTotals();
  drawBudget();
  drawRecords();
  drawChart();
}

// Month name with the budget, spent and left amounts
function drawTotals() {
  const spent = sumOf(monthRecords());
  const budget = budgets[shownKey()];

  $("month").textContent = monthName();
  $("spent").textContent = money.format(spent);

  if (budget) {
    $("budget").textContent = money.format(budget);
    $("left").textContent = money.format(budget - spent);
    $("left").classList.toggle("over", spent > budget);
  } else {
    $("budget").textContent = "Not set";
    $("left").textContent = "-";
    $("left").classList.remove("over");
  }
}

// Budget card with the progress bar
function drawBudget() {
  const spent = sumOf(monthRecords());
  const budget = budgets[shownKey()];
  const fill = $("budget-fill");

  if (!budget) {
    $("budget-text").textContent = "No budget set for this month yet.";
    $("set-budget").textContent = "Set budget";
    fill.style.width = "0%";
    fill.classList.remove("over");
    return;
  }

  const percent = Math.round((spent / budget) * 100);
  $("set-budget").textContent = "Change";
  $("budget-text").textContent =
    spent <= budget
      ? percent + "% of your budget used"
      : "Over budget by " + money.format(spent - budget);
  fill.style.width = Math.min(100, (spent / budget) * 100) + "%";
  fill.classList.toggle("over", spent > budget);
}

// Records list grouped by day
function drawRecords() {
  const list = $("list");
  const items = monthRecords().sort((a, b) => b.date.localeCompare(a.date));
  list.innerHTML = "";
  $("records-empty").hidden = items.length > 0;

  const days = {};
  items.forEach((r) => {
    if (!days[r.date]) days[r.date] = [];
    days[r.date].push(r);
  });

  Object.keys(days).forEach((date) => {
    const [y, m, d] = date.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

    const rows = days[date]
      .map((r) => {
        const c = categoryOf(r.category);
        const note = r.note ? '<span class="row-note">' + safe(r.note) + "</span>" : "";
        return (
          '<button class="row" data-id="' + safe(r.id) + '">' +
          iconHtml(c) +
          '<span class="row-info"><span class="row-name">' + c.name + "</span>" + note + "</span>" +
          '<span class="row-amount">' + money.format(r.amount) + "</span>" +
          "</button>"
        );
      })
      .join("");

    const day = document.createElement("div");
    day.className = "day";
    day.innerHTML =
      '<div class="day-title"><span>' + label + "</span><span>" +
      money.format(sumOf(days[date])) + "</span></div>" +
      '<div class="rows">' + rows + "</div>";
    list.appendChild(day);
  });
}

// Donut chart, legend and top categories
function drawChart() {
  const items = monthRecords();
  const sum = sumOf(items);
  const hasData = items.length > 0;

  $("chart-card").hidden = !hasData;
  $("top-card").hidden = !hasData;
  $("chart-empty").hidden = hasData;
  if (!hasData) return;

  // Add up the spending for each category, biggest first
  const totals = {};
  items.forEach((r) => {
    totals[r.category] = (totals[r.category] || 0) + r.amount;
  });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  // The donut is a circular color gradient
  let start = 0;
  const parts = sorted.map(([category, amount]) => {
    const end = start + (amount / sum) * 100;
    const part = categoryOf(category).color + " " + start + "% " + end + "%";
    start = end;
    return part;
  });
  $("donut").style.background = "conic-gradient(" + parts.join(", ") + ")";
  $("donut-total").textContent = money.format(sum);

  $("legend").innerHTML = sorted
    .map(([category, amount]) => {
      const c = categoryOf(category);
      const percent = ((amount / sum) * 100).toFixed(1);
      return (
        '<li><span class="legend-dot" style="background:' + c.color + '"></span>' +
        c.name + '<span class="percent">' + percent + "%</span></li>"
      );
    })
    .join("");

  $("top-list").innerHTML = sorted
    .map(([category, amount]) => {
      const c = categoryOf(category);
      const percent = ((amount / sum) * 100).toFixed(1);
      return (
        "<li>" +
        '<div class="top-row">' + iconHtml(c) +
        '<span class="top-name">' + c.name + "<small>" + percent + "%</small></span>" +
        "<b>" + money.format(amount) + "</b></div>" +
        '<div class="category-bar"><div class="category-fill" style="width:' + percent + "%;background:" + c.color + '"></div></div>' +
        "</li>"
      );
    })
    .join("");
}

// Go to the previous or next month
function moveMonth(step) {
  const d = new Date(shown.year, shown.month + step, 1);
  shown = { year: d.getFullYear(), month: d.getMonth() };
  render();
}

$("prev").addEventListener("click", () => moveMonth(-1));
$("next").addEventListener("click", () => moveMonth(1));

// Switching between Records, Chart, Assistant and Me
function showScreen(name) {
  currentScreen = name;

  document.querySelectorAll(".screen").forEach((s) => {
    s.hidden = s.id !== name;
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === name);
  });

  // The month bar is only needed on Records and Chart
  $("month-bar").hidden = !(name === "records" || name === "chart");
  $("screens").scrollTop = 0;
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showScreen(tab.dataset.screen));
});

// The add and edit popup
const popup = $("popup");
const form = $("form");

// Open the popup to add a new expense or edit an old one
function openPopup(record) {
  form.reset();
  editingId = record ? record.id : null;
  $("popup-title").textContent = record ? "Edit expense" : "Add expense";
  $("popup-message").textContent = "";
  $("delete").hidden = !record;

  if (record) {
    $("amount").value = record.amount;
    $("date").value = record.date;
    $("note").value = record.note || "";
    const radio = form.querySelector('input[name="category"][value="' + record.category + '"]');
    if (radio) radio.checked = true;
  } else {
    $("date").value = dateText(new Date());
  }

  popup.showModal();
  if (!record) $("amount").focus();
}

$("add").addEventListener("click", () => openPopup(null));
$("close").addEventListener("click", () => popup.close());

// Clicking an expense opens it for editing
$("list").addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (!row) return;
  const record = records.find((r) => r.id === row.dataset.id);
  if (record) openPopup(record);
});

// Amount boxes accept only numbers and up to two decimals
function cleanAmount(e) {
  let value = e.target.value.replace(/[^0-9.]/g, "");
  const dot = value.indexOf(".");
  if (dot !== -1) {
    value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  }
  e.target.value = value;
}

$("amount").addEventListener("input", cleanAmount);
$("budget-amount").addEventListener("input", cleanAmount);

// Save a new expense or update an old one
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = parseFloat($("amount").value);
  const category = form.elements.category.value;

  if (!(amount > 0)) {
    $("popup-message").textContent = "Please enter an amount above zero.";
    return;
  }
  if (!category) {
    $("popup-message").textContent = "Please pick a category.";
    return;
  }

  const data = {
    amount: Math.round(amount * 100) / 100,
    category: category,
    date: $("date").value,
    note: $("note").value.trim(),
  };

  try {
    if (editingId) await callServer("/expenses/" + editingId, "PUT", data);
    else await callServer("/expenses", "POST", data);
  } catch {
    $("popup-message").textContent = "Could not save. Is the server running?";
    return;
  }

  // Show the month of the saved expense so it is easy to spot
  const [y, m] = data.date.split("-").map(Number);
  shown = { year: y, month: m - 1 };

  popup.close();
  await loadData();
});




// Delete an expense after asking
$("delete").addEventListener("click", async () => {
  if (!editingId || !confirm("Delete this expense?")) return;

  try {
    await callServer("/expenses/" + editingId, "DELETE");
  } catch {
    alert("Could not delete. Is the server running?");
    return;
  }

  popup.close();
  await loadData();
});

// The budget popup, each month has its own budget
const budgetPopup = $("budget-popup");

$("set-budget").addEventListener("click", () => {
  const key = shownKey();
  const before = new Date(shown.year, shown.month - 1, 1);
  const lastMonth = budgets[monthKey(before.getFullYear(), before.getMonth())];

  // If this month has no budget yet, start with the amount from last month
  $("budget-title").textContent = "Budget for " + monthName();
  $("budget-amount").value = budgets[key] || lastMonth || "";
  $("budget-remove").hidden = !budgets[key];
  budgetPopup.showModal();
  $("budget-amount").focus();
});

$("budget-close").addEventListener("click", () => budgetPopup.close());

$("budget-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = parseFloat($("budget-amount").value);
  if (!(amount > 0)) return;

  try {
    await callServer("/budgets/" + shownKey(), "PUT", { amount: Math.round(amount * 100) / 100 });
  } catch {
    alert("Could not save the budget. Is the server running?");
    return;
  }

  budgetPopup.close();
  await loadData();
});

$("budget-remove").addEventListener("click", async () => {
  try {
    await callServer("/budgets/" + shownKey(), "DELETE");
  } catch {
    alert("Could not remove the budget. Is the server running?");
    return;
  }

  budgetPopup.close();
  await loadData();
});

// Clicking the dark area outside a popup closes it
[popup, budgetPopup].forEach((p) => {
  p.addEventListener("click", (e) => {
    if (e.target === p) p.close();
  });
});

// Add a message bubble to the chat and scroll to it
function addBubble(text, who) {
  const bubble = document.createElement("p");
  bubble.className = "bubble " + who;
  bubble.textContent = text;
  $("messages").appendChild(bubble);
  $("messages").scrollTop = $("messages").scrollHeight;
  return bubble;
}

// Send the question to the server and show the answer
$("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const input = $("chat-input");
  const question = input.value.trim();
  if (!question) return;

  addBubble(question, "me");
  input.value = "";
  input.disabled = true;
  const waiting = addBubble("Thinking...", "bot");

  try {
    const data = await callServer("/chat", "POST", { message: question });
    waiting.textContent = data.reply;
  } catch {
    waiting.textContent = "Sorry, the assistant could not answer right now. Please try again in a minute.";
  }

  input.disabled = false;
  input.focus();
  $("messages").scrollTop = $("messages").scrollHeight;
});

// The Google client ID, copy it from the backend .env file
const GOOGLE_CLIENT_ID = "800953821744-l3rpuqge32peg3fcap6kog60g7jq1k2i.apps.googleusercontent.com";
let googleStarted = false;

// Show the login page or the app
function showLogin() {
  $("app").hidden = true;
  $("login").hidden = false;
  $("message").textContent = "";
  drawGoogleButton();
}

function showApp() {
  $("login").hidden = true;
  $("app").hidden = false;
  drawProfile();
  loadData();
  showScreen(currentScreen);
}

// Name, email and first letter on the Me screen
function drawProfile() {
  const name = user.name || user.email;
  $("name").textContent = name;
  $("email").textContent = user.email;
  $("avatar").textContent = name.charAt(0).toUpperCase();
}

// Draw the Google sign in button once Google has loaded
function drawGoogleButton() {
  if (!window.google) return;

  if (!googleStarted) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogle,
    });
    googleStarted = true;
  }
  google.accounts.id.renderButton($("google-button"), {
    theme: "outline",
    size: "large",
    width: 280,
  });
}

// Send the proof from Google to our server and save the login pass
async function handleGoogle(response) {
  try {
    const result = await fetch(API + "/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });
    if (!result.ok) throw new Error("Sign in failed");

    const data = await result.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    user = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    showApp();
  } catch {
    $("message").textContent = "Could not sign in. Please try again.";
  }
}

// Remove the login pass and go back to the login page
function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  user = null;
  records = [];
  budgets = {};
  currentScreen = "records";
  showLogin();
}

$("logout").addEventListener("click", signOut);

// The Google script loads after this file, so draw the button when everything is ready
window.addEventListener("load", () => {
  if (!$("login").hidden) drawGoogleButton();
});

// Start the app
if (user && localStorage.getItem(TOKEN_KEY)) {
  showApp();
} else {
  showLogin();
}