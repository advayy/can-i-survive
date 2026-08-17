const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  step: 0,
  mode: "baseline",
  incomeMode: "typical",
  result: null,
};

const COUNTRY_PROFILES = {
  CA: {
    name: "Canada",
    currency: "CAD",
    dataBacked: true,
    inflationDefault: 0.021,
    headline: "Canada · data-backed prototype",
    details: "2025 annual-average CPI: 2.1%. June 2026 unemployment rate: 6.5%; Statistics Canada also reported a 0.6% layoff rate for that month. These are dated macro context values, not a personal annual job-loss probability.",
    labourEventAnnualProxy: 0.045,
    sources: [
      "Statistics Canada CPI annual review, 2025",
      "Statistics Canada Labour Force Survey, June 2026",
      "Statistics Canada 2025 layoff research"
    ]
  },
  US: {
    name: "United States",
    currency: "USD",
    dataBacked: false,
    inflationDefault: 0.02,
    headline: "United States · generic fallback",
    details: "A country-specific data pack has not been added yet. Manual assumptions remain visible and editable.",
    labourEventAnnualProxy: 0.045,
    sources: []
  },
  GB: {
    name: "United Kingdom",
    currency: "GBP",
    dataBacked: false,
    inflationDefault: 0.02,
    headline: "United Kingdom · generic fallback",
    details: "A country-specific data pack has not been added yet. Manual assumptions remain visible and editable.",
    labourEventAnnualProxy: 0.045,
    sources: []
  },
  NL: {
    name: "Netherlands",
    currency: "EUR",
    dataBacked: false,
    inflationDefault: 0.02,
    headline: "Netherlands · generic fallback",
    details: "A country-specific data pack has not been added yet. Manual assumptions remain visible and editable.",
    labourEventAnnualProxy: 0.045,
    sources: []
  },
  GENERIC: {
    name: "Generic",
    currency: "CAD",
    dataBacked: false,
    inflationDefault: 0.02,
    headline: "Generic · manual assumptions",
    details: "No local data pack is being applied.",
    labourEventAnnualProxy: 0.045,
    sources: []
  }
};

const CAREER_PROFILES = {
  general: {
    name: "General worker",
    canadaMedianAnnual: 1316.18 * 52,
    source: "Statistics Canada: average weekly earnings, Canada, Dec. 2025 ($1,316.18/week)",
    earlyGrowth: 0.045,
    midGrowth: 0.032,
    matureGrowth: 0.024,
    lateGrowth: 0.018,
    jobRiskMultiplier: 1.0,
  },
  software: {
    name: "Software development",
    canadaMedianAnnual: 48.08 * 2080,
    source: "Government of Canada Job Bank: software developer median wage, Canada ($48.08/hour)",
    earlyGrowth: 0.06,
    midGrowth: 0.04,
    matureGrowth: 0.027,
    lateGrowth: 0.018,
    jobRiskMultiplier: 1.08,
  },
  nursing: {
    name: "Registered nursing",
    canadaMedianAnnual: 43.27 * 2080,
    source: "Government of Canada Job Bank: registered nurse median wage, Canada ($43.27/hour)",
    earlyGrowth: 0.04,
    midGrowth: 0.03,
    matureGrowth: 0.023,
    lateGrowth: 0.018,
    jobRiskMultiplier: 0.72,
  },
  finance: {
    name: "Financial services management",
    canadaMedianAnnual: 57.14 * 2080,
    source: "Government of Canada Job Bank: financial services manager median wage, Canada ($57.14/hour)",
    earlyGrowth: 0.055,
    midGrowth: 0.038,
    matureGrowth: 0.026,
    lateGrowth: 0.018,
    jobRiskMultiplier: 0.92,
  },
};

const CANADIAN_WEALTH_MEDIANS = {
  under35: 159100,
  "35to44": 409300,
  "45to54": 675800,
  "55to64": 873400,
  "65plus": 738900,
};

const SHS_2023_AVERAGE_SPENDING = 76750;

const PERSONAL_EVENT_LIBRARY = [
  { id: "appliance", title: "Major appliance replacement", icon: "▣", min: 700, max: 2500, eligible: "all" },
  { id: "dental", title: "Unexpected dental / health bill", icon: "+", min: 500, max: 3500, eligible: "all" },
  { id: "move", title: "Unexpected move", icon: "→", min: 1500, max: 6000, eligible: "all" },
  { id: "vehicle", title: "Major vehicle repair", icon: "⚙", min: 1000, max: 4500, eligible: "all" },
  { id: "homeRepair", title: "Home repair surprise", icon: "⌂", min: 1500, max: 9000, eligible: "homeowner" },
  { id: "familySupport", title: "Family support / caregiving period", icon: "♡", min: 1000, max: 6500, eligible: "all" },
];

const HISTORICAL_SCENARIOS = {
  gfc2008: {
    name: "2008-09 financial crisis analogue",
    icon: "↘",
    durationMonths: 12,
    portfolioShock: 0.30,
    jobRiskMultiplier: 2.5,
    inflationShift: -0.01,
    mortgageRateShift: -0.01,
    note: "Simplified analogue: deep recession, financial-market loss and rapidly falling policy rates.",
    source: "Bank of Canada crisis-response chronology",
  },
  pandemic2020: {
    name: "2020 pandemic labour shock analogue",
    icon: "!",
    durationMonths: 9,
    portfolioShock: 0.20,
    jobRiskMultiplier: 3.0,
    inflationShift: -0.01,
    mortgageRateShift: -0.015,
    note: "Simplified analogue inspired by Canada's record 2020 unemployment shock.",
    source: "Statistics Canada Labour Force Survey, May 2020",
  },
  inflation2022: {
    name: "2022 inflation / rate shock analogue",
    icon: "↑",
    durationMonths: 18,
    portfolioShock: 0.15,
    jobRiskMultiplier: 1.1,
    inflationShift: 0.04,
    mortgageRateShift: 0.02,
    note: "Simplified analogue inspired by Canada's 6.8% annual-average CPI increase in 2022.",
    source: "Statistics Canada CPI annual review, 2022",
  },
};

const CALIBRATION_ITEMS = [
  { type: "official", title: "Inflation anchor", detail: "2.1% annual-average CPI increase in 2025.", source: "Statistics Canada · CPI annual review 2025" },
  { type: "proxy", title: "Job-loss context", detail: "June 2026 layoff rate was 0.6%; the simulator keeps personal annual job-loss risk editable.", source: "Statistics Canada · Labour Force Survey" },
  { type: "official", title: "Household spending", detail: "$76,750 average spending on goods and services in 2023.", source: "Statistics Canada · Survey of Household Spending" },
  { type: "official", title: "Household wealth", detail: "2023 median net worth benchmarks by age come from the Survey of Financial Security.", source: "Statistics Canada · SFS 2023" },
  { type: "model", title: "Career transitions", detail: "Promotion and re-employment salary changes are calibrated assumptions, not official forecasts.", source: "Model parameter informed by labour-transition research" },
  { type: "model", title: "Markets & historical stress", detail: "Historical analogues preserve the shape of real episodes, not exact month-by-month returns.", source: "Bank of Canada / Statistics Canada context" },
];

const CANADA_TAX_2026 = {
  federal: [
    [58523, 0.14],
    [117045, 0.205],
    [181440, 0.26],
    [258482, 0.29],
    [Infinity, 0.33],
  ],
  provinces: {
    AB: [[61200,0.08],[154259,0.10],[185111,0.12],[246813,0.13],[370220,0.14],[Infinity,0.15]],
    BC: [[50363,0.056],[100728,0.077],[115648,0.105],[140430,0.1229],[190405,0.147],[265545,0.168],[Infinity,0.205]],
    MB: [[47564,0.108],[101200,0.1275],[Infinity,0.174]],
    NB: [[52333,0.094],[104666,0.14],[193861,0.16],[Infinity,0.195]],
    NL: [[44678,0.087],[89354,0.145],[159528,0.158],[223340,0.178],[285319,0.198],[570638,0.208],[1141275,0.213],[Infinity,0.218]],
    NT: [[53003,0.059],[106009,0.086],[172346,0.122],[Infinity,0.1405]],
    NS: [[30995,0.0879],[61991,0.1495],[97417,0.1667],[157124,0.175],[Infinity,0.21]],
    NU: [[55801,0.04],[111602,0.07],[181439,0.09],[Infinity,0.115]],
    ON: [[53891,0.0505],[107785,0.0915],[150000,0.1116],[220000,0.1216],[Infinity,0.1316]],
    PE: [[33928,0.095],[65820,0.1347],[106890,0.166],[142520,0.1762],[200000,0.19],[Infinity,0.20]],
    SK: [[54532,0.105],[155805,0.125],[Infinity,0.145]],
    YT: [[58523,0.064],[117045,0.09],[181440,0.109],[500000,0.128],[Infinity,0.15]],
  },
  federalBasicPersonalAmount: 16452,
  cppBaseMax: 4230.45,
  cpp2Max: 416.00,
  cppYmpe: 74600,
  cppYampe: 85000,
  cppExemption: 3500,
  cppRate: 0.0595,
  cpp2Rate: 0.04,
  eiMaxEarnings: 68900,
  eiRate: 0.0163,
  eiMax: 1123.07,
};

const LIFE_QX_ANCHORS = [
  [20, 0.00045],
  [30, 0.00055],
  [40, 0.00085],
  [50, 0.0018],
  [60, 0.0045],
  [65, 0.0075],
  [70, 0.012],
  [75, 0.021],
  [80, 0.036],
  [85, 0.064],
  [90, 0.11],
  [95, 0.19],
  [100, 0.30],
  [105, 0.43],
  [110, 0.58],
];

const BASE_EVENTS = [
  {
    type: "unemployment",
    icon: "⌁",
    title: "Job loss / unemployment",
    probabilityKind: "country-profile",
    minDuration: 2,
    maxDuration: 8,
  },
  {
    type: "emergency",
    icon: "!",
    title: "Unexpected expense",
    probabilityKind: "scenario",
    annualProbability: 0.085,
    minAmount: 1000,
    maxAmount: 6500,
  },
  {
    type: "bonus",
    icon: "+",
    title: "Windfall / bonus",
    probabilityKind: "scenario",
    annualProbability: 0.07,
    minAmount: 750,
    maxAmount: 5000,
  },
  {
    type: "marketShock",
    icon: "↘",
    title: "Market shock",
    probabilityKind: "scenario",
    annualProbability: 0.035,
    minAmount: 0.08,
    maxAmount: 0.24,
  },
];

const views = $$(".view");
const steps = $$(".step");

function showView(id) {
  views.forEach(view => view.classList.toggle("active", view.id === id));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setStep(index) {
  state.step = Math.max(0, Math.min(steps.length - 1, index));
  steps.forEach((step, i) => step.classList.toggle("active", i === state.step));
  $("#stepIndicator").textContent = `${state.step + 1} / ${steps.length}`;
  $("#backButton").style.visibility = state.step === 0 ? "hidden" : "visible";
  $("#nextButton").style.display = state.step === steps.length - 1 ? "none" : "inline-flex";
  updateRunSummary();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function addNode(type, values = {}) {
  const template = $(`#${type}NodeTemplate`);
  if (!template) return;

  const fragment = template.content.cloneNode(true);
  const node = $(".node", fragment);

  Object.entries(values).forEach(([key, value]) => {
    const el = $(`[data-field="${key}"]`, node);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(value);
    else el.value = value;
  });

  const containerMap = {
    income: $("#incomeNodes"),
    expense: $("#expenseNodes"),
    debt: $("#debtNodes"),
  };
  const container = containerMap[type];

  $(".remove-node", node).addEventListener("click", () => {
    if (type === "debt" || $$(".node", container).length > 1) node.remove();
  });

  container?.appendChild(node);
}

function initializeNodes(example = false) {
  $("#incomeNodes").innerHTML = "";
  $("#expenseNodes").innerHTML = "";
  $("#debtNodes").innerHTML = "";

  if (example) {
    addNode("income", { label: "Primary job", annual: 72000, startAge: 25, endAge: 65, growth: 3 });
    addNode("income", { label: "Retirement income", annual: 26000, startAge: 65, endAge: 85, growth: 2 });
    addNode("expense", { label: "Core living costs", monthly: 3000, startAge: 25, endAge: 100, inflates: true });
    addNode("expense", { label: "Travel / lifestyle", monthly: 350, startAge: 25, endAge: 75, inflates: true });
    addNode("debt", { label: "Student loan", balance: 10000, apr: 4.5, payment: 250 });
  } else {
    addNode("income", { label: "Primary job", annual: 65000, startAge: 25, endAge: 65, growth: 3 });
    addNode("expense", { label: "Living costs", monthly: 2800, startAge: 25, endAge: 100, inflates: true });
  }
}

function collectNodes(type) {
  const containerMap = {
    income: $("#incomeNodes"),
    expense: $("#expenseNodes"),
    debt: $("#debtNodes"),
  };
  const container = containerMap[type];
  if (!container) return [];

  return $$(".node", container).map(node => {
    const data = {};
    $$("[data-field]", node).forEach(input => {
      const key = input.dataset.field;
      data[key] = input.type === "checkbox" ? input.checked :
        input.type === "number" ? Number(input.value) :
        input.value.trim();
    });
    return data;
  });
}

function number(id) {
  const raw = $(id).value;
  return raw === "" ? 0 : Number(raw);
}

function collectPlan() {
  return {
    currentAge: number("#currentAge"),
    endAge: number("#endAge"),
    retirementAge: number("#retirementAge"),
    startingSavings: number("#startingSavings"),
    startingInvestments: number("#startingInvestments"),
    currency: $("#currency").value,
    country: $("#country").value,
    province: $("#province").value,

    incomeMode: state.incomeMode,
    careerField: $("#careerField").value,
    careerCurrentIncome: number("#careerCurrentIncome"),
    incomeNodes: collectNodes("income"),
    expenseNodes: collectNodes("expense"),
    debtNodes: collectNodes("debt"),

    inflationRate: number("#inflationRate") / 100,
    stochasticInflation: $("#stochasticInflation").checked,
    inflationVolatility: number("#inflationVolatility") / 100,
    expenseRealGrowth: number("#expenseRealGrowth") / 100,
    retirementExpenseMultiplier: number("#retirementExpenseMultiplier") / 100,
    cashReturn: number("#cashReturn") / 100,

    portfolioModel: $("#portfolioModel").value,
    investmentReturn: number("#investmentReturn") / 100,
    investmentVolatility: number("#investmentVolatility") / 100,
    equityWeight: number("#equityWeight") / 100,
    bondWeight: number("#bondWeight") / 100,
    equityReturn: number("#equityReturn") / 100,
    equityVolatility: number("#equityVolatility") / 100,
    bondReturn: number("#bondReturn") / 100,
    bondVolatility: number("#bondVolatility") / 100,
    equityBondCorrelation: number("#equityBondCorrelation"),
    parameterUncertainty: $("#parameterUncertainty").checked,
    investmentFee: number("#investmentFee") / 100,
    stochasticReturns: $("#stochasticReturns").checked,
    investmentShare: number("#investmentShare") / 100,
    taxFreeShare: number("#taxFreeShare") / 100,
    taxDeferredShare: number("#taxDeferredShare") / 100,
    taxableInvestmentTaxRate: number("#taxableInvestmentTaxRate") / 100,

    minSavePercent: number("#minSavePercent") / 100,
    maxSavePercent: number("#maxSavePercent") / 100,
    minSaveAmount: number("#minSaveAmount"),

    taxModel: $("#taxModel").value,
    incomeTaxRate: number("#incomeTaxRate") / 100,
    deferredWithdrawalTaxRate: number("#deferredWithdrawalTaxRate") / 100,
    governmentRetirementMonthly: number("#governmentRetirementMonthly"),
    governmentRetirementAge: number("#governmentRetirementAge"),
    longevityBufferYears: number("#longevityBufferYears"),
    longevityProfile: $("#longevityProfile").value,
    displayRealDollars: $("#displayRealDollars").checked,

    includeHome: $("#includeHome").checked,
    homeValue: number("#homeValue"),
    mortgageBalance: number("#mortgageBalance"),
    mortgageRate: number("#mortgageRate") / 100,
    mortgageYears: number("#mortgageYears"),
    mortgageTermYears: number("#mortgageTermYears"),
    mortgageRenewalSpread: number("#mortgageRenewalSpread") / 100,
    homeAppreciation: number("#homeAppreciation") / 100,
    propertyTaxRate: number("#propertyTaxRate") / 100,
    homeMaintenanceRate: number("#homeMaintenanceRate") / 100,

    jobLossAnnual: number("#jobLossAnnual") / 100,
    jobLossMinMonths: number("#jobLossMinMonths"),
    jobLossMaxMonths: number("#jobLossMaxMonths"),
    emergencyAnnual: number("#emergencyAnnual") / 100,
    emergencyMin: number("#emergencyMin"),
    emergencyMax: number("#emergencyMax"),
    bonusAnnual: number("#bonusAnnual") / 100,
    bonusMin: number("#bonusMin"),
    bonusMax: number("#bonusMax"),
    marketShockAnnual: number("#marketShockAnnual") / 100,
    marketShockMin: number("#marketShockMin") / 100,
    marketShockMax: number("#marketShockMax") / 100,

    promotionAnnual: number("#promotionAnnual") / 100,
    promotionMin: number("#promotionMin") / 100,
    promotionMax: number("#promotionMax") / 100,
    reemploymentMin: number("#reemploymentMin") / 100,
    reemploymentMax: number("#reemploymentMax") / 100,
    namedEventDeck: $("#namedEventDeck").checked,
    eventCostScale: number("#eventCostScale") / 100,

    recessionEntryAnnual: number("#recessionEntryAnnual") / 100,
    recessionExitAnnual: number("#recessionExitAnnual") / 100,
    recessionJobMultiplier: number("#recessionJobMultiplier"),
    recessionReturnPenalty: number("#recessionReturnPenalty") / 100,

    historicalScenario: $("#historicalScenario").value,
    historicalScenarioAge: number("#historicalScenarioAge"),

    seed: Math.floor(number("#seed") || 1),
    eventIntensity: number("#eventIntensity") / 100,
    useLocalRisk: $("#useLocalRisk").checked,
    monteRuns: Number($("#monteRuns").value),
    mode: state.mode,
  };
}

function validatePlan(plan) {
  const issues = [];
  if (plan.endAge <= plan.currentAge) issues.push("End age must be after current age.");
  if (plan.retirementAge < plan.currentAge || plan.retirementAge > plan.endAge + plan.longevityBufferYears) {
    issues.push("Retirement age must fall inside the simulated life window.");
  }
  if (plan.incomeMode === "custom" && !plan.incomeNodes.length) issues.push("Add at least one income node.");
  if (plan.incomeMode === "typical" && plan.country !== "CA" && plan.careerCurrentIncome <= 0) {
    issues.push("For countries without a wage data pack, enter your current annual income in Typical Career mode.");
  }
  if (!plan.expenseNodes.length) issues.push("Add at least one expense node.");
  if (plan.taxFreeShare + plan.taxDeferredShare > 1) {
    issues.push("Tax-free and tax-deferred investment shares cannot add to more than 100%.");
  }
  if (plan.portfolioModel === "multiasset" && plan.equityWeight + plan.bondWeight > 1.0001) {
    issues.push("Equity and bond allocations cannot add to more than 100%.");
  }
  if (plan.jobLossMinMonths > plan.jobLossMaxMonths) issues.push("Job-loss minimum duration cannot exceed the maximum.");
  if (plan.promotionMin > plan.promotionMax) issues.push("Promotion minimum cannot exceed the maximum.");
  if (plan.reemploymentMin > plan.reemploymentMax) issues.push("Re-employment salary minimum cannot exceed the maximum.");
  if (plan.emergencyMin > plan.emergencyMax) issues.push("Emergency minimum cannot exceed the maximum.");
  if (plan.bonusMin > plan.bonusMax) issues.push("Bonus minimum cannot exceed the maximum.");
  if (plan.marketShockMin > plan.marketShockMax) issues.push("Market-shock minimum cannot exceed the maximum.");
  if (plan.includeHome && plan.mortgageBalance > plan.homeValue * 2) {
    issues.push("Mortgage balance looks unusually large compared with home value; check the housing inputs.");
  }

  if (issues.length) {
    alert(issues.join("\n"));
    return false;
  }
  return true;
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function annualToMonthly(rate) {
  return Math.pow(1 + rate, 1 / 12) - 1;
}

function normalRandom(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function stochasticMonthlyReturn(meanAnnual, volatilityAnnual, rng) {
  const sigma = Math.max(0, volatilityAnnual);
  const logReturn =
    ((meanAnnual - 0.5 * sigma * sigma) / 12) +
    (sigma / Math.sqrt(12)) * normalRandom(rng);
  return Math.exp(logReturn) - 1;
}

function monthlyProbability(annualProbability) {
  const annual = Math.max(0, Math.min(0.999999, annualProbability));
  return 1 - Math.pow(1 - annual, 1 / 12);
}

function mortgageMonthlyPayment(balance, annualRate, months) {
  if (balance <= 0 || months <= 0) return 0;
  const r = annualRate / 12;
  if (Math.abs(r) < 1e-12) return balance / months;
  const growth = Math.pow(1 + r, months);
  return balance * r * growth / (growth - 1);
}

function investmentTotal(accounts) {
  return accounts.taxFree + accounts.taxDeferred + accounts.taxable;
}

function realFactor(plan, month, priceIndex = null) {
  if (Number.isFinite(priceIndex) && priceIndex > 0) return priceIndex;
  return Math.pow(1 + plan.inflationRate, month / 12);
}

function displayAmount(plan, nominal, month, priceIndex = null) {
  return plan.displayRealDollars ? nominal / realFactor(plan, month, priceIndex) : nominal;
}

function dateFromMonth(startDate, monthIndex) {
  return new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, 1);
}

function ageAtMonth(startAge, monthIndex) {
  return startAge + monthIndex / 12;
}

function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function careerStageMultiplier(age) {
  if (age <= 23) return 0.62;
  if (age <= 27) return 0.72;
  if (age <= 31) return 0.84;
  if (age <= 36) return 0.94;
  if (age <= 45) return 1.04;
  if (age <= 55) return 1.08;
  return 1.03;
}

function careerGrowthRate(profile, age) {
  if (age < 30) return profile.earlyGrowth;
  if (age < 40) return profile.midGrowth;
  if (age < 55) return profile.matureGrowth;
  return profile.lateGrowth;
}

function typicalCareerMonthlyIncome(plan, age, monthsFromStart) {
  if (age >= plan.retirementAge) return 0;

  const profile = CAREER_PROFILES[plan.careerField] || CAREER_PROFILES.general;
  const country = COUNTRY_PROFILES[plan.country] || COUNTRY_PROFILES.GENERIC;

  let currentAnnual;
  if (plan.careerCurrentIncome > 0) {
    currentAnnual = plan.careerCurrentIncome;
  } else if (country.dataBacked && plan.country === "CA") {
    currentAnnual = profile.canadaMedianAnnual * careerStageMultiplier(plan.currentAge);
  } else {
    currentAnnual = CAREER_PROFILES.general.canadaMedianAnnual * careerStageMultiplier(plan.currentAge);
  }

  let annual = currentAnnual;
  const completedYears = Math.floor(monthsFromStart / 12);
  for (let year = 0; year < completedYears; year++) {
    const yearAge = plan.currentAge + year;
    annual *= 1 + careerGrowthRate(profile, yearAge);
  }

  const partialMonths = monthsFromStart % 12;
  annual *= Math.pow(1 + careerGrowthRate(profile, age), partialMonths / 12);
  return annual / 12;
}

function activeIncome(plan, age, monthsFromStart) {
  if (plan.incomeMode === "typical") {
    return typicalCareerMonthlyIncome(plan, age, monthsFromStart);
  }

  return plan.incomeNodes.reduce((sum, node) => {
    if (age < node.startAge || age >= node.endAge) return sum;
    const monthsSinceNodeStart = Math.max(0, monthsFromStart - Math.round((node.startAge - plan.currentAge) * 12));
    const monthlyGrowth = annualToMonthly((node.growth || 0) / 100);
    return sum + (node.annual / 12) * Math.pow(1 + monthlyGrowth, monthsSinceNodeStart);
  }, 0);
}

function activeExpenses(plan, age, monthsFromStart, priceIndex = null) {
  const monthlyInflation = annualToMonthly(plan.inflationRate);
  const monthlyRealGrowth = annualToMonthly(plan.expenseRealGrowth);
  const inflationFactor = Number.isFinite(priceIndex)
    ? priceIndex
    : Math.pow(1 + monthlyInflation, monthsFromStart);

  let total = plan.expenseNodes.reduce((sum, node) => {
    if (age < node.startAge || age >= node.endAge) return sum;

    let amount = node.monthly;
    if (node.inflates) amount *= inflationFactor;
    amount *= Math.pow(1 + monthlyRealGrowth, monthsFromStart);

    return sum + amount;
  }, 0);

  if (age >= plan.retirementAge) total *= plan.retirementExpenseMultiplier;
  return total;
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function taxFromBrackets(income, brackets) {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of brackets) {
    if (income <= lower) break;
    const taxable = Math.min(income, upper) - lower;
    tax += Math.max(0, taxable) * rate;
    lower = upper;
  }
  return tax;
}

function canadaAnnualPayrollTax(grossAnnual, province) {
  const gross = Math.max(0, grossAnnual);
  const federalBeforeCredit = taxFromBrackets(gross, CANADA_TAX_2026.federal);
  const federalCredit = CANADA_TAX_2026.federalBasicPersonalAmount * 0.14;
  const federalTax = Math.max(0, federalBeforeCredit - federalCredit);

  const provinceBrackets = CANADA_TAX_2026.provinces[province];
  if (!provinceBrackets) return null;
  const provincialTax = Math.max(0, taxFromBrackets(gross, provinceBrackets));

  const cppBase = Math.min(
    CANADA_TAX_2026.cppBaseMax,
    Math.max(0, Math.min(gross, CANADA_TAX_2026.cppYmpe) - CANADA_TAX_2026.cppExemption) * CANADA_TAX_2026.cppRate
  );
  const cpp2 = Math.min(
    CANADA_TAX_2026.cpp2Max,
    Math.max(0, Math.min(gross, CANADA_TAX_2026.cppYampe) - CANADA_TAX_2026.cppYmpe) * CANADA_TAX_2026.cpp2Rate
  );
  const ei = Math.min(CANADA_TAX_2026.eiMax, Math.min(gross, CANADA_TAX_2026.eiMaxEarnings) * CANADA_TAX_2026.eiRate);

  return federalTax + provincialTax + cppBase + cpp2 + ei;
}

function monthlyIncomeTax(plan, grossMonthly) {
  if (plan.taxModel === "canada2026" && plan.country === "CA" && plan.province !== "QC") {
    const annual = canadaAnnualPayrollTax(grossMonthly * 12, plan.province);
    if (annual !== null) return Math.max(0, annual / 12);
  }
  return Math.max(0, grossMonthly * plan.incomeTaxRate);
}

function multiAssetMonthlyReturn(plan, rng, recession = false, extraPenalty = 0) {
  const eqWeight = clamp(plan.equityWeight, 0, 1);
  const bondWeight = clamp(plan.bondWeight, 0, 1 - eqWeight);
  const cashWeight = Math.max(0, 1 - eqWeight - bondWeight);

  const z1 = normalRandom(rng);
  const z2independent = normalRandom(rng);
  const corr = clamp(plan.equityBondCorrelation, -0.99, 0.99);
  const z2 = corr * z1 + Math.sqrt(1 - corr * corr) * z2independent;

  const eqMean = plan.equityReturn - (recession ? plan.recessionReturnPenalty : 0) - extraPenalty;
  const bondMean = plan.bondReturn - extraPenalty * 0.2;

  const eqLog = ((eqMean - 0.5 * plan.equityVolatility ** 2) / 12) +
    (plan.equityVolatility / Math.sqrt(12)) * z1;
  const bondLog = ((bondMean - 0.5 * plan.bondVolatility ** 2) / 12) +
    (plan.bondVolatility / Math.sqrt(12)) * z2;

  const eqReturn = Math.exp(eqLog) - 1;
  const bondReturn = Math.exp(bondLog) - 1;
  const cashReturn = annualToMonthly(plan.cashReturn);

  return eqWeight * eqReturn + bondWeight * bondReturn + cashWeight * cashReturn;
}

function ageBandForBenchmark(age) {
  if (age < 35) return "under35";
  if (age < 45) return "35to44";
  if (age < 55) return "45to54";
  if (age < 65) return "55to64";
  return "65plus";
}

function canadianMedianNetWorth(age) {
  return CANADIAN_WEALTH_MEDIANS[ageBandForBenchmark(age)] || CANADIAN_WEALTH_MEDIANS.under35;
}

function spendingAgeFactor(age) {
  if (age < 30) return 0.82;
  if (age < 40) return 1.00;
  if (age < 55) return 1.10;
  if (age < 65) return 1.02;
  return 0.78;
}

function lifeQx(age, profile = "neutral") {
  const a = clamp(age, LIFE_QX_ANCHORS[0][0], LIFE_QX_ANCHORS[LIFE_QX_ANCHORS.length - 1][0]);
  let lower = LIFE_QX_ANCHORS[0];
  let upper = LIFE_QX_ANCHORS[LIFE_QX_ANCHORS.length - 1];

  for (let i = 0; i < LIFE_QX_ANCHORS.length - 1; i++) {
    if (a >= LIFE_QX_ANCHORS[i][0] && a <= LIFE_QX_ANCHORS[i + 1][0]) {
      lower = LIFE_QX_ANCHORS[i];
      upper = LIFE_QX_ANCHORS[i + 1];
      break;
    }
  }

  const fraction = upper[0] === lower[0] ? 0 : (a - lower[0]) / (upper[0] - lower[0]);
  const logQ = Math.log(lower[1]) + fraction * (Math.log(upper[1]) - Math.log(lower[1]));
  let q = Math.exp(logQ);
  if (profile === "male") q *= 1.12;
  if (profile === "female") q *= 0.86;
  return clamp(q, 0.00001, 0.95);
}

function probabilityOutliving(currentAge, targetAge, profile = "neutral") {
  if (profile === "manual" || targetAge <= currentAge) return null;
  let survival = 1;
  for (let age = Math.floor(currentAge); age < Math.floor(targetAge); age++) {
    survival *= 1 - lifeQx(age, profile);
  }
  return clamp(survival, 0, 1);
}

function chooseNamedExpenseEvent(plan, rng) {
  const eligible = PERSONAL_EVENT_LIBRARY.filter(item =>
    item.eligible === "all" || (item.eligible === "homeowner" && plan.includeHome)
  );
  return eligible[Math.floor(rng() * eligible.length)] || PERSONAL_EVENT_LIBRARY[0];
}

function historicalScenarioForPlan(plan, rng) {
  if (!plan.historicalScenario || plan.historicalScenario === "none") return null;
  if (plan.historicalScenario === "random") {
    const keys = Object.keys(HISTORICAL_SCENARIOS);
    return HISTORICAL_SCENARIOS[keys[Math.floor(rng() * keys.length)]];
  }
  return HISTORICAL_SCENARIOS[plan.historicalScenario] || null;
}

function samplePlanParameters(plan, seed) {
  if (!plan.parameterUncertainty) return { ...plan };
  const rng = mulberry32(seed ^ 0x5f3759df);
  return {
    ...plan,
    inflationRate: clamp(plan.inflationRate + normalRandom(rng) * 0.004, -0.01, 0.10),
    investmentReturn: plan.investmentReturn + normalRandom(rng) * 0.01,
    equityReturn: plan.equityReturn + normalRandom(rng) * 0.012,
    bondReturn: plan.bondReturn + normalRandom(rng) * 0.006,
    jobLossAnnual: clamp(plan.jobLossAnnual * Math.exp(normalRandom(rng) * 0.22), 0.001, 0.40),
    homeAppreciation: plan.homeAppreciation + normalRandom(rng) * 0.01,
  };
}

function eventLibraryForPlan(plan) {
  const country = COUNTRY_PROFILES[plan.country] || COUNTRY_PROFILES.GENERIC;
  const career = CAREER_PROFILES[plan.careerField] || CAREER_PROFILES.general;
  const careerMultiplier = plan.useLocalRisk && plan.incomeMode === "typical"
    ? career.jobRiskMultiplier
    : 1;

  return [
    {
      type: "unemployment",
      icon: "⌁",
      title: "Job loss / unemployment",
      annualProbability: plan.jobLossAnnual * careerMultiplier,
      minDuration: Math.max(1, Math.round(plan.jobLossMinMonths)),
      maxDuration: Math.max(1, Math.round(plan.jobLossMaxMonths)),
      probabilitySource: plan.useLocalRisk && country.dataBacked
        ? `${country.name} editable labour-risk assumption × ${career.name} modifier`
        : "User-editable probability assumption",
    },
    {
      type: "emergency",
      icon: "!",
      title: "Unexpected expense",
      annualProbability: plan.emergencyAnnual,
      minAmount: plan.emergencyMin,
      maxAmount: plan.emergencyMax,
      probabilitySource: "User-editable probability assumption",
    },
    {
      type: "bonus",
      icon: "+",
      title: "Windfall / bonus",
      annualProbability: plan.bonusAnnual,
      minAmount: plan.bonusMin,
      maxAmount: plan.bonusMax,
      probabilitySource: "User-editable probability assumption",
    },
    {
      type: "marketShock",
      icon: "↘",
      title: "Extra market shock",
      annualProbability: plan.marketShockAnnual,
      minAmount: plan.marketShockMin,
      maxAmount: plan.marketShockMax,
      probabilitySource: "User-editable probability assumption",
    },
  ];
}

function monthlyEventProbability(annualProbability, intensity) {
  return Math.min(1, (1 - Math.pow(1 - annualProbability, 1 / 12)) * intensity);
}

function simulate(plan) {
  const rng = mulberry32(plan.seed);
  const effectiveEndAge = plan.endAge + plan.longevityBufferYears;
  const totalMonths = Math.max(1, Math.round((effectiveEndAge - plan.currentAge) * 12));
  const startDate = new Date();
  startDate.setDate(1);

  const eventLibrary = eventLibraryForPlan(plan);
  const smoothInvestmentReturn = annualToMonthly(plan.investmentReturn - plan.investmentFee);
  const homeMonthlyReturn = annualToMonthly(plan.homeAppreciation);

  const taxFreeShare = clamp(plan.taxFreeShare, 0, 1);
  const taxDeferredShare = clamp(plan.taxDeferredShare, 0, 1 - taxFreeShare);
  const taxableShare = Math.max(0, 1 - taxFreeShare - taxDeferredShare);

  let cash = plan.startingSavings;
  const accounts = {
    taxFree: plan.startingInvestments * taxFreeShare,
    taxDeferred: plan.startingInvestments * taxDeferredShare,
    taxable: plan.startingInvestments * taxableShare,
  };

  let homeValue = plan.includeHome ? plan.homeValue : 0;
  let mortgageBalance = plan.includeHome ? plan.mortgageBalance : 0;
  const originalMortgageMonths = Math.max(1, Math.round(plan.mortgageYears * 12));
  let mortgageMonthsRemaining = originalMortgageMonths;
  let currentMortgageRate = plan.mortgageRate;
  let mortgagePayment = mortgageMonthlyPayment(mortgageBalance, currentMortgageRate, mortgageMonthsRemaining);
  let monthsUntilMortgageRenewal = Math.max(1, Math.round(plan.mortgageTermYears * 12));

  const debts = plan.debtNodes.map(node => ({
    ...node,
    balance: Math.max(0, node.balance || 0),
  }));

  let cumulativeGrossEarned = 0;
  let cumulativeNetEarned = 0;
  let cumulativeSpent = 0;
  let cumulativeTaxes = 0;
  let cumulativeContributions = 0;
  let cumulativeRealGrossEarned = 0;
  let cumulativeRealNetEarned = 0;
  let cumulativeRealSpent = 0;
  let cumulativeRealTaxes = 0;
  let cumulativeRealContributions = 0;

  let recession = false;
  let firstNegativeMonth = null;
  let minimumNetWorth = Infinity;
  let retirementSnapshot = null;

  let careerIncomeMultiplier = 1;
  let reemploymentAtMonth = null;
  let pendingReemploymentMultiplier = 1;

  let priceIndex = 1;
  let inflationAnnual = plan.inflationRate;
  let policyRate = 0.0225;

  const historicalScenario = historicalScenarioForPlan(plan, rng);
  const historicalStartMonth = historicalScenario
    ? Math.max(1, Math.round((plan.historicalScenarioAge - plan.currentAge) * 12))
    : null;
  let historicalMonthsRemaining = 0;
  let historicalActive = null;

  const points = [];
  const events = [];

  for (let month = 0; month <= totalMonths; month++) {
    const age = ageAtMonth(plan.currentAge, month);
    const date = dateFromMonth(startDate, month);

    if (historicalScenario && month === historicalStartMonth) {
      historicalActive = historicalScenario;
      historicalMonthsRemaining = historicalScenario.durationMonths;

      if (investmentTotal(accounts) > 0 && historicalScenario.portfolioShock > 0) {
        const before = investmentTotal(accounts);
        const multiplier = 1 - historicalScenario.portfolioShock;
        accounts.taxFree *= multiplier;
        accounts.taxDeferred *= multiplier;
        accounts.taxable *= multiplier;
        const loss = before - investmentTotal(accounts);
        events.push({
          type: "historicalStress",
          icon: historicalScenario.icon,
          title: historicalScenario.name,
          month,
          date,
          amount: -displayAmount(plan, loss, month, priceIndex),
          detail: `${historicalScenario.note} ${historicalScenario.source}.`,
        });
      }
    }

    const historicalJobMultiplier = historicalMonthsRemaining > 0 && historicalActive
      ? historicalActive.jobRiskMultiplier
      : 1;
    const historicalInflationShift = historicalMonthsRemaining > 0 && historicalActive
      ? historicalActive.inflationShift
      : 0;
    const historicalMortgageShift = historicalMonthsRemaining > 0 && historicalActive
      ? historicalActive.mortgageRateShift
      : 0;

    // Economic regime transitions.
    if (plan.mode !== "baseline") {
      if (!recession && rng() < monthlyProbability(plan.recessionEntryAnnual)) {
        recession = true;
        events.push({
          type: "recessionStart",
          icon: "↘",
          title: "Recession regime",
          month,
          date,
          amount: 0,
          detail: "The model entered a recession state: job-loss risk rises and expected investment returns fall.",
        });
      } else if (recession && rng() < monthlyProbability(plan.recessionExitAnnual)) {
        recession = false;
        events.push({
          type: "recessionEnd",
          icon: "↗",
          title: "Recovery regime",
          month,
          date,
          amount: 0,
          detail: "The model returned to its normal economic state.",
        });
      }
    }

    // Inflation and policy rate.
    if (month > 0) {
      const inflationTarget = plan.inflationRate + historicalInflationShift;
      if (plan.mode !== "baseline" && plan.stochasticInflation) {
        const persistence = 0.94;
        const innovation = normalRandom(rng) * (plan.inflationVolatility / Math.sqrt(12));
        inflationAnnual = clamp(
          inflationTarget + persistence * (inflationAnnual - inflationTarget) + innovation,
          -0.02,
          0.15
        );
      } else {
        inflationAnnual = inflationTarget;
      }

      const monthlyInflation = annualToMonthly(Math.max(-0.90, inflationAnnual));
      priceIndex *= 1 + monthlyInflation;

      const policyTarget = clamp(
        0.0225 + (inflationAnnual - 0.02) * 0.65 - (recession ? 0.005 : 0),
        0.0025,
        0.10
      );
      policyRate = clamp(0.90 * policyRate + 0.10 * policyTarget + normalRandom(rng) * 0.0008, 0.001, 0.12);
    }

    const cashMonthlyReturn = annualToMonthly(plan.cashReturn);
    if (cash > 0) cash *= 1 + cashMonthlyReturn;

    // Portfolio return.
    let marketReturn;
    if (plan.portfolioModel === "multiasset") {
      if (plan.mode !== "baseline" && plan.stochasticReturns) {
        marketReturn = multiAssetMonthlyReturn(plan, rng, recession, 0);
      } else {
        const eqWeight = clamp(plan.equityWeight, 0, 1);
        const bondWeight = clamp(plan.bondWeight, 0, 1 - eqWeight);
        const cashWeight = Math.max(0, 1 - eqWeight - bondWeight);
        const annualMean =
          eqWeight * plan.equityReturn +
          bondWeight * plan.bondReturn +
          cashWeight * plan.cashReturn -
          plan.investmentFee;
        marketReturn = annualToMonthly(annualMean);
      }
    } else {
      marketReturn = smoothInvestmentReturn;
      if (plan.mode !== "baseline" && plan.stochasticReturns) {
        const regimeMean = plan.investmentReturn - (recession ? plan.recessionReturnPenalty : 0);
        marketReturn = stochasticMonthlyReturn(regimeMean, plan.investmentVolatility, rng) - plan.investmentFee / 12;
      }
    }

    const beforeTaxable = accounts.taxable;
    accounts.taxFree *= 1 + marketReturn;
    accounts.taxDeferred *= 1 + marketReturn;
    accounts.taxable *= 1 + marketReturn;

    if (marketReturn > 0 && beforeTaxable > 0) {
      const taxableGain = beforeTaxable * marketReturn;
      const investmentTax = Math.max(0, taxableGain * plan.taxableInvestmentTaxRate);
      accounts.taxable -= investmentTax;
      cumulativeTaxes += investmentTax;
      cumulativeRealTaxes += investmentTax / priceIndex;
    }

    // Home appreciation, mortgage amortization and renewals.
    let housingOutflow = 0;
    if (plan.includeHome) {
      homeValue *= 1 + homeMonthlyReturn;

      if (mortgageBalance > 0) {
        if (monthsUntilMortgageRenewal <= 0 && mortgageMonthsRemaining > 0) {
          currentMortgageRate = clamp(
            policyRate + plan.mortgageRenewalSpread + historicalMortgageShift,
            0.005,
            0.20
          );
          mortgagePayment = mortgageMonthlyPayment(mortgageBalance, currentMortgageRate, mortgageMonthsRemaining);
          monthsUntilMortgageRenewal = Math.max(1, Math.round(plan.mortgageTermYears * 12));

          events.push({
            type: "mortgageRenewal",
            icon: "⌂",
            title: "Mortgage renewed",
            month,
            date,
            amount: 0,
            detail: `Mortgage rate reset to ${(currentMortgageRate * 100).toFixed(1)}% using the simulated rate environment.`,
          });
        }

        const monthlyMortgageRate = currentMortgageRate / 12;
        const interest = mortgageBalance * monthlyMortgageRate;
        const scheduled = Math.min(mortgagePayment, mortgageBalance + interest);
        const principal = Math.max(0, scheduled - interest);
        mortgageBalance = Math.max(0, mortgageBalance - principal);
        housingOutflow += scheduled;
        mortgageMonthsRemaining = Math.max(0, mortgageMonthsRemaining - 1);
        monthsUntilMortgageRenewal -= 1;
      }

      housingOutflow += homeValue * (plan.propertyTaxRate + plan.homeMaintenanceRate) / 12;
    }

    let debtOutflow = 0;
    debts.forEach(debt => {
      if (debt.balance <= 0) return;
      const interest = debt.balance * ((debt.apr || 0) / 100) / 12;
      const due = debt.balance + interest;
      const payment = Math.min(Math.max(0, debt.payment || 0), due);
      debt.balance = Math.max(0, due - payment);
      debtOutflow += payment;
    });

    // Career transitions.
    if (reemploymentAtMonth !== null && month === reemploymentAtMonth) {
      careerIncomeMultiplier *= pendingReemploymentMultiplier;
      events.push({
        type: "reemployment",
        icon: "↗",
        title: "Re-employed",
        month,
        date,
        amount: 0,
        detail: `New employment income path starts at ${(pendingReemploymentMultiplier * 100).toFixed(0)}% of the prior projected path.`,
      });
      reemploymentAtMonth = null;
      pendingReemploymentMultiplier = 1;
    }

    const unemployedNow = reemploymentAtMonth !== null && month < reemploymentAtMonth;
    let employmentGross = unemployedNow
      ? 0
      : activeIncome(plan, age, month) * careerIncomeMultiplier;

    if (
      plan.mode !== "baseline" &&
      plan.incomeMode === "typical" &&
      !unemployedNow &&
      age < plan.retirementAge &&
      rng() < monthlyProbability(plan.promotionAnnual)
    ) {
      const bump = plan.promotionMin + rng() * Math.max(0, plan.promotionMax - plan.promotionMin);
      careerIncomeMultiplier *= 1 + bump;
      employmentGross *= 1 + bump;
      events.push({
        type: "promotion",
        icon: "↑",
        title: "Promotion / career step",
        month,
        date,
        amount: 0,
        detail: `Future employment income path increased by ${(bump * 100).toFixed(0)}%. This is a modelled transition.`,
      });
    }

    const indexedGovernmentIncome = age >= plan.governmentRetirementAge
      ? plan.governmentRetirementMonthly * priceIndex
      : 0;

    let ordinaryExpenses = activeExpenses(plan, age, month, priceIndex);

    if (plan.mode !== "baseline") {
      eventLibrary.forEach(eventType => {
        let annualProbability = eventType.annualProbability;

        if (eventType.type === "unemployment") {
          if (recession) annualProbability *= plan.recessionJobMultiplier;
          annualProbability *= historicalJobMultiplier;
        }

        const eventProbability = monthlyEventProbability(annualProbability, plan.eventIntensity);
        if (rng() > eventProbability) return;

        if (eventType.type === "unemployment" && reemploymentAtMonth === null && employmentGross > 0) {
          const duration = Math.floor(eventType.minDuration + rng() * (eventType.maxDuration - eventType.minDuration + 1));
          reemploymentAtMonth = month + duration;
          pendingReemploymentMultiplier =
            plan.reemploymentMin + rng() * Math.max(0, plan.reemploymentMax - plan.reemploymentMin);
          employmentGross = 0;
          events.push({
            ...eventType,
            month,
            date,
            amount: 0,
            detail: `${duration} months with simulated employment-income interruption. Re-employment salary is drawn separately. ${eventType.probabilitySource}.`,
          });
        }

        if (eventType.type === "emergency") {
          let title = eventType.title;
          let icon = eventType.icon;
          let minAmount = eventType.minAmount;
          let maxAmount = eventType.maxAmount;
          let detailPrefix = "One-time unexpected expense";

          if (plan.namedEventDeck) {
            const named = chooseNamedExpenseEvent(plan, rng);
            title = named.title;
            icon = named.icon;
            minAmount = named.min * plan.eventCostScale;
            maxAmount = named.max * plan.eventCostScale;
            detailPrefix = "Named life-event scenario";
          }

          const amount = minAmount + rng() * Math.max(0, maxAmount - minAmount);
          ordinaryExpenses += amount;
          events.push({
            ...eventType,
            title,
            icon,
            month,
            date,
            amount: -displayAmount(plan, amount, month, priceIndex),
            detail: `${detailPrefix}: ${formatMoney(displayAmount(plan, amount, month, priceIndex), plan.currency)}. Cost range is an editable model assumption.`,
          });
        }

        if (eventType.type === "bonus") {
          const amount = eventType.minAmount + rng() * Math.max(0, eventType.maxAmount - eventType.minAmount);
          employmentGross += amount;
          events.push({
            ...eventType,
            month,
            date,
            amount: displayAmount(plan, amount, month, priceIndex),
            detail: `One-time gross income of ${formatMoney(displayAmount(plan, amount, month, priceIndex), plan.currency)}. ${eventType.probabilitySource}.`,
          });
        }

        if (eventType.type === "marketShock" && investmentTotal(accounts) > 0) {
          const loss = eventType.minAmount + rng() * Math.max(0, eventType.maxAmount - eventType.minAmount);
          const before = investmentTotal(accounts);
          const multiplier = Math.max(0, 1 - loss);
          accounts.taxFree *= multiplier;
          accounts.taxDeferred *= multiplier;
          accounts.taxable *= multiplier;
          const amount = before - investmentTotal(accounts);
          events.push({
            ...eventType,
            month,
            date,
            amount: -displayAmount(plan, amount, month, priceIndex),
            detail: `Additional ${(loss * 100).toFixed(0)}% portfolio shock layered onto the normal return model. ${eventType.probabilitySource}.`,
          });
        }
      });
    }

    const grossIncome = employmentGross + indexedGovernmentIncome;
    const incomeTax = monthlyIncomeTax(plan, grossIncome);
    const netIncome = Math.max(0, grossIncome - incomeTax);

    const requiredOutflow = ordinaryExpenses + housingOutflow + debtOutflow;

    cumulativeGrossEarned += grossIncome;
    cumulativeNetEarned += netIncome;
    cumulativeTaxes += incomeTax;
    cumulativeSpent += requiredOutflow;

    cumulativeRealGrossEarned += grossIncome / priceIndex;
    cumulativeRealNetEarned += netIncome / priceIndex;
    cumulativeRealTaxes += incomeTax / priceIndex;
    cumulativeRealSpent += requiredOutflow / priceIndex;

    const available = netIncome - requiredOutflow;
    let contribution = 0;

    if (available >= 0) {
      const desiredSavings = Math.max(plan.minSaveAmount, available * plan.minSavePercent);
      const incomeCap = netIncome * plan.maxSavePercent;
      contribution = Math.max(0, Math.min(available, desiredSavings, incomeCap));

      const investAmount = contribution * plan.investmentShare;
      const cashAmount = contribution - investAmount;
      cash += cashAmount;

      accounts.taxFree += investAmount * taxFreeShare;
      accounts.taxDeferred += investAmount * taxDeferredShare;
      accounts.taxable += investAmount * taxableShare;

      cumulativeContributions += contribution;
      cumulativeRealContributions += contribution / priceIndex;

      const discretionarySpend = available - contribution;
      cumulativeSpent += discretionarySpend;
      cumulativeRealSpent += discretionarySpend / priceIndex;
    } else {
      let shortfall = Math.abs(available);

      if (cash > 0) {
        const fromCash = Math.min(cash, shortfall);
        cash -= fromCash;
        shortfall -= fromCash;
      }

      const withdrawSimple = key => {
        if (shortfall <= 0 || accounts[key] <= 0) return;
        const amount = Math.min(accounts[key], shortfall);
        accounts[key] -= amount;
        shortfall -= amount;
      };

      withdrawSimple("taxable");
      withdrawSimple("taxFree");

      if (shortfall > 0 && accounts.taxDeferred > 0) {
        const taxRate = clamp(plan.deferredWithdrawalTaxRate, 0, 0.95);
        const grossNeeded = shortfall / Math.max(0.05, 1 - taxRate);
        const grossWithdrawal = Math.min(accounts.taxDeferred, grossNeeded);
        const withdrawalTax = grossWithdrawal * taxRate;
        const netProceeds = grossWithdrawal - withdrawalTax;

        accounts.taxDeferred -= grossWithdrawal;
        shortfall -= Math.min(shortfall, netProceeds);
        cumulativeTaxes += withdrawalTax;
        cumulativeRealTaxes += withdrawalTax / priceIndex;
      }

      if (shortfall > 0) cash -= shortfall;
    }

    const investments = investmentTotal(accounts);
    const debtBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const homeEquityNominal = homeValue - mortgageBalance;
    const nominalNetWorth = cash + investments + homeEquityNominal - debtBalance;
    const liquidNetWorthNominal = cash + investments - debtBalance;

    const shownNetWorth = displayAmount(plan, nominalNetWorth, month, priceIndex);
    minimumNetWorth = Math.min(minimumNetWorth, shownNetWorth);

    if (cash < 0 && firstNegativeMonth === null) firstNegativeMonth = month;

    const point = {
      month,
      date,
      age,
      cash: displayAmount(plan, cash, month, priceIndex),
      investments: displayAmount(plan, investments, month, priceIndex),
      netWorth: shownNetWorth,
      liquidNetWorth: displayAmount(plan, liquidNetWorthNominal, month, priceIndex),
      homeEquity: displayAmount(plan, homeEquityNominal, month, priceIndex),
      mortgageBalance: displayAmount(plan, mortgageBalance, month, priceIndex),
      debtBalance: displayAmount(plan, debtBalance, month, priceIndex),
      cumulativeEarned: plan.displayRealDollars ? cumulativeRealGrossEarned : cumulativeGrossEarned,
      cumulativeNetEarned: plan.displayRealDollars ? cumulativeRealNetEarned : cumulativeNetEarned,
      cumulativeSpent: plan.displayRealDollars ? cumulativeRealSpent : cumulativeSpent,
      cumulativeTaxes: plan.displayRealDollars ? cumulativeRealTaxes : cumulativeTaxes,
      cumulativeContributions: plan.displayRealDollars ? cumulativeRealContributions : cumulativeContributions,
      savingsRateGross: cumulativeGrossEarned > 0 ? cumulativeContributions / cumulativeGrossEarned : 0,
      recession,
      inflationAnnual,
      policyRate,
      mortgageRate: currentMortgageRate,
      priceIndex,
      careerIncomeMultiplier,
    };

    if (!retirementSnapshot && age >= plan.retirementAge) {
      retirementSnapshot = { ...point };
    }

    points.push(point);

    if (historicalMonthsRemaining > 0) {
      historicalMonthsRemaining -= 1;
      if (historicalMonthsRemaining === 0) historicalActive = null;
    }
  }

  const final = points[points.length - 1];
  return {
    plan: { ...plan, effectiveEndAge },
    points,
    events,
    final,
    survived: firstNegativeMonth === null,
    firstNegativeMonth,
    minimumNetWorth: Number.isFinite(minimumNetWorth) ? minimumNetWorth : final.netWorth,
    retirementSnapshot: retirementSnapshot || final,
    outliveProbability: probabilityOutliving(plan.currentAge, effectiveEndAge, plan.longevityProfile),
  };
}

function percentile(sorted, q) {
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function simulateMonteCarlo(plan) {
  const runCount = plan.monteRuns;
  const outcomes = [];

  for (let i = 0; i < runCount; i++) {
    const runSeed = plan.seed + i * 7919;
    const sampled = samplePlanParameters(plan, runSeed);
    outcomes.push(simulate({
      ...sampled,
      mode: "events",
      seed: runSeed,
    }));
  }

  const finalValues = outcomes.map(result => result.final.netWorth).sort((a, b) => a - b);
  const p10 = percentile(finalValues, 0.10);
  const median = percentile(finalValues, 0.50);
  const p90 = percentile(finalValues, 0.90);
  const survivalRate = outcomes.filter(result => result.survived).length / runCount;

  const pointCount = Math.min(...outcomes.map(result => result.points.length));
  const percentilePoints = Array.from({ length: pointCount }, (_, month) => {
    const values = outcomes.map(result => result.points[month].netWorth).sort((a, b) => a - b);
    return {
      month,
      p10: percentile(values, 0.10),
      p50: percentile(values, 0.50),
      p90: percentile(values, 0.90),
    };
  });

  // Choose the run whose full trajectory is closest to the median trajectory (a simple medoid-like representative).
  let representative = outcomes[0];
  let bestDistance = Infinity;
  outcomes.forEach(result => {
    let distance = 0;
    const stride = Math.max(1, Math.floor(pointCount / 80));
    for (let month = 0; month < pointCount; month += stride) {
      const scale = Math.max(1, Math.abs(percentilePoints[month].p50));
      distance += Math.abs(result.points[month].netWorth - percentilePoints[month].p50) / scale;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      representative = result;
    }
  });

  return {
    ...representative,
    plan: { ...plan, effectiveEndAge: plan.endAge + plan.longevityBufferYears },
    monte: {
      runCount,
      survivalRate,
      p10,
      median,
      p90,
      percentilePoints,
      parameterUncertainty: plan.parameterUncertainty,
    },
  };
}

function formatMoney(value, currency) {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1000 ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

function compactMoney(value, currency) {
  const symbol = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).formatToParts(0).find(part => part.type === "currency")?.value || "$";

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return `${sign}${symbol}${Math.round(abs)}`;
}

function setPrimaryMoney(value, currency) {
  const el = $("#finalNetWorth");
  if (!el) return;

  const formatted = formatMoney(value, currency);
  el.textContent = formatted;
  el.classList.toggle("money-long", formatted.length >= 13);
  el.classList.toggle("money-very-long", formatted.length >= 16);
}


function modeLabel(mode) {
  if (mode === "events") return "Life Events";
  if (mode === "montecarlo") return "Monte Carlo";
  return "Baseline";
}

function renderResults(result) {
  state.result = result;
  const { plan, survived, firstNegativeMonth } = result;
  const finalAge = plan.effectiveEndAge ?? (plan.endAge + (plan.longevityBufferYears || 0));

  $("#resultModeLabel").textContent = `${modeLabel(plan.mode)} simulation`;

  if (result.monte) {
    const percent = Math.round(result.monte.survivalRate * 100);
    $("#survivalHeadline").textContent = `${percent}% survive through ${Math.floor(finalAge)}.`;
    $("#survivalSubhead").textContent =
      `Across ${result.monte.runCount.toLocaleString()} seeded lives. The animated line is a representative run near the median final outcome; the shaded band is the 10th-90th percentile range.`;
  } else {
    $("#survivalHeadline").textContent = survived
      ? `You make it through ${Math.floor(finalAge)}.`
      : `Your plan runs short before ${Math.floor(finalAge)}.`;

    if (survived) {
      $("#survivalSubhead").textContent =
        `Under these assumptions, liquid resources never fall below zero.`;
    } else {
      const failurePoint = result.points[firstNegativeMonth];
      $("#survivalSubhead").textContent = failurePoint
        ? `Liquid resources are first exhausted around age ${failurePoint.age.toFixed(1)} (${formatMonthYear(failurePoint.date)}).`
        : `Liquid resources are exhausted during this simulation.`;
    }
  }

  const displayNote = plan.displayRealDollars
    ? " Values are shown in today's purchasing power."
    : " Values are shown in nominal future dollars.";
  $("#chartSubtitle").textContent = plan.displayRealDollars
    ? "Watch the plan unfold in today’s purchasing power. Hover event markers for details."
    : "Watch the plan unfold in nominal future dollars. Hover event markers for details.";
  const bufferNote = plan.longevityBufferYears > 0
    ? ` Your age-${plan.endAge} target includes a ${plan.longevityBufferYears}-year safety buffer.`
    : "";
  $("#survivalSubhead").textContent += displayNote + bufferNote;

  initializeOutcomeMetrics(result);
  showView("resultsView");
  renderChart(result);
  renderEvents(result);
  renderCalibrationResult(result);
  $("#sensitivityList").innerHTML = '<div class="fine-print">Calculating sensitivity…</div>';
  window.setTimeout(() => renderSensitivity(result), 0);
}

function initializeOutcomeMetrics(result) {
  const startPoint = result.points?.[0];
  const currency = result.plan.currency;

  $("#primaryMetricLabel").textContent = result.monte ? "Median net worth now" : "Net worth now";
  setPrimaryMoney(
    result.monte ? (result.monte.percentilePoints?.[0]?.p50 ?? startPoint?.netWorth ?? 0) : (startPoint?.netWorth ?? 0),
    currency
  );
  $("#outcomeAgeLabel").textContent = startPoint ? `Age ${startPoint.age.toFixed(1)}` : "At the start";

  if (result.monte) {
    const firstBand = result.monte.percentilePoints?.[0] || {};
    $("#metricRow").innerHTML = `
      <div class="metric"><span>Survival rate</span><strong data-metric="survival">0%</strong></div>
      <div class="metric"><span>10th percentile</span><strong data-metric="p10">${formatMoney(firstBand.p10 ?? 0, currency)}</strong></div>
      <div class="metric"><span>Median outcome</span><strong data-metric="p50">${formatMoney(firstBand.p50 ?? 0, currency)}</strong></div>
      <div class="metric"><span>90th percentile</span><strong data-metric="p90">${formatMoney(firstBand.p90 ?? 0, currency)}</strong></div>
      <div class="metric"><span>Saved of gross income</span><strong data-metric="savingsRate">0%</strong></div>
    `;
  } else {
    $("#metricRow").innerHTML = `
      <div class="metric"><span>At retirement</span><strong data-metric="retirement">-</strong></div>
      <div class="metric"><span>Gross income</span><strong data-metric="income">${formatMoney(startPoint?.cumulativeEarned ?? 0, currency)}</strong></div>
      <div class="metric"><span>Taxes paid</span><strong data-metric="taxes">${formatMoney(startPoint?.cumulativeTaxes ?? 0, currency)}</strong></div>
      <div class="metric"><span>Total spent</span><strong data-metric="expenses">${formatMoney(startPoint?.cumulativeSpent ?? 0, currency)}</strong></div>
      <div class="metric"><span>Saved of gross income</span><strong data-metric="savingsRate">0%</strong></div>
      <div class="metric"><span>Home equity</span><strong data-metric="homeEquity">${formatMoney(startPoint?.homeEquity ?? 0, currency)}</strong></div>
      <div class="metric"><span>Lowest net worth so far</span><strong data-metric="minimum">${formatMoney(startPoint?.netWorth ?? 0, currency)}</strong></div>
    `;
  }
}

function updateOutcomeMetrics(result, currentPoint, currentIndex, progress, complete = false) {
  if (!currentPoint) return;

  const currency = result.plan.currency;
  const finalAge = result.plan.effectiveEndAge ?? (result.plan.endAge + (result.plan.longevityBufferYears || 0));

  $("#outcomeAgeLabel").textContent = complete
    ? `Age ${finalAge} · complete`
    : `Age ${currentPoint.age.toFixed(1)} · ${formatMonthYear(currentPoint.date)}`;

  if (result.monte) {
    const bandLength = result.monte.percentilePoints?.length || 0;
    const bandIndex = bandLength
      ? Math.max(0, Math.min(bandLength - 1, Number.isFinite(currentIndex) ? currentIndex : 0))
      : 0;
    const band = result.monte.percentilePoints?.[bandIndex] || {};
    const medianNow = band.p50 ?? currentPoint.netWorth ?? 0;

    $("#primaryMetricLabel").textContent = complete ? "Median final net worth" : "Median net worth now";
    setPrimaryMoney(medianNow, currency);

    const survivalEl = $('[data-metric="survival"]');
    const p10El = $('[data-metric="p10"]');
    const p50El = $('[data-metric="p50"]');
    const p90El = $('[data-metric="p90"]');
    const savingsRateEl = $('[data-metric="savingsRate"]');

    if (survivalEl) survivalEl.textContent = `${Math.round(result.monte.survivalRate * 100 * progress)}%`;
    if (p10El) p10El.textContent = formatMoney(band.p10 ?? 0, currency);
    if (p50El) p50El.textContent = formatMoney(band.p50 ?? 0, currency);
    if (p90El) p90El.textContent = formatMoney(band.p90 ?? 0, currency);
    if (savingsRateEl) savingsRateEl.textContent = `${((currentPoint.savingsRateGross || 0) * 100).toFixed(1)}%`;
    return;
  }

  $("#primaryMetricLabel").textContent = complete ? "Final net worth" : "Net worth now";
  setPrimaryMoney(currentPoint.netWorth ?? 0, currency);

  const incomeEl = $('[data-metric="income"]');
  const taxesEl = $('[data-metric="taxes"]');
  const expensesEl = $('[data-metric="expenses"]');
  const retirementEl = $('[data-metric="retirement"]');
  const minimumEl = $('[data-metric="minimum"]');
  const savingsRateEl = $('[data-metric="savingsRate"]');
  const homeEquityEl = $('[data-metric="homeEquity"]');

  if (incomeEl) incomeEl.textContent = formatMoney(currentPoint.cumulativeEarned ?? 0, currency);
  if (taxesEl) taxesEl.textContent = formatMoney(currentPoint.cumulativeTaxes ?? 0, currency);
  if (expensesEl) expensesEl.textContent = formatMoney(currentPoint.cumulativeSpent ?? 0, currency);
  if (savingsRateEl) savingsRateEl.textContent = `${((currentPoint.savingsRateGross || 0) * 100).toFixed(1)}%`;
  if (homeEquityEl) homeEquityEl.textContent = formatMoney(currentPoint.homeEquity ?? 0, currency);

  if (retirementEl) {
    if (currentPoint.age >= result.plan.retirementAge || complete) {
      retirementEl.textContent = formatMoney(result.retirementSnapshot?.netWorth ?? currentPoint.netWorth ?? 0, currency);
    } else {
      retirementEl.textContent = "-";
    }
  }

  if (minimumEl) {
    let minimumSoFar = result.points?.[0]?.netWorth ?? 0;
    for (let i = 0; i <= currentIndex && i < result.points.length; i++) {
      if (Number.isFinite(result.points[i]?.netWorth)) {
        minimumSoFar = Math.min(minimumSoFar, result.points[i].netWorth);
      }
    }
    minimumEl.textContent = formatMoney(complete ? result.minimumNetWorth : minimumSoFar, currency);
  }
}

function renderEvents(result) {
  const list = $("#eventList");
  const { events, plan } = result;

  if (!events.length) {
    $("#eventSummary").textContent = plan.mode === "baseline"
      ? "No probabilistic events in baseline mode."
      : "No probabilistic events occurred on the displayed representative path.";
    list.innerHTML = "";
    return;
  }

  $("#eventSummary").textContent = result.monte
    ? `${events.length} events on the displayed representative path. Monte Carlo statistics include all ${result.monte.runCount.toLocaleString()} runs.`
    : `${events.length} event${events.length === 1 ? "" : "s"} occurred in this run.`;

  list.innerHTML = events.map(event => {
    const impactClass = event.amount < 0 ? "negative" : event.amount > 0 ? "positive" : "";
    const impact = event.amount === 0 ? "Income interruption" : formatMoney(event.amount, plan.currency);

    return `
      <div class="event-item">
        <span class="event-icon">${event.icon}</span>
        <div class="event-body">
          <div class="event-meta">
            <span class="event-date">${formatMonthYear(event.date)}</span>
            <span class="event-impact ${impactClass}">${impact}</span>
          </div>
          <strong class="event-title">${event.title}</strong>
          <p class="event-detail">${event.detail}</p>
        </div>
      </div>`;
  }).join("");
}

function renderChart(result) {
  const wrap = $("#chartWrap");
  wrap.innerHTML = "";

  const width = 1000;
  const height = 430;
  const margin = { top: 32, right: 26, bottom: 46, left: 76 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allValues = result.points.flatMap(p => [
    p.netWorth,
    p.cash,
    p.investments,
    ...(result.plan.includeHome ? [p.homeEquity] : []),
  ]);
  if (result.monte) {
    result.monte.percentilePoints.forEach(p => allValues.push(p.p10, p.p90));
  }

  let minY = Math.min(0, ...allValues);
  let maxY = Math.max(1, ...allValues);
  const padding = (maxY - minY) * 0.08 || 1;
  minY -= padding;
  maxY += padding;

  const pointDenominator = Math.max(1, result.points.length - 1);
  const x = month => margin.left + (month / pointDenominator) * innerWidth;
  const y = value => margin.top + innerHeight - ((value - minY) / (maxY - minY)) * innerHeight;

  const pathFor = key => result.points.map((p, index) =>
    `${index === 0 ? "M" : "L"}${x(p.month).toFixed(2)},${y(p[key]).toFixed(2)}`
  ).join(" ");

  const percentilePath = key => result.monte.percentilePoints.map((p, index) =>
    `${index === 0 ? "M" : "L"}${x(p.month).toFixed(2)},${y(p[key]).toFixed(2)}`
  ).join(" ");

  const monteBand = result.monte ? (() => {
    const upper = result.monte.percentilePoints.map((p, index) =>
      `${index === 0 ? "M" : "L"}${x(p.month).toFixed(2)},${y(p.p90).toFixed(2)}`
    ).join(" ");
    const lower = [...result.monte.percentilePoints].reverse().map(p =>
      `L${x(p.month).toFixed(2)},${y(p.p10).toFixed(2)}`
    ).join(" ");
    return `<path d="${upper} ${lower} Z" fill="#68472f" class="monte-band"/>`;
  })() : "";

  const monteMedian = result.monte
    ? `<path d="${percentilePath("p50")}" fill="none" stroke="#68472f" stroke-width="2" class="monte-median"/>`
    : "";

  const gridCount = 5;
  const yGrid = Array.from({ length: gridCount + 1 }, (_, i) => {
    const value = minY + ((maxY - minY) * i / gridCount);
    const yy = y(value);
    return `
      <line x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}" stroke="#dacba5" stroke-width="1"/>
      <text x="${margin.left - 12}" y="${yy + 4}" text-anchor="end" fill="#716351" font-size="12">${compactMoney(value, result.plan.currency)}</text>
    `;
  }).join("");

  const yearSpan = result.plan.endAge - result.plan.currentAge;
  const xTickCount = Math.min(6, Math.max(3, Math.floor(yearSpan / 10)));
  const xGrid = Array.from({ length: xTickCount + 1 }, (_, i) => {
    const month = Math.round((result.points.length - 1) * i / xTickCount);
    const point = result.points[month];
    const xx = x(month);
    return `
      <line x1="${xx}" x2="${xx}" y1="${margin.top}" y2="${height - margin.bottom}" stroke="#eadfbd" stroke-width="1"/>
      <text x="${xx}" y="${height - 18}" text-anchor="middle" fill="#716351" font-size="12">Age ${Math.round(point.age)}</text>
    `;
  }).join("");

  const zeroY = y(0);
  const zeroLine = minY < 0 && maxY > 0
    ? `<line x1="${margin.left}" x2="${width - margin.right}" y1="${zeroY}" y2="${zeroY}" stroke="#914b38" stroke-dasharray="5 5" opacity=".55"/>`
    : "";

  const eventMarkers = result.events.map((event, index) => {
    const point = result.points[Math.min(event.month, result.points.length - 1)];
    const cx = x(point.month);
    const cy = y(point.netWorth);
    return `
      <g class="event-marker" data-event-index="${index}" data-progress="${event.month / pointDenominator}" tabindex="0" role="button">
        <circle cx="${cx}" cy="${cy}" r="9" fill="#fff" stroke="#68472f" stroke-width="3"/>
        <circle cx="${cx}" cy="${cy}" r="3" fill="#68472f"/>
      </g>`;
  }).join("");

  wrap.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-label="Financial timeline chart">
      ${yGrid}
      ${xGrid}
      ${zeroLine}
      ${monteBand}
      ${monteMedian}
      <path pathLength="1" d="${pathFor("cash")}" fill="none" stroke="#b07d3b" stroke-width="2" opacity=".9" class="animated-line"/>
      <path pathLength="1" d="${pathFor("investments")}" fill="none" stroke="#687151" stroke-width="2" opacity=".9" class="animated-line"/>
      ${result.plan.includeHome ? `<path pathLength="1" d="${pathFor("homeEquity")}" fill="none" stroke="#88715c" stroke-width="2" opacity=".85" class="animated-line"/>` : ""}
      <path pathLength="1" d="${pathFor("netWorth")}" fill="none" stroke="#68472f" stroke-width="4" class="animated-line"/>
      ${eventMarkers}
    </svg>
  `;

  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip hidden";
  wrap.appendChild(tooltip);

  const status = document.createElement("div");
  status.className = "chart-status";
  wrap.appendChild(status);

  result.events.forEach((event, index) => {
    const point = result.points[Math.min(event.month, result.points.length - 1)];
    const popup = document.createElement("div");
    popup.className = "timeline-popup";
    popup.dataset.eventIndex = index;
    popup.style.left = `${(x(point.month) / width) * 100}%`;
    popup.style.top = `${(y(point.netWorth) / height) * 100}%`;
    popup.innerHTML = `<strong>${event.icon} ${event.title} · ${formatMonthYear(event.date)}</strong><span>${event.detail}</span>`;
    wrap.appendChild(popup);
  });

  $$(".event-marker", wrap).forEach(marker => {
    const show = event => {
      const item = result.events[Number(marker.dataset.eventIndex)];
      tooltip.innerHTML = `<strong>${item.title} · ${formatMonthYear(item.date)}</strong>${item.detail}`;
      tooltip.classList.remove("hidden");

      const wrapRect = wrap.getBoundingClientRect();
      const targetRect = event.currentTarget.getBoundingClientRect();
      const left = Math.min(wrapRect.width - 250, Math.max(8, targetRect.left - wrapRect.left + 12));
      const top = Math.max(8, targetRect.top - wrapRect.top - 60);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };
    const hide = () => tooltip.classList.add("hidden");

    marker.addEventListener("mouseenter", show);
    marker.addEventListener("focus", show);
    marker.addEventListener("mouseleave", hide);
    marker.addEventListener("blur", hide);
  });

  $("#homeLegend")?.classList.toggle("hidden", !result.plan.includeHome);

  const play = () => animateChart(result, wrap, status);
  $("#replayAnimationButton").onclick = play;
  play();
}

function animateChart(result, wrap, status) {
  const lines = $$(".animated-line", wrap);
  const markers = $$(".event-marker", wrap);
  const popups = $$(".timeline-popup", wrap);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointCount = Array.isArray(result.points) ? result.points.length : 0;

  const animationRun = String((Number(wrap.dataset.animationRun) || 0) + 1);
  wrap.dataset.animationRun = animationRun;

  lines.forEach(line => line.style.strokeDashoffset = "1");
  markers.forEach(marker => marker.classList.remove("revealed"));
  popups.forEach(popup => popup.classList.remove("show"));
  initializeOutcomeMetrics(result);

  if (!pointCount) {
    status.textContent = "No timeline data";
    return;
  }

  const lastIndex = pointCount - 1;
  const finalPoint = result.points[lastIndex];

  if (reducedMotion) {
    lines.forEach(line => line.style.strokeDashoffset = "0");
    markers.forEach(marker => marker.classList.add("revealed"));
    status.textContent = `Age ${result.plan.effectiveEndAge ?? result.plan.endAge} · complete`;
    updateOutcomeMetrics(result, finalPoint, lastIndex, 1, true);
    return;
  }

  const duration = 5200;
  const start = performance.now();
  const revealed = new Set();

  function frame(now) {
    if (wrap.dataset.animationRun !== animationRun) return;

    const frameTime = Number.isFinite(now) ? now : performance.now();
    const elapsed = Math.max(0, frameTime - start);
    const rawProgress = Math.max(0, Math.min(1, elapsed / duration));
    const easedProgress = 1 - Math.pow(1 - rawProgress, 2.15);
    const progress = Number.isFinite(easedProgress)
      ? Math.max(0, Math.min(1, easedProgress))
      : rawProgress;

    lines.forEach(line => line.style.strokeDashoffset = String(1 - progress));

    const proposedIndex = Math.floor(progress * lastIndex);
    const currentIndex = Number.isFinite(proposedIndex)
      ? Math.max(0, Math.min(lastIndex, proposedIndex))
      : 0;
    const currentPoint = result.points[currentIndex] || result.points[0] || finalPoint;

    if (!currentPoint) {
      status.textContent = "Timeline unavailable";
      return;
    }

    status.textContent = `Age ${currentPoint.age.toFixed(1)} · ${formatMonthYear(currentPoint.date)}`;
    updateOutcomeMetrics(result, currentPoint, currentIndex, progress, false);

    markers.forEach(marker => {
      const eventProgress = Number(marker.dataset.progress);
      const index = Number(marker.dataset.eventIndex);
      if (Number.isFinite(eventProgress) && progress >= eventProgress && !revealed.has(index)) {
        revealed.add(index);
        marker.classList.add("revealed");
        const popup = $(`.timeline-popup[data-event-index="${index}"]`, wrap);
        if (popup) {
          popup.classList.add("show");
          window.setTimeout(() => {
            if (wrap.dataset.animationRun === animationRun) popup.classList.remove("show");
          }, 1450);
        }
      }
    });

    if (rawProgress < 1) {
      requestAnimationFrame(frame);
    } else {
      status.textContent = `Age ${result.plan.effectiveEndAge ?? result.plan.endAge} · complete`;
      markers.forEach(marker => marker.classList.add("revealed"));
      updateOutcomeMetrics(result, finalPoint, lastIndex, 1, true);
    }
  }

  requestAnimationFrame(frame);
}

function updateHomeFields() {
  const enabled = $("#includeHome")?.checked;
  const panel = $("#homeFields");
  if (!panel) return;

  panel.classList.toggle("muted-disabled", !enabled);
  $$("input", panel).forEach(input => {
    input.disabled = !enabled;
  });
}


function renderCalibrationCards() {
  const container = $("#calibrationCards");
  if (!container) return;
  container.innerHTML = CALIBRATION_ITEMS.map(item => `
    <div class="calibration-card">
      <span class="data-badge ${item.type}">${item.type}</span>
      <div>
        <strong>${item.title}</strong>
        <p>${item.detail}</p>
        <small>${item.source}</small>
      </div>
    </div>
  `).join("");
}

function updateWealthBenchmark() {
  const age = number("#currentAge") || 25;
  const median = canadianMedianNetWorth(age);
  $("#wealthBenchmarkText").textContent =
    `SFS 2023 median net worth for this age band: ${formatMoney(median, "CAD")} (2023 dollars). The optional starting-position breakdown is modelled, not an official asset mix.`;
}

function applyWealthBenchmark() {
  const age = number("#currentAge") || 25;
  const median = canadianMedianNetWorth(age);

  let cashShare = 0.08;
  let investShare = 0.32;
  let homeShare = 0.60;
  let equityRatio = 0.35;

  if (age < 35) {
    cashShare = 0.10;
    investShare = 0.40;
    homeShare = 0.50;
    equityRatio = 0.25;
  } else if (age >= 55) {
    cashShare = 0.06;
    investShare = 0.44;
    homeShare = 0.50;
    equityRatio = age >= 65 ? 0.85 : 0.65;
  }

  $("#startingSavings").value = Math.round(median * cashShare / 100) * 100;
  $("#startingInvestments").value = Math.round(median * investShare / 100) * 100;

  const homeEquity = median * homeShare;
  const homeValue = homeEquity / equityRatio;
  $("#includeHome").checked = true;
  $("#homeValue").value = Math.round(homeValue / 1000) * 1000;
  $("#mortgageBalance").value = Math.max(0, Math.round((homeValue - homeEquity) / 1000) * 1000);
  updateHomeFields();
}

function applySpendingBenchmark() {
  const age = number("#currentAge") || 25;
  const annual = SHS_2023_AVERAGE_SPENDING * spendingAgeFactor(age);
  const monthly = annual / 12;
  const firstExpense = $("#expenseNodes .node [data-field='monthly']");
  if (firstExpense) firstExpense.value = Math.round(monthly / 25) * 25;
  $("#spendingBenchmarkNote").textContent =
    `Applied ${formatMoney(annual, "CAD")}/year as a modelled age-shaped benchmark around the official 2023 national average of ${formatMoney(SHS_2023_AVERAGE_SPENDING, "CAD")}.`;
}

function updateCountryFields() {
  const canada = $("#country").value === "CA";
  $("#provinceField")?.classList.toggle("hidden", !canada);
  $(".benchmark-card")?.classList.toggle("hidden", !canada);
}

function updateHistoricalScenarioNote() {
  const value = $("#historicalScenario").value;
  if (value === "none") {
    $("#historicalScenarioNote").textContent = "No forced historical stress. The normal stochastic model still runs.";
    return;
  }
  if (value === "random") {
    $("#historicalScenarioNote").textContent = "One historical analogue will be selected from the deck using the simulation seed.";
    return;
  }
  const scenario = HISTORICAL_SCENARIOS[value];
  $("#historicalScenarioNote").textContent = scenario
    ? `${scenario.name}: ${scenario.note}`
    : "Select a scenario to see what it changes.";
}

function updateLongevityEstimate() {
  const profile = $("#longevityProfile").value;
  const currentAge = number("#currentAge") || 25;
  const target = (number("#endAge") || 80) + (number("#longevityBufferYears") || 0);
  const p = probabilityOutliving(currentAge, target, profile);
  $("#longevityEstimateText").textContent = p === null
    ? "Manual horizon only; no life-table comparison is shown."
    : `Approximate chance of being alive beyond age ${target}: ${(p * 100).toFixed(0)}%. This is a smoothed life-table calibration, not an individual mortality forecast.`;
}

function renderCalibrationResult(result) {
  const container = $("#calibrationResult");
  if (!container) return;

  if (result.plan.country !== "CA") {
    container.innerHTML = `
      <div class="calibration-chip">
        <span>Country profile</span>
        <strong>Manual</strong>
        <small>Use local assumptions; Canadian benchmarks are not applied.</small>
      </div>`;
    return;
  }

  const median = canadianMedianNetWorth(result.plan.currentAge);
  const startPoint = result.points[0];
  const startNetWorth = startPoint?.netWorth ?? 0;
  const spendingMonthly = result.plan.expenseNodes.reduce((sum, node) => sum + (node.monthly || 0), 0);
  const spendingAnnual = spendingMonthly * 12;
  const outlive = result.outliveProbability;

  container.innerHTML = `
    <div class="calibration-chip">
      <span>SFS age-band median</span>
      <strong>${formatMoney(median, "CAD")}</strong>
      <small>Your simulated starting net worth: ${formatMoney(startNetWorth, result.plan.currency)}.</small>
    </div>
    <div class="calibration-chip">
      <span>SHS spending context</span>
      <strong>${formatMoney(SHS_2023_AVERAGE_SPENDING, "CAD")}/yr</strong>
      <small>Your entered base expense nodes total roughly ${formatMoney(spendingAnnual, result.plan.currency)}/yr before modelled growth.</small>
    </div>
    <div class="calibration-chip">
      <span>Longevity context</span>
      <strong>${outlive === null ? "Manual" : `${(outlive * 100).toFixed(0)}%`}</strong>
      <small>${outlive === null ? "No life-table comparison selected." : `Approximate chance of outliving the age-${result.plan.effectiveEndAge} planning horizon.`}</small>
    </div>`;
}

function sensitivityMetric(result) {
  return result.monte ? result.monte.survivalRate : result.final.netWorth;
}

function runSensitivityPlan(plan, monte = false) {
  if (monte) {
    return simulateMonteCarlo({
      ...plan,
      monteRuns: Math.min(70, Math.max(30, plan.monteRuns || 50)),
      parameterUncertainty: false,
    });
  }
  return simulate({ ...plan, mode: "baseline" });
}

function renderSensitivity(result) {
  const container = $("#sensitivityList");
  if (!container) return;

  const plan = result.plan;
  const useMonte = Boolean(result.monte);
  const cases = [
    {
      label: "Savings rate",
      low: p => ({ ...p, maxSavePercent: Math.max(0, p.maxSavePercent * 0.8), minSavePercent: Math.max(0, p.minSavePercent * 0.8) }),
      high: p => ({ ...p, maxSavePercent: Math.min(1, p.maxSavePercent * 1.2), minSavePercent: Math.min(1, p.minSavePercent * 1.2) }),
    },
    {
      label: "Base spending",
      low: p => ({ ...p, expenseNodes: p.expenseNodes.map(n => ({ ...n, monthly: n.monthly * 0.9 })) }),
      high: p => ({ ...p, expenseNodes: p.expenseNodes.map(n => ({ ...n, monthly: n.monthly * 1.1 })) }),
    },
    {
      label: "Retirement age",
      low: p => ({ ...p, retirementAge: Math.max(p.currentAge + 1, p.retirementAge - 2) }),
      high: p => ({ ...p, retirementAge: Math.min(p.endAge + p.longevityBufferYears, p.retirementAge + 2) }),
    },
    {
      label: "Market return",
      low: p => ({ ...p, investmentReturn: p.investmentReturn - 0.01, equityReturn: p.equityReturn - 0.01, bondReturn: p.bondReturn - 0.004 }),
      high: p => ({ ...p, investmentReturn: p.investmentReturn + 0.01, equityReturn: p.equityReturn + 0.01, bondReturn: p.bondReturn + 0.004 }),
    },
    {
      label: "Job-loss risk",
      low: p => ({ ...p, jobLossAnnual: p.jobLossAnnual * 0.5 }),
      high: p => ({ ...p, jobLossAnnual: Math.min(0.8, p.jobLossAnnual * 1.5) }),
    },
    {
      label: "Housing carrying cost",
      low: p => ({ ...p, propertyTaxRate: p.propertyTaxRate * 0.8, homeMaintenanceRate: p.homeMaintenanceRate * 0.8 }),
      high: p => ({ ...p, propertyTaxRate: p.propertyTaxRate * 1.2, homeMaintenanceRate: p.homeMaintenanceRate * 1.2 }),
    },
  ];

  const impacts = cases.map((item, index) => {
    const baseSeed = plan.seed + 100000 + index * 4000;
    const lowResult = runSensitivityPlan({ ...item.low(plan), seed: baseSeed }, useMonte);
    const highResult = runSensitivityPlan({ ...item.high(plan), seed: baseSeed }, useMonte);
    const low = sensitivityMetric(lowResult);
    const high = sensitivityMetric(highResult);
    return {
      label: item.label,
      impact: Math.abs(high - low),
      low,
      high,
    };
  });

  const maxImpact = Math.max(1e-9, ...impacts.map(item => item.impact));
  impacts.sort((a, b) => b.impact - a.impact);

  container.innerHTML = impacts.map(item => {
    const pct = Math.max(4, (item.impact / maxImpact) * 100);
    const valueText = useMonte
      ? `${(item.low * 100).toFixed(0)}% → ${(item.high * 100).toFixed(0)}%`
      : `${compactMoney(item.low, plan.currency)} → ${compactMoney(item.high, plan.currency)}`;
    return `
      <div class="sensitivity-row">
        <span class="sensitivity-label">${item.label}</span>
        <div class="sensitivity-track"><div class="sensitivity-fill" style="--impact:${pct}%"></div></div>
        <span class="sensitivity-value">${valueText}</span>
      </div>`;
  }).join("");
}

function openAlphaModal() {
  $("#alphaModal")?.classList.remove("hidden");
}

function closeAlphaModal() {
  $("#alphaModal")?.classList.add("hidden");
}

function updateMode(mode) {
  state.mode = mode;
  $$("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
  $("#eventControls").classList.toggle("hidden", mode === "baseline");
  $("#monteControls").classList.toggle("hidden", mode !== "montecarlo");
  updateRunSummary();
}

function updateIncomeMode(mode) {
  state.incomeMode = mode;
  $$("[data-income-mode]").forEach(button => button.classList.toggle("active", button.dataset.incomeMode === mode));
  $("#typicalCareerPanel").classList.toggle("hidden", mode !== "typical");
  $("#customIncomePanel").classList.toggle("hidden", mode !== "custom");
  updateCareerProfileNote();
}

function updateCountryProfile() {
  const profile = COUNTRY_PROFILES[$("#country").value] || COUNTRY_PROFILES.GENERIC;
  $("#countryProfileHeadline").textContent = profile.headline;
  $("#countryProfileDetails").textContent = profile.details;
  $("#countryDataStatus").textContent = profile.dataBacked
    ? `${profile.name} currently has a versioned data profile in this prototype.`
    : `${profile.name} is selectable, but its local data pack has not been added yet.`;
  $("#applyCountryDefaultsButton").disabled = false;
  updateCountryFields();
  updateCareerProfileNote();
  updateWealthBenchmark();
}

function applyPensionPreset() {
  const preset = $("#pensionPreset")?.value || "manual";

  // Official published 2026 values used as convenient context:
  // CPP average new age-65 pension: 877.01/month.
  // CPP maximum age-65 pension: 1,507.65/month.
  // OAS maximum age 65-74 (Jul-Sep 2026): 751.97/month.
  if (preset === "average") {
    $("#governmentRetirementMonthly").value = (877.01 + 751.97).toFixed(2);
  } else if (preset === "maximum") {
    $("#governmentRetirementMonthly").value = (1507.65 + 751.97).toFixed(2);
  } else if (preset === "none") {
    $("#governmentRetirementMonthly").value = 0;
  }
}

function applyCountryDefaults() {
  const profile = COUNTRY_PROFILES[$("#country").value] || COUNTRY_PROFILES.GENERIC;
  $("#inflationRate").value = (profile.inflationDefault * 100).toFixed(1);
  if (profile.currency) $("#currency").value = profile.currency;

  if ($("#country").value === "CA") {
    // Official observations and transparent planning defaults.
    $("#taxModel").value = "canada2026";
    $("#incomeTaxRate").value = 25;
    $("#pensionPreset").value = "average";
    applyPensionPreset();
    $("#governmentRetirementAge").value = 65;

    $("#jobLossAnnual").value = 3.0;
    $("#portfolioModel").value = "multiasset";
    $("#investmentReturn").value = 5.0;
    $("#investmentVolatility").value = 15;
    $("#equityWeight").value = 70;
    $("#bondWeight").value = 30;
    $("#equityReturn").value = 6.5;
    $("#equityVolatility").value = 18;
    $("#bondReturn").value = 3.0;
    $("#bondVolatility").value = 6;
    $("#equityBondCorrelation").value = 0.15;
    $("#stochasticInflation").checked = true;
    $("#parameterUncertainty").checked = true;
    $("#taxableInvestmentTaxRate").value = 15;
  } else {
    // Generic/manual means "bring your own local numbers."
    $("#taxModel").value = "effective";
    $("#incomeTaxRate").value = 25;
    $("#pensionPreset").value = "none";
    applyPensionPreset();
    $("#governmentRetirementAge").value = 65;
    $("#jobLossAnnual").value = 3.0;
  }

  updateCountryProfile();
}

function updateCareerProfileNote() {
  const field = CAREER_PROFILES[$("#careerField").value] || CAREER_PROFILES.general;
  const country = COUNTRY_PROFILES[$("#country").value] || COUNTRY_PROFILES.GENERIC;

  if (country.dataBacked && $("#country").value === "CA") {
    const currentAge = Number($("#currentAge").value) || 25;
    const estimate = field.canadaMedianAnnual * careerStageMultiplier(currentAge);
    $("#careerDataBadge").textContent = "Canada wage anchor";
    $("#careerProfileNote").textContent =
      `${field.source}. At age ${currentAge}, the prototype's career-stage curve starts around ${formatMoney(estimate, $("#currency").value)} unless you enter your own current income. The growth curve itself is still a modelling assumption, not an official forecast.`;
  } else {
    $("#careerDataBadge").textContent = "Generic curve";
    $("#careerProfileNote").textContent =
      `No local wage pack is available for ${country.name} yet. Enter a current annual income to use the career curve without borrowing the Canadian wage anchor.`;
  }
}

function updateRunSummary() {
  $("#runModeSummary").textContent = modeLabel(state.mode);
  const buffer = number("#longevityBufferYears") || 0;
  const target = $("#endAge").value || "?";
  $("#runWindowSummary").textContent = buffer > 0
    ? `Age ${$("#currentAge").value || "?"} → ${target} + ${buffer}y buffer`
    : `Age ${$("#currentAge").value || "?"} → ${target}`;
}

function runCurrentPlan() {
  const plan = collectPlan();
  if (!validatePlan(plan)) return;
  const result = plan.mode === "montecarlo" ? simulateMonteCarlo(plan) : simulate(plan);
  renderResults(result);
}

function loadExample() {
  $("#currentAge").value = 25;
  $("#endAge").value = 80;
  $("#retirementAge").value = 65;
  $("#startingSavings").value = 18000;
  $("#startingInvestments").value = 12000;
  $("#country").value = "CA";
  $("#province").value = "BC";
  $("#careerField").value = "software";
  $("#careerCurrentIncome").value = "";

  $("#inflationRate").value = 2.1;
  $("#stochasticInflation").checked = true;
  $("#inflationVolatility").value = 1.2;
  $("#expenseRealGrowth").value = 0.5;
  $("#retirementExpenseMultiplier").value = 85;
  $("#cashReturn").value = 1.5;

  $("#portfolioModel").value = "multiasset";
  $("#investmentReturn").value = 5.5;
  $("#investmentVolatility").value = 15;
  $("#equityWeight").value = 70;
  $("#bondWeight").value = 30;
  $("#equityReturn").value = 6.5;
  $("#equityVolatility").value = 18;
  $("#bondReturn").value = 3.0;
  $("#bondVolatility").value = 6;
  $("#equityBondCorrelation").value = 0.15;
  $("#parameterUncertainty").checked = true;
  $("#investmentFee").value = 0.25;
  $("#investmentShare").value = 75;
  $("#taxFreeShare").value = 40;
  $("#taxDeferredShare").value = 40;

  $("#minSavePercent").value = 60;
  $("#maxSavePercent").value = 30;
  $("#minSaveAmount").value = 600;

  $("#taxModel").value = "canada2026";
  $("#incomeTaxRate").value = 25;
  $("#pensionPreset").value = "average";
  applyPensionPreset();
  $("#governmentRetirementAge").value = 65;
  $("#longevityBufferYears").value = 5;
  $("#longevityProfile").value = "neutral";
  $("#displayRealDollars").checked = true;

  $("#promotionAnnual").value = 8;
  $("#promotionMin").value = 5;
  $("#promotionMax").value = 15;
  $("#reemploymentMin").value = 90;
  $("#reemploymentMax").value = 105;
  $("#namedEventDeck").checked = true;
  $("#eventCostScale").value = 100;

  $("#historicalScenario").value = "none";
  $("#historicalScenarioAge").value = 40;
  $("#seed").value = 42;

  $("#includeHome").checked = false;
  initializeNodes(true);
  updateHomeFields();
  updateIncomeMode("typical");
  updateMode("events");
  updateCountryProfile();
  updateHistoricalScenarioNote();
  updateLongevityEstimate();
  showView("setupView");
  setStep(0);
}

$("#startButton").addEventListener("click", () => {
  showView("setupView");
  setStep(0);
});

$("#loadExampleButton").addEventListener("click", loadExample);

$$("[data-go]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.go));
});

$("#addIncomeButton").addEventListener("click", () => {
  const currentAge = number("#currentAge") || 25;
  const retirementAge = number("#retirementAge") || 65;
  addNode("income", { label: "New income", annual: 30000, startAge: currentAge, endAge: retirementAge, growth: 2 });
});

$("#addExpenseButton").addEventListener("click", () => {
  const currentAge = number("#currentAge") || 25;
  const endAge = number("#endAge") || 80;
  addNode("expense", { label: "New expense", monthly: 500, startAge: currentAge, endAge, inflates: true });
});

$("#addDebtButton").addEventListener("click", () => {
  addNode("debt", { label: "New debt", balance: 10000, apr: 6, payment: 250 });
});

$("#includeHome").addEventListener("change", updateHomeFields);

$("#backButton").addEventListener("click", () => setStep(state.step - 1));
$("#nextButton").addEventListener("click", () => setStep(state.step + 1));

$$("[data-mode]").forEach(button => {
  button.addEventListener("click", () => updateMode(button.dataset.mode));
});

$$("[data-income-mode]").forEach(button => {
  button.addEventListener("click", () => updateIncomeMode(button.dataset.incomeMode));
});

$("#eventIntensity").addEventListener("input", event => {
  $("#eventIntensityValue").textContent = `${event.target.value}%`;
});

$("#country").addEventListener("change", updateCountryProfile);
$("#careerField").addEventListener("change", updateCareerProfileNote);
$("#currentAge").addEventListener("input", () => {
  updateRunSummary();
  updateCareerProfileNote();
  updateWealthBenchmark();
  updateLongevityEstimate();
});
$("#currency").addEventListener("change", updateCareerProfileNote);
$("#applyCountryDefaultsButton").addEventListener("click", applyCountryDefaults);
$("#pensionPreset").addEventListener("change", applyPensionPreset);
$("#applyWealthBenchmarkButton").addEventListener("click", applyWealthBenchmark);
$("#applySpendingBenchmarkButton").addEventListener("click", applySpendingBenchmark);
$("#historicalScenario").addEventListener("change", updateHistoricalScenarioNote);
$("#longevityProfile").addEventListener("change", updateLongevityEstimate);
$("#longevityBufferYears").addEventListener("input", updateLongevityEstimate);
$("#aboutAlphaButton").addEventListener("click", openAlphaModal);
$("#closeAlphaButton").addEventListener("click", closeAlphaModal);
$("#alphaModal").addEventListener("click", event => {
  if (event.target === $("#alphaModal")) closeAlphaModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#alphaModal").classList.contains("hidden")) {
    closeAlphaModal();
  }
});

$("#runButton").addEventListener("click", runCurrentPlan);

$("#editButton").addEventListener("click", () => {
  showView("setupView");
  setStep(0);
});

$("#rerunButton").addEventListener("click", runCurrentPlan);
$("#endAge").addEventListener("input", () => {
  updateRunSummary();
  updateLongevityEstimate();
});
$("#longevityBufferYears").addEventListener("input", updateRunSummary);

initializeNodes(false);
updateHomeFields();
setStep(0);
updateIncomeMode("typical");
updateMode("baseline");
updateCountryProfile();
renderCalibrationCards();
updateHistoricalScenarioNote();
updateLongevityEstimate();


