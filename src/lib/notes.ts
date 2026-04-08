import type { CollectionEntry } from "astro:content";

export type NoteEntry = CollectionEntry<"notes">;
type DateValue = Date | string | undefined;

export type SidebarFolderNode = {
  kind: "folder";
  name: string;
  path: string;
  children: SidebarNode[];
};

export type SidebarNoteNode = {
  kind: "note";
  name: string;
  path: string;
  url: string;
  date: DateValue;
};

export type SidebarNode = SidebarFolderNode | SidebarNoteNode;

function compareText(a: string, b: string) {
  return a.localeCompare(b, "zh-CN", {
    numeric: true,
    sensitivity: "base",
  });
}

function toDate(value: DateValue) {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function compareDatesDesc(a: DateValue, b: DateValue) {
  return (toDate(b)?.getTime() ?? Number.NEGATIVE_INFINITY) -
    (toDate(a)?.getTime() ?? Number.NEGATIVE_INFINITY);
}

function compareNotes(a: NoteEntry, b: NoteEntry) {
  return compareDatesDesc(a.data.date, b.data.date) || compareText(getNoteTitle(a), getNoteTitle(b));
}

export function normalizeNoteId(id: string) {
  return id.replace(/\\/g, "/").replace(/\.(md|markdown)$/i, "");
}

export function noteUrlFromId(id: string) {
  const segments = normalizeNoteId(id)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));

  return `/notes/${segments.join("/")}`;
}

export function getNoteTitle(note: Pick<NoteEntry, "id" | "data"> | string) {
  const id = typeof note === "string" ? note : note.id;
  const rawTitle = typeof note === "string" ? undefined : note.data.title;

  if (rawTitle?.trim()) {
    return rawTitle.trim();
  }

  const fallback = normalizeNoteId(id).split("/").pop() ?? "Untitled";
  return fallback.replace(/[-_]/g, " ");
}

export function getNoteFolderPath(id: string) {
  const parts = normalizeNoteId(id).split("/");
  parts.pop();
  return parts.join("/");
}

export function getNoteFolderLabel(id: string) {
  const folderPath = getNoteFolderPath(id);
  return folderPath || "顶层";
}

export function buildSidebarTree(entries: NoteEntry[]) {
  const root: SidebarFolderNode = {
    kind: "folder",
    name: "",
    path: "",
    children: [],
  };
  const folders = new Map<string, SidebarFolderNode>([["", root]]);

  for (const entry of entries) {
    const notePath = normalizeNoteId(entry.id);
    const parts = notePath.split("/");
    parts.pop();

    let currentFolder = root;
    let folderPath = "";

    for (const part of parts) {
      folderPath = folderPath ? `${folderPath}/${part}` : part;
      let folder = folders.get(folderPath);

      if (!folder) {
        folder = {
          kind: "folder",
          name: part.replace(/[-_]/g, " "),
          path: folderPath,
          children: [],
        };
        folders.set(folderPath, folder);
        currentFolder.children.push(folder);
      }

      currentFolder = folder;
    }

    currentFolder.children.push({
      kind: "note",
      name: getNoteTitle(entry),
      path: notePath,
      url: noteUrlFromId(entry.id),
      date: entry.data.date,
    });
  }

  return sortSidebarNodes(root.children);
}

function sortSidebarNodes(nodes: SidebarNode[]): SidebarNode[] {
  const folders: SidebarFolderNode[] = [];
  const notes: SidebarNoteNode[] = [];

  for (const node of nodes) {
    if (node.kind === "folder") {
      node.children = sortSidebarNodes(node.children);
      folders.push(node);
    } else {
      notes.push(node);
    }
  }

  folders.sort((a, b) => compareText(a.name, b.name));
  notes.sort((a, b) => compareDatesDesc(a.date, b.date) || compareText(a.name, b.name));

  return [...folders, ...notes];
}

export function getOpenFolderPaths(currentNotePath?: string) {
  const openFolders = new Set<string>();

  if (!currentNotePath) {
    return openFolders;
  }

  const parts = normalizeNoteId(currentNotePath).split("/");
  parts.pop();

  let folderPath = "";

  for (const part of parts) {
    folderPath = folderPath ? `${folderPath}/${part}` : part;
    openFolders.add(folderPath);
  }

  return openFolders;
}

export function getRecentNotes(entries: NoteEntry[], limit = 6) {
  return [...entries]
    .sort(compareNotes)
    .slice(0, limit);
}

export function getFolderNotes(entries: NoteEntry[], id: string) {
  const folderPath = getNoteFolderPath(id);

  return entries
    .filter((entry) => getNoteFolderPath(entry.id) === folderPath)
    .sort(compareNotes);
}

export function getSiblingNotes(entries: NoteEntry[], id: string) {
  const folderNotes = getFolderNotes(entries, id);
  const currentPath = normalizeNoteId(id);
  const index = folderNotes.findIndex((entry) => normalizeNoteId(entry.id) === currentPath);

  return {
    previous: index > 0 ? folderNotes[index - 1] : undefined,
    next: index >= 0 && index < folderNotes.length - 1 ? folderNotes[index + 1] : undefined,
  };
}

export function formatLongDate(value: DateValue) {
  const date = toDate(value);
  if (!date) return "未标注日期";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}

export function formatShortDate(value: DateValue) {
  const date = toDate(value);
  if (!date) return "--/--";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}