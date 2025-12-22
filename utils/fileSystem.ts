/**
 * Handles saving content to a file.
 * Uses File System Access API if available, falls back to download.
 */
export const saveFile = async (
  content: string, 
  filename: string, 
  existingHandle?: any
): Promise<{ success: boolean; handle?: any; newFilename?: string }> => {
  
  // @ts-ignore - TS doesn't fully know FS API yet
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      let fileHandle = existingHandle;
      
      if (!fileHandle) {
        const options = {
          suggestedName: filename.endsWith('.md') ? filename : `${filename}.md`,
          types: [{
            description: 'Markdown File',
            accept: { 'text/markdown': ['.md', '.txt'] },
          }],
        };
        // @ts-ignore
        fileHandle = await window.showSaveFilePicker(options);
      }
      
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      return { success: true, handle: fileHandle, newFilename: fileHandle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') return { success: false };
      console.error('Save failed, falling back to download', err);
    }
  }

  // Fallback
  downloadFile(content, filename);
  return { success: true };
};

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  let finalName = filename;
  if (!finalName.includes('.')) finalName += '.md';
  
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const openFilePicker = async (): Promise<{ name: string; content: string } | null> => {
  // @ts-ignore
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      // @ts-ignore
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Text Files',
          accept: {
            'text/*': ['.md', '.txt', '.json', '.js', '.ts', '.tsx', '.html', '.css']
          }
        }],
        multiple: false
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      return { name: file.name, content: text };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Open file failed', err);
      }
    }
  }
  return null;
};