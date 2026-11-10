import Papa from "papaparse";

// ======================================================
// DATASET PATHS
// ======================================================

export const DATA_URL =
  "/data/earthscope_master_dataset_2001_2024.csv";

export const GOVERNORATE_MONTHLY_URL =
  "/data/earthscope_governorate_monthly.csv";

export const CLIMATE_FINGERPRINT_URL =
  "/data/earthscope_climate_fingerprint.csv";

// ======================================================
// NATIONAL DATASET
// ======================================================

const numericFields = [
  "rainfall_mm",
  "baseline_mm",
  "anomaly_mm",
  "z_score_rainfall",

  "lst_celsius",
  "baseline_celsius",
  "anomaly_celsius",
  "z_score_lst",

  "ndvi_mean",
  "baseline_ndvi",
  "ndvi_anomaly",
  "z_score_ndvi"
];

export function parseDataset(rows) {
  return rows
    .map((row) => {
      const item = {
        ...row,
        date: String(row.date || "").slice(0, 7)
      };

      numericFields.forEach((key) => {
        const value = Number(row[key]);

        item[key] =
          row[key] === "" ||
          row[key] == null ||
          !Number.isFinite(value)
            ? null
            : value;
      });

      return item;
    })
    .filter((row) => /^\d{4}-\d{2}$/.test(row.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadDataset() {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(
      `Could not load ${DATA_URL} (HTTP ${response.status}).`
    );
  }

  const csv = await response.text();

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    throw new Error(
      `CSV parsing issue: ${parsed.errors[0].message}`
    );
  }

  const rows = parseDataset(parsed.data);

  if (!rows.length) {
    throw new Error(
      "The CSV loaded, but it contains no valid monthly records."
    );
  }

  const required = [
    "date",
    "rainfall_mm",
    "lst_celsius",
    "ndvi_mean"
  ];

  const missing = required.filter(
    (key) => !(key in (parsed.data[0] || {}))
  );

  if (missing.length) {
    throw new Error(
      `Missing required columns: ${missing.join(", ")}`
    );
  }

  return rows;
}

// ======================================================
// REGIONAL DATASET HELPERS
// ======================================================

const regionalNumericFields = [
  "year",
  "month",

  "rainfall_mm",
  "lst_celsius",
  "ndvi_mean",

  "rainfall_mm_baseline",
  "rainfall_mm_std",
  "rainfall_mm_anomaly",
  "rainfall_mm_zscore",

  "lst_celsius_baseline",
  "lst_celsius_std",
  "lst_celsius_anomaly",
  "lst_celsius_zscore",

  "ndvi_mean_baseline",
  "ndvi_mean_std",
  "ndvi_mean_anomaly",
  "ndvi_mean_zscore",

  "rainfall_mm_average",
  "rainfall_mm_variability",
  "rainfall_mm_unusual_months_pct",

  "lst_celsius_average",
  "lst_celsius_variability",
  "lst_celsius_unusual_months_pct",

  "ndvi_mean_average",
  "ndvi_mean_variability",
  "ndvi_mean_unusual_months_pct"
];

async function loadRegionalCSV(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not load ${url} (HTTP ${response.status}).`
    );
  }

  const csv = await response.text();

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length) {
    throw new Error(
      `CSV parsing issue in ${url}: ${parsed.errors[0].message}`
    );
  }

  return parsed.data.map((row) => {
    const item = { ...row };

    regionalNumericFields.forEach((key) => {
      if (key in item) {
        const value = Number(item[key]);

        item[key] =
          item[key] === "" ||
          item[key] == null ||
          !Number.isFinite(value)
            ? null
            : value;
      }
    });

    if (item.governorate) {
      item.governorate = item.governorate.trim();
    }

    if (item.climate_group) {
      item.climate_group = item.climate_group.trim();
    }

    if (item.date) {
      item.date = String(item.date).slice(0, 10);
    }

    return item;
  });
}

// ======================================================
// GOVERNORATE MONTHLY DATA
// ======================================================

export async function loadGovernorateMonthlyData() {
  const rows = await loadRegionalCSV(
    GOVERNORATE_MONTHLY_URL
  );

  const required = [
    "governorate",
    "date",
    "rainfall_mm",
    "lst_celsius",
    "ndvi_mean"
  ];

  const missing = required.filter(
    (key) => !(key in (rows[0] || {}))
  );

  if (missing.length) {
    throw new Error(
      `Governorate monthly dataset is missing columns: ${missing.join(", ")}`
    );
  }

  const validRows = rows.filter(
    (row) => row.governorate && row.date
  );

  return validRows.sort((a, b) => {
    const governorateOrder =
      a.governorate.localeCompare(b.governorate);

    return (
      governorateOrder ||
      String(a.date).localeCompare(String(b.date))
    );
  });
}

// ======================================================
// CLIMATE FINGERPRINT DATA
// ======================================================

export async function loadClimateFingerprintData() {
  const rows = await loadRegionalCSV(
    CLIMATE_FINGERPRINT_URL
  );

  const required = [
    "governorate",
    "rainfall_mm_average",
    "lst_celsius_average",
    "ndvi_mean_average",
    "climate_group"
  ];

  const missing = required.filter(
    (key) => !(key in (rows[0] || {}))
  );

  if (missing.length) {
    throw new Error(
      `Climate fingerprint dataset is missing columns: ${missing.join(", ")}`
    );
  }

  return rows.filter((row) => row.governorate);
}

// ======================================================
// INDICATOR CONFIGURATION
// ======================================================

export const INDICATORS = {
  rainfall: {
    label: "Rainfall",
    unit: "mm",
    value: "rainfall_mm",
    baseline: "baseline_mm",
    anomaly: "anomaly_mm",
    z: "z_score_rainfall",
    color: "#69b8f2",
    description:
      "Monthly precipitation. Very dry conditions across much of Egypt can produce small baseline variability."
  },

  lst: {
    label: "Land Surface Temperature",
    unit: "°C",
    value: "lst_celsius",
    baseline: "baseline_celsius",
    anomaly: "anomaly_celsius",
    z: "z_score_lst",
    color: "#f5a66b",
    description:
      "Satellite-derived land surface temperature, not near-surface air temperature."
  },

  ndvi: {
    label: "Vegetation Greenness (NDVI)",
    unit: "NDVI",
    value: "ndvi_mean",
    baseline: "baseline_ndvi",
    anomaly: "ndvi_anomaly",
    z: "z_score_ndvi",
    color: "#7bc99b",
    description:
      "Satellite-derived vegetation greenness; it is not a direct measurement of plant health."
  }
};

// ======================================================
// FORMATTING HELPERS
// ======================================================

export function fmt(value, digits = 2) {
  return value == null ||
    !Number.isFinite(Number(value))
    ? "—"
    : Number(value).toFixed(digits);
}

export function latestValid(rows, key) {
  return (
    [...rows]
      .reverse()
      .find((row) => row[key] != null) || null
  );
}

export function monthLabel(date) {
  if (!date) return "";

  const [year, month] = date.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString("en", {
    month: "short",
    year: "2-digit"
  });
}

// ======================================================
// ANOMALY DETECTION
// ======================================================

export function getAnomalyCandidates(
  rows,
  threshold = 2
) {
  return rows
    .map((row) => {
      const flags = Object.entries(INDICATORS)
        .map(([id, meta]) => {
          const z = row[meta.z];

          return {
            id,
            ...meta,
            z,
            anomaly: row[meta.anomaly],
            value: row[meta.value],
            flagged:
              z != null &&
              Math.abs(z) >= threshold
          };
        })
        .filter((item) => item.flagged);

      return {
        ...row,
        flags,
        count: flags.length
      };
    })
    .filter((row) => row.count >= 2)
    .sort((a, b) =>
      b.date.localeCompare(a.date)
    );
}

// ======================================================
// STATISTICS
// ======================================================

export function calcStats(rows, key) {
  const values = rows
    .map((row) => row[key])
    .filter(
      (value) =>
        value != null &&
        Number.isFinite(value)
    );

  if (!values.length) return null;

  const mean =
    values.reduce((a, b) => a + b, 0) /
    values.length;

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  return {
    mean,
    min: sorted[0],
    max: sorted.at(-1),
    count: values.length
  };
}
