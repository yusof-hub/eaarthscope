# EARTHSCOPE

A React/Vite environmental investigation dashboard for Egypt using a monthly NASA-derived master CSV (2001–2024).

## 1. Requirements
- Node.js LTS (18+ recommended)
- npm

## 2. Add your real dataset
Copy your existing file:

`earthscope_master_dataset_2001_2024.csv`

into:

`public/data/earthscope_master_dataset_2001_2024.csv`

The CSV must contain these columns:

`date, rainfall_mm, baseline_mm, anomaly_mm, z_score_rainfall, lst_celsius, baseline_celsius, anomaly_celsius, z_score_lst, ndvi_mean, baseline_ndvi, ndvi_anomaly, z_score_ndvi`

The app validates the required date and primary indicator columns. Missing optional anomaly/baseline values are displayed as unavailable.

## 3. Run on Windows
Open Command Prompt in the `earthscope` folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## 4. Production build
```bash
npm run build
npm run preview
```

## 5. Pages
- Overview: dataset summary, latest measurements, national history, candidate anomaly months.
- Anomaly Detective: configurable Z-score screening, year and indicator filters, result details.
- Climate Fingerprint: honest regional-data prerequisite state; no fabricated governorate results.
- Climate Timeline: filter years and indicator, inspect observed values, baselines and anomalies.
- Future Simulator: independent arithmetic scenario adjustments, explicitly not a climate forecast.

## Scientific notes
- LST is land surface temperature, not air temperature.
- NDVI represents vegetation greenness, not direct plant health.
- Z-score thresholds are screening criteria, not proof of significance.
- Very small baseline standard deviations can inflate Z-scores; inspect absolute anomalies too.
- The supplied CSV contains national monthly averages. Governorate analysis requires separately processed and validated regional data.
- Future Simulator outputs are illustrative arithmetic scenarios, not official projections.

## Troubleshooting
If the app says it cannot load the CSV, check the exact filename and location:
`public/data/earthscope_master_dataset_2001_2024.csv`

If `npm run dev` says Vite is not recognized, run `npm install` from the project root first.
# eaarthscope
