import React, { useEffect, useMemo, useState } from "react";
import { Download, Info, MapPin, SlidersHorizontal } from "lucide-react";
import { loadGovernorateMonthlyData, INDICATORS, fmt, monthLabel } from "./data.js";

const REGIONAL_INDICATORS = {
  rainfall: {
    label: "Rainfall",
    value: "rainfall_mm",
    baseline: "rainfall_mm_baseline",
    anomaly: "rainfall_mm_anomaly",
    unit: "mm",
    digits: 2,
    color: INDICATORS.rainfall.color
  },
  lst: {
    label: "Land Surface Temperature",
    value: "lst_celsius",
    baseline: "lst_celsius_baseline",
    anomaly: "lst_celsius_anomaly",
    unit: "°C",
    digits: 2,
    color: INDICATORS.lst.color
  },
  ndvi: {
    label: "Vegetation Greenness (NDVI)",
    value: "ndvi_mean",
    baseline: "ndvi_mean_baseline",
    anomaly: "ndvi_mean_anomaly",
    unit: "NDVI",
    digits: 4,
    color: INDICATORS.ndvi.color
  }
};

const MAP_WIDTH = 900;
const MAP_HEIGHT = 760;
const MAP_PADDING = 28;
const STANDARD_PARALLEL = 27 * Math.PI / 180;
const CSV_NAME_ALIASES = { Sharkia: "Shrkia" };

function Explain({ children }) {
  return (
    <details className="explain">
      <summary aria-label="Explain this map" title="Explain this map">
        <Info size={15} />
      </summary>
      <div className="explain-popover">
        <strong>About this map</strong>
        <p>{children}</p>
      </div>
    </details>
  );
}

function displayValue(value, digits, unit) {
  return value == null ? "No data" : `${fmt(value, digits)} ${unit}`.trim();
}

function loadGovernorateBoundaries() {
  return fetch("/data/egypt_governorates.geojson").then(async (response) => {
    if (!response.ok) {
      throw new Error(`Could not load official governorate boundaries (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (
      data.type !== "FeatureCollection" ||
      !Array.isArray(data.features) ||
      data.features.length === 0 ||
      data.features.some(
        (feature) =>
          !feature.properties?.name ||
          !["Polygon", "MultiPolygon"].includes(feature.geometry?.type)
      )
    ) {
      throw new Error("The governorate boundary file is invalid or incomplete.");
    }

    return data.features;
  });
}

function featureRings(feature) {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates;
  }

  return feature.geometry.coordinates.flat();
}

function getMapProjection(features) {
  const projectCoordinate = ([longitude, latitude]) => [
    longitude * Math.cos(STANDARD_PARALLEL),
    -latitude
  ];
  const points = features.flatMap((feature) =>
    featureRings(feature).flatMap((ring) => ring.map(projectCoordinate))
  );
  const bounds = points.reduce(
    (result, [x, y]) => ({
      minX: Math.min(result.minX, x),
      maxX: Math.max(result.maxX, x),
      minY: Math.min(result.minY, y),
      maxY: Math.max(result.maxY, y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / (bounds.maxX - bounds.minX),
    (MAP_HEIGHT - MAP_PADDING * 2) / (bounds.maxY - bounds.minY)
  );
  const offsetX = (MAP_WIDTH - (bounds.maxX - bounds.minX) * scale) / 2;
  const offsetY = (MAP_HEIGHT - (bounds.maxY - bounds.minY) * scale) / 2;

  return ([longitude, latitude]) => {
    const [x, y] = projectCoordinate([longitude, latitude]);
    return [
      offsetX + (x - bounds.minX) * scale,
      offsetY + (y - bounds.minY) * scale
    ];
  };
}

function featurePath(feature, project) {
  return featureRings(feature)
    .map((ring) =>
      ring
        .map((coordinate, index) => {
          const [x, y] = project(coordinate);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ") + " Z"
    )
    .join(" ");
}

export default function RegionalMap() {
  const [rows, setRows] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [indicator, setIndicator] = useState("rainfall");
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadGovernorateMonthlyData(), loadGovernorateBoundaries()])
      .then(([data, features]) => {
        if (cancelled) return;
        setRows(data);
        setBoundaries(features);
        const periods = [...new Set(data.map((row) => row.date.slice(0, 7)))].sort();
        const governorates = features.map((feature) => feature.properties.name);
        setPeriod(periods.at(-1) || "");
        setSelected(governorates[0] || "");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unable to load governorate data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const meta = REGIONAL_INDICATORS[indicator];
  const periods = useMemo(
    () => [...new Set(rows.map((row) => row.date.slice(0, 7)))].sort(),
    [rows]
  );
  const project = useMemo(
    () => getMapProjection(boundaries),
    [boundaries]
  );
  const mapFeatures = useMemo(
    () =>
      boundaries.map((feature) => ({
        feature,
        name: feature.properties.name,
        path: featurePath(feature, project)
      })),
    [boundaries, project]
  );
  const periodRows = useMemo(
    () => rows.filter((row) => row.date.slice(0, 7) === period),
    [rows, period]
  );
  const rowsByGovernorate = useMemo(
    () => new Map(periodRows.map((row) => [row.governorate, row])),
    [periodRows]
  );
  const rowForBoundary = (name) =>
    rowsByGovernorate.get(CSV_NAME_ALIASES[name] || name);
  const governorates = boundaries.map((feature) => feature.properties.name);
  const values = periodRows
    .map((row) => row[meta.value])
    .filter((value) => Number.isFinite(value));
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const selectedRow = rowForBoundary(selected);
  const regionalMean = values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;

  const downloadPeriodData = () => {
    const columns = ["governorate", "date", meta.value, meta.baseline, meta.anomaly, "unit"];
    const escapeCSV = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.map(escapeCSV).join(","),
      ...periodRows.map((row) =>
        [row.governorate, row.date, row[meta.value], row[meta.baseline], row[meta.anomaly], meta.unit]
          .map(escapeCSV)
          .join(",")
      )
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `earthscope-${indicator}-${period || "selected-month"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const markerColor = (value) => {
    if (value == null || min == null || max == null) return "var(--muted-strong)";
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    return `hsl(${205 - ratio * 165} 72% 58%)`;
  };

  if (loading) {
    return (
      <section className="panel glass regional-map-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">GEOGRAPHIC CONTEXT</div>
            <h3>Egypt governorate map</h3>
            <p>Loading official boundaries and regional observations…</p>
          </div>
          <MapPin size={18} className="muted-icon" />
        </div>
        <div className="map-loading">Loading map data…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel glass regional-map-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">GEOGRAPHIC CONTEXT</div>
            <h3>Egypt governorate map</h3>
            <p>Regional monthly observations</p>
          </div>
          <MapPin size={18} className="muted-icon" />
        </div>
        <div className="empty-state">
          <Info size={24} />
          <strong>Regional map data is unavailable</strong>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel glass regional-map-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">GEOGRAPHIC CONTEXT</div>
          <h3>Egypt governorate map</h3>
          <p>Official governorate boundaries · {boundaries.length} governorates</p>
        </div>
        <div className="heading-actions">
          <Explain>
            Each polygon follows the official CAPMAS-sourced governorate boundary
            geometry published in OCHA's Common Operational Dataset. Colors compare
            available regional observations for the selected month, from lower
            values (blue) to higher values (orange). Gray means that the CSV has
            no value for that governorate and indicator.
          </Explain>
          <button className="text-link" onClick={downloadPeriodData} disabled={!periodRows.length}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="map-controls">
        <div className="filter-title">
          <SlidersHorizontal size={15} />
          Customize map
        </div>
        <label className="select-wrap">
          <span>INDICATOR</span>
          <select value={indicator} onChange={(event) => setIndicator(event.target.value)}>
            {Object.entries(REGIONAL_INDICATORS).map(([id, item]) => (
              <option
                key={id}
                value={id}
                disabled={!rows.some((row) => row[item.value] != null)}
              >
                {item.label}{rows.some((row) => row[item.value] != null) ? "" : " — no regional data"}
              </option>
            ))}
          </select>
        </label>
        <label className="select-wrap">
          <span>MONTH</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            {periods.map((date) => (
              <option key={date} value={date}>{monthLabel(date)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="regional-map-layout">
        <div className="regional-map-visual">
          <div className="egypt-visual interactive-map">
            <div className="map-gridlines" />
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              role="group"
              aria-label="Interactive map of Egypt's official governorate boundaries"
            >
              {[...mapFeatures]
                .sort((a, b) => Number(a.name === selected) - Number(b.name === selected))
                .map(({ name, path }) => {
                const value = rowForBoundary(name)?.[meta.value];
                return (
                  <g
                    key={name}
                    className={`map-marker ${selected === name ? "selected" : ""}`}
                    role="button"
                    tabIndex="0"
                    aria-pressed={selected === name}
                    aria-label={`${name}: ${displayValue(value, meta.digits, meta.unit)} for ${period}`}
                    onClick={() => setSelected(name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(name);
                      }
                    }}
                    style={{ "--region-color": markerColor(value) }}
                  >
                    <title>{name}: {displayValue(value, meta.digits, meta.unit)} ({period})</title>
                    <path d={path} fillRule="evenodd" />
                  </g>
                );
              })}
            </svg>
            <span className="map-coord">{period ? monthLabel(period) : "NO PERIOD SELECTED"}</span>
          </div>
          <div className="map-legend">
            <span><i style={{ background: markerColor(min) }} /> Lower</span>
            <span className="map-legend-gradient" />
            <span><i style={{ background: markerColor(max) }} /> Higher</span>
            <span><i className="no-data-dot" /> No data</span>
          </div>
        </div>

        <div className="map-data-panel">
          <div className="map-data-heading">
            <span className="eyebrow">SELECTED GOVERNORATE</span>
            <h4>{selected || "Choose a map marker"}</h4>
            <p>{period ? monthLabel(period) : "No month selected"}</p>
          </div>
          <div className="map-reading">
            <span>{meta.label}</span>
            <strong>{displayValue(selectedRow?.[meta.value], meta.digits, meta.unit)}</strong>
          </div>
          <div className="map-reading">
            <span>Month-specific baseline</span>
            <strong>{displayValue(selectedRow?.[meta.baseline], meta.digits, meta.unit)}</strong>
          </div>
          <div className="map-reading">
            <span>Difference from baseline</span>
            <strong>{displayValue(selectedRow?.[meta.anomaly], meta.digits, meta.unit)}</strong>
          </div>
          <div className="map-reading">
            <span>Governorate average this month</span>
            <strong>{displayValue(regionalMean, meta.digits, meta.unit)}</strong>
          </div>
          <div className="chart-note">
            <Info size={14} />
            Showing {values.length} available governorate values for {period ? monthLabel(period) : "the selected month"}.
          </div>
          {governorates.length > 0 && (
            <label className="select-wrap map-governorate-select">
              <span>CHOOSE GOVERNORATE</span>
              <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                {governorates.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>
      <div className="map-disclaimer">
        <Info size={13} />
        <span>
          Boundaries: Egypt CAPMAS via OCHA Common Operational Dataset (Admin 1), reviewed 19 Dec 2024.{" "}
          <a href="https://data.humdata.org/dataset/cod-ab-egy" target="_blank" rel="noreferrer">Source &amp; attribution</a>{" "}
          · CC BY-IGO 3.0.
        </span>
      </div>
    </section>
  );
}
