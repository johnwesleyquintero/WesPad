/**
 * Handles saving content to a file.
 * Uses File System Access API if available, falls back to download.
 */
export const saveFile = async (
  content: string,
  filename: string,
  existingHandle?: FileSystemFileHandle,
): Promise<{
  success: boolean;
  handle?: FileSystemFileHandle;
  newFilename?: string;
}> => {
  // Sanitize filename: remove common invalid chars
  const safeName = filename.replace(/[^a-z0-9.\-_ ]/gi, "_");

  // @ts-ignore - TS doesn't fully know FS API yet
  if (typeof window.showSaveFilePicker === "function") {
    try {
      let fileHandle = existingHandle;

      if (!fileHandle) {
        const options = {
          suggestedName: safeName.endsWith(".md") ? safeName : `${safeName}.md`,
          types: [
            {
              description: "Markdown File",
              accept: { "text/markdown": [".md", ".txt"] },
            },
          ],
        };
        // @ts-ignore
        fileHandle = await window.showSaveFilePicker(options);
      }

      if (!fileHandle) {
        throw new Error("Failed to acquire file handle");
      }

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        handle: fileHandle,
        newFilename: fileHandle.name,
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError")
        return { success: false };
      console.error("Save failed, falling back to download", err);
    }
  }

  // Fallback for browsers without FS Access API or if save with handle failed
  downloadFile(content, safeName);
  return { success: true };
};

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  let finalName = filename;
  if (!finalName.includes(".")) finalName += ".md";

  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const openFilePicker = async (): Promise<{
  name: string;
  content: string;
  handle?: FileSystemFileHandle;
} | null> => {
  // @ts-ignore
  if (typeof window.showOpenFilePicker === "function") {
    try {
      // @ts-ignore
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Text Files",
            accept: {
              "text/*": [
                ".md",
                ".txt",
                ".json",
                ".js",
                ".ts",
                ".tsx",
                ".html",
                ".css",
              ],
            },
          },
        ],
        multiple: false,
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      return { name: file.name, content: text, handle: fileHandle };
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Open file failed", err);
      }
    }
  }
  return null;
};
