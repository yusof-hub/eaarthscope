# EARTHSCOPE

An interactive environmental investigation dashboard for Egypt. Explore national monthly rainfall, land surface temperature (LST), and vegetation greenness (NDVI), then compare regional observations and screen for unusual months.

## Run locally

Requirements: Node.js 18+ and npm.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Data files

The project includes three CSV files and one official-source boundary file in `public/data/`:

- `earthscope_master_dataset_2001_2024.csv` — national monthly observations, baselines, anomalies, and Z-scores.
- `earthscope_governorate_monthly.csv` — monthly observations and baselines for 27 governorates.
- `earthscope_climate_fingerprint.csv` — regional summaries and exploratory climate-group labels.
- `egypt_governorates.geojson` — 27 Admin 1 governorate polygons sourced from CAPMAS through the UN OCHA Common Operational Dataset for Egypt.

The national dataset must include these columns: `date`, `rainfall_mm`, `baseline_mm`, `anomaly_mm`, `z_score_rainfall`, `lst_celsius`, `baseline_celsius`, `anomaly_celsius`, `z_score_lst`, `ndvi_mean`, `baseline_ndvi`, `ndvi_anomaly`, and `z_score_ndvi`. If you replace a file, keep its expected headers and verify its provenance and processing before using the results.

## Workspaces

- **Overview:** national indicator snapshot, standardized anomaly comparison, recent anomaly candidates, and an interactive governorate locator. Export the selected regional month and indicator as CSV.
- **Anomaly Detective:** filter national Z-score screening results by indicator, year, and threshold.
- **Climate Fingerprint:** compare governorate summaries, monthly history, and exploratory regional groups.
- **Climate Timeline:** inspect national observations, month-specific baselines, and anomalies by indicator and year range.
- **Future Simulator:** try independent arithmetic adjustments to historical means. This is not a climate forecast.
- **About EarthScope:** definitions, interpretation guidance, product references, and limitations.

## Data products and interpretation

The project identifies these Earth-observation product families:

- NASA Global Precipitation Measurement IMERG — [product information](https://gpm.nasa.gov/data/imerg)
- MODIS Terra MOD11A2 land surface temperature — [product information](https://lpdaac.usgs.gov/products/mod11a2v061/)
- MODIS Terra MOD13Q1 vegetation indices — [product information](https://lpdaac.usgs.gov/products/mod13q1v061/)

The dashboard loads the included CSVs; it does not retrieve or reprocess the original satellite products. The CSVs provide a 2001–2020 reference period for monthly baselines. Consult the supplied data and processing metadata before reuse.

- LST is land surface temperature, not near-surface air temperature.
- NDVI represents vegetation greenness, not a direct measure of plant health.
- The included governorate datasets currently have no valid regional NDVI observations; NDVI remains available in the national monthly dataset.
- Z-score thresholds are screening aids, not proof of statistical significance or cause. Very small reference variability can inflate Z-scores.
- The overview map uses CAPMAS-sourced Admin 1 polygons, published through OCHA HDX as the Egypt COD-AB, reviewed 19 December 2024. [Dataset and attribution](https://data.humdata.org/dataset/cod-ab-egy). Licensed CC BY-IGO 3.0; attribution is shown on the map and About page.
- The governorate CSV spells Sharkia as `Shrkia`; the map crosswalks that data label to the boundary dataset's `Sharkia` name.
- The map is an administrative overview, not a cadastral or legal survey. Its data colors summarize the supplied CSV records; the boundaries do not imply that measurements cover every point within a governorate.
- Climate groups are exploratory labels, not official climate classifications.
- Missing values are not zero.
- Simulator outputs are illustrative arithmetic scenarios, not projections.

## Production build

```powershell
npm run build
npm run preview
```

If the master CSV cannot load, verify its exact filename and location at `public/data/earthscope_master_dataset_2001_2024.csv`.

**Vercel deployment:
**
https://earthscopenasa.vercel.app 
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
3. No environment variables are required. Deploy the `main` branch; later pushes to `main` trigger production deployments automatically.
