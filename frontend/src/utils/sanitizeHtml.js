// HTML Sanitization Utility
// Prevents XSS attacks by sanitizing HTML content

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Create a temporary div element
  const tempDiv = document.createElement("div");
  tempDiv.textContent = html;

  // Return the text content (strips all HTML tags)
  return tempDiv.textContent || tempDiv.innerText || "";
};

/**
 * Sanitize HTML content but allow safe HTML tags
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string with safe tags
 */
export const sanitizeHtmlSafe = (html) => {
  if (!html || typeof html !== "string") {
    return "";
  }

  // List of allowed HTML tags
  const allowedTags = ["b", "i", "em", "strong", "p", "br", "span", "div"];

  // Create a temporary div element
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove all non-allowed tags
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  const nodesToRemove = [];
  let node;

  while ((node = walker.nextNode())) {
    if (!allowedTags.includes(node.tagName.toLowerCase())) {
      nodesToRemove.push(node);
    }
  }

  // Remove disallowed tags
  nodesToRemove.forEach((node) => {
    const parent = node.parentNode;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
  });

  return tempDiv.innerHTML;
};

/**
 * Escape HTML special characters
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'/]/g, (s) => map[s]);
};
