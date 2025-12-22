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
  
  // Regex for unordered, ordered lists, or task lists
  // Capture groups: 1=indent, 2=bullet/number/task, 3=whitespace
  const match = currentLine.match(/^(\s*)([-*]|\d+\.|[-*]\s\[[ x]\])(\s+)/);
  
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
  
  // Handle Ordered List increment
  if (match[2].match(/^\d+\.$/)) {
    const num = parseInt(match[2]);
    nextBullet = `${num + 1}.`;
  }
  // Handle Task List (Respect user's bullet choice of - or *)
  else {
    const taskMatch = match[2].match(/([-*])\s\[[ x]\]/);
    if (taskMatch) {
      nextBullet = `${taskMatch[1]} [ ]`;
    }
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

export const handleLink = (state: TextState): MutationResult => {
  const { value, selectionStart, selectionEnd } = state;
  const selectedText = value.substring(selectionStart, selectionEnd);
  
  // If no text selected, insert empty link []()
  if (!selectedText) {
    const newValue = value.substring(0, selectionStart) + '[]()' + value.substring(selectionEnd);
    return {
      newValue,
      newSelectionStart: selectionStart + 1, // Inside brackets
      newSelectionEnd: selectionStart + 1,
      shouldPreventDefault: true
    };
  }

  // If text is selected, wrap it in brackets and add parens: [text]()
  const newValue = value.substring(0, selectionStart) + `[${selectedText}]()` + value.substring(selectionEnd);
  // Place cursor inside the parentheses
  const cursorPosition = selectionStart + selectedText.length + 3; // [ + text + ] + ( = +3
  
  return {
    newValue,
    newSelectionStart: cursorPosition,
    newSelectionEnd: cursorPosition,
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

  // Regex to detect existing prefixes: Headers (#), Bullets (- or *), Numbers (1.), Blockquotes (>), Task Lists (- [ ])
  const prefixRegex = /^(\s*)(#+\s|[-*]\s|\d+\.\s|>\s|[-*]\s\[[ x]\]\s)/;

  // Check if all lines already start with the *target* prefix
  const isAllTargetPrefixed = lines.every(line => line.startsWith(prefix));

  const newLines = lines.map(line => {
    if (isAllTargetPrefixed) {
      // Remove the prefix
      return line.substring(prefix.length);
    } else {
      // Apply new prefix, replacing ANY existing prefix
      const match = line.match(prefixRegex);
      if (match) {
        // match[0] is the full prefix including whitespace like "# " or "- "
        return prefix + line.substring(match[0].length);
      } else {
        return prefix + line;
      }
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