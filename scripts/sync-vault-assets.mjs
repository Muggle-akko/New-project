import fs from "node:fs/promises";
import path from "node:path";

const markdownExtensions = new Set([".md", ".markdown"]);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyAssets(sourceDir, targetDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      await copyAssets(sourcePath, targetPath);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (markdownExtensions.has(extension)) {
      continue;
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function main() {
  const workspaceRoot = process.cwd();
  const vaultDir = path.join(workspaceRoot, "vault");
  const targetDir = path.join(workspaceRoot, "public", "_vault");

  await fs.rm(targetDir, { recursive: true, force: true });

  if (!(await pathExists(vaultDir))) {
    return;
  }

  await fs.mkdir(targetDir, { recursive: true });
  await copyAssets(vaultDir, targetDir);
}

await main();
