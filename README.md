# Can I Survive?

**Can I Survive?** is a browser-based financial resilience simulator.

Sketch out a rough version of your finances, then watch a possible life unfold month by month. The model can include work, promotions, layoffs, spending, housing, debt, taxes, retirement income, markets, inflation, mortgage renewals, and random life events.

It is built around questions like:

- What if I save a little more?
- What if I retire two years later?
- What happens if I hit a recession or spend a long stretch out of work?
- How much does housing change the plan?
- Which assumptions matter most?
- How much margin does this plan actually have?

This is an **alpha planning experiment**. It is not financial advice and it does not predict an individual's future.

## Run locally

The project is plain HTML, CSS, and JavaScript. There is no package install or build step.

From the repo folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## What it models

- monthly household cash flow
- Baseline, Life Events, and Monte Carlo modes
- current savings and investments
- custom income and expense periods
- Typical Career income paths
- promotions, layoffs, unemployment, and re-employment
- Canadian wage anchors
- spending growth and retirement spending changes
- cash, taxable, tax-free, and tax-deferred investments
- equity and bond portfolio assumptions
- stochastic market returns and inflation
- recession regimes
- housing, mortgages, renewals, maintenance, and home equity
- other debt
- simplified Canadian income tax, CPP, and EI
- government retirement income
- longevity planning context
- named life-event expenses
- simplified historical stress analogues
- sensitivity analysis
- real-dollar and nominal-dollar views

Canada is currently the most source-aware profile. Other countries can use the same engine with manual assumptions.

## How the model works

[`MODEL.md`](MODEL.md) contains the full explanation of:

- the simulation architecture
- formulas
- stochastic assumptions
- Canadian data sources
- which values are observed versus modelled
- taxes and retirement assumptions
- career and employment modelling
- markets and inflation
- housing and debt
- Monte Carlo
- historical stress scenarios
- sensitivity analysis
- current limitations
- how results should be interpreted

If you want to understand or audit the simulator, start there.

## Project structure

```text
can-i-survive/
├── index.html
├── styles.css
├── app.js
├── README.md
├── MODEL.md
├── .nojekyll
└── .gitignore
```

## GitHub Pages

Push the repository to GitHub, then open:

**Settings > Pages > Build and deployment**

Choose:

```text
Deploy from a branch
main
/ (root)
```

No GitHub Actions workflow or build command is required.

For a new empty GitHub repository:

```bash
git init
git add .
git commit -m "Initial Can I Survive alpha"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/can-i-survive.git
git push -u origin main
```

After that, normal updates are:

```bash
git add .
git commit -m "Describe the change"
git push
```

## Status

The current model is designed to be transparent about its assumptions and to use real-world data where practical.

It has **not** been actuarially validated or proven to predict individual financial outcomes. The useful output is the shape and sensitivity of a plan under explicit assumptions, not a single exact dollar prediction.
