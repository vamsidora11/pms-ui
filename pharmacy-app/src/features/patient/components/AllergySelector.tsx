import { useEffect, useRef } from "react";
import { X, Search as SearchIcon, Loader2 } from "lucide-react";
import clsx from "clsx";

import {
  useAllergySearch,
  type AllergySearchFn,
} from "../hooks/useAllergySearch";

type Props = {
  /** Text box value (search query) */
  query: string;
  /** Called when user types in search input */
  onQueryChange: (value: string) => void;

  /** Currently selected allergies (chips) */
  selected: string[];

  /** Add a selected suggestion to chips */
  onAdd: (value: string) => void;
  /** Remove chip */
  onRemove: (value: string) => void;

  /** Dependency-injected API function */
  searchFn: AllergySearchFn;

  /** Optional UI options */
  label?: string;
  placeholder?: string;

  /** Search tuning */
  minChars?: number;
  debounceMs?: number;
};

export default function AllergySelector({
  query,
  onQueryChange,
  selected,
  onAdd,
  onRemove,
  searchFn,
  label = "Allergies",
  placeholder = "Type to search allergy catalog (e.g., Aspirin, Penicillin)…",
  minChars = 2,
  debounceMs = 250,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const {
    suggestions,
    loading,
    error,
    open,
    setOpen,
    highlightIndex,
    setHighlightIndex,
  } = useAllergySearch({
    query,
    selected,
    searchFn,
    minChars,
    debounceMs,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [setOpen, setHighlightIndex]);

  const highlight = (labelText: string, q: string) => {
    const L = (labelText ?? "").toString();
    const Q = (q ?? "").toString();
    const idx = L.toLowerCase().indexOf(Q.toLowerCase());
    if (idx < 0) return L;
    return (
      <>
        {L.slice(0, idx)}
        <mark className="bg-yellow-100">{L.slice(idx, idx + Q.length)}</mark>
        {L.slice(idx + Q.length)}
      </>
    );
  };

  const handleSelectSuggestion = (value: string) => {
    onAdd(value);
    setOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef}>
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </label>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => {
                if (query.trim()) setOpen(true);
              }}
              onKeyDown={(e) => {
                if (!open) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightIndex((i) =>
                    Math.min(i + 1, suggestions.length - 1),
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (
                    highlightIndex >= 0 &&
                    highlightIndex < suggestions.length
                  ) {
                    handleSelectSuggestion(suggestions[highlightIndex]);
                  }
                } else if (e.key === "Escape") {
                  setOpen(false);
                  setHighlightIndex(-1);
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-64 overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                <Loader2 className="animate-spin" size={16} /> Searching…
              </div>
            )}

            {!loading && error && (
              <div className="px-3 py-2 text-red-600 text-sm">{error}</div>
            )}

            {!loading && !error && suggestions.length === 0 && (
              <div className="px-3 py-2 text-gray-500 text-sm">No matches.</div>
            )}

            {!loading &&
              !error &&
              suggestions.map((s, idx) => (
                <button
                  key={`${s}-${idx}`}
                  type="button"
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => handleSelectSuggestion(s)}
                  className={clsx(
                    "w-full text-left px-3 py-2 hover:bg-gray-50",
                    idx === highlightIndex && "bg-blue-50",
                  )}
                >
                  <div className="font-medium text-gray-900">
                    {highlight(s, query)}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {selected.map((a) => (
          <span
            key={a}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1"
            title={a}
          >
            {a}
            <button
              type="button"
              onClick={() => onRemove(a)}
              aria-label={`Remove ${a}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
