"use client";

import type { BaziChart } from "@/features/bazi/engine/types";
import type { YijingResult } from "@/features/yijing/engine/types";
import type { InterpretationReport } from "@/lib/ai/schemas";

export type ArchiveKind = "bazi" | "yijing";

export type ArchiveItem = {
  id: string;
  kind: ArchiveKind;
  sourceId: string;
  name: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  payload: {
    chart?: BaziChart;
    yijingResult?: YijingResult;
    report: InterpretationReport;
  };
};

export type ArchiveDraft = Omit<ArchiveItem, "id" | "name" | "createdAt" | "updatedAt"> & {
  name?: string;
};

const STORAGE_KEY = "mystic:archives:v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createArchiveId() {
  return `ar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emitArchiveChange() {
  window.dispatchEvent(new CustomEvent("mystic-archive-change"));
}

export function readArchiveItems(): ArchiveItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as ArchiveItem[];
    return Array.isArray(items)
      ? items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : [];
  } catch {
    return [];
  }
}

function writeArchiveItems(items: ArchiveItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitArchiveChange();
}

export function saveArchiveItem(draft: ArchiveDraft): { item: ArchiveItem; updatedExisting: boolean } {
  const now = new Date().toISOString();
  const items = readArchiveItems();
  const existingIndex = items.findIndex((item) => item.kind === draft.kind && item.sourceId === draft.sourceId);

  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const item: ArchiveItem = {
      ...existing,
      ...draft,
      name: existing.name || draft.name || draft.title,
      updatedAt: now
    };
    const nextItems = [...items];
    nextItems[existingIndex] = item;
    writeArchiveItems(nextItems);
    return { item, updatedExisting: true };
  }

  const item: ArchiveItem = {
    ...draft,
    id: createArchiveId(),
    name: draft.name || draft.title,
    createdAt: now,
    updatedAt: now
  };
  writeArchiveItems([item, ...items]);
  return { item, updatedExisting: false };
}

export function renameArchiveItem(id: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return readArchiveItems();
  const now = new Date().toISOString();
  const items = readArchiveItems().map((item) => item.id === id ? { ...item, name: trimmedName, updatedAt: now } : item);
  writeArchiveItems(items);
  return items;
}

export function deleteArchiveItem(id: string) {
  const items = readArchiveItems().filter((item) => item.id !== id);
  writeArchiveItems(items);
  return items;
}

export function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
