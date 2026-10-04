import { Field } from "./Input";
import { Action, IconButton } from "./Button";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaFolder,
  FaFileAlt,
  FaUser,
  FaTasks,
  FaSpinner,
} from "react-icons/fa";
import { api, apiMessage } from "../api/client";
const types = {
  project: "Loyiha",
  folder: "Papka",
  letter: "Xat",
  order: "Buyruq",
  task: "Vazifa",
  file: "Fayl",
  contract: "Shartnoma",
  expense: "Xarajat",
  user: "Xodim",
};
const icons = {
  project: FaFolder,
  folder: FaFolder,
  task: FaTasks,
  user: FaUser,
};
export function GlobalSearch() {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [rows, setRows] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [active, setActive] = useState(-1),
    ref = useRef(null),
    input = useRef(null),
    keyboard = useRef(false),
    id = useId(),
    navigate = useNavigate();
  const term = query.trim();
  useEffect(() => {
    setRows([]);
    setActive(-1);
    setError("");
    if (term.length < 2) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/api/search", {
          params: { q: term },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setRows(data.data || []);
      } catch (e) {
        if (!controller.signal.aborted) setError(apiMessage(e));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (keyboard.current && active >= 0)
      document
        .getElementById(`${id}-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, id]);
  const select = (row) => {
    setOpen(false);
    setQuery("");
    navigate(row.href);
  };
  const keys = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      input.current.blur();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      keyboard.current = true;
      setOpen(true);
      if (rows.length)
        setActive((i) =>
          e.key === "ArrowDown"
            ? (i + 1) % rows.length
            : i < 1
              ? rows.length - 1
              : i - 1,
        );
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (rows.length && !loading) select(rows[active < 0 ? 0 : active]);
      else setOpen(true);
    }
  };
  return (
    <div className={`global-search ${open ? "search-open" : ""}`} ref={ref}>
      <div className="global-search-field">
        <FaSearch aria-hidden="true" />
        <Field
          ref={input}
          role="combobox"
          aria-label="Umumiy qidiruv"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={id}
          aria-activedescendant={
            !open || active < 0 ? undefined : `${id}-${active}`
          }
          placeholder="Loyiha, hujjat yoki xodimni qidirish"
          value={query}
          onKeyDown={keys}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          autoComplete="off"
          maxLength={120}
        />
        {query && (
          <IconButton
            type="button"
            className="search-clear"
            aria-label="Qidiruvni tozalash"
            onClick={() => {
              setQuery("");
              input.current.focus();
            }}
          >
            <FaTimes />
          </IconButton>
        )}
      </div>
      {open && (
        <div className="global-search-results" id={id}>
          <div className="search-caption">
            Ish joyi bo'yicha qidiruv{" "}
            <span>{!loading && rows.length ? rows.length : ""}</span>
          </div>
          {term.length < 2 ? (
            <p className="search-feedback" role="status">
              Kamida 2 ta belgi kiriting.
            </p>
          ) : loading ? (
            <p className="search-feedback" role="status">
              <FaSpinner className="spin" /> Qidirilmoqda...
            </p>
          ) : error ? (
            <p className="search-feedback search-error" role="alert">
              {error}
            </p>
          ) : !rows.length ? (
            <p className="search-feedback" role="status">
              Hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring.
            </p>
          ) : (
            <div role="listbox" aria-label="Qidiruv natijalari">
              {rows.map((row, i) => {
                const Icon = icons[row.type] || FaFileAlt;
                return (
                  <Action
                    key={`${row.type}-${row.id}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    id={`${id}-${i}`}
                    aria-selected={i === active}
                    className="global-search-option"
                    onPointerMove={() => {
                      keyboard.current = false;
                      setActive(i);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(row)}
                  >
                    <span className="search-result-icon">
                      <Icon />
                    </span>
                    <span>
                      <strong>{row.title}</strong>
                      <small>
                        {types[row.type] || row.type}
                        {row.subtitle ? ` · ${row.subtitle}` : ""}
                      </small>
                    </span>
                  </Action>
                );
              })}
            </div>
          )}
          <div className="search-hint">
            ↑ ↓ Tanlash <span>Enter Ochish · Esc Yopish</span>
          </div>
        </div>
      )}
    </div>
  );
}
