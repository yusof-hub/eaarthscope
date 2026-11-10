import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, CalendarDays, ChevronDown, ChevronRight,
  CloudRain, Database, Download, Droplets, Globe2, Layers3, Leaf, Menu, Moon,
  Search, Sun, ThermometerSun, TrendingUp, Waves, X, ArrowUpRight, Info,
  RefreshCw, SlidersHorizontal, MapPin, Sparkles, CircleHelp, CheckCircle2
} from "lucide-react";
import RegionalMap from "./RegionalMap.jsx";
import {
  loadDataset,
  loadGovernorateMonthlyData,
  loadClimateFingerprintData,
  INDICATORS,
  fmt,
  latestValid,
  monthLabel,
  getAnomalyCandidates,
  calcStats
} from "./data.js";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, BarChart, Bar, Legend
} from "recharts";

const NAV = [
  { id:"overview", label:"Overview", icon:Globe2 },
  { id:"anomalies", label:"Anomaly Detective", icon:AlertTriangle },
  { id:"fingerprint", label:"Climate Fingerprint", icon:Layers3 },
  { id:"timeline", label:"Climate Timeline", icon:CalendarDays },
  { id:"simulator", label:"Future Simulator", icon:TrendingUp },
  { id:"about", label:"About EarthScope", icon:CircleHelp }
];

function IconButton({ children, onClick, title, className="" }) {
  return <button className={`icon-btn ${className}`} onClick={onClick} title={title} aria-label={title}>{children}</button>;
}
function Explain({ label="Explain this data", children }) {
  return <details className="explain">
    <summary aria-label={label} title={label}><CircleHelp size={15}/></summary>
    <div className="explain-popover"><strong>{label}</strong><p>{children}</p></div>
  </details>;
}
function Metric({ icon:Icon, label, value, unit, detail, accent, explanation=detail }) {
  return <div className="metric glass">
    <div className="metric-top"><span className="metric-icon" style={{"--accent":accent}}><Icon size={18}/></span><span className="metric-label">{label}</span><Explain label={`Explain ${label.toLowerCase()}`}>{explanation}</Explain><span className="metric-dot"/></div>
    <div className="metric-value">{value}<small>{unit}</small></div>
    <div className="metric-detail">{detail}</div>
  </div>;
}
function SectionHeading({ eyebrow, title, subtitle, right, explanation }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><div className="heading-actions">{explanation&&<Explain label={`About ${title}`}>{explanation}</Explain>}{right}</div></div>;
}
function Select({ value, onChange, children, label }) {
  return <label className="select-wrap"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{children}</select><ChevronDown size={14}/></label>;
}
function EmptyState({ title, message, icon:Icon=Info }) {
  return <div className="empty-state"><Icon size={24}/><strong>{title}</strong><p>{message}</p></div>;
}
function ChartTooltip({active,payload,label}) {
  if(!active || !payload?.length) return null;
  return <div className="chart-tooltip"><b>{label}</b>{payload.map((p,i)=><div key={i}><i style={{background:p.color}}/>{p.name}: <strong>{fmt(p.value,3)}</strong></div>)}</div>;
}
function DataChart({ data, lines, height=280, yLabel }) {
  if(!data.length) return <EmptyState title="No chart data" message="There are no valid observations for this selection."/>;
  return <div className="chart-wrap" style={{height}}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{top:12,right:12,left:0,bottom:4}}>
        <CartesianGrid stroke="var(--grid)" vertical={false}/>
        <XAxis dataKey="label" tick={{fill:"var(--muted)",fontSize:11}} tickLine={false} axisLine={false} minTickGap={28}/>
        <YAxis domain={[-4,4]} allowDataOverflow tick={{fill:"var(--muted)",fontSize:11}} tickLine={false} axisLine={false} width={48} label={yLabel?{value:yLabel,angle:-90,position:"insideLeft",fill:"var(--muted)",fontSize:10}:undefined}/>
        <Tooltip content={<ChartTooltip/>}/>
        <ReferenceLine y={0} stroke="var(--muted)" strokeOpacity={0.65}/>
        <ReferenceLine y={2} stroke="var(--muted-strong)" strokeDasharray="4 4"/>
        <ReferenceLine y={-2} stroke="var(--muted-strong)" strokeDasharray="4 4"/>
        {lines.map(line=><Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={2} dot={false} connectNulls={false}/>)}
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
function AnomalyChart({rows, meta}) {
  const data=rows.map(r=>({label:monthLabel(r.date), anomaly:r[meta.anomaly]}));
  return <div className="chart-wrap" style={{height:235}}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{top:10,right:10,left:0,bottom:0}}>
        <CartesianGrid stroke="var(--grid)" vertical={false}/>
        <XAxis dataKey="label" tick={{fill:"var(--muted)",fontSize:10}} tickLine={false} axisLine={false} minTickGap={28}/>
        <YAxis tick={{fill:"var(--muted)",fontSize:10}} tickLine={false} axisLine={false} width={48}/>
        <Tooltip content={<ChartTooltip/>}/><ReferenceLine y={0} stroke="var(--muted)"/>
        <Bar dataKey="anomaly" name={`${meta.label} anomaly`} fill={meta.color} radius={[3,3,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
function Sidebar({page,setPage,open,setOpen}) {
  return <aside className={`sidebar ${open?"sidebar-open":""}`}>
    <div className="brand"><div className="brand-mark"><Globe2 size={22}/><span/></div><div><b>EARTHSCOPE</b><small>EARTH SYSTEM INTELLIGENCE</small></div><IconButton className="mobile-close" title="Close menu" onClick={()=>setOpen(false)}><X size={18}/></IconButton></div>
    <div className="nav-caption">WORKSPACE</div>
    <nav>{NAV.map(item=><button key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>{setPage(item.id);setOpen(false)}}><item.icon size={18}/><span>{item.label}</span>{page===item.id&&<span className="nav-active-dot"/>}</button>)}</nav>
    <div className="sidebar-bottom">
      <div className="sidebar-status"><span className="status-light"/><div><b>DATA WORKSPACE</b><small>Egypt · 2001—2024</small></div></div>
      <div className="sidebar-foot">NASA EARTH OBSERVATION<br/>INDEPENDENT DATA ANALYSIS</div>
    </div>
  </aside>;
}
function Topbar({page,theme,setTheme,onMenu,dataStatus}) {
  const current=NAV.find(n=>n.id===page);
  return <header className="topbar"><div className="top-left"><IconButton title="Open navigation" className="menu-btn" onClick={onMenu}><Menu size={19}/></IconButton><div className="breadcrumb">WORKSPACE <ChevronRight size={13}/> <b>{current?.label}</b></div></div>
    <div className="top-actions"><span className={`data-pill ${dataStatus==="ready"?"ready":""}`}><span/>{dataStatus==="ready"?"DATA CONNECTED":dataStatus==="loading"?"LOADING DATA":"DATA NOT CONNECTED"}</span><IconButton title={`Switch to ${theme==="dark"?"light":"dark"} theme`} onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</IconButton></div>
  </header>;
}
function Overview({rows,setPage}) {
  const latest=rows.at(-1), candidates=getAnomalyCandidates(rows);
  const chartData=rows.map(r=>({label:monthLabel(r.date),rain:r[INDICATORS.rainfall.z],lst:r[INDICATORS.lst.z],ndvi:r[INDICATORS.ndvi.z]}));
  const stats=calcStats(rows,"rainfall_mm");
  const indicatorRows=Object.entries(INDICATORS).map(([id,m])=>({id,...m,row:latestValid(rows,m.value)}));
  return <div className="page-stack">
    <div className="welcome-row"><div><div className="eyebrow">EARTH SYSTEM TREND DETECTIVE / EGYPT</div><h1>See the bigger <em>picture.</em></h1><p>Explore environmental signals, investigate anomalies, and understand how Earth's systems change over time.</p></div><div className="coverage-chip"><span className="coverage-icon"><CalendarDays size={17}/></span><div><small>OBSERVATION PERIOD</small><b>{rows[0]?.date} — {latest?.date}</b></div></div></div>
    <div className="metric-grid">
      <Metric icon={Database} label="MONTHLY RECORDS" value={rows.length.toLocaleString()} unit="months" detail="Validated rows loaded from CSV" explanation="Count of monthly records in the national dataset. A record is not necessarily complete for every indicator." accent="#75b9ee"/>
      <Metric icon={CalendarDays} label="TIME COVERAGE" value={rows.length?`${rows[0].date.slice(0,4)}–${latest.date.slice(0,4)}`:"—"} unit="" detail="Historical monthly observations" explanation="The first and last years represented in the loaded national observations." accent="#a99ae9"/>
      <Metric icon={Layers3} label="INDICATORS" value="03" unit="datasets" detail="Rainfall · LST · NDVI" explanation="The dashboard presents precipitation, land surface temperature, and vegetation greenness (NDVI)." accent="#7bc99b"/>
      <Metric icon={AlertTriangle} label="MULTI-SIGNAL CANDIDATES" value={candidates.length} unit="months" detail="At least two |Z-score| ≥ 2" explanation="Months where at least two indicators have absolute Z-scores of 2 or greater. This is a screening flag, not proof of a cause." accent="#efad78"/>
    </div>
    <div className="content-grid overview-grid">
      <section className="panel glass chart-panel"><div className="panel-head"><div><div className="eyebrow">HISTORICAL OVERVIEW</div><h3>Standardized environmental anomalies</h3><p>Compare unusually high and low months across indicators</p></div><div className="heading-actions"><Explain label="Explain the environmental signals chart">Each line shows a monthly Z-score: how far an observation sits from its month-specific baseline in standard deviations. This makes relative departures comparable across indicators. Dashed guides mark ±2; values outside the visible ±4 range are clipped, so inspect the Anomaly Detective for exact extremes. Z-scores can be inflated where historical variability is very small.</Explain><span className="live-tag"><span/> CSV DATA</span></div></div>
        <div className="legend-row"><span><i style={{background:INDICATORS.rainfall.color}}/>Rainfall (Z-score)</span><span><i style={{background:INDICATORS.lst.color}}/>LST (Z-score)</span><span><i style={{background:INDICATORS.ndvi.color}}/>NDVI (Z-score)</span></div>
        <DataChart data={chartData} yLabel="Standard deviations from baseline" lines={[{key:"rain",name:"Rainfall Z-score",color:INDICATORS.rainfall.color},{key:"lst",name:"LST Z-score",color:INDICATORS.lst.color},{key:"ndvi",name:"NDVI Z-score",color:INDICATORS.ndvi.color}]}/>
        <div className="chart-note"><Info size={14}/> The chart is limited to ±4 standard deviations so smaller departures remain legible. Open Anomaly Detective to inspect full values, including larger outliers.</div>
      </section>
      <section className="panel glass indicator-panel"><div className="panel-head"><div><div className="eyebrow">LATEST AVAILABLE</div><h3>Indicator snapshot</h3><p>Most recent valid reading for each indicator</p></div><div className="heading-actions"><Explain label="Explain the indicator snapshot">The latest available reading for each indicator, along with its difference from its month-specific baseline. The dates can differ when an indicator has missing values; check the date shown beside each reading.</Explain><Activity size={18} className="muted-icon"/></div></div>
        <div className="indicator-list">{indicatorRows.map(({id,label,unit,value,anomaly,z,row,color,description})=><div className="indicator-row" key={id}><div className="indicator-symbol" style={{"--accent":color}}>{id==="rainfall"?<Droplets size={18}/>:id==="lst"?<ThermometerSun size={18}/>:<Leaf size={18}/>}</div><div className="indicator-info"><b>{label}</b><small>{description}</small><span className="indicator-as-of">Latest: {row?.date?monthLabel(row.date):"No valid reading"}</span></div><div className="indicator-reading"><strong>{fmt(row?.[value],id==="ndvi"?4:2)}</strong><small>{unit}</small><span className={row?.[anomaly]>=0?"positive":"negative"}>{row?.[anomaly]==null?"No anomaly":`${row[anomaly]>=0?"+":""}${fmt(row[anomaly],3)} ${unit}`}</span><Explain label={`Explain ${label}`}>{description} The anomaly is the observed value minus its corresponding baseline, expressed in {unit}.</Explain></div></div>)}</div>
      </section>
    </div>
    <div className="content-grid lower-grid">
      <section className="panel glass"><div className="panel-head"><div><div className="eyebrow">INVESTIGATE</div><h3>Recent anomaly candidates</h3><p>Months with at least two indicators crossing the screening threshold</p></div><div className="heading-actions"><Explain label="Explain anomaly candidates">These months have at least two indicators with an absolute Z-score of 2 or greater. Z-scores describe distance from the reference in standard deviations; investigate further before drawing conclusions.</Explain><button className="text-link" onClick={()=>setPage("anomalies")}>Explore all <ArrowUpRight size={14}/></button></div></div>
        {candidates.slice(0,4).length?candidates.slice(0,4).map(r=><div className="finding-row" key={r.date}><div className="finding-date">{r.date}</div><div className="finding-bars">{r.flags.map(f=><span key={f.id} style={{background:f.color}} title={f.label}/>)}</div><div className="finding-summary">{r.count} indicators flagged</div><ChevronRight size={15} className="muted-icon"/></div>):<EmptyState title="No candidate months" message="No months currently meet the multi-indicator screening rule."/>}
      </section>
    </div>
    <RegionalMap/>
    <div className="source-strip"><span><Database size={15}/> DATA SOURCE</span><b>NASA GPM IMERG · MODIS MOD11A2 · MODIS MOD13Q1</b><span className="source-period">Baseline: 2001–2020</span></div>
  </div>;
}
function AnomalyDetective({rows}) {
  const [indicator,setIndicator]=useState("all"),[threshold,setThreshold]=useState("2"),[year,setYear]=useState("all"),[selected,setSelected]=useState(null);
  const t=Number(threshold);
  const results=useMemo(()=>rows.map(r=>{
    const flags=Object.entries(INDICATORS).map(([id,m])=>({id,...m,z:r[m.z],anomaly:r[m.anomaly],value:r[m.value],baseline:r[m.baseline],flagged:r[m.z]!=null&&Math.abs(r[m.z])>=t}))
      .filter(f=>f.flagged&&(indicator==="all"||f.id===indicator));
    return {...r,flags,count:flags.length};
  }).filter(r=>r.count>0&&(indicator==="all"?r.count>=2:true)&&(year==="all"||r.date.startsWith(year))).sort((a,b)=>b.date.localeCompare(a.date)),[rows,indicator,t,year]);
  const years=[...new Set(rows.map(r=>r.date.slice(0,4)))];
  const active=results.find(r=>r.date===selected)||results[0];
  return <div className="page-stack"><SectionHeading eyebrow="INVESTIGATION MODULE / 01" title="Anomaly Detective" subtitle="Find observations that differ from their historical reference conditions." explanation="This page screens national monthly records by comparing observations with month-specific baselines. Z-scores help flag unusual values but do not explain why they occurred." right={<span className="module-badge"><AlertTriangle size={14}/> SCREENING ENGINE</span>}/>
    <div className="panel glass filter-panel"><div className="heading-actions"><div className="filter-title"><SlidersHorizontal size={16}/> Investigation controls</div><Explain label="Explain investigation controls">Choose an indicator, year, and Z-score threshold. When multiple indicators are selected, a month appears only when at least two indicators meet the threshold.</Explain></div><div className="filters">
      <Select label="INDICATOR" value={indicator} onChange={v=>{setIndicator(v);setSelected(null)}}><option value="all">Multiple indicators (2+)</option><option value="rainfall">Rainfall</option><option value="lst">Land Surface Temperature</option><option value="ndvi">NDVI</option></Select>
      <Select label="YEAR" value={year} onChange={setYear}><option value="all">All years</option>{years.map(y=><option key={y}>{y}</option>)}</Select>
      <Select label="Z-SCORE THRESHOLD" value={threshold} onChange={setThreshold}><option value="1.5">±1.5</option><option value="2">±2.0 (default)</option><option value="2.5">±2.5</option><option value="3">±3.0</option></Select>
    </div></div>
    <div className="metric-grid three"><Metric icon={Search} label="MATCHING PERIODS" value={results.length} unit="months" detail="After selected filters" accent="#75b9ee"/><Metric icon={AlertTriangle} label="SCREENING RULE" value={indicator==="all"?"2+":"1+"} unit="indicators" detail={`Absolute Z-score ≥ ${t}`} accent="#efad78"/><Metric icon={CalendarDays} label="SELECTED PERIOD" value={active?.date||"—"} unit="" detail="Most recent matching month" accent="#a99ae9"/></div>
    <div className="content-grid anomaly-layout"><section className="panel glass"><div className="panel-head"><div><div className="eyebrow">DETECTION RESULTS</div><h3>Candidate observations</h3><p>{results.length} matching months · newest first</p></div><Explain label="Explain detection results">The displayed σ value is the indicator's Z-score: how many standard deviations the observation is from its month-specific reference. Positive and negative signs indicate above- and below-baseline values.</Explain></div>
      <div className="result-list">{results.map(r=><button key={r.date} className={`result-item ${active?.date===r.date?"selected":""}`} onClick={()=>setSelected(r.date)}><div className="result-date"><b>{r.date}</b><small>{r.count} flagged</small></div><div className="result-tags">{r.flags.map(f=><span key={f.id} style={{"--tag":f.color}}>{f.label==="Land Surface Temperature"?"LST":f.id.toUpperCase()} <b>{f.z>0?"+":""}{fmt(f.z,2)}σ</b></span>)}</div><ChevronRight size={16}/></button>)}
      {results.length===0&&<EmptyState title="No matching observations" message="Try a lower threshold, another year, or a different indicator selection."/>}</div></section>
      <section className="panel glass detail-panel"><div className="panel-head"><div><div className="eyebrow">OBSERVATION DETAILS</div><h3>{active?active.date:"Select a result"}</h3><p>Values compared with the month-specific baseline</p></div><Explain label="Explain observation details">Observed is the recorded measurement, baseline is the reference value for that calendar month, and anomaly is observed minus baseline. The Z-score expresses the anomaly relative to historical variability.</Explain></div>
        {active?<><div className="detail-flags">{active.flags.map(f=><div className="detail-flag" key={f.id}><div className="detail-flag-head"><span style={{color:f.color}}>{f.label}</span><b className={f.z>=0?"positive":"negative"}>{f.z>0?"+":""}{fmt(f.z,2)}σ</b></div><div className="detail-values"><div><small>OBSERVED</small><b>{fmt(f.value,f.id==="ndvi"?4:2)} <i>{f.unit}</i></b></div><div><small>BASELINE</small><b>{fmt(f.baseline,f.id==="ndvi"?4:2)} <i>{f.unit}</i></b></div><div><small>ANOMALY</small><b>{f.anomaly>0?"+":""}{fmt(f.anomaly,3)} <i>{f.unit}</i></b></div></div></div>)}</div><div className="interpretation"><Info size={16}/><p>This is a statistical screening candidate, not a confirmed climate event. Simultaneous anomalies do not establish causation. Interpret Z-scores alongside absolute anomalies, especially when historical variability is very small.</p></div></>:<EmptyState title="Choose an observation" message="Select a candidate month to inspect its measurements and anomalies."/>}</section></div>
  </div>;
}

function ClimateFingerprint() {
  const [monthly, setMonthly] = useState([]);
  const [fingerprints, setFingerprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState("");
  const [comparison, setComparison] = useState("");
  const [indicator, setIndicator] = useState("rainfall");

  useEffect(() => {
    let cancelled = false;

    async function fetchRegionalData() {
      setLoading(true);
      setError("");

      try {
        const [monthlyData, fingerprintData] =
          await Promise.all([
            loadGovernorateMonthlyData(),
            loadClimateFingerprintData()
          ]);

        if (cancelled) return;

        setMonthly(monthlyData);
        setFingerprints(fingerprintData);

        const names = fingerprintData
          .map((item) => item.governorate)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (names.length) {
          setSelected(names[0]);
          setComparison(names.length > 1 ? names[1] : "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load regional data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRegionalData();

    return () => {
      cancelled = true;
    };
  }, []);

  const governorates = useMemo(
    () =>
      fingerprints
        .map((item) => item.governorate)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [fingerprints]
  );

  const selectedProfile = fingerprints.find(
    (item) => item.governorate === selected
  );

  const comparisonProfile = fingerprints.find(
    (item) => item.governorate === comparison
  );

  const selectedMonthly = useMemo(
    () =>
      monthly
        .filter((item) => item.governorate === selected)
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [monthly, selected]
  );

  const comparisonMonthly = useMemo(
    () =>
      monthly
        .filter((item) => item.governorate === comparison)
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [monthly, comparison]
  );

  const indicatorConfig = {
    rainfall: {
      label: "Rainfall",
      unit: "mm",
      average: "rainfall_mm_average",
      variability: "rainfall_mm_variability",
      unusual: "rainfall_mm_unusual_months_pct",
      monthly: "rainfall_mm",
      color: INDICATORS.rainfall.color,
      digits: 2
    },
    lst: {
      label: "Land Surface Temperature",
      unit: "°C",
      average: "lst_celsius_average",
      variability: "lst_celsius_variability",
      unusual: "lst_celsius_unusual_months_pct",
      monthly: "lst_celsius",
      color: INDICATORS.lst.color,
      digits: 2
    },
    ndvi: {
      label: "Vegetation Greenness (NDVI)",
      unit: "NDVI",
      average: "ndvi_mean_average",
      variability: "ndvi_mean_variability",
      unusual: "ndvi_mean_unusual_months_pct",
      monthly: "ndvi_mean",
      color: INDICATORS.ndvi.color,
      digits: 4
    }
  };

  const availableIndicators = Object.entries(indicatorConfig).filter(
    ([, item]) =>
      monthly.some((row) => row[item.monthly] != null) &&
      fingerprints.some((row) => row[item.average] != null)
  );
  const meta = indicatorConfig[indicator];

  const groupLabel = (value) => {
    if (value == null || value === "") return "Unclassified";

    const text = String(value);

    return /^\d+$/.test(text)
      ? `Climate Group ${text}`
      : text;
  };

  const selectedGroup = selectedProfile?.climate_group;
  const comparisonGroup = comparisonProfile?.climate_group;

  const chartData = useMemo(() => {
    const dates = [
      ...new Set([
        ...selectedMonthly.map((item) => item.date),
        ...comparisonMonthly.map((item) => item.date)
      ])
    ].sort();

    return dates.map((date) => {
      const first = selectedMonthly.find(
        (item) => item.date === date
      );

      const second = comparisonMonthly.find(
        (item) => item.date === date
      );

      return {
        label: monthLabel(String(date).slice(0, 7)),
        selectedValue: first?.[meta.monthly] ?? null,
        comparisonValue: second?.[meta.monthly] ?? null
      };
    });
  }, [selectedMonthly, comparisonMonthly, meta.monthly]);

  const groupCounts = useMemo(() => {
    const counts = {};

    fingerprints.forEach((item) => {
      const group = groupLabel(item.climate_group);
      counts[group] = (counts[group] || 0) + 1;
    });

    return Object.entries(counts).sort(
      (a, b) => a[0].localeCompare(b[0])
    );
  }, [fingerprints]);

  const selectedStats = selectedProfile
    ? {
        average: selectedProfile[meta.average],
        variability: selectedProfile[meta.variability],
        unusual: selectedProfile[meta.unusual]
      }
    : null;

  const comparisonStats = comparisonProfile
    ? {
        average: comparisonProfile[meta.average],
        variability: comparisonProfile[meta.variability],
        unusual: comparisonProfile[meta.unusual]
      }
    : null;

  const formatPercent = (value) =>
    value == null ? "—" : `${fmt(value, 1)}%`;

  if (loading) {
    return (
      <div className="page-stack">
        <SectionHeading
          eyebrow="REGIONAL ANALYSIS / 02"
          title="Climate Fingerprint"
          subtitle="Discover how environmental characteristics differ across Egypt's governorates."
        />
        <div className="loading-screen">
          <div className="loader" />
          <b>Loading governorate data</b>
          <p>Reading regional satellite observations and climate profiles…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <SectionHeading
          eyebrow="REGIONAL ANALYSIS / 02"
          title="Climate Fingerprint"
          subtitle="Explore environmental similarities and differences across Egypt."
        />
        <div className="panel glass">
          <EmptyState
            icon={Database}
            title="Regional data could not be loaded"
            message={error}
          />
          <div className="chart-note">
            <Info size={14} />
            Check that both regional CSV files are inside public/data
            and that their column names match the expected dataset schema.
          </div>
        </div>
      </div>
    );
  }

  if (!fingerprints.length || !monthly.length) {
    return (
      <div className="page-stack">
        <SectionHeading
          eyebrow="REGIONAL ANALYSIS / 02"
          title="Climate Fingerprint"
          subtitle="Explore environmental similarities and differences across Egypt."
        />
        <EmptyState
          title="No regional observations found"
          message="The regional CSV files loaded, but they contain no usable governorate records."
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="REGIONAL ANALYSIS / 02"
        title="Climate Fingerprint"
        subtitle="Compare environmental characteristics and discover similarities across Egypt's governorates."
        explanation="Compare long-term regional averages, variability, unusual-month frequency, and monthly histories. Climate groups are exploratory clusters from the supplied data, not official climate classifications."
        right={
          <span className="module-badge">
            <Layers3 size={14} /> REGIONAL DATA CONNECTED
          </span>
        }
      />

      <div className="metric-grid">
        <Metric
          icon={MapPin}
          label="GOVERNORATES"
          value={governorates.length}
          unit="regions"
          detail="Governorates in the fingerprint dataset"
          accent="#75b9ee"
        />
        <Metric
          icon={Database}
          label="MONTHLY RECORDS"
          value={monthly.length.toLocaleString()}
          unit="records"
          detail="Regional monthly observations"
          accent="#a99ae9"
        />
        <Metric
          icon={Layers3}
          label="CLIMATE GROUPS"
          value={groupCounts.length}
          unit="groups"
          detail="Groups supplied by the clustering dataset"
          accent="#7bc99b"
        />
        <Metric
          icon={Activity}
          label="INDICATORS"
          value={availableIndicators.length}
          unit="variables"
          detail="Regional variables with valid data"
          accent="#efad78"
        />
      </div>

      <div className="panel glass filter-panel">
        <div className="heading-actions"><div className="filter-title">
          <SlidersHorizontal size={16} />
          Regional comparison controls
        </div><Explain label="Explain regional comparison controls">Select a governorate, optionally choose another for comparison, and select one indicator. Monthly values and profile statistics update to the selected indicator.</Explain></div>

        <div className="filters">
          <Select
            label="FIRST GOVERNORATE"
            value={selected}
            onChange={setSelected}
          >
            {governorates.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>

          <Select
            label="COMPARE WITH"
            value={comparison}
            onChange={setComparison}
          >
            <option value="">No comparison</option>
            {governorates
              .filter((name) => name !== selected)
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </Select>

          <Select
            label="INDICATOR"
            value={indicator}
            onChange={setIndicator}
          >
            {Object.entries(indicatorConfig).map(([id, item]) => (
              <option
                key={id}
                value={id}
                disabled={!availableIndicators.some(([availableId]) => availableId === id)}
              >
                {item.label}{availableIndicators.some(([availableId]) => availableId === id) ? "" : " — no regional data"}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel glass">
          <div className="panel-head">
            <div>
              <div className="eyebrow">SELECTED REGION</div>
              <h3>{selected || "Governorate profile"}</h3>
              <p>Regional environmental fingerprint</p>
            </div>
            <MapPin size={18} className="muted-icon" />
          </div>

          <div className="regional-profile">
            <div className="profile-group">
              <span>CLIMATE GROUP</span>
              <b>{groupLabel(selectedGroup)}</b>
              <Explain label="Explain climate group">This is the cluster assigned in the processed fingerprint dataset. It describes similarity within the analysis and is not an official climate zone.</Explain>
            </div>

            {Object.entries(indicatorConfig).map(([id, item]) => (
              <div className="planned-row" key={id}>
                <span
                  className="planned-dot"
                  style={{ background: item.color }}
                />
                <div>
                  <b>{item.label}</b>
                  <small>
                    Average:{" "}
                    {fmt(selectedProfile?.[item.average], item.digits)}{" "}
                    {item.unit}
                  </small>
                </div>
                <Explain label={`Explain ${item.label}`}>Regional mean from the climate fingerprint dataset for {item.label}. The monthly time series and regional profile use the same supplied records but summarize them differently.</Explain>
                <span className={`status-tag ${selectedProfile?.[item.average] == null ? "unavailable" : ""}`}>
                  {selectedProfile?.[item.average] == null ? "NO DATA" : "AVAILABLE"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel glass">
          <div className="panel-head">
            <div>
              <div className="eyebrow">COMPARISON REGION</div>
              <h3>{comparison || "No comparison selected"}</h3>
              <p>Compare its climate profile with the selected region</p>
            </div>
            <Layers3 size={18} className="muted-icon" />
          </div>

          {comparisonProfile ? (
            <>
              <div className="profile-group">
                <span>CLIMATE GROUP</span>
                <b>{groupLabel(comparisonGroup)}</b>
                <Explain label="Explain climate group">This is the cluster assigned in the processed fingerprint dataset. It describes similarity within the analysis and is not an official climate zone.</Explain>
              </div>

              {Object.entries(indicatorConfig).map(([id, item]) => (
                <div className="planned-row" key={id}>
                  <span
                    className="planned-dot"
                    style={{ background: item.color }}
                  />
                  <div>
                    <b>{item.label}</b>
                    <small>
                      Average:{" "}
                      {fmt(comparisonProfile[item.average], item.digits)}{" "}
                      {item.unit}
                    </small>
                  </div>
                  <Explain label={`Explain ${item.label}`}>Regional mean from the climate fingerprint dataset for {item.label}. The monthly time series and regional profile use the same supplied records but summarize them differently.</Explain>
                  <span className={`status-tag ${comparisonProfile[item.average] == null ? "unavailable" : ""}`}>
                    {comparisonProfile[item.average] == null ? "NO DATA" : "AVAILABLE"}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <EmptyState
              title="Choose a second governorate"
              message="Select another region above to compare its environmental characteristics."
            />
          )}
        </section>
      </div>

      <section className="panel glass">
        <div className="panel-head">
          <div>
            <div className="eyebrow">ENVIRONMENTAL COMPARISON</div>
            <h3>{meta.label} profile</h3>
            <p>
              Regional average, variability, and unusual-month frequency
            </p>
          </div>
          <div className="heading-actions"><Explain label={`Explain ${meta.label} profile`}>Average is the regional mean, variability describes the spread of monthly observations, and unusual months is the percentage marked unusual by the supplied analysis.</Explain><span className="unit-chip">{meta.unit}</span></div>
        </div>

        <div className="metric-grid three">
          <Metric
            icon={Activity}
            label={`${selected || "FIRST"} · AVERAGE`}
            value={fmt(selectedStats?.average, meta.digits)}
            unit={meta.unit}
            detail="Regional mean"
            accent={meta.color}
          />

          <Metric
            icon={Waves}
            label="VARIABILITY"
            value={fmt(selectedStats?.variability, meta.digits)}
            unit={meta.unit}
            detail="Regional variability measure"
            accent="#a99ae9"
          />

          <Metric
            icon={AlertTriangle}
            label="UNUSUAL MONTHS"
            value={formatPercent(selectedStats?.unusual)}
            unit=""
            detail="Percentage of unusual observations"
            accent="#efad78"
          />
        </div>

        {comparisonStats && (
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>MEASURE</th>
                  <th>{selected}</th>
                  <th>{comparison}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Average ({meta.unit})</td>
                  <td>{fmt(selectedStats.average, meta.digits)}</td>
                  <td>{fmt(comparisonStats.average, meta.digits)}</td>
                </tr>
                <tr>
                  <td>Variability ({meta.unit})</td>
                  <td>{fmt(selectedStats.variability, meta.digits)}</td>
                  <td>{fmt(comparisonStats.variability, meta.digits)}</td>
                </tr>
                <tr>
                  <td>Unusual months</td>
                  <td>{formatPercent(selectedStats.unusual)}</td>
                  <td>{formatPercent(comparisonStats.unusual)}</td>
                </tr>
                <tr>
                  <td>Climate group</td>
                  <td>{groupLabel(selectedGroup)}</td>
                  <td>{groupLabel(comparisonGroup)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <div>
            <div className="eyebrow">MONTHLY REGIONAL HISTORY</div>
            <h3>{meta.label} over time</h3>
            <p>
              Monthly observations for the selected governorates
            </p>
          </div>
          <div className="heading-actions"><Explain label={`Explain ${meta.label} history`}>The lines show monthly observations for the selected governorate or governorates. Gaps indicate missing values; each value is in {meta.unit}.</Explain><span className="unit-chip">{meta.unit}</span></div>
        </div>

        {chartData.length ? (
          <div className="chart-wrap" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 15, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="var(--grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "var(--muted)",
                    fontSize: 10
                  }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={35}
                />
                <YAxis
                  tick={{
                    fill: "var(--muted)",
                    fontSize: 11
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />

                <Line
                  dataKey="selectedValue"
                  name={selected}
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />

                {comparison && (
                  <Line
                    dataKey="comparisonValue"
                    name={comparison}
                    stroke="#a99ae9"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No monthly observations"
            message="There are no monthly records for this selection."
          />
        )}

        <div className="chart-note">
          <Info size={14} />
          Rainfall, LST, and NDVI are different environmental indicators.
          Compare them separately because their units and scales differ.
        </div>
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <div>
            <div className="eyebrow">CLIMATE CLASSIFICATION</div>
            <h3>Governorate climate groups</h3>
            <p>
              Group membership from the processed fingerprint dataset
            </p>
          </div>
          <Explain label="Explain climate groups">The counts and member lists come from the supplied clustering dataset. Groups indicate similarity in the variables used for clustering and should not be treated as official zones.</Explain>
        </div>

        <div className="cluster-steps">
          {groupCounts.map(([group, count]) => {
            const members = fingerprints
              .filter(
                (item) => groupLabel(item.climate_group) === group
              )
              .map((item) => item.governorate)
              .sort((a, b) => a.localeCompare(b));

            return (
              <div key={group}>
                <span>{count}</span>
                <p>
                  <b>{group}</b>
                  <br />
                  {members.join(" · ")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="chart-note">
          <Info size={14} />
          These groups represent similarity in the variables used by
          your clustering analysis. They are exploratory groups, not
          official Egyptian climate zones.
        </div>
      </section>

      <div className="source-strip">
        <span><Database size={15} /> REGIONAL DATA</span>
        <b>NASA GPM IMERG · MODIS MOD11A2 · MODIS MOD13Q1</b>
        <span className="source-period">
          {governorates.length} governorates
        </span>
      </div>
    </div>
  );
}

function ClimateTimeline({rows}) {
  const [indicator,setIndicator]=useState("rainfall"),[start,setStart]=useState(rows[0]?.date.slice(0,4)||"2001"),[end,setEnd]=useState(rows.at(-1)?.date.slice(0,4)||"2024");
  const meta=INDICATORS[indicator], filtered=rows.filter(r=>Number(r.date.slice(0,4))>=Number(start)&&Number(r.date.slice(0,4))<=Number(end));
  const chartData=filtered.map(r=>({label:monthLabel(r.date),value:r[meta.value],baseline:r[meta.baseline]}));
  const anomalyStats=calcStats(filtered,meta.anomaly);
  const years=[...new Set(rows.map(r=>r.date.slice(0,4)))];
  return <div className="page-stack"><SectionHeading eyebrow="HISTORICAL EXPLORATION / 03" title="Climate Timeline" subtitle="Explore how environmental observations and anomalies evolved from 2001 to 2024." explanation="Filter the national monthly dataset by indicator and inclusive year range. The baseline uses the corresponding calendar month from the supplied 2001–2020 reference period."/>
    <div className="panel glass filter-panel"><div className="heading-actions"><div className="filter-title"><SlidersHorizontal size={16}/> Timeline controls</div><Explain label="Explain timeline controls">Choose an indicator, a starting year, and an ending year. The charts and statistics below use only records inside that inclusive range.</Explain></div><div className="filters"><Select label="INDICATOR" value={indicator} onChange={setIndicator}><option value="rainfall">Rainfall</option><option value="lst">Land Surface Temperature</option><option value="ndvi">NDVI</option></Select><Select label="FROM YEAR" value={start} onChange={setStart}>{years.map(y=><option key={y}>{y}</option>)}</Select><Select label="TO YEAR" value={end} onChange={setEnd}>{years.filter(y=>Number(y)>=Number(start)).map(y=><option key={y}>{y}</option>)}</Select></div></div>
    <div className="metric-grid three"><Metric icon={CalendarDays} label="OBSERVATIONS" value={filtered.length} unit="months" detail={`${start} to ${end}`} explanation="Number of monthly records in the selected indicator and year range." accent="#75b9ee"/><Metric icon={Activity} label="MEAN ANOMALY" value={fmt(anomalyStats?.mean,3)} unit={meta.unit} detail="Average signed anomaly in selected period" explanation="Average of observed-minus-baseline anomalies. Positive and negative values can offset one another." accent="#a99ae9"/><Metric icon={TrendingUp} label="ANOMALY RANGE" value={anomalyStats?`${fmt(anomalyStats.min,2)} to ${fmt(anomalyStats.max,2)}`:"—"} unit={meta.unit} detail="Minimum to maximum anomaly" explanation="Smallest and largest observed-minus-baseline anomalies in the selected period." accent="#7bc99b"/></div>
    <section className="panel glass"><div className="panel-head"><div><div className="eyebrow">OBSERVED VALUES</div><h3>{meta.label} over time</h3><p>Monthly satellite-derived measurements and month-specific baseline</p></div><div className="heading-actions"><Explain label={`Explain ${meta.label} chart`}>Observed values are compared with the dashed month-specific baseline. The y-axis and tooltip use {meta.unit}. Missing observations appear as gaps.</Explain><span className="unit-chip">{meta.unit}</span></div></div><div className="legend-row"><span><i style={{background:meta.color}}/>Observed</span><span><i style={{background:"var(--muted)"}}/>Baseline</span></div><div className="chart-wrap" style={{height:330}}><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:12,right:15,left:0,bottom:4}}><CartesianGrid stroke="var(--grid)" vertical={false}/><XAxis dataKey="label" tick={{fill:"var(--muted)",fontSize:11}} tickLine={false} axisLine={false} minTickGap={30}/><YAxis tick={{fill:"var(--muted)",fontSize:11}} tickLine={false} axisLine={false} width={55}/><Tooltip content={<ChartTooltip/>}/><Line dataKey="value" name="Observed" stroke={meta.color} strokeWidth={1.8} dot={false}/><Line dataKey="baseline" name="Baseline" stroke="var(--muted)" strokeDasharray="5 5" strokeWidth={1.5} dot={false}/></LineChart></ResponsiveContainer></div></section>
    <section className="panel glass"><div className="panel-head"><div><div className="eyebrow">DEVIATION FROM BASELINE</div><h3>{meta.label} anomaly timeline</h3><p>Positive values are above baseline; negative values are below baseline.</p></div><Explain label="Explain the anomaly timeline">Each bar is an observed value minus its month-specific baseline. Bars above zero are higher than baseline and bars below zero are lower.</Explain></div><AnomalyChart rows={filtered} meta={meta}/></section>
    <div className="chart-note"><Info size={14}/> The baseline is month-specific (2001–2020). These charts describe the supplied dataset; trend significance requires a separate statistical test.</div>
  </div>;
}
function FutureSimulator({rows}) {
  const [rainDelta,setRainDelta]=useState(0),[tempDelta,setTempDelta]=useState(0),[ndviDelta,setNdviDelta]=useState(0);
  const baseline=useMemo(()=>({rain:calcStats(rows,"rainfall_mm")?.mean||0,lst:calcStats(rows,"lst_celsius")?.mean||0,ndvi:calcStats(rows,"ndvi_mean")?.mean||0}),[rows]);
  const reset=()=>{setRainDelta(0);setTempDelta(0);setNdviDelta(0)};
  const scenarios=[{label:"Reference",rain:0,temp:0,ndvi:0},{label:"Warmer / drier",rain:-15,temp:2,ndvi:-.02},{label:"Warmer / wetter",rain:15,temp:2,ndvi:.01}];
  return <div className="page-stack"><SectionHeading eyebrow="SCENARIO LAB / 04" title="Future Simulator" subtitle="Explore hypothetical changes to environmental variables. This is a scenario calculator, not a climate forecast." explanation="This tool performs arithmetic adjustments to historical means. It does not simulate climate physics, emissions, or the causal relationship among rainfall, temperature, and vegetation." right={<span className="module-badge pending"><Sparkles size={14}/> EXPLORATORY</span>}/>
    <div className="hero-callout warning"><div className="callout-icon"><CircleHelp size={22}/></div><div><b>Explore assumptions, not predictions.</b><p>The controls apply user-selected changes to historical average values. They do not model physical climate processes, future emissions, or validated vegetation responses. Outputs must not be interpreted as official projections.</p></div></div>
    <div className="content-grid simulator-grid"><section className="panel glass"><div className="panel-head"><div><div className="eyebrow">SCENARIO INPUTS</div><h3>Adjust environmental assumptions</h3><p>Changes are relative to the dataset's historical mean.</p></div><div className="heading-actions"><Explain label="Explain scenario inputs">Each slider sets an independent adjustment to its indicator's full-record historical mean. It does not model relationships among indicators or predict a future outcome.</Explain><button className="text-link" onClick={reset}><RefreshCw size={14}/> Reset</button></div></div>
      <div className="slider-control"><div className="slider-label"><span><Droplets size={17}/> Rainfall change</span><b>{rainDelta>0?"+":""}{rainDelta}%</b><Explain label="Explain rainfall adjustment">Changes the historical mean rainfall by the selected percentage. The displayed value is calculated arithmetically.</Explain></div><input type="range" min="-50" max="50" step="5" value={rainDelta} onChange={e=>setRainDelta(Number(e.target.value))}/><div className="range-labels"><span>−50%</span><span>0%</span><span>+50%</span></div></div>
      <div className="slider-control"><div className="slider-label"><span><ThermometerSun size={17}/> LST change</span><b>{tempDelta>0?"+":""}{tempDelta.toFixed(1)} °C</b><Explain label="Explain temperature adjustment">Adds the selected temperature change in degrees Celsius to the historical mean land surface temperature.</Explain></div><input type="range" min="-3" max="5" step=".5" value={tempDelta} onChange={e=>setTempDelta(Number(e.target.value))}/><div className="range-labels"><span>−3 °C</span><span>0 °C</span><span>+5 °C</span></div></div>
      <div className="slider-control"><div className="slider-label"><span><Leaf size={17}/> NDVI adjustment</span><b>{ndviDelta>0?"+":""}{ndviDelta.toFixed(3)}</b><Explain label="Explain NDVI adjustment">Adds the selected NDVI adjustment to the historical mean. NDVI is a dimensionless index of vegetation greenness.</Explain></div><input type="range" min="-.05" max=".05" step=".005" value={ndviDelta} onChange={e=>setNdviDelta(Number(e.target.value))}/><div className="range-labels"><span>−0.05</span><span>0</span><span>+0.05</span></div></div>
    </section><section className="panel glass"><div className="panel-head"><div><div className="eyebrow">CALCULATED SCENARIO</div><h3>Adjusted reference values</h3><p>Arithmetic outputs from your selected assumptions</p></div><Explain label="Explain calculated scenario">Reference values are means across the full loaded dataset. Adjusted rainfall is base × (1 + percent change); temperature and NDVI use addition. These are illustrative arithmetic results, not projections.</Explain></div>
      <div className="scenario-results">{[{label:"Rainfall",base:baseline.rain,result:baseline.rain*(1+rainDelta/100),unit:"mm",digits:2},{label:"Land Surface Temperature",base:baseline.lst,result:baseline.lst+tempDelta,unit:"°C",digits:2},{label:"NDVI",base:baseline.ndvi,result:baseline.ndvi+ndviDelta,unit:"",digits:4}].map(x=><div className="scenario-result" key={x.label}><span>{x.label}</span><div><small>REFERENCE {fmt(x.base,x.digits)} {x.unit}</small><b>{fmt(x.result,x.digits)} <i>{x.unit}</i></b></div></div>)}</div>
      <div className="scenario-disclaimer"><Info size={15}/> These are independent arithmetic adjustments. No causal relationship between rainfall, temperature, and NDVI is assumed.</div>
    </section></div>
    <section className="panel glass"><div className="panel-head"><div><div className="eyebrow">STARTING POINTS</div><h3>Example scenarios</h3><p>Load a preset to explore different assumptions.</p></div><Explain label="Explain example scenarios">Presets are example combinations of slider values only. They are not forecasts, recommended scenarios, or statements about future conditions.</Explain></div><div className="preset-grid">{scenarios.map(s=><button className="preset" key={s.label} onClick={()=>{setRainDelta(s.rain);setTempDelta(s.temp);setNdviDelta(s.ndvi)}}><b>{s.label}</b><small>Rainfall {s.rain>0?"+":""}{s.rain}% · LST {s.temp>0?"+":""}{s.temp}°C · NDVI {s.ndvi>0?"+":""}{s.ndvi}</small><span>Load scenario <ArrowUpRight size={13}/></span></button>)}</div></section>
  </div>;
}
function AboutEarthScope({ rows }) {
  const modules = [
    ["Overview", "Start with national monthly trends, the latest indicator readings, recent anomaly candidates, and the interactive governorate map."],
    ["Anomaly Detective", "Screen monthly observations using an indicator, year, and Z-score threshold. Flagged values are candidates for further investigation, not confirmed events."],
    ["Climate Fingerprint", "Compare governorate averages, variability, unusual-month percentages, monthly histories, and exploratory climate groups."],
    ["Climate Timeline", "Follow one national indicator over time and compare observations with the month-specific baseline."],
    ["Future Simulator", "Try arithmetic changes to historical averages. This is a scenario calculator, not a forecast."]
  ];

  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="ABOUT THIS WORKSPACE"
        title="About EarthScope"
        subtitle="A guide to the website, its data, and how to interpret what you see."
        explanation="EarthScope is an exploratory dashboard for examining the supplied Egypt environmental observation datasets. It helps users inspect patterns; it does not make official climate assessments or predictions."
      />

      <section className="panel glass about-intro">
        <div className="eyebrow">WHAT EARTHSCOPE DOES</div>
        <h3>Explore environmental observations, not just numbers.</h3>
        <p>
          EarthScope brings monthly rainfall, land surface temperature (LST),
          and vegetation greenness (NDVI) together in one workspace. Use its
          charts and regional comparisons to spot patterns, examine unusual
          months, and understand the limits of the available data.
        </p>
        <div className="about-dataset-facts">
          <div><span>National records</span><b>{rows.length.toLocaleString()} months</b></div>
          <div><span>Coverage</span><b>{rows[0]?.date?.slice(0, 4) || "—"}–{rows.at(-1)?.date?.slice(0, 4) || "—"}</b></div>
          <div><span>Core indicators</span><b>Rainfall · LST · NDVI</b></div>
        </div>
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <div><div className="eyebrow">HOW TO USE IT</div><h3>Choose a workspace</h3></div>
          <Explain label="Explain the workspace navigation">Use the sidebar to move between the overview and focused analysis tools. Your theme preference is stored in this browser.</Explain>
        </div>
        <div className="about-module-list">
          {modules.map(([title, description], index) => (
            <div className="about-module" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><b>{title}</b><p>{description}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <div><div className="eyebrow">DATA GUIDE</div><h3>What each indicator means</h3></div>
          <Explain label="Explain the data guide">Indicator definitions describe the measured variable. The values and derived statistics are taken from the CSV files included with this project.</Explain>
        </div>
        <div className="about-indicator-grid">
          <article><Droplets size={18}/><h4>Rainfall</h4><p>Monthly precipitation in millimeters (mm). A baseline is the typical value for that calendar month in the 2001–2020 reference period.</p></article>
          <article><ThermometerSun size={18}/><h4>Land Surface Temperature</h4><p>The temperature of the land surface in degrees Celsius (°C); it is not the same as near-surface air temperature.</p></article>
          <article><Leaf size={18}/><h4>Vegetation Greenness (NDVI)</h4><p>A dimensionless satellite index related to vegetation greenness. Missing NDVI observations are possible and should not be read as zero.</p></article>
        </div>
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <div><div className="eyebrow">DATA PROVENANCE</div><h3>Explore the source products</h3></div>
          <Explain label="Explain data provenance">These references describe the Earth-observation products and the government-sourced administrative boundaries used by this project. The dashboard reads its included processed CSV files; it does not fetch or reprocess the satellite products.</Explain>
        </div>
        <div className="source-cards">
          <a href="https://gpm.nasa.gov/data/imerg" target="_blank" rel="noreferrer">
            <span>PRECIPITATION</span><b>NASA Global Precipitation Measurement (IMERG)</b><small>Product information <ArrowUpRight size={13}/></small>
          </a>
          <a href="https://lpdaac.usgs.gov/products/mod11a2v061/" target="_blank" rel="noreferrer">
            <span>LAND SURFACE TEMPERATURE</span><b>MODIS Terra MOD11A2</b><small>Product information <ArrowUpRight size={13}/></small>
          </a>
          <a href="https://lpdaac.usgs.gov/products/mod13q1v061/" target="_blank" rel="noreferrer">
            <span>VEGETATION INDEX</span><b>MODIS Terra MOD13Q1 (NDVI)</b><small>Product information <ArrowUpRight size={13}/></small>
          </a>
          <a href="https://data.humdata.org/dataset/cod-ab-egy" target="_blank" rel="noreferrer">
            <span>GOVERNORATE BOUNDARIES</span><b>Egypt CAPMAS · OCHA COD-AB</b><small>Boundary data &amp; CC BY-IGO attribution <ArrowUpRight size={13}/></small>
          </a>
        </div>
        <p className="source-method-note">The map uses the 27 Admin 1 governorate boundaries sourced from Egypt's CAPMAS and published by OCHA in the Common Operational Dataset (reviewed 19 Dec 2024; CC BY-IGO 3.0). Monthly baselines in the supplied observation datasets use a 2001–2020 reference period. Review the source files and processing metadata before reuse; this dashboard does not independently validate the upstream processing.</p>
      </section>

      <div className="content-grid about-grid">
        <section className="panel glass">
          <div className="panel-head"><div><div className="eyebrow">READING THE NUMBERS</div><h3>Baseline, anomaly, and Z-score</h3></div><Explain label="Explain statistical terms">Derived statistics summarize differences from reference conditions. Their meaning depends on the supplied data and method, and they do not establish causes.</Explain></div>
          <dl className="about-definitions">
            <div><dt>Baseline</dt><dd>A month-specific reference value.</dd></div>
            <div><dt>Anomaly</dt><dd>Observed value minus baseline, in the indicator's units.</dd></div>
            <div><dt>Z-score</dt><dd>Anomaly scaled by historical variability, expressed in standard deviations.</dd></div>
            <div><dt>Unusual months</dt><dd>Percentage of months flagged by the regional fingerprint analysis.</dd></div>
          </dl>
        </section>
        <section className="panel glass">
          <div className="panel-head"><div><div className="eyebrow">IMPORTANT LIMITS</div><h3>Use the data thoughtfully</h3></div><Explain label="Explain data limitations">The supplied data supports exploration and screening, not causal conclusions or official projections. Always review the source files and methodology before reusing a result.</Explain></div>
          <ul className="about-limits">
            <li>CSV files may contain missing observations; a missing value is not zero. Regional NDVI is currently unavailable in the included governorate files, while national NDVI is present.</li>
            <li>The map shows CAPMAS-sourced governorate polygons from OCHA COD-AB (Admin 1). It is an administrative map, not a cadastral or legal survey.</li>
            <li>Climate groups are exploratory clusters, not official Egyptian climate zones.</li>
            <li>The simulator uses arithmetic adjustments and is not a climate forecast.</li>
            <li>Anomalies and correlations do not prove a cause or establish statistical significance.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
function DataError({error,onRetry}) {
  return <div className="error-screen"><div className="error-icon"><Database size={26}/></div><div className="eyebrow">DATA CONNECTION REQUIRED</div><h2>EARTHSCOPE needs its master dataset.</h2><p>{error}</p><div className="setup-card"><b>How to connect your CSV</b><ol><li>Open the EARTHSCOPE project folder.</li><li>Open <code>public/data/</code>.</li><li>Place <code>earthscope_master_dataset_2001_2024.csv</code> inside that folder.</li><li>Restart the development server or select Retry.</li></ol></div><button className="primary-btn" onClick={onRetry}><RefreshCw size={16}/> Retry loading dataset</button></div>;
}
export default function App() {
  const [page,setPage]=useState("overview"),[theme,setTheme]=useState(()=>localStorage.getItem("earthscope-theme")||"dark");
  const [rows,setRows]=useState([]),[status,setStatus]=useState("loading"),[error,setError]=useState(""),[menuOpen,setMenuOpen]=useState(false);
  const fetchData=async()=>{setStatus("loading");setError("");try{const data=await loadDataset();setRows(data);setStatus("ready")}catch(e){setError(e.message);setStatus("error")}};
  useEffect(()=>{fetchData()},[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("earthscope-theme",theme)},[theme]);
  const content=useMemo(()=>{
    if(page==="overview")return <Overview rows={rows} setPage={setPage}/>;
    if(page==="anomalies")return <AnomalyDetective rows={rows}/>;
    if(page==="fingerprint")return <ClimateFingerprint/>;
    if(page==="timeline")return <ClimateTimeline rows={rows}/>;
    if(page==="simulator")return <FutureSimulator rows={rows}/>;
    return <AboutEarthScope rows={rows}/>;
  },[page,rows]);
  if(status==="error")return <DataError error={error} onRetry={fetchData}/>;
  return <div className="app-shell"><Sidebar page={page} setPage={setPage} open={menuOpen} setOpen={setMenuOpen}/>{menuOpen&&<button className="mobile-overlay" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"/>}
    <main className="main-area"><Topbar page={page} theme={theme} setTheme={setTheme} onMenu={()=>setMenuOpen(true)} dataStatus={status}/>{status==="loading"?<div className="loading-screen"><div className="loader"/><b>Loading Earth observation data</b><p>Reading the EARTHSCOPE monthly master dataset…</p></div>:<div className="page-container">{content}<footer className="app-footer"><span>EARTHSCOPE <i>·</i> EARTH SYSTEM TREND DETECTIVE</span><span>NASA-DERIVED DATA · EGYPT · 2001—2024</span></footer></div>}</main></div>;
}