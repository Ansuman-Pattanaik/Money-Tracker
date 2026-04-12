const STORAGE_KEYS = {
  transactions: "sxt_transactions",
  customCategories: "sxt_custom_categories",
  theme: "sxt_theme",
  activeRange: "sxt_active_range",
  pieRange: "sxt_pie_range",
  pieDate: "sxt_pie_date",
  lineDate: "sxt_line_date",
  summaryMonth: "sxt_summary_month",
};
const expenseCategories = ["Food", "Travel", "Shopping", "Health Care", "Others"];
const emiCategories = [
  "Home Loan",
  "Car Loan",
  "Bike Loan",
  "Phone EMI",
  "Laptop EMI",
  "Electronics EMI",
  "Personal Loan",
  "Gold Loan",
];
const incomeCategories = ["Salary", "Bonus", "Rental", "Trading", "Other Income"];
const transactionTypeLabels = {
  income: "Income",
  expense: "Expense",
  emi: "EMI",
};
const logoSources = {
  light: "1776011150175.png",
  dark: "1776008751843.png",
};
const today = new Date();
const els = {
  clearAllBtn: document.getElementById("clearAllBtn"),
  brandLogo: document.getElementById("brandLogo"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  summaryMonth: document.getElementById("summaryMonth"),
  monthlyIncome: document.getElementById("monthlyIncome"),
  totalExpenses: document.getElementById("totalExpenses"),
  totalEmi: document.getElementById("totalEmi"),
  balanceAmount: document.getElementById("balanceAmount"),
  incomeForm: document.getElementById("incomeForm"),
  incomeAmount: document.getElementById("incomeAmount"),
  incomeCategory: document.getElementById("incomeCategory"),
  incomeDate: document.getElementById("incomeDate"),
  incomeNote: document.getElementById("incomeNote"),
  customCategoryForm: document.getElementById("customCategoryForm"),
  customCategoryType: document.getElementById("customCategoryType"),
  customCategoryName: document.getElementById("customCategoryName"),
  customCategoryList: document.getElementById("customCategoryList"),
  transactionForm: document.getElementById("transactionForm"),
  transactionDate: document.getElementById("transactionDate"),
  transactionType: document.getElementById("transactionType"),
  categorySelect: document.getElementById("categorySelect"),
  transactionAmount: document.getElementById("transactionAmount"),
  transactionNote: document.getElementById("transactionNote"),
  saveTransactionBtn: document.getElementById("saveTransactionBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  editBadge: document.getElementById("editBadge"),
  pieCanvas: document.getElementById("pieChart"),
  pieDate: document.getElementById("pieDate"),
  pieCenterPercent: document.getElementById("pieCenterPercent"),
  pieCenterLabel: document.getElementById("pieCenterLabel"),
  pieCenterAmount: document.getElementById("pieCenterAmount"),
  pieTotal: document.getElementById("pieTotal"),
  pieMessage: document.getElementById("pieMessage"),
  lineCanvas: document.getElementById("lineChart"),
  lineDate: document.getElementById("lineDate"),
  lineTotal: document.getElementById("lineTotal"),
  lineMessage: document.getElementById("lineMessage"),
  historyList: document.getElementById("historyList"),
  historyTemplate: document.getElementById("historyItemTemplate"),
  pieRangeButtons: document.querySelectorAll(".pie-range-btn"),
  lineRangeButtons: document.querySelectorAll(".line-range-btn"),
};
let transactions = loadTransactions();
let customCategories = loadCustomCategories();
let editingId = null;
let activeRange = localStorage.getItem(STORAGE_KEYS.activeRange) || "weekly";
let pieRange = localStorage.getItem(STORAGE_KEYS.pieRange) || "daily";
let pieReferenceDate = normalizeDateString(localStorage.getItem(STORAGE_KEYS.pieDate) || toDateInputValue(today));
let lineReferenceDate = normalizeDateString(localStorage.getItem(STORAGE_KEYS.lineDate) || toDateInputValue(today));
let summaryMonthKey = normalizeMonthString(localStorage.getItem(STORAGE_KEYS.summaryMonth) || toMonthInputValue(today));
const PIE_COLORS = ["#5b7cfa", "#7c3aed", "#0f9d58", "#f59e0b", "#dc2626", "#14b8a6"];
const pieChartState = {
  segments: [],
  total: 0,
  hoveredCategory: null,
  selectedCategory: null,
  innerRadius: 72,
  outerRadius: 118,
  contextLabel: "",
  emptyMessage: "No expenses found for this period.",
};
const lineChartState = {
  bars: [],
  hoveredIndex: null,
};
if (!["weekly", "monthly"].includes(activeRange)) {
  activeRange = "weekly";
}
if (!["daily", "weekly", "monthly"].includes(pieRange)) {
  pieRange = "daily";
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function toDateInputValue(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toMonthInputValue(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function formatCurrency(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `\u20B9${safe.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function normalizeDateString(dateStr) {
  if (!dateStr) return toDateInputValue(today);
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return toDateInputValue(today);
  return toDateInputValue(d);
}
function normalizeMonthString(monthStr) {
  const match = String(monthStr || "").match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) {
      return `${year}-${pad(month)}`;
    }
  }
  const fallback = new Date(monthStr);
  if (Number.isNaN(fallback.getTime())) return toMonthInputValue(today);
  return toMonthInputValue(fallback);
}
function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function parseDateInput(dateStr) {
  const parts = String(dateStr || "").split("-").map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const fallback = new Date(dateStr);
  return Number.isNaN(fallback.getTime()) ? new Date(today) : fallback;
}
function shiftDateString(dateStr, offsetDays) {
  const d = parseDateInput(dateStr);
  d.setDate(d.getDate() + offsetDays);
  return toDateInputValue(d);
}
function getWeekBounds(dateStr) {
  const reference = parseDateInput(dateStr);
  const start = new Date(reference);
  start.setDate(reference.getDate() - reference.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}
function formatDisplayDate(dateStr, options = { day: "numeric", month: "short", year: "numeric" }) {
  return parseDateInput(dateStr).toLocaleDateString(undefined, options);
}
function normalizeTransactionType(type) {
  const normalized = String(type || "expense").toLowerCase();
  return transactionTypeLabels[normalized] ? normalized : "expense";
}
function isExpenseLikeTransaction(transaction) {
  const type = normalizeTransactionType(transaction && transaction.type);
  return type === "expense" || type === "emi";
}
function isEmiCategory(category) {
  return category === "EMI" || emiCategories.includes(category);
}
function isEmiTransaction(transaction) {
  const type = normalizeTransactionType(transaction && transaction.type);
  const category = transaction && transaction.category;
  return type === "emi" || (type === "expense" && isEmiCategory(category));
}
function getTransactionTypeLabel(transaction) {
  const typeKey = isEmiTransaction(transaction)
    ? "emi"
    : normalizeTransactionType(transaction && transaction.type);
  return transactionTypeLabels[typeKey] || "Expense";
}
function getFormTransactionType(transaction) {
  return isEmiTransaction(transaction) ? "emi" : normalizeTransactionType(transaction && transaction.type);
}
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
        .filter(item => item && typeof item === "object")
        .map(item => ({
          ...item,
          type: normalizeTransactionType(item.type),
          category: String(item.category || ""),
          amount: safeNumber(item.amount),
          date: normalizeDateString(item.date),
          note: typeof item.note === "string" ? item.note : "",
        }))
      : [];
  } catch {
    return [];
  }
}
function normalizeCategoryName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}
function uniqueCategoryList(categories) {
  const seen = new Set();
  return categories
    .map(normalizeCategoryName)
    .filter(Boolean)
    .filter((category) => {
      const key = category.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
function getEmptyCustomCategories() {
  return {
    expense: [],
    income: [],
  };
}
function normalizeCustomCategories(value) {
  const safe = getEmptyCustomCategories();
  if (!value || typeof value !== "object") {
    return safe;
  }
  safe.expense = Array.isArray(value.expense) ? uniqueCategoryList(value.expense) : [];
  safe.income = Array.isArray(value.income) ? uniqueCategoryList(value.income) : [];
  return safe;
}
function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customCategories);
    return normalizeCustomCategories(raw ? JSON.parse(raw) : {});
  } catch {
    return getEmptyCustomCategories();
  }
}
function saveCustomCategories() {
  localStorage.setItem(STORAGE_KEYS.customCategories, JSON.stringify(customCategories));
}
function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  els.brandLogo.src = theme === "dark" ? logoSources.dark : logoSources.light;
  els.themeIcon.textContent = theme === "dark" ? "\u2600\uFE0F" : "\u{1F319}";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === "dark" || saved === "light") {
    setTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}
function getCategoryOptions(type = els.transactionType.value, selectedCategory = "") {
  const normalizedType = normalizeTransactionType(type);
  const baseOptions = normalizedType === "income"
    ? incomeCategories
    : normalizedType === "emi"
      ? emiCategories
      : expenseCategories;
  const customOptions = normalizedType === "income" || normalizedType === "expense"
    ? customCategories[normalizedType] || []
    : [];
  const options = uniqueCategoryList([...baseOptions, ...customOptions]);
  const normalizedSelected = normalizeCategoryName(selectedCategory);
  return normalizedSelected && !options.some(cat => cat.toLowerCase() === normalizedSelected.toLowerCase())
    ? [...options, normalizedSelected]
    : options;
}
function renderSelectOptions(selectEl, options, selectedCategory = "") {
  const normalizedSelected = normalizeCategoryName(selectedCategory);
  const selectedOption = options.find(cat => cat === selectedCategory)
    || options.find(cat => cat.toLowerCase() === normalizedSelected.toLowerCase());
  selectEl.replaceChildren(...options.map((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    return option;
  }));
  if (selectedOption) {
    selectEl.value = selectedOption;
  }
}
function renderCategoryOptions(selectedCategory = "") {
  const options = getCategoryOptions(els.transactionType.value, selectedCategory);
  renderSelectOptions(els.categorySelect, options, selectedCategory);
}
function renderIncomeSourceOptions(selectedCategory = "") {
  const options = getCategoryOptions("income", selectedCategory);
  renderSelectOptions(els.incomeCategory, options, selectedCategory);
}
function renderCustomCategoryList() {
  const groups = [
    { type: "expense", title: "Expense", empty: "No custom expense categories yet." },
    { type: "income", title: "Income", empty: "No custom income categories yet." },
  ];
  els.customCategoryList.replaceChildren();
  groups.forEach(({ type, title, empty }) => {
    const group = document.createElement("div");
    group.className = "category-group";
    const heading = document.createElement("h3");
    heading.textContent = `${title} categories`;
    group.appendChild(heading);
    const categories = customCategories[type] || [];
    if (!categories.length) {
      const emptyText = document.createElement("p");
      emptyText.className = "category-empty";
      emptyText.textContent = empty;
      group.appendChild(emptyText);
      els.customCategoryList.appendChild(group);
      return;
    }
    const row = document.createElement("div");
    row.className = "category-chip-row";
    categories.forEach((category) => {
      const chip = document.createElement("span");
      chip.className = "category-chip";
      const label = document.createElement("span");
      label.textContent = category;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.setAttribute("aria-label", `Remove ${category} ${title.toLowerCase()} category`);
      removeBtn.addEventListener("click", () => deleteCustomCategory(type, category));
      chip.append(label, removeBtn);
      row.appendChild(chip);
    });
    group.appendChild(row);
    els.customCategoryList.appendChild(group);
  });
}
function handleCustomCategorySubmit(event) {
  event.preventDefault();
  const type = els.customCategoryType.value === "income" ? "income" : "expense";
  const category = normalizeCategoryName(els.customCategoryName.value);
  if (!category) {
    alert("Enter a category name.");
    return;
  }
  if (getCategoryOptions(type).some(cat => cat.toLowerCase() === category.toLowerCase())) {
    alert(`${category} already exists in ${transactionTypeLabels[type].toLowerCase()} categories.`);
    return;
  }
  customCategories = {
    ...customCategories,
    [type]: uniqueCategoryList([...(customCategories[type] || []), category]),
  };
  saveCustomCategories();
  renderCustomCategoryList();
  renderCategoryOptions(els.transactionType.value === type ? category : els.categorySelect.value);
  renderIncomeSourceOptions(type === "income" ? category : els.incomeCategory.value);
  els.customCategoryName.value = "";
  els.customCategoryName.focus();
}
function deleteCustomCategory(type, category) {
  const ok = confirm(`Remove ${category} from custom ${transactionTypeLabels[type].toLowerCase()} categories? Existing transactions stay unchanged.`);
  if (!ok) return;
  const key = category.toLowerCase();
  const selectedTransactionCategory = els.transactionType.value === type && els.categorySelect.value.toLowerCase() === key
    ? ""
    : els.categorySelect.value;
  const selectedIncomeCategory = type === "income" && els.incomeCategory.value.toLowerCase() === key
    ? ""
    : els.incomeCategory.value;
  customCategories = {
    ...customCategories,
    [type]: (customCategories[type] || []).filter(cat => cat.toLowerCase() !== key),
  };
  saveCustomCategories();
  renderCustomCategoryList();
  renderCategoryOptions(selectedTransactionCategory);
  renderIncomeSourceOptions(selectedIncomeCategory);
}
function sumTransactions(predicate) {
  return transactions.filter(predicate).reduce((sum, t) => sum + safeNumber(t.amount), 0);
}
function getMonthlyTotal(monthKey, predicate) {
  return sumTransactions(t => predicate(t) && getMonthKey(t.date) === monthKey);
}
const getMonthlyIncome = (monthKey = summaryMonthKey) =>
  getMonthlyTotal(monthKey, t => normalizeTransactionType(t.type) === "income");
const getMonthlyExpenses = (monthKey = summaryMonthKey) => getMonthlyTotal(monthKey, isExpenseLikeTransaction);
const getMonthlyEmi = (monthKey = summaryMonthKey) => getMonthlyTotal(monthKey, isEmiTransaction);
const getBalance = (monthKey = summaryMonthKey) => getMonthlyIncome(monthKey) - getMonthlyExpenses(monthKey);
function updateSummaryCards() {
  const balance = getBalance(summaryMonthKey);
  els.monthlyIncome.textContent = formatCurrency(getMonthlyIncome(summaryMonthKey));
  els.totalExpenses.textContent = formatCurrency(getMonthlyExpenses(summaryMonthKey));
  els.totalEmi.textContent = formatCurrency(getMonthlyEmi(summaryMonthKey));
  els.balanceAmount.textContent = formatCurrency(balance);
  els.balanceAmount.style.color = balance < 0 ? "var(--danger)" : "var(--good)";
}
function getPieChartData() {
  const referenceDate = normalizeDateString(pieReferenceDate);
  if (pieRange === "weekly") {
    const startDate = shiftDateString(referenceDate, -6);
    const longStart = formatDisplayDate(startDate);
    const longEnd = formatDisplayDate(referenceDate);
    return {
      records: transactions.filter(t => isExpenseLikeTransaction(t) && t.date >= startDate && t.date <= referenceDate),
      contextLabel: `from ${longStart} to ${longEnd}`,
      emptyMessage: `No expenses found from ${longStart} to ${longEnd}.`,
    };
  }
  if (pieRange === "monthly") {
    const monthLabel = formatDisplayDate(referenceDate, { month: "long", year: "numeric" });
    return {
      records: transactions.filter(t => isExpenseLikeTransaction(t) && getMonthKey(t.date) === getMonthKey(referenceDate)),
      contextLabel: `in ${monthLabel}`,
      emptyMessage: `No expenses found in ${monthLabel}.`,
    };
  }
  const dayLabel = formatDisplayDate(referenceDate);
  return {
    records: transactions.filter(t => isExpenseLikeTransaction(t) && t.date === referenceDate),
    contextLabel: `on ${dayLabel}`,
    emptyMessage: `No expenses found on ${dayLabel}.`,
  };
}
function groupByCategory(records) {
  return records.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + safeNumber(t.amount);
    return acc;
  }, {});
}
function getActivePieSegment() {
  if (!pieChartState.segments.length) return null;
  return pieChartState.segments.find(segment => segment.category === pieChartState.hoveredCategory)
    || pieChartState.segments.find(segment => segment.category === pieChartState.selectedCategory)
    || pieChartState.segments[0];
}
function syncPieCenterContent() {
  els.pieTotal.textContent = pieChartState.contextLabel
    ? `Total expenses ${pieChartState.contextLabel}: ${formatCurrency(pieChartState.total)}`
    : `Total expenses: ${formatCurrency(pieChartState.total)}`;
  const activeSegment = getActivePieSegment();
  if (!activeSegment) {
    els.pieCenterPercent.textContent = "0%";
    els.pieCenterLabel.textContent = "No data";
    els.pieCenterAmount.textContent = "";
    els.pieMessage.textContent = pieChartState.emptyMessage;
    return;
  }
  els.pieCenterPercent.textContent = `${activeSegment.percent}%`;
  els.pieCenterLabel.textContent = activeSegment.category;
  els.pieCenterAmount.textContent = formatCurrency(activeSegment.value);
  if (pieChartState.hoveredCategory && pieChartState.hoveredCategory !== pieChartState.selectedCategory) {
    els.pieMessage.textContent = `Click ${activeSegment.category} to keep it selected ${pieChartState.contextLabel}.`;
    return;
  }
  if (pieChartState.selectedCategory) {
    els.pieMessage.textContent = `${activeSegment.category} is ${activeSegment.percent}% of your expenses ${pieChartState.contextLabel}.`;
    return;
  }
  els.pieMessage.textContent = `Top spend ${pieChartState.contextLabel}: ${activeSegment.category}.`;
}
function getPiePointerPosition(event) {
  const rect = els.pieCanvas.getBoundingClientRect();
  const scaleX = els.pieCanvas.width / rect.width;
  const scaleY = els.pieCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}
function findPieSegmentAtPosition(position) {
  if (!pieChartState.segments.length) return null;
  const centerX = els.pieCanvas.width / 2;
  const centerY = els.pieCanvas.height / 2;
  const dx = position.x - centerX;
  const dy = position.y - centerY;
  const distance = Math.hypot(dx, dy);
  if (distance < pieChartState.innerRadius || distance > pieChartState.outerRadius + 16) {
    return null;
  }
  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) angle += Math.PI * 2;
  return pieChartState.segments.find(segment => angle >= segment.startAngle && angle < segment.endAngle)
    || pieChartState.segments.find(segment => angle === segment.endAngle)
    || null;
}
function handlePieMouseMove(event) {
  const segment = findPieSegmentAtPosition(getPiePointerPosition(event));
  const hoveredCategory = segment ? segment.category : null;
  els.pieCanvas.style.cursor = segment ? "pointer" : "default";
  if (hoveredCategory === pieChartState.hoveredCategory) return;
  pieChartState.hoveredCategory = hoveredCategory;
  drawPieChart();
}
function handlePieMouseLeave() {
  els.pieCanvas.style.cursor = "default";
  if (!pieChartState.hoveredCategory) return;
  pieChartState.hoveredCategory = null;
  drawPieChart();
}
function handlePieClick(event) {
  const segment = findPieSegmentAtPosition(getPiePointerPosition(event));
  const selectedCategory = segment ? segment.category : null;
  els.pieCanvas.style.cursor = segment ? "pointer" : "default";
  if (selectedCategory === pieChartState.selectedCategory && pieChartState.hoveredCategory === selectedCategory) {
    return;
  }
  pieChartState.selectedCategory = selectedCategory;
  pieChartState.hoveredCategory = selectedCategory;
  drawPieChart();
}
function resetPieInteraction() {
  pieChartState.hoveredCategory = null;
  pieChartState.selectedCategory = null;
  els.pieCanvas.style.cursor = "default";
}
function drawPieChart() {
  const ctx = els.pieCanvas.getContext("2d");
  const { width, height } = els.pieCanvas;
  ctx.clearRect(0, 0, width, height);
  const pieData = getPieChartData();
  const records = pieData.records;
  const grouped = groupByCategory(records);
  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const styles = getComputedStyle(document.documentElement);
  const borderColor = styles.getPropertyValue("--border").trim();
  const cardColor = styles.getPropertyValue("--card-solid").trim();
  pieChartState.contextLabel = pieData.contextLabel;
  pieChartState.emptyMessage = pieData.emptyMessage;
  els.pieCanvas.setAttribute("aria-label", `Expense pie chart ${pieData.contextLabel}`);
  // backdrop
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, pieChartState.outerRadius + 6, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();
  if (!total) {
    pieChartState.segments = [];
    pieChartState.total = 0;
    resetPieInteraction();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 98, 0, Math.PI * 2);
    ctx.fillStyle = cardColor;
    ctx.fill();
    syncPieCenterContent();
    return;
  }
  let start = -Math.PI / 2;
  pieChartState.total = total;
  pieChartState.segments = entries.map(([category, value], index) => {
    const slice = (value / total) * Math.PI * 2;
    const segment = {
      category,
      value,
      percent: Math.round((value / total) * 100),
      color: PIE_COLORS[index % PIE_COLORS.length],
      startAngle: start,
      endAngle: start + slice,
      midAngle: start + slice / 2,
    };
    start += slice;
    return segment;
  });
  if (!pieChartState.segments.some(segment => segment.category === pieChartState.selectedCategory)) {
    pieChartState.selectedCategory = null;
  }
  if (!pieChartState.segments.some(segment => segment.category === pieChartState.hoveredCategory)) {
    pieChartState.hoveredCategory = null;
  }
  const hasInteractiveFocus = Boolean(pieChartState.hoveredCategory || pieChartState.selectedCategory);
  pieChartState.segments.forEach((segment) => {
    const isHovered = segment.category === pieChartState.hoveredCategory;
    const isSelected = segment.category === pieChartState.selectedCategory;
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      width / 2,
      height / 2,
      pieChartState.outerRadius + (isHovered ? 6 : isSelected ? 3 : 0),
      segment.startAngle,
      segment.endAngle
    );
    ctx.arc(
      width / 2,
      height / 2,
      pieChartState.innerRadius,
      segment.endAngle,
      segment.startAngle,
      true
    );
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.globalAlpha = hasInteractiveFocus && !isHovered && !isSelected ? 0.86 : 1;
    if (isHovered || isSelected) {
      ctx.shadowColor = "rgba(16, 32, 49, 0.18)";
      ctx.shadowBlur = 18;
    }
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = cardColor;
    ctx.stroke();
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, pieChartState.innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = cardColor;
  ctx.fill();
  els.pieCanvas.style.cursor = pieChartState.hoveredCategory ? "pointer" : "default";
  syncPieCenterContent();
}
function getLineContext() {
  const referenceDate = normalizeDateString(lineReferenceDate);
  if (activeRange === "weekly") {
    const { startDate, endDate } = getWeekBounds(referenceDate);
    return {
      ariaLabel: `weekly expense bar chart from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`,
      emptyMessage: `No expense data found from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}.`,
      rangeLabel: `for ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`,
    };
  }
  const referenceMonth = parseDateInput(referenceDate);
  const selectedYear = referenceMonth.getFullYear();
  return {
    ariaLabel: `monthly expense bar chart from January to December ${selectedYear}`,
    emptyMessage: `No expense data found in ${selectedYear}.`,
    rangeLabel: `in ${selectedYear}`,
  };
}
function getWeeklyData(referenceDate = lineReferenceDate) {
  const { startDate } = getWeekBounds(referenceDate);
  const weekStart = parseDateInput(startDate);
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return toDateInputValue(d);
  });
  return {
    labels,
    values: labels.map(key => sumTransactions(t => isExpenseLikeTransaction(t) && t.date === key)),
  };
}
function getMonthlyData(referenceDate = lineReferenceDate) {
  const selectedYear = parseDateInput(referenceDate).getFullYear();
  const labels = Array.from({ length: 12 }, (_, month) => `${selectedYear}-${pad(month + 1)}`);
  return {
    labels,
    values: labels.map(key => sumTransactions(t => isExpenseLikeTransaction(t) && getMonthKey(t.date) === key)),
  };
}
function formatAxisLabel(label, range) {
  if (range === "weekly") {
    const d = parseDateInput(label);
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  const [year, month] = label.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short" });
}
function formatPeriodLabel(label, range) {
  if (range === "weekly") {
    const d = parseDateInput(label);
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  }
  const [year, month] = label.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function getDefaultLineMessage(labels, values) {
  const lineContext = getLineContext();
  const topIndex = values.indexOf(Math.max(...values));
  const topValue = values[topIndex] || 0;
  const topLabel = labels[topIndex];
  if (!topValue) {
    return lineContext.emptyMessage;
  }
  if (activeRange === "weekly") {
    return `Highest spend ${lineContext.rangeLabel} was on ${formatPeriodLabel(topLabel, activeRange)}.`;
  }
  return `Highest spend ${lineContext.rangeLabel} was in ${formatPeriodLabel(topLabel, activeRange)}.`;
}
function syncLineMessage(labels, values) {
  const totalSpent = values.reduce((sum, value) => sum + safeNumber(value), 0);
  const lineContext = getLineContext();
  els.lineTotal.textContent = `Total expenses ${lineContext.rangeLabel}: ${formatCurrency(totalSpent)}`;
  const hoveredBar = lineChartState.bars[lineChartState.hoveredIndex];
  if (!hoveredBar) {
    els.lineMessage.textContent = getDefaultLineMessage(labels, values);
    return;
  }
  if (activeRange === "weekly") {
    els.lineMessage.textContent = `Total spent on ${formatPeriodLabel(hoveredBar.label, activeRange)}: ${formatCurrency(hoveredBar.value)}.`;
    return;
  }
  els.lineMessage.textContent = `Total spent in ${formatPeriodLabel(hoveredBar.label, activeRange)}: ${formatCurrency(hoveredBar.value)}.`;
}
function getLinePointerPosition(event) {
  const rect = els.lineCanvas.getBoundingClientRect();
  const scaleX = els.lineCanvas.width / rect.width;
  const scaleY = els.lineCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}
function findLineBarAtPosition(position) {
  if (!lineChartState.bars.length) return null;
  return lineChartState.bars.find(bar =>
    position.x >= bar.x
    && position.x <= bar.x + bar.width
    && position.y >= bar.y
    && position.y <= bar.y + bar.height
  ) || null;
}
function handleLineMouseMove(event) {
  const bar = findLineBarAtPosition(getLinePointerPosition(event));
  const hoveredIndex = bar ? bar.index : null;
  els.lineCanvas.style.cursor = bar ? "pointer" : "default";
  if (hoveredIndex === lineChartState.hoveredIndex) return;
  lineChartState.hoveredIndex = hoveredIndex;
  drawLineChart();
}
function handleLineMouseLeave() {
  els.lineCanvas.style.cursor = "default";
  if (lineChartState.hoveredIndex === null) return;
  lineChartState.hoveredIndex = null;
  drawLineChart();
}
function drawBar(ctx, x, y, width, height, radius) {
  const safeHeight = Math.max(height, 0);
  const safeRadius = Math.min(radius, width / 2, safeHeight / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + safeHeight);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + safeHeight);
  ctx.closePath();
}
function drawLineHoverBadge(ctx, bar, valueText, chartTop) {
  const styles = getComputedStyle(document.documentElement);
  const cardColor = styles.getPropertyValue("--card-solid").trim();
  const borderColor = styles.getPropertyValue("--border").trim();
  const textColor = styles.getPropertyValue("--text").trim();
  const badgeWidth = Math.max(92, ctx.measureText(valueText).width + 20);
  const badgeHeight = 28;
  const badgeX = Math.min(
    Math.max(12, bar.x + bar.width / 2 - badgeWidth / 2),
    els.lineCanvas.width - badgeWidth - 12
  );
  const badgeY = Math.max(chartTop - 6, bar.y - badgeHeight - 12);
  ctx.save();
  drawBar(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 10);
  ctx.fillStyle = cardColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.shadowColor = "rgba(16, 32, 49, 0.12)";
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(valueText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
  ctx.restore();
}
function drawLineChart() {
  const ctx = els.lineCanvas.getContext("2d");
  const { width, height } = els.lineCanvas;
  ctx.clearRect(0, 0, width, height);
  const lineContext = getLineContext();
  const data = activeRange === "weekly"
    ? getWeeklyData(lineReferenceDate)
    : getMonthlyData(lineReferenceDate);
  const values = data.values;
  const labels = data.labels;
  els.lineCanvas.setAttribute("aria-label", lineContext.ariaLabel);
  const padLeft = 56;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 52;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const max = Math.max(10, ...values);
  const color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const accent2 = getComputedStyle(document.documentElement).getPropertyValue("--accent-2").trim();
  const grid = getComputedStyle(document.documentElement).getPropertyValue("--border").trim();
  const text = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
  const slotWidth = labels.length ? innerW / labels.length : innerW;
  const barWidth = Math.min(58, Math.max(24, slotWidth * 0.58));
  // grid
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  ctx.font = "12px sans-serif";
  ctx.fillStyle = text;
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (innerH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    const value = Math.round(max - (max / 4) * i);
    ctx.fillText(`\u20B9${value}`, 10, y + 4);
  }
  lineChartState.bars = values.map((value, index) => {
    const heightValue = (value / max) * innerH;
    const x = padLeft + index * slotWidth + (slotWidth - barWidth) / 2;
    const y = padTop + innerH - heightValue;
    return {
      index,
      label: labels[index],
      value,
      x,
      y,
      width: barWidth,
      height: heightValue,
    };
  });
  if (lineChartState.hoveredIndex !== null && !lineChartState.bars.some(bar => bar.index === lineChartState.hoveredIndex)) {
    lineChartState.hoveredIndex = null;
  }
  lineChartState.bars.forEach((bar) => {
    const isHovered = bar.index === lineChartState.hoveredIndex;
    ctx.save();
    drawBar(ctx, bar.x, bar.y, bar.width, bar.height, 12);
    ctx.fillStyle = isHovered ? accent2 : color;
    ctx.globalAlpha = isHovered ? 1 : 0.9;
    if (isHovered) {
      ctx.shadowColor = "rgba(16, 32, 49, 0.18)";
      ctx.shadowBlur = 18;
    }
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = text;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(formatAxisLabel(bar.label, activeRange), bar.x + bar.width / 2, height - 18);
  });
  const hoveredBar = lineChartState.bars[lineChartState.hoveredIndex];
  if (hoveredBar) {
    ctx.font = "12px sans-serif";
    drawLineHoverBadge(ctx, hoveredBar, formatCurrency(hoveredBar.value), padTop);
  }
  els.lineCanvas.style.cursor = hoveredBar ? "pointer" : "default";
  syncLineMessage(labels, values);
}
function resetForm() {
  editingId = null;
  els.transactionForm.reset();
  els.transactionDate.value = toDateInputValue(today);
  els.saveTransactionBtn.textContent = "Add Transaction";
  els.cancelEditBtn.classList.add("hidden");
  els.editBadge.classList.add("hidden");
  els.transactionType.value = "expense";
  renderCategoryOptions();
}
function resetIncomeForm() {
  els.incomeForm.reset();
  els.incomeCategory.value = "Salary";
  els.incomeDate.value = toDateInputValue(today);
}
function startEdit(id) {
  const item = transactions.find(t => t.id === id);
  if (!item) return;
  editingId = id;
  els.transactionDate.value = item.date;
  els.transactionType.value = getFormTransactionType(item);
  renderCategoryOptions(item.category);
  els.categorySelect.value = item.category;
  els.transactionAmount.value = item.amount;
  els.transactionNote.value = item.note || "";
  els.saveTransactionBtn.textContent = "Update Transaction";
  els.cancelEditBtn.classList.remove("hidden");
  els.editBadge.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function deleteTransaction(id) {
  const item = transactions.find(t => t.id === id);
  if (!item) return;
  const ok = confirm(`Delete ${item.category} on ${item.date}?`);
  if (!ok) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  if (editingId === id) resetForm();
  refreshUI();
}
function handleTransactionSubmit(event) {
  event.preventDefault();
  const payload = {
    date: normalizeDateString(els.transactionDate.value),
    type: normalizeTransactionType(els.transactionType.value),
    category: els.categorySelect.value,
    amount: safeNumber(els.transactionAmount.value),
    note: els.transactionNote.value.trim(),
  };
  if (!payload.amount) {
    alert("Enter a valid amount.");
    return;
  }
  if (editingId) {
    transactions = transactions.map(t => (t.id === editingId ? { ...t, ...payload } : t));
  } else {
    transactions.unshift({
      id: Date.now(),
      ...payload,
    });
  }
  saveTransactions();
  resetForm();
  refreshUI();
}
function handleIncomeSubmit(event) {
  event.preventDefault();
  const amount = safeNumber(els.incomeAmount.value);
  if (!amount) {
    alert("Enter a valid income amount.");
    return;
  }
  const incomeRecord = {
    id: Date.now(),
    date: normalizeDateString(els.incomeDate.value),
    type: "income",
    category: els.incomeCategory.value,
    amount,
    note: els.incomeNote.value.trim() || `${els.incomeCategory.value} income saved`,
  };
  transactions.unshift(incomeRecord);
  saveTransactions();
  resetIncomeForm();
  refreshUI();
}
function refreshUI() {
  updateSummaryCards();
  drawPieChart();
  drawLineChart();
  renderHistory();
}
function handleRangeChange(range) {
  activeRange = range;
  localStorage.setItem(STORAGE_KEYS.activeRange, range);
  els.lineRangeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.range === range));
  lineChartState.hoveredIndex = null;
  els.lineCanvas.style.cursor = "default";
  drawLineChart();
}
function handleLineDateChange() {
  lineReferenceDate = normalizeDateString(els.lineDate.value);
  els.lineDate.value = lineReferenceDate;
  localStorage.setItem(STORAGE_KEYS.lineDate, lineReferenceDate);
  lineChartState.hoveredIndex = null;
  els.lineCanvas.style.cursor = "default";
  drawLineChart();
}
function handleSummaryMonthChange() {
  summaryMonthKey = normalizeMonthString(els.summaryMonth.value);
  els.summaryMonth.value = summaryMonthKey;
  localStorage.setItem(STORAGE_KEYS.summaryMonth, summaryMonthKey);
  updateSummaryCards();
}
function handlePieRangeChange(range) {
  pieRange = range;
  localStorage.setItem(STORAGE_KEYS.pieRange, range);
  els.pieRangeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.pieRange === range));
  resetPieInteraction();
  drawPieChart();
}
function handlePieDateChange() {
  pieReferenceDate = normalizeDateString(els.pieDate.value);
  els.pieDate.value = pieReferenceDate;
  localStorage.setItem(STORAGE_KEYS.pieDate, pieReferenceDate);
  resetPieInteraction();
  drawPieChart();
}
function clearAllData() {
  const ok = confirm("Clear all saved income, expenses, custom categories, chart data, and history? This will reset everything back to zero.");
  if (!ok) return;
  transactions = [];
  customCategories = getEmptyCustomCategories();
  editingId = null;
  activeRange = "weekly";
  pieRange = "daily";
  pieReferenceDate = toDateInputValue(today);
  lineReferenceDate = toDateInputValue(today);
  summaryMonthKey = toMonthInputValue(today);
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.customCategories);
  localStorage.removeItem(STORAGE_KEYS.activeRange);
  localStorage.removeItem(STORAGE_KEYS.pieRange);
  localStorage.removeItem(STORAGE_KEYS.pieDate);
  localStorage.removeItem(STORAGE_KEYS.lineDate);
  localStorage.removeItem(STORAGE_KEYS.summaryMonth);
  resetPieInteraction();
  lineChartState.hoveredIndex = null;
  els.lineCanvas.style.cursor = "default";
  resetForm();
  resetIncomeForm();
  setupDefaults();
  refreshUI();
}
function setupDefaults() {
  els.transactionDate.value = toDateInputValue(today);
  els.incomeDate.value = toDateInputValue(today);
  els.pieDate.value = pieReferenceDate;
  els.lineDate.value = lineReferenceDate;
  els.summaryMonth.value = summaryMonthKey;
  renderIncomeSourceOptions();
  els.incomeCategory.value = "Salary";
  renderCategoryOptions();
  renderCustomCategoryList();
  els.lineRangeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.range === activeRange));
  els.pieRangeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.pieRange === pieRange));
}
function renderHistory() {
  els.historyList.innerHTML = "";
  if (!transactions.length) {
    els.historyList.innerHTML = `<p class="subtle">No transactions yet. Add one above and it will appear here.</p>`;
    return;
  }
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
  sorted.forEach((item) => {
    const node = els.historyTemplate.content.cloneNode(true);
    const [root, title, typeEl, meta, note, amount, editBtn, deleteBtn] = [
      ".history-item",
      ".history-title",
      ".history-type",
      ".history-meta",
      ".history-note",
      ".history-amount",
      ".edit-btn",
      ".delete-btn",
    ].map(selector => node.querySelector(selector));
    const isIncome = normalizeTransactionType(item.type) === "income";
    const isEmi = isEmiTransaction(item);
    const typeLabel = getTransactionTypeLabel(item);
    const categoryLabel = item.category || typeLabel;
    const borderColor = isIncome ? "var(--good)" : isEmi ? "var(--warning)" : "var(--danger)";
    title.textContent = categoryLabel;
    typeEl.textContent = typeLabel;
    typeEl.style.color = isIncome ? "var(--good)" : isEmi ? "var(--warning)" : "var(--muted)";
    meta.textContent = `${item.date} | ${categoryLabel} | ${typeLabel}`;
    note.textContent = item.note ? item.note : "No note added";
    amount.textContent = `${isIncome ? "+" : "-"} ${formatCurrency(item.amount)}`;
    amount.style.color = isIncome ? "var(--good)" : "var(--danger)";
    root.style.borderLeft = `4px solid ${borderColor}`;
    editBtn.addEventListener("click", () => startEdit(item.id));
    deleteBtn.addEventListener("click", () => deleteTransaction(item.id));
    els.historyList.appendChild(node);
  });
}
function setupEvents() {
  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
    // redraw because colors come from CSS variables
    drawPieChart();
    drawLineChart();
  });
  els.transactionType.addEventListener("change", () => {
    renderCategoryOptions();
  });
  els.transactionForm.addEventListener("submit", handleTransactionSubmit);
  els.incomeForm.addEventListener("submit", handleIncomeSubmit);
  els.customCategoryForm.addEventListener("submit", handleCustomCategorySubmit);
  els.cancelEditBtn.addEventListener("click", resetForm);
  els.clearAllBtn.addEventListener("click", clearAllData);
  els.summaryMonth.addEventListener("change", handleSummaryMonthChange);
  els.lineRangeButtons.forEach(btn => {
    btn.addEventListener("click", () => handleRangeChange(btn.dataset.range));
  });
  els.pieRangeButtons.forEach(btn => {
    btn.addEventListener("click", () => handlePieRangeChange(btn.dataset.pieRange));
  });
  els.pieDate.addEventListener("change", handlePieDateChange);
  els.lineDate.addEventListener("change", handleLineDateChange);
  els.pieCanvas.addEventListener("mousemove", handlePieMouseMove);
  els.pieCanvas.addEventListener("mouseleave", handlePieMouseLeave);
  els.pieCanvas.addEventListener("click", handlePieClick);
  els.lineCanvas.addEventListener("mousemove", handleLineMouseMove);
  els.lineCanvas.addEventListener("mouseleave", handleLineMouseLeave);
  window.addEventListener("resize", () => {
    // redraw to keep charts sharp on layout changes
    drawPieChart();
    drawLineChart();
  });
}
function init() {
  initTheme();
  setupDefaults();
  setupEvents();
  refreshUI();
}
init();
