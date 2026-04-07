import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visit } from "unist-util-visit";

const NOTE_EXTENSIONS = new Set([".md", ".markdown"]);
const IMAGE_EXTENSIONS = new Set([
  ".apng",
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);
const EXCLUDED_PARENT_TYPES = new Set([
  "code",
  "definition",
  "html",
  "image",
  "inlineCode",
  "link",
  "yaml",
]);
const WIKILINK_PATTERN = /(!)?\[\[([^\[\]#|]+?)(?:#([^\[\]|]+))?(?:\|([^\[\]]+))?\]\]/g;

function normalizePath(value) {
  return value.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+/, "");
}

function stripMarkdownExtension(value) {
  return value.replace(/\.(md|markdown)$/i, "");
}

function pushToMap(map, key, value) {
  const current = map.get(key) ?? [];
  current.push(value);
  map.set(key, current);
}

function buildUniqueMap(source) {
  const unique = new Map();

  for (const [key, values] of source.entries()) {
    if (values.length === 1) {
      unique.set(key, values[0]);
    }
  }

  return unique;
}

function walkDirectory(directory, visitor) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(absolutePath, visitor);
      continue;
    }

    visitor(absolutePath);
  }
}

function encodeUrlPath(prefix, relativePath) {
  const encoded = normalizePath(relativePath)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${prefix}/${encoded}`.replace(/\/{2,}/g, "/");
}

function labelFromTarget(target) {
  const normalized = normalizePath(target);
  const fileName = normalized.split("/").pop() ?? normalized;
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
}

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isExternalUrl(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value);
}

function isImageTarget(value) {
  return IMAGE_EXTENSIONS.has(path.extname(value).toLowerCase());
}

function toTextNode(value) {
  return { type: "text", value };
}

function toLinkNode(url, label) {
  return {
    type: "link",
    url,
    children: [toTextNode(label)],
  };
}

function toImageNode(url, alt) {
  return {
    type: "image",
    url,
    alt,
  };
}

function collectPlainText(nodes) {
  return nodes
    .map((node) => {
      if (!node) {
        return "";
      }

      if (node.type === "text") {
        return node.value;
      }

      if (Array.isArray(node.children)) {
        return collectPlainText(node.children);
      }

      return "";
    })
    .join("");
}

function resolveNoteCandidates(target, currentNotePath) {
  const normalizedTarget = stripMarkdownExtension(normalizePath(target));

  if (!normalizedTarget) {
    return [];
  }

  const candidates = [normalizedTarget];

  if (currentNotePath) {
    const relativeCandidate = normalizePath(
      path.posix.join(path.posix.dirname(currentNotePath), normalizedTarget),
    );
    candidates.push(relativeCandidate);
  }

  return [...new Set(candidates)];
}

function resolveAssetCandidates(target, currentNotePath, preferRelative) {
  const normalizedTarget = normalizePath(target);

  if (!normalizedTarget) {
    return [];
  }

  const candidates = [];

  if (preferRelative && currentNotePath) {
    candidates.push(
      normalizePath(
        path.posix.join(path.posix.dirname(currentNotePath), normalizedTarget),
      ),
    );
  }

  candidates.push(normalizedTarget);

  if (!preferRelative && currentNotePath) {
    candidates.push(
      normalizePath(
        path.posix.join(path.posix.dirname(currentNotePath), normalizedTarget),
      ),
    );
  }

  return [...new Set(candidates)];
}

export function createVaultResolver(vaultRootUrl) {
  const vaultRoot = normalizePath(fileURLToPath(vaultRootUrl));
  const notesByPath = new Map();
  const assetsByPath = new Map();
  const notesByBaseName = new Map();
  const assetsByBaseName = new Map();

  walkDirectory(vaultRoot, (absolutePath) => {
    const relativePath = normalizePath(path.relative(vaultRoot, absolutePath));
    const extension = path.extname(relativePath).toLowerCase();

    if (NOTE_EXTENSIONS.has(extension)) {
      const notePath = stripMarkdownExtension(relativePath);
      notesByPath.set(notePath, notePath);
      pushToMap(
        notesByBaseName,
        path.posix.basename(notePath).toLowerCase(),
        notePath,
      );
      return;
    }

    assetsByPath.set(relativePath, relativePath);
    pushToMap(
      assetsByBaseName,
      path.posix.basename(relativePath).toLowerCase(),
      relativePath,
    );
  });

  const uniqueNotesByBaseName = buildUniqueMap(notesByBaseName);
  const uniqueAssetsByBaseName = buildUniqueMap(assetsByBaseName);

  return {
    relativeNotePathFromFile(file) {
      if (!file.path) {
        return "";
      }

      const relativePath = normalizePath(path.relative(vaultRoot, file.path));
      return stripMarkdownExtension(relativePath);
    },
    resolveNoteTarget(target, currentNotePath = "") {
      const candidates = resolveNoteCandidates(target, currentNotePath);

      for (const candidate of candidates) {
        if (notesByPath.has(candidate)) {
          return candidate;
        }
      }

      const baseName = path.posix
        .basename(stripMarkdownExtension(normalizePath(target)))
        .toLowerCase();
      return uniqueNotesByBaseName.get(baseName) ?? null;
    },
    resolveObsidianAssetTarget(target, currentNotePath = "") {
      const candidates = resolveAssetCandidates(target, currentNotePath, false);

      for (const candidate of candidates) {
        if (assetsByPath.has(candidate)) {
          return candidate;
        }
      }

      const baseName = path.posix.basename(normalizePath(target)).toLowerCase();
      return uniqueAssetsByBaseName.get(baseName) ?? null;
    },
    resolveMarkdownAssetTarget(target, currentNotePath = "") {
      const candidates = resolveAssetCandidates(target, currentNotePath, true);

      for (const candidate of candidates) {
        if (assetsByPath.has(candidate)) {
          return candidate;
        }
      }

      return null;
    },
    noteUrlFromPath(notePath) {
      return encodeUrlPath("/notes", notePath);
    },
    assetUrlFromPath(assetPath) {
      return encodeUrlPath("/_vault", assetPath);
    },
  };
}

export function remarkReadingTime() {
  return (tree, file) => {
    let wordCount = 0;

    visit(tree, "text", (node, _index, parent) => {
      if (parent && EXCLUDED_PARENT_TYPES.has(parent.type)) {
        return;
      }

      const words = node.value.trim().split(/\s+/u).filter(Boolean).length;
      wordCount += words;
    });

    const readingTime = Math.max(1, Math.ceil(wordCount / 220));
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.readingTime = readingTime;
  };
}

export function remarkObsidianLinksAndEmbeds(options) {
  const { resolver } = options;

  function tokenizeText(value, currentNotePath) {
    const nodes = [];
    let cursor = 0;

    for (const match of value.matchAll(WIKILINK_PATTERN)) {
      const [token, embedFlag, rawTarget, rawHeading, rawAlias] = match;
      const index = match.index ?? 0;

      if (index > cursor) {
        nodes.push(toTextNode(value.slice(cursor, index)));
      }

      const target = rawTarget.trim();
      const alias = rawAlias?.trim() || labelFromTarget(target);
      const heading = rawHeading?.trim();

      if (embedFlag) {
        const assetPath = resolver.resolveObsidianAssetTarget(
          target,
          currentNotePath,
        );

        if (assetPath) {
          const assetUrl = resolver.assetUrlFromPath(assetPath);

          nodes.push(
            isImageTarget(assetPath)
              ? toImageNode(assetUrl, alias)
              : toLinkNode(assetUrl, alias),
          );
          cursor = index + token.length;
          continue;
        }
      }

      const notePath = resolver.resolveNoteTarget(target, currentNotePath);

      if (notePath) {
        const anchor = heading ? `#${slugifyHeading(heading)}` : "";
        nodes.push(toLinkNode(`${resolver.noteUrlFromPath(notePath)}${anchor}`, alias));
      } else {
        nodes.push(toTextNode(token));
      }

      cursor = index + token.length;
    }

    if (cursor < value.length) {
      nodes.push(toTextNode(value.slice(cursor)));
    }

    return nodes.length ? nodes : [toTextNode(value)];
  }

  function transformNode(node, file) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.type === "image") {
      return;
    }

    if (EXCLUDED_PARENT_TYPES.has(node.type)) {
      return;
    }

    if (!Array.isArray(node.children)) {
      return;
    }

    const currentNotePath = resolver.relativeNotePathFromFile(file);
    const nextChildren = [];

    for (const child of node.children) {
      if (child.type === "text") {
        nextChildren.push(...tokenizeText(child.value, currentNotePath));
        continue;
      }

      transformNode(child, file);
      nextChildren.push(child);
    }

    node.children = nextChildren;
  }

  return (tree, file) => {
    transformNode(tree, file);
  };
}

export function remarkResolveRelativeAssets(options) {
  const { resolver } = options;

  return (tree, file) => {
    const currentNotePath = resolver.relativeNotePathFromFile(file);

    visit(tree, "image", (node) => {
      if (!node.url || isExternalUrl(node.url) || node.url.startsWith("/")) {
        return;
      }

      const assetPath = resolver.resolveMarkdownAssetTarget(
        node.url,
        currentNotePath,
      );

      if (assetPath) {
        node.url = resolver.assetUrlFromPath(assetPath);
      }
    });
  };
}

export function remarkObsidianCallouts() {
  const defaultTitles = {
    note: "Note",
    tip: "Tip",
    warning: "Warning",
  };

  return (tree) => {
    visit(tree, "blockquote", (node) => {
      const firstChild = node.children?.[0];

      if (!firstChild || firstChild.type !== "paragraph") {
        return;
      }

      const textContent = collectPlainText(firstChild.children ?? []);
      const match = textContent.match(/^\[!([a-zA-Z-]+)\]\s*(.*)$/);

      if (!match) {
        return;
      }

      const calloutType = match[1].toLowerCase();
      const title =
        match[2].trim() ||
        defaultTitles[calloutType] ||
        calloutType.charAt(0).toUpperCase() + calloutType.slice(1);

      node.data ??= {};
      node.data.hName = "aside";
      node.data.hProperties = {
        className: ["callout", `callout-${calloutType}`],
        "data-callout": calloutType,
      };

      node.children = [
        {
          type: "paragraph",
          data: {
            hName: "div",
            hProperties: { className: ["callout-title"] },
          },
          children: [toTextNode(title)],
        },
        ...node.children.slice(1),
      ];
    });
  };
}
