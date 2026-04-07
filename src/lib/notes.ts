import type { CollectionEntry } from "astro:content";

export type NoteEntry = CollectionEntry<"notes">;
type DateValue = Date | string;

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
  return value instanceof Date ? value : new Date(`${value}T00:00:00`);
}

function compareDatesDesc(a: DateValue, b: DateValue) {
  return toDate(b).getTime() - toDate(a).getTime();
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
      name: entry.data.title,
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
    .sort((a, b) => compareDatesDesc(a.data.date, b.data.date) || compareText(a.data.title, b.data.title))
    .slice(0, limit);
}

export function formatLongDate(value: DateValue) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(toDate(value));
}

export function formatShortDate(value: DateValue) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(toDate(value));
}
