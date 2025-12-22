import { AUTO_CLOSE_PAIRS } from '../constants';

interface TextState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface MutationResult {
  newValue: string;
  newSelectionStart: number;
  newSelectionEnd: number;
  shouldPreventDefault: boolean;
}

export const handleTabIndentation = (state: TextState): MutationResult => {
  const { value, selectionStart, selectionEnd } = state;
  const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
  return {
    newValue,
    newSelectionStart: selectionStart + 2,
    newSelectionEnd: selectionStart + 2,
    shouldPreventDefault: true
  };
};

export const handleAutoClose = (state: TextState, char: string): MutationResult | null => {
  const { value, selectionStart, selectionEnd } = state;
  const closeChar = AUTO_CLOSE_PAIRS[char];

  if (!closeChar) return null;

  // Wrap selection
  if (selectionStart !== selectionEnd) {
    const selected = value.substring(selectionStart, selectionEnd);
    const newValue = value.substring(0, selectionStart) + char + selected + closeChar + value.substring(selectionEnd);
    return {
      newValue,
      newSelectionStart: selectionStart + 1,
      newSelectionEnd: selectionEnd + 1, // Keep selection inside
      shouldPreventDefault: true
    };
  } 
  
  // Insert pair
  const newValue = value.substring(0, selectionStart) + char + closeChar + value.substring(selectionEnd);
  return {
    newValue,
    newSelectionStart: selectionStart + 1,
    newSelectionEnd: selectionStart + 1,
    shouldPreventDefault: true
  };
};

export const handleOvertype = (state: TextState, char: string): MutationResult | null => {
  const { value, selectionStart } = state;
  
  // If we are typing a closing char that is already next to cursor, skip over it
  if (Object.values(AUTO_CLOSE_PAIRS).includes(char) && value[selectionStart] === char) {
    return {
      newValue: value,
      newSelectionStart: selectionStart + 1,
      newSelectionEnd: selectionStart + 1,
      shouldPreventDefault: true
    };
  }
  return null;
};

export const handleSmartList = (state: TextState): MutationResult | null => {
  const { value, selectionStart, selectionEnd } = state;
  
  const lastNewLinePos = value.lastIndexOf('\n', selectionStart - 1);
  const currentLineStart = lastNewLinePos + 1;
  const currentLine = value.substring(currentLineStart, selectionStart);
  
  // Regex for unordered (- or *) or ordered (1.) lists
  const match = currentLine.match(/^(\s*)([-*]|\d+\.)(\s+)/);
  
  if (!match) return null;

  // Check if list item is empty (user wants to break out of list)
  const lineContent = currentLine.substring(match[0].length).trim();
  if (lineContent === '') {
    // Remove the bullet
    const newValue = value.substring(0, currentLineStart) + '\n' + value.substring(selectionStart);
    // Determine where cursor should land (start of new line)
    return {
      newValue,
      newSelectionStart: currentLineStart + 1, 
      newSelectionEnd: currentLineStart + 1,
      shouldPreventDefault: true
    };
  }

  // Calculate next bullet
  let nextBullet = match[2];
  if (match[2].match(/\d+\./)) {
    const num = parseInt(match[2]);
    nextBullet = `${num + 1}.`;
  }

  const insertion = `\n${match[1]}${nextBullet}${match[3]}`;
  const newValue = value.substring(0, selectionStart) + insertion + value.substring(selectionEnd);
  
  return {
    newValue,
    newSelectionStart: selectionStart + insertion.length,
    newSelectionEnd: selectionStart + insertion.length,
    shouldPreventDefault: true
  };
};

export const handleSmartBackspace = (state: TextState): MutationResult | null => {
  const { value, selectionStart, selectionEnd } = state;

  if (selectionStart === selectionEnd && selectionStart > 0) {
    const charToDelete = value[selectionStart - 1];
    const nextChar = value[selectionStart];

    // If deleting opening char and next is closing char, delete both
    if (AUTO_CLOSE_PAIRS[charToDelete] === nextChar) {
      const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
      return {
        newValue,
        newSelectionStart: selectionStart - 1,
        newSelectionEnd: selectionStart - 1,
        shouldPreventDefault: true
      };
    }
  }
  return null;
};

export const handleFormatWrapper = (state: TextState, wrapper: string): MutationResult => {
  const { value, selectionStart, selectionEnd } = state;
  const selectedText = value.substring(selectionStart, selectionEnd);
  const before = value.substring(0, selectionStart);
  const after = value.substring(selectionEnd);

  // Unwrap if already wrapped
  if (selectedText.startsWith(wrapper) && selectedText.endsWith(wrapper) && selectedText.length >= 2 * wrapper.length) {
    const newText = selectedText.substring(wrapper.length, selectedText.length - wrapper.length);
    return {
      newValue: before + newText + after,
      newSelectionStart: selectionStart,
      newSelectionEnd: selectionStart + newText.length,
      shouldPreventDefault: true
    };
  }

  // Unwrap if context is wrapped
  if (before.endsWith(wrapper) && after.startsWith(wrapper)) {
    const newBefore = before.substring(0, before.length - wrapper.length);
    const newAfter = after.substring(wrapper.length);
    return {
      newValue: newBefore + selectedText + newAfter,
      newSelectionStart: selectionStart - wrapper.length,
      newSelectionEnd: selectionEnd - wrapper.length,
      shouldPreventDefault: true
    };
  }

  // Wrap
  return {
    newValue: before + wrapper + selectedText + wrapper + after,
    newSelectionStart: selectionStart + wrapper.length,
    newSelectionEnd: selectionEnd + wrapper.length,
    shouldPreventDefault: true
  };
};

export const toggleLinePrefix = (state: TextState, prefix: string): MutationResult => {
  const { value, selectionStart, selectionEnd } = state;
  
  // Find start and end of the affected lines
  const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let lastLineEnd = value.indexOf('\n', selectionEnd);
  if (lastLineEnd === -1) lastLineEnd = value.length;

  const content = value.substring(firstLineStart, lastLineEnd);
  const lines = content.split('\n');

  // Check if all lines already start with prefix (normalized)
  const isAllPrefixed = lines.every(line => line.startsWith(prefix));

  const newLines = lines.map(line => {
    if (isAllPrefixed) {
      return line.startsWith(prefix) ? line.substring(prefix.length) : line;
    } else {
      // Remove any existing heading/list prefix if we are applying a new one, to avoid "## # Title"
      // Simple logic: If applying H1 (#), and it has H2 (##), strip H2 first.
      return prefix + line;
    }
  });

  const newContent = newLines.join('\n');
  const newValue = value.substring(0, firstLineStart) + newContent + value.substring(lastLineEnd);

  return {
    newValue,
    newSelectionStart: firstLineStart,
    newSelectionEnd: firstLineStart + newContent.length,
    shouldPreventDefault: true
  };
};