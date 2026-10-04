import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaFolderOpen,
  FaSyncAlt,
  FaArrowRight,
  FaTimes,
} from "react-icons/fa";
import { api, apiMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Surface, Title, Meter, Badge } from "../components/DesignSystem";
import { Button, IconButton, Action } from "../components/Button";
import { Field, Select } from "../components/Input";
import { StatusBadge } from "../components/StatusBadge";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { AuthImage } from "../components/AuthImage";
import { Notice, Pagination } from "../components/Workspace";
import "../styles/analytics.css";

const count = (value) => new Intl.NumberFormat("uz-UZ").format(value);
const months = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];
const formattedDate = (value, includeTime = false) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tashkent",
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day} ${months[Number(parts.month) - 1]}${includeTime ? ` ${parts.hour}:${parts.minute}` : ""}`;
};
const date = (value) => formattedDate(value);
const timestamp = (value) => formattedDate(value, true);
const categoryNames = {
  general: "Umumiy",
  single: "Yakka tartibdagi",
  interior: "Interyer",
  "tex-obs": "Tex-obs",
  laboratory: "Laboratoriya",
  control: "Tashqi nazorat",
  render: "Rendr",
};
const actionNames = {
  create: "yaratdi",
  update: "yangiladi",
  upload: "fayl yukladi",
  download: "yuklab oldi",
  archive: "arxivladi",
  restore: "tikladi",
  avatar: "profil rasmini yangiladi",
  deactivate: "faolsizlantirdi",
};
const entityNames = {
  Project: "Loyiha",
  Task: "Vazifa",
  File: "Fayl",
  ProjectFolder: "Papka",
  Contract: "Shartnoma",
  Expense: "Xarajat",
  Letter: "Xat",
  Order: "Buyruq",
  User: "Xodim",
  Profile: "Profil",
  CompanySettings: "Kompaniya",
};

function ActivityChart({ rows, label }) {
  const [selection, setFocused] = useState(null),
    chartId = useId();
  const chart = useRef(null),
    [width, setWidth] = useState(640);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(chart.current);
    return () => observer.disconnect();
  }, []);
  const focused = rows.find((row) => row.date === selection?.date);
  const maximum = Math.max(1, ...rows.map((row) => row.count)),
    total = rows.reduce((sum, row) => sum + row.count, 0);
  const left = 36,
    plot = width - left - 12,
    step = plot / rows.length,
    baseline = 160;
  const ticks = [...new Set([0, Math.ceil(maximum / 2), maximum])];
  return (
    <div className="analytics-chart" ref={chart}>
      <div className="analytics-chart-value" role="status" aria-live="polite">
        {focused ? (
          <>
            <strong>{date(focused.date)}</strong>
            <span>{count(focused.count)} ta</span>
          </>
        ) : (
          <>
            <strong>{count(total)}</strong>
            <span>{label}</span>
          </>
        )}
      </div>
      {total ? (
        <svg
          viewBox={`0 0 ${width} 198`}
          role="img"
          aria-labelledby={chartId}
          className="analytics-chart-svg"
        >
          <title id={chartId}>
            {label}: {count(total)} ta, {rows.length} kun
          </title>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={width - 12}
                y1={baseline - (tick / maximum) * 132}
                y2={baseline - (tick / maximum) * 132}
                className="analytics-gridline"
              />
              <text
                x={left - 10}
                y={baseline - (tick / maximum) * 132 + 4}
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          ))}
          {rows.map((row, index) => (
            <rect
              key={row.date}
              x={left + index * step + 1}
              y={baseline - (row.count / maximum) * 132}
              width={Math.max(1, step - 2)}
              height={(row.count / maximum) * 132}
              rx={Math.min(3, step / 4)}
              tabIndex={row.count ? 0 : -1}
              aria-label={`${date(row.date)}: ${row.count} ta`}
              className="analytics-chart-bar"
              onFocus={() => setFocused(row)}
              onBlur={() => setFocused(null)}
              onPointerEnter={() => setFocused(row)}
              onPointerLeave={() => setFocused(null)}
            >
              <title>
                {date(row.date)}: {row.count} ta
              </title>
            </rect>
          ))}
          {[0, Math.floor((rows.length - 1) / 2), rows.length - 1].map(
            (index, n) => (
              <text
                key={index}
                x={left + index * step + step / 2}
                y={189}
                textAnchor={n === 0 ? "start" : n === 2 ? "end" : "middle"}
              >
                {date(rows[index].date)}
              </text>
            ),
          )}
        </svg>
      ) : (
        <div className="analytics-chart-empty">
          Tanlangan davrda ma’lumot qayd etilmagan.
        </div>
      )}
    </div>
  );
}
function ProjectPicker({ open, selected, onClose, onSelect }) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [result, setResult] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setResult(null);
    setError("");
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .get("/api/projects", {
          params: { search, page, limit: 12 },
          signal: controller.signal,
        })
        .then(({ data }) => setResult(data))
        .catch((e) => {
          if (!controller.signal.aborted) setError(apiMessage(e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, search, page]);
  return (
    <Modal open={open} title="Loyihani tanlash" onClose={onClose}>
      <div className="analytics-picker">
        <Field
          aria-label="Loyihani qidirish"
          placeholder="Loyiha nomi yoki manzili"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button variant="secondary" onClick={() => onSelect(null)}>
          Barcha loyihalar
        </Button>
        <Notice error={error} loading={loading} />
        {!loading && !error && (
          <div className="analytics-picker-list">
            {result?.data.length ? (
              result.data.map((row) => (
                <Action
                  key={row.id}
                  onClick={() => onSelect({ id: row.id, title: row.title })}
                  className="analytics-picker-row"
                  aria-pressed={selected?.id === row.id}
                >
                  <span>{row.title}</span>
                  <StatusBadge value={row.status} />
                </Action>
              ))
            ) : (
              <p className="analytics-empty">Loyiha topilmadi.</p>
            )}
          </div>
        )}
        <Pagination
          meta={result?.meta}
          page={page}
          onChange={setPage}
          loading={loading}
        />
      </div>
    </Modal>
  );
}

export default function Analytics() {
  const { hasRole } = useAuth();
  const [days, setDays] = useState("30"),
    [project, setProject] = useState(null),
    [picker, setPicker] = useState(false);
  const [page, setPage] = useState(1),
    [teamPage, setTeamPage] = useState(1),
    [activityPage, setActivityPage] = useState(1),
    [revision, setRevision] = useState(0);
  const [response, setResponse] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const key = JSON.stringify([days, project?.id, page, teamPage, activityPage]);
  const data = response?.key === key ? response.data : null;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .get("/api/analytics", {
        params: { days, project: project?.id, page, teamPage, activityPage },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) setResponse({ key, data });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(apiMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days, project?.id, page, teamPage, activityPage, key, revision]);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible")
        setRevision((value) => value + 1);
    };
    const interval = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const filterProject = (next) => {
    setProject(next);
    setPage(1);
    setTeamPage(1);
    setActivityPage(1);
    setPicker(false);
  };
  const refresh = () => setRevision((v) => v + 1);
  const summary = data?.summary;
  const cards = summary
    ? [
        {
          key: "open-projects",
          label: "Ochiq loyihalar",
          value: count(summary.openProjects),
          detail: `${count(summary.completedProjects)} tayyor · ${count(summary.projects)} jami`,
          Icon: FaFolderOpen,
        },
        {
          key: "completion",
          label: "Vazifalar bajarilishi",
          value: summary.completion === null ? "—" : `${summary.completion}%`,
          detail: `${count(summary.doneTasks)} / ${count(summary.tasks)} vazifa`,
          Icon: FaCheckCircle,
        },
        {
          key: "overdue",
          label: "Muddati o'tgan vazifalar",
          value: count(summary.overdueTasks),
          detail: `${count(summary.openTasks)} ochiq vazifa`,
          Icon: FaClock,
          danger: summary.overdueTasks > 0,
        },
        {
          key: "activity",
          label: data.meta.activityAvailable
            ? "Davrdagi amallar"
            : "Davrda yaratilgan loyihalar",
          value: count(
            data.meta.activityAvailable
              ? summary.periodActions
              : summary.createdProjects,
          ),
          detail: `${days} kun · Toshkent vaqti`,
          Icon: FaChartBar,
        },
      ]
    : [];
  return (
    <div className="analytics-page" aria-busy={loading}>
      <div className="page-heading">
        <Title>Analitika</Title>
        <div className={`analytics-controls ${project ? "has-project" : ""}`}>
          <Select
            label="Faollik davri"
            aria-label="Faollik davri"
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              setActivityPage(1);
            }}
          >
            <option value="7">Oxirgi 7 kun</option>
            <option value="30">Oxirgi 30 kun</option>
            <option value="90">Oxirgi 90 kun</option>
          </Select>
          <Button variant="secondary" onClick={() => setPicker(true)}>
            <FaFolderOpen />
            {project ? project.title : "Barcha loyihalar"}
          </Button>
          {project && (
            <IconButton
              aria-label="Loyiha filtrini tozalash"
              onClick={() => filterProject(null)}
            >
              <FaTimes />
            </IconButton>
          )}
          <IconButton
            aria-label="Analitikani yangilash"
            tooltip="Yangilash"
            onClick={refresh}
            disabled={loading}
          >
            <FaSyncAlt />
          </IconButton>
        </div>
      </div>
      <div className="analytics-context">
        <p>
          Holat va yuklama — hozirgi vazifalar bo'yicha. Davr filtri faollik
          grafigi va jurnal uchun.
        </p>
        {data && (
          <time dateTime={data.meta.generatedAt}>
            Yangilandi: {timestamp(data.meta.generatedAt)}
          </time>
        )}
      </div>
      <Notice loading={loading && !data} error={error} onRetry={refresh} />
      {data && !error && (
        <>
          <div className="analytics-kpis">
            {cards.map(({ key, label, value, detail, Icon, danger }) => (
              <Surface
                key={key}
                className={`analytics-kpi ${danger ? "analytics-kpi-warning" : ""}`}
                data-testid={`analytics-${key}`}
              >
                <div>
                  <p>{label}</p>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </div>
                <span className="analytics-kpi-icon">
                  <Icon />
                </span>
              </Surface>
            ))}
          </div>
          {summary.overdueTasks > 0 && (
            <Surface className="analytics-attention">
              <div className="analytics-section-heading">
                <h2>E’tibor talab qilmoqda</h2>
                <Link to="/tasks">
                  Vazifalarni ochish <FaArrowRight />
                </Link>
              </div>
              <div className="analytics-due-list">
                {data.overdue.map((row) => (
                  <Link key={row.id} to={`/tasks?record=${row.id}`}>
                    <span>
                      <strong>{row.title}</strong>
                      <small>{row.assignee || "Ijrochi belgilanmagan"}</small>
                    </span>
                    <time dateTime={row.dueDate}>{date(row.dueDate)}</time>
                  </Link>
                ))}
              </div>
            </Surface>
          )}
          <div className="analytics-overview">
            <Surface className="analytics-panel">
              <div className="analytics-section-heading">
                <h2>
                  {data.meta.activityAvailable
                    ? "Ish jarayoni faolligi"
                    : "Loyihalar yaratilishi"}
                </h2>
                <Badge>{days} kun</Badge>
              </div>
              <ActivityChart
                rows={data.timeline}
                label={
                  data.meta.activityAvailable
                    ? "qayd etilgan amal"
                    : "yaratilgan loyiha"
                }
              />
              <p className="analytics-caption">
                {data.meta.activityAvailable
                  ? "Yaratish, tahrirlash, fayl yuklash va arxiv amallari. Kirish/chiqish va yuklab olishlar hisoblanmaydi."
                  : "Sizga ochiq loyihalarning yaratilgan sanasi bo'yicha."}{" "}
                Bugungi kun hali tugamagan.
              </p>
            </Surface>
            <Surface className="analytics-panel">
              <div className="analytics-section-heading">
                <h2>Loyihalar holati</h2>
                <span>{count(summary.projects)} ta</span>
              </div>
              <div className="analytics-status-track" aria-hidden="true">
                {data.statuses
                  .filter((row) => row.count)
                  .map((row) => (
                    <span
                      key={row.status}
                      className={`analytics-status-fill analytics-status-${row.status}`}
                      style={{
                        width: `${(row.count / summary.projects) * 100}%`,
                      }}
                    />
                  ))}
              </div>
              <div className="analytics-status-list">
                {data.statuses.map((row) => (
                  <div key={row.status}>
                    <StatusBadge value={row.status} />
                    <strong>{count(row.count)}</strong>
                  </div>
                ))}
              </div>
              {data.categories.length > 0 && (
                <div className="analytics-categories">
                  {data.categories.map((row) => (
                    <span key={row.category}>
                      {categoryNames[row.category] || row.category}
                      <strong>{count(row.count)}</strong>
                    </span>
                  ))}
                </div>
              )}
            </Surface>
          </div>
          <section
            className="analytics-section"
            aria-labelledby="analytics-projects"
          >
            <div className="analytics-section-heading">
              <h2 id="analytics-projects">Loyihalar bo'yicha jarayon</h2>
              <span>{count(data.projects.meta.total)} ta</span>
            </div>
            <Table
              columns={[
                "Loyiha",
                "Holat",
                "Ijrochilar",
                "Vazifalar bajarilishi",
                "Kechikkan",
                "",
              ]}
              rows={data.projects.rows}
              empty="Tanlangan doirada loyihalar yo'q"
              renderRow={(row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      className="analytics-record-link"
                      to={`/projects?record=${row.id}`}
                    >
                      {row.title}
                    </Link>
                    <small className="analytics-cell-subtitle">
                      {categoryNames[row.category] || row.category}
                    </small>
                  </td>
                  <td>
                    <StatusBadge value={row.status} />
                  </td>
                  <td>
                    <div className="analytics-members">
                      {row.members.slice(0, 3).map((person) => (
                        <AuthImage
                          key={person.id}
                          src={person.avatar}
                          alt={person.name}
                          className="analytics-member-avatar"
                        />
                      ))}
                      <span>
                        {row.members.length
                          ? row.members.map((person) => person.name).join(", ")
                          : "Biriktirilmagan"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="analytics-progress">
                      {row.completion === null ? (
                        <span>Vazifalar yo'q</span>
                      ) : (
                        <>
                          <div>
                            <strong>{row.completion}%</strong>
                            <span>
                              {row.done} / {row.tasks}
                            </span>
                          </div>
                          <Meter
                            value={row.completion}
                            label={`${row.title}: vazifalar bajarilishi`}
                          />
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        row.overdue ? "analytics-late" : "analytics-muted"
                      }
                    >
                      {count(row.overdue)}
                    </span>
                  </td>
                  <td>
                    <IconButton
                      aria-label={`${row.title}: analitika`}
                      tooltip="Loyiha analitikasi"
                      onClick={() =>
                        filterProject({ id: row.id, title: row.title })
                      }
                    >
                      <FaChartBar />
                    </IconButton>
                  </td>
                </tr>
              )}
            />
            <Pagination
              meta={data.projects.meta}
              page={page}
              onChange={setPage}
              loading={loading}
            />
          </section>
          <section
            className="analytics-section"
            aria-labelledby="analytics-team"
          >
            <div className="analytics-section-heading">
              <h2 id="analytics-team">
                {data.meta.personal ? "Shaxsiy yuklama" : "Xodimlar yuklamasi"}
              </h2>
              <span>{count(data.team.meta.total)} xodim</span>
            </div>
            <Table
              columns={[
                "Xodim",
                "Loyihalar",
                "Ochiq vazifalar",
                "Kechikkan",
                "Bajarilgan",
              ]}
              rows={data.team.rows}
              empty="Ushbu doirada xodimlar biriktirilmagan"
              renderRow={(row) => (
                <tr key={row.id}>
                  <td>
                    <div className="analytics-person">
                      <AuthImage
                        src={row.avatar}
                        alt=""
                        className="analytics-person-avatar"
                      />
                      <div>
                        {hasRole("Admin") ? (
                          <Link to={`/users?record=${row.id}`}>{row.name}</Link>
                        ) : (
                          <strong>{row.name}</strong>
                        )}
                        <small>
                          {row.position ||
                            (row.active ? "Faol xodim" : "Faol emas")}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{count(row.projects)}</td>
                  <td>{count(row.open)}</td>
                  <td>
                    <span
                      className={
                        row.overdue ? "analytics-late" : "analytics-muted"
                      }
                    >
                      {count(row.overdue)}
                    </span>
                  </td>
                  <td>{count(row.done)}</td>
                </tr>
              )}
            />
            <Pagination
              meta={data.team.meta}
              page={teamPage}
              onChange={setTeamPage}
              loading={loading}
            />
            {summary.unassignedTasks > 0 && (
              <p className="analytics-caption">
                {count(summary.unassignedTasks)} ta ochiq vazifaga ijrochi
                belgilanmagan.
              </p>
            )}
          </section>
          <Surface className="analytics-panel">
            <div className="analytics-section-heading">
              <h2>Oxirgi amallar</h2>
              {data.activity && (
                <span>{count(data.activity.meta.total)} amal</span>
              )}
            </div>
            {!data.meta.activityAvailable ? (
              <p className="analytics-empty">
                Xodimlar amallari jurnali faqat Owner uchun ochiq.
              </p>
            ) : !data.activity.rows.length ? (
              <p className="analytics-empty">
                Tanlangan davrda amallar qayd etilmagan.
              </p>
            ) : (
              <ol className="analytics-feed">
                {data.activity.rows.map((row) => (
                  <li key={row.id}>
                    <AuthImage
                      src={row.actor.avatar}
                      alt=""
                      className="analytics-person-avatar"
                    />
                    <div>
                      <p>
                        <strong>{row.actor.name}</strong>{" "}
                        {actionNames[row.action] || row.action}
                      </p>
                      <div className="analytics-feed-record">
                        <span>{entityNames[row.entity] || row.entity}</span>
                        {row.title &&
                          (row.href ? (
                            <Link to={row.href}>{row.title}</Link>
                          ) : (
                            <span>{row.title}</span>
                          ))}
                      </div>
                    </div>
                    <time dateTime={row.time}>{timestamp(row.time)}</time>
                  </li>
                ))}
              </ol>
            )}
            {data.activity && (
              <Pagination
                meta={data.activity.meta}
                page={activityPage}
                onChange={setActivityPage}
                loading={loading}
              />
            )}
          </Surface>
          <details className="analytics-methods">
            <summary>Ko'rsatkichlar qanday hisoblanadi</summary>
            <p>
              Bajarilish foizi = bajarilgan / jami arxivlanmagan vazifalar.
              Vazifa bo'lmasa foiz berilmaydi. Muddatli vazifa Toshkent vaqti
              bo'yicha sanasi o'tgach kechikkan hisoblanadi.
            </p>
            <p>
              Loyihalar soni — o'chirilmagan yozuvlar; «Arxiv» holati alohida
              ko'rsatiladi. Faollik — tanlangan davrda qayd etilgan amallar
              soni, ishlangan soatlar yoki samaradorlik bahosi emas. Barcha
              qiymatlar sizga berilgan ruxsatlar va loyiha filtri doirasida
              hisoblanadi.
            </p>
          </details>
        </>
      )}
      <ProjectPicker
        open={picker}
        selected={project}
        onClose={() => setPicker(false)}
        onSelect={filterProject}
      />
    </div>
  );
}
