# Can I Survive?: Methodology, Rationale & Formulas

Version: **v0.4**

This document describes what the simulator calculates, which quantities are observed data versus assumptions, and the mathematical approximations used by the browser model.

The simulator is an educational planning and sensitivity-analysis tool. It is not a financial forecast, tax calculator, actuarial model, or individualized financial advice.

---

## 1. Design principle

The simulator is intended to answer:

> Given these assumptions, how robust is this financial plan across time and across plausible alternative futures?

It is **not** intended to answer:

> Exactly how much money will this person have at age 80?

The model therefore distinguishes three classes of inputs:

1. **Observed data**: published statistics such as CPI or a wage median.
2. **Data-derived context/proxies**: real statistics used to inform a model parameter but not mathematically identical to it.
3. **Model assumptions**: values such as expected market return, emergency-event probability, housing appreciation, or an effective tax rate.

All important model assumptions are editable in the UI.

---

## 2. Time step

The simulation advances in monthly steps.

For a simulation from current age \(a_0\) to end age \(a_1\), with longevity buffer \(b\):

\[
N = 12(a_1 + b - a_0)
\]

months are simulated.

The buffer is a conservative planning extension rather than a mortality model.

---

## 3. Inflation and today's dollars

Nominal money is converted to today's purchasing power using:

\[
R_t = \frac{N_t}{(1+\pi)^{t/12}}
\]

where:

- \(N_t\) = nominal value at month \(t\)
- \(R_t\) = real value in today's dollars
- \(\pi\) = annual inflation assumption

If “Show results in today's purchasing power” is enabled, charts and headline metrics use \(R_t\).

The Canada preset uses the **2.1% annual-average CPI increase in 2025** as its current observed inflation anchor. This is a historical observation, not a prediction that every future year will equal 2.1%.

Source: Statistics Canada, *Consumer Price Index: Annual review, 2025*  
https://www150.statcan.gc.ca/n1/daily-quotidien/260119/dq260119b-eng.htm

The Bank of Canada's inflation-control framework targets **2%**, the midpoint of a 1%-3% range, over the medium term.

Source: Bank of Canada  
https://www.bankofcanada.ca/core-functions/monetary-policy/inflation/

---

## 4. Income

### 4.1 Custom income nodes

Each custom income node has:

- annual starting income \(S\)
- start/end ages
- annual nominal growth \(g\)

Monthly income after \(m\) active months is approximately:

\[
I_m = \frac{S}{12}(1+g_m)^m
\]

where:

\[
g_m = (1+g)^{1/12} - 1
\]

### 4.2 Typical career mode

Typical Career begins with a wage anchor and applies an age-stage multiplier plus a modelled growth curve.

The wage anchor may be sourced from an official wage dataset. The **age progression curve is not an official forecast**; it is a user-convenience model.

A user can override current salary, which avoids relying on the wage anchor while preserving the progression model.

---

## 5. Taxes

The current tax model deliberately uses an **effective average tax rate** rather than pretending to reproduce a country's full tax code.

For monthly gross income \(G_t\) and effective tax rate \(\tau\):

\[
Tax_t = G_t \tau
\]

\[
NetIncome_t = G_t - Tax_t
\]

This rate should be interpreted as a broad combination of income/payroll tax drag appropriate to the scenario.

Why not use a hard-coded Canadian tax table?

- tax depends on province/territory
- deductions and credits differ
- contribution programs have thresholds
- tax systems change
- retirement withdrawals may be treated differently from employment income

A future jurisdiction module can replace the effective-rate model.

---

## 6. Savings strategy

After tax and required spending:

\[
Surplus_t = NetIncome_t - RequiredOutflow_t
\]

The desired contribution is:

\[
D_t = \max(M,\; Surplus_t \cdot p_{min})
\]

where \(M\) is the minimum monthly target and \(p_{min}\) is the minimum share of surplus.

The maximum contribution allowed by the strategy is:

\[
C_{cap,t} = NetIncome_t \cdot p_{max}
\]

Actual contribution:

\[
C_t = \max(0,\min(Surplus_t,D_t,C_{cap,t}))
\]

The displayed “Saved of gross income” metric is:

\[
SavingsRate = \frac{\sum C_t}{\sum GrossIncome_t}
\]

This is intentionally different from “savings as a percent of disposable income.”

---

## 7. Expenses and life-stage spending

Expense nodes may be inflation-linked.

If an expense starts at monthly amount \(E_0\), then before retirement:

\[
E_t = E_0(1+\pi_m)^t(1+g_{real,m})^t
\]

where:

- \(\pi_m\) = monthly inflation
- \(g_{real,m}\) = real lifestyle-growth assumption

After retirement, the aggregate expense level is multiplied by retirement spending factor \(r\):

\[
E_{retired,t} = rE_t
\]

This lets a plan represent either reduced retirement spending (\(r<1\)) or increased later-life spending (\(r>1\)).

Specific changes such as childcare, tuition, rent, travel, or elder care are better represented as separate dated expense nodes.

---

## 8. Investment accounts

The model divides investments into three conceptual buckets:

- **tax-free**
- **tax-deferred**
- **taxable**

For Canada these roughly resemble TFSA-like, RRSP-like, and non-registered investments, but the names are intentionally generic for use in other countries.

### Tax-free

Returns compound without investment tax in the model.

### Tax-deferred

Returns compound without annual investment tax. When money is withdrawn to cover a cash shortfall, the withdrawal is reduced by the configured deferred-withdrawal tax rate.

### Taxable

Positive simulated gains are reduced by the configured effective investment-gain tax rate. This is a simplification: real tax treatment depends on interest, dividends, realized capital gains, losses, account structure, and jurisdiction.

Canada reference:

- TFSA investment income and gains are generally tax-free.
- RRSP income is generally tax-deferred while funds remain in the plan; withdrawals are generally taxable.

Sources:

https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4466/tax-free-savings-account-tfsa-guide-individuals.html

https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/registered-retirement-savings-plan-rrsp.html

---

## 9. Investment returns

### 9.1 Baseline mode

Baseline uses a smooth annual expected return \(\mu\), converted to a monthly rate:

\[
r_m = (1+\mu)^{1/12}-1
\]

Fees are incorporated as a reduction to the return assumption.

### 9.2 Stochastic returns

Life Events and Monte Carlo can use a geometric-Brownian-style approximation.

Monthly log return:

\[
\ln(1+r_t) =
\frac{\mu-\frac{1}{2}\sigma^2}{12}
+
\frac{\sigma}{\sqrt{12}}Z_t
\]

where:

- \(\mu\) = annual expected return
- \(\sigma\) = annual volatility
- \(Z_t \sim N(0,1)\)

Therefore:

\[
r_t = e^{\ln(1+r_t)}-1
\]

This generates irregular investment paths and sequence-of-returns risk.

It is still a simplified market model:

- returns are approximately lognormal
- volatility is constant except for the recession mean shift
- fat tails, asset allocation, interest-rate regimes, correlations among asset classes, and valuation effects are not explicitly modelled

The separate “extra market shock” event adds an optional rare discrete loss on top of the stochastic return path.

---

## 10. Economic states and correlated risks

The model has two economic states:

- normal
- recession

The state changes according to editable probabilities.

If annual recession-entry probability is \(p_e\), the monthly transition probability is:

\[
p_{e,m} = 1-(1-p_e)^{1/12}
\]

The same conversion is used for recession exit.

During recession:

- expected investment return is reduced by a configured annual percentage-point penalty
- job-loss probability is multiplied by a configured factor

This creates basic correlation:

\[
Recession \rightarrow
\begin{cases}
\text{lower expected market returns}\\
\text{higher job-loss risk}
\end{cases}
\]

This is more realistic than drawing every adverse event independently, but it is not a full macroeconomic model.

---

## 11. Event probabilities

For an annual event probability \(p_a\), the monthly probability used by the simulator is:

\[
p_m = 1-(1-p_a)^{1/12}
\]

The event-intensity slider then scales the monthly event probability for scenario testing.

Editable events currently include:

- job loss
- emergency expense
- bonus/windfall
- extra market shock

### Why unemployment rate is not job-loss probability

The unemployment rate is a **stock**: the share of the labour force unemployed at a point in time.

A layoff or employment-to-unemployment transition rate is a **flow** and is closer to the event probability needed by this simulator.

Statistics Canada reported:

- unemployment rate: **6.5%** in June 2026
- layoff rate: **0.6%** in June 2026

The layoff rate in that release was the proportion of people employed in May who became unemployed in June because of a layoff.

Source: Statistics Canada, *Labour Force Survey, June 2026*  
https://www150.statcan.gc.ca/n1/daily-quotidien/260710/dq260710a-eng.htm

The simulator does **not** mechanically turn 0.6% monthly into a universal personal layoff probability. Industry, age, tenure, geography, macro state, and the definition of layoff all matter. The UI therefore exposes an editable annual job-loss probability.

---

## 12. Housing and mortgages

Owned housing contributes an asset \(H_t\) and mortgage liability \(B_t\).

### Home appreciation

\[
H_{t+1}=H_t(1+h_m)
\]

where \(h_m\) is the monthly rate equivalent of annual appreciation assumption \(h\).

### Mortgage payment

For principal \(P\), monthly interest rate \(i\), and \(n\) remaining payments:

\[
Payment =
P
\frac{i(1+i)^n}
{(1+i)^n-1}
\]

For each month:

\[
Interest_t = B_t i
\]

\[
Principal_t = Payment_t - Interest_t
\]

\[
B_{t+1}=B_t-Principal_t
\]

Property tax/fees and maintenance are approximated as annual percentages of current home value divided by 12.

### Home equity

\[
HomeEquity_t = H_t - B_t
\]

Home equity contributes to total net worth.

**Important liquidity rule:** home equity does not automatically pay a cash shortfall. The model does not silently sell, refinance, or reverse-mortgage the home.

This means a person can have positive total net worth but still fail the liquidity/survivability test.

---

## 13. Other debt

Each debt has:

- balance \(D_t\)
- APR \(a\)
- scheduled monthly payment \(P\)

Monthly interest:

\[
Interest_t=D_t\frac{a}{12}
\]

New balance:

\[
D_{t+1} = \max(0,D_t+Interest_t-P)
\]

Debt balances reduce net worth.

The model currently assumes fixed APR and payment.

---

## 14. Government retirement income

The simulator adds the configured monthly government/pension income after the configured start age and indexes the entered current-dollar amount with inflation.

The Canada preset currently uses an **illustrative** monthly value of approximately **$1,629**, formed from:

- average new CPP retirement pension at age 65: **$877.01/month** (April 2026)
- maximum OAS for age 65-74: **$751.97/month** (July-September 2026)

This is **not an entitlement estimate**.

CPP depends on age, contribution history, and earnings history. OAS depends on residency, age, income, and other rules.

Sources:

https://www.canada.ca/en/services/benefits/publicpensions/cpp/amount.html

https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/payments.html

Users should replace the preset with their own government/account estimate when possible.

---

## 15. Net worth vs survivability

Total net worth:

\[
NW_t =
Cash_t +
Investments_t +
HomeValue_t -
Mortgage_t -
OtherDebt_t
\]

However, survivability is a **liquidity test**.

When monthly required outflows exceed income, the simulator uses:

1. cash
2. taxable investments
3. tax-free investments
4. tax-deferred investments, after withdrawal tax

If those are exhausted and the remaining shortfall pushes cash below zero, the plan records its first failure month.

The home is not automatically sold.

This is intentional: positive home equity does not mean a household can pay this month's bills without taking an additional action.

---

## 16. Monte Carlo

For \(K\) runs, the simulator repeats the same plan using independent deterministic random seeds.

For every month it calculates:

- 10th percentile net worth
- median net worth
- 90th percentile net worth

At the final month it reports the same distribution plus:

\[
SurvivalRate =
\frac{\text{runs with no liquidity failure}}
{K}
\]

The displayed animated path is the simulated run whose final net worth lies closest to the median final outcome.

Monte Carlo therefore answers a distributional question rather than pretending one random path is the prediction.

---

## 17. Country profiles

Country profiles are **presets**, not separate simulators.

The engine itself uses generic normalized inputs:

```text
inflation
tax assumptions
retirement income
income/wage anchor
job-loss probability
event probabilities
market assumptions
housing assumptions
```

Canada simply provides some pre-filled values and source metadata.

A user in a country without a maintained pack can choose **Generic / manual** and enter local numbers.

The important design idea is that country profiles are presets over the same simulation engine. Canada currently has the most source-aware preset. A future US, UK, or Netherlands profile can supply different taxes, pensions, wage anchors, labour assumptions, and other defaults without changing the underlying simulation equations.

---

## 18. Known limitations

Even v0.4 is an approximation. Important omissions include:

- exact federal/provincial/state/local tax brackets
- tax credits and deductions
- CPP contribution-history reconstruction
- OAS clawbacks and residency calculations
- TFSA/RRSP contribution-room rules
- realized vs unrealized taxable capital gains
- dividend and interest tax differences
- multiple asset classes and correlations
- stochastic inflation
- stochastic housing prices
- housing transaction costs
- rent-vs-own endogenous choice
- adjustable-rate/refinanced mortgages
- bankruptcy, refinancing, HELOCs, or home sales
- disability and health costs
- family/household income pooling
- dependants
- inheritances with population-calibrated incidence
- mortality tables and survivor benefits
- currency risk
- immigration/emigration
- country-specific pension/tax regime changes over decades

The purpose of exposing assumptions is to make those limitations visible and testable rather than hidden.

---

## 19. Recommended interpretation

Prefer:

> Under these assumptions, 78% of 1,000 simulated paths remain liquid through age 85, with median final real net worth of X and a 10th-90th percentile range of Y-Z.

Avoid:

> You will have X dollars at age 85.

The most useful question is often not the point estimate but:

- What assumptions cause failure?
- Which variables matter most?
- How much margin does the plan have?
- How different are pessimistic and optimistic outcomes?


---

## 20. v0.5 calibration architecture

v0.5 separates the model into four layers:

```text
public / historical data
          ↓
calibration + provenance
          ↓
economic / personal transition models
          ↓
monthly household microsimulation
          ↓
Monte Carlo + sensitivity output
```

Every grounded input should be classified as:

- **official**: directly observed and used for substantially the same quantity;
- **proxy**: observed data used to inform a related model quantity;
- **model**: calibrated or hand-selected modelling assumption;
- **user**: explicit user override.


### 20.1 Canadian household benchmarks

The app includes source-aware context from:

- Statistics Canada Survey of Household Spending 2023;
- Statistics Canada Survey of Financial Security 2023.

The SFS age-band median net worth can be used as a benchmark. If the user chooses the optional modelled starting-position preset, only the **total median net worth** is official; its split into cash, investments, home equity and mortgage is a modelling convenience.

Similarly, the SHS 2023 national average household spending value is official, while the prototype's age multipliers are model assumptions.

### 20.2 Career transitions

Typical Career is no longer only a smooth curve in stochastic modes.

It can now contain:

- promotions / career steps;
- job loss;
- an unemployment duration;
- re-employment;
- a persistent re-employment salary multiplier.

The transition probabilities and salary multipliers are editable model parameters. Future calibration should condition them on age, industry, occupation, tenure, geography and macroeconomic state.

### 20.3 Correlated equity/bond portfolio

The optional multi-asset model draws two standard normal shocks \(Z_1,Z_2\) and creates a correlated bond shock:

\[
Z_b = \rho Z_1 + \sqrt{1-\rho^2}Z_2
\]

Equity and bond returns are then generated from their own expected return and volatility assumptions.

The portfolio return is:

\[
r_p = w_e r_e + w_b r_b + w_c r_c
\]

where the weights sum to at most one and the remainder is treated as cash-like.

This is more useful than one universal portfolio return but is still not a full empirical asset-allocation model.

### 20.4 Stochastic inflation and policy-rate approximation

Inflation can evolve around the long-run assumption using a persistent mean-reverting approximation:

\[
\pi_t =
\pi^* +
\phi(\pi_{t-1}-\pi^*) +
\epsilon_t
\]

where \(\phi\) is currently fixed near 0.94 at the monthly step.

The simulated policy rate reacts directionally to inflation and recession state. This is a scenario generator, not a Bank of Canada forecasting model.

### 20.5 Mortgage renewal

Canadian mortgages may be assigned a term shorter than the full amortization.

When the term expires, the remaining mortgage is re-amortized using:

\[
r_{renewal} = r_{policy} + s
\]

where \(s\) is the user's mortgage spread assumption.

This captures an important Canadian cash-flow risk that a fixed rate over the entire amortization misses.

### 20.6 Canadian tax approximation

`canada2026` mode applies:

- published 2026 federal brackets;
- selected province/territory brackets;
- an approximate federal basic-personal credit;
- approximate CPP / CPP2 employee contributions;
- approximate EI premium.

This is still a planning approximation.

Important omissions include:

- detailed provincial credits and surtaxes;
- Quebec's separate provincial tax calculation;
- deductions;
- RRSP contribution deductions;
- benefits and refundable credits;
- spouse/dependant rules;
- exact annual withholding/reconciliation.

If a province is unsupported by the approximation, the engine falls back to the user-entered effective rate.

### 20.7 Longevity calibration

The model keeps the conservative planning horizon as the actual solvency horizon.

A smoothed age-specific hazard curve provides context:

\[
S(a_0,a_1)=\prod_{a=a_0}^{a_1-1}(1-q_a)
\]

where \(q_a\) is an approximate annual mortality probability.

The result is shown as “chance of outliving the selected horizon.” It **does not** terminate the plan early or encourage planning only to expected death.

The current qx curve is a smooth approximation informed by Canadian life-table shape; it is not yet a direct import of every official age-specific life-table cell.

### 20.8 Historical stress analogues

Historical scenarios are intentionally labelled **analogues**.

They reproduce recognizable combinations such as:

- market loss + recession/job risk;
- pandemic-like labour shock;
- inflation + mortgage-rate shock.

They are not exact historical block bootstraps and should not be described as historical replays.

A future empirical engine should sample blocks from aligned historical series for:

- equity returns;
- bond returns;
- CPI;
- policy/mortgage rates;
- unemployment transitions.

### 20.9 Parameter uncertainty

If enabled, Monte Carlo varies selected model parameters between runs as well as varying events within each run.

Conceptually:

\[
\theta_k \sim P(\theta)
\]

then:

\[
Y_k \sim P(Y \mid \theta_k)
\]

This separates uncertainty about **what future occurs** from uncertainty about **the correct parameter values**.

The present parameter distributions are hand-selected approximations; a later calibration layer should derive them from standard errors, confidence intervals or posterior distributions.

### 20.10 Representative Monte Carlo life

The animated representative life is no longer selected only by final wealth.

The engine compares each run's trajectory with the pointwise median trajectory and chooses a run with low normalized path distance.

This creates a more representative animated path, although it is still only one realization.

### 20.11 Sensitivity analysis

v0.5 runs one-at-a-time perturbations around:

- savings rate;
- base spending;
- retirement age;
- market-return assumptions;
- job-loss risk;
- housing carrying cost.

The bars answer:

> Which assumptions move this plan the most?

This is a local sensitivity analysis, not a variance-decomposition method such as Sobol indices.

### 20.12 Named random occurrences

The generic emergency event can now be rendered as concrete scenarios such as:

- appliance replacement;
- dental / health bill;
- unexpected move;
- vehicle repair;
- homeowner repair;
- family-support period.

The event **type** is realistic; the current price ranges are explicitly model assumptions. A later data pack can replace those ranges with region-specific observed cost distributions.

### What has actually been validated

The browser implementation is checked for internal consistency and the public-data inputs are documented with their sources.

That is different from proving that the model predicts real households accurately.

The project has **not yet completed historical population backtesting**. A stronger future validation process would initialize synthetic households using historical data, simulate them forward, then compare the resulting distributions with later observed Canadian wealth, spending, employment, housing, and retirement outcomes.

Until that exists, appropriate language is:

> source-aware, benchmarked, and designed for calibration

rather than:

> actuarially validated

or:

> predicts your probability of retirement success with known real-world accuracy.
