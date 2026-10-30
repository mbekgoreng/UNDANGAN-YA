// ============================================================
// UndangYa! HTML Visual Studio — DOM Utility Functions
// Optimal selector generation, DOM tree traversal & computed styles
// ============================================================
import type { SelectedElementInfo, DomNodeSummary } from '../types/visualStudio';

/**
 * Generates an unambiguous, human-friendly CSS selector for an element
 */
export function generateOptimalSelector(el: Element): string {
  if (!(el instanceof Element)) return '';

  // 1. If element has an ID that doesn't look auto-generated, use it
  if (el.id && !el.id.startsWith(':') && !el.id.includes('__') && !el.id.includes('react')) {
    const escapedId = CSS.escape ? CSS.escape(el.id) : el.id;
    const matches = el.ownerDocument.querySelectorAll(`#${escapedId}`);
    if (matches.length === 1) {
      return `#${escapedId}`;
    }
  }

  // 2. Build tag and semantic classes
  const tagName = el.tagName.toLowerCase();
  if (['body', 'html'].includes(tagName)) return tagName;

  const validClasses = Array.from(el.classList)
    .filter(c => !c.startsWith('undangya-') && !c.includes(':') && !c.includes('['));

  let localSelector = tagName;
  if (validClasses.length > 0) {
    localSelector += '.' + validClasses.map(c => CSS.escape ? CSS.escape(c) : c).join('.');
  }

  // Check if unique in document
  try {
    if (el.ownerDocument.querySelectorAll(localSelector).length === 1) {
      return localSelector;
    }
  } catch {
    // Fall back to path
  }

  // 3. Build path up to parent
  const parent = el.parentElement;
  if (!parent || parent.tagName.toLowerCase() === 'html') {
    return localSelector;
  }

  const parentSelector = generateOptimalSelector(parent);

  // Find index among siblings with same tag
  const siblings = Array.from(parent.children).filter(s => s.tagName === el.tagName);
  if (siblings.length > 1) {
    const index = siblings.indexOf(el) + 1;
    return `${parentSelector} > ${localSelector}:nth-of-type(${index})`;
  }

  return `${parentSelector} > ${localSelector}`;
}

/**
 * Generates an XPath string for fallback reference
 */
export function getXPath(element: Element): string {
  if (element.id !== '') {
    return `//*[@id="${element.id}"]`;
  }
  if (element === element.ownerDocument.body) {
    return '/html/body';
  }

  let ix = 0;
  const siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      const parentXPath = element.parentElement ? getXPath(element.parentElement) : '';
      return `${parentXPath}/${element.tagName.toLowerCase()}[${ix + 1}]`;
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
  return '';
}

/**
 * Extracts complete computed and layout info from an iframe DOM element
 */
export function extractElementInfo(el: HTMLElement, iframe: HTMLIFrameElement): SelectedElementInfo {
  const win = iframe.contentWindow || window;
  const computed = win.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const selector = generateOptimalSelector(el);
  const tagName = el.tagName.toLowerCase();
  const isImage = tagName === 'img' || tagName === 'svg' || tagName === 'image' || !!computed.backgroundImage && computed.backgroundImage !== 'none';
  const isText = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'b', 'strong', 'em', 'label', 'button'].includes(tagName) ||
    (!isImage && el.children.length === 0 && (el.textContent || '').trim().length > 0);

  let imageSrc: string | undefined;
  if (tagName === 'img') {
    imageSrc = (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src;
  } else if (computed.backgroundImage && computed.backgroundImage !== 'none') {
    const match = computed.backgroundImage.match(/url\(["']?([^"']*)["']?\)/);
    if (match) imageSrc = match[1];
  }

  const aspectRatio = rect.height > 0 ? rect.width / rect.height : 1;

  return {
    selector,
    tagName,
    idAttr: el.id || '',
    classList: Array.from(el.classList).filter(c => !c.startsWith('undangya-')),
    xpath: getXPath(el),
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
    },
    computed: {
      position: computed.position || 'static',
      top: computed.top || 'auto',
      left: computed.left || 'auto',
      right: computed.right || 'auto',
      bottom: computed.bottom || 'auto',
      width: computed.width || 'auto',
      height: computed.height || 'auto',
      opacity: computed.opacity || '1',
      transform: computed.transform || 'none',
      zIndex: computed.zIndex || 'auto',
      fontFamily: computed.fontFamily || 'inherit',
      fontSize: computed.fontSize || 'inherit',
      fontWeight: computed.fontWeight || 'inherit',
      color: computed.color || 'inherit',
      lineHeight: computed.lineHeight || 'inherit',
      letterSpacing: computed.letterSpacing || 'normal',
      textAlign: computed.textAlign || 'left',
      display: computed.display || 'block',
      objectFit: computed.objectFit || 'fill',
      margin: computed.margin || '0px',
      padding: computed.padding || '0px',
      backgroundColor: computed.backgroundColor || 'transparent',
      borderRadius: computed.borderRadius || '0px',
      animationName: computed.animationName || 'none',
      animationDuration: computed.animationDuration || '0s',
      animationDelay: computed.animationDelay || '0s',
      animationTimingFunction: computed.animationTimingFunction || 'ease',
    },
    isImage,
    isText,
    imageSrc,
    textContent: isText ? (el.textContent || '').trim().slice(0, 500) : undefined,
    aspectRatio,
  };
}

/**
 * Builds a lightweight hierarchical representation of the iframe DOM tree
 */
export function buildDomTree(root: Element, maxDepth = 6, currentDepth = 0): DomNodeSummary[] {
  if (currentDepth > maxDepth || !root) return [];

  const children = Array.from(root.children);
  const result: DomNodeSummary[] = [];

  for (const child of children) {
    const tagName = child.tagName.toLowerCase();
    // Skip script, style, noscript, svg internal paths/defs
    if (['script', 'style', 'noscript', 'meta', 'link', 'path', 'g', 'defs', 'clippath'].includes(tagName)) {
      continue;
    }

    const idAttr = child.id || undefined;
    const classNames = Array.from(child.classList).filter(c => !c.startsWith('undangya-'));
    const isImage = tagName === 'img' || tagName === 'svg';
    const isSection = tagName === 'section' || 
      (!!idAttr && (idAttr.includes('section') || idAttr.includes('cover') || idAttr.includes('event') || idAttr.includes('couple') || idAttr.includes('gallery') || idAttr.includes('rsvp'))) ||
      classNames.some(c => c.includes('section') || c.includes('scene') || c.includes('page'));

    const textContent = child.textContent?.trim();
    const textPreview = (!isImage && textContent && child.children.length === 0)
      ? textContent.slice(0, 35) + (textContent.length > 35 ? '...' : '')
      : undefined;

    const summary: DomNodeSummary = {
      id: generateOptimalSelector(child),
      tagName,
      idAttr,
      classNames,
      textPreview,
      isImage,
      isSection,
      children: buildDomTree(child, maxDepth, currentDepth + 1),
    };

    result.push(summary);
  }

  return result;
}

/**
 * Auto-detects main invitation sections/scenes for quick navigation
 */
export function scanInvitationScenes(doc: Document): Array<{ id: string; name: string; selector: string; top: number }> {
  const scenes: Array<{ id: string; name: string; selector: string; top: number }> = [];

  // Search for section elements or divs with section-like identifiers
  const candidates = doc.querySelectorAll('section, [id*="hero"], [id*="cover"], [id*="mempelai"], [id*="couple"], [id*="acara"], [id*="event"], [id*="story"], [id*="cerita"], [id*="galeri"], [id*="gallery"], [id*="rsvp"], [id*="doa"], [id*="waktu"], [class*="section"]');

  const seen = new Set<Element>();

  candidates.forEach((el, index) => {
    // Only top-level sections (not small nested divs)
    if (seen.has(el)) return;
    const rect = el.getBoundingClientRect();
    if (rect.height < 60) return; // Ignore tiny containers

    seen.add(el);
    const tagName = el.tagName.toLowerCase();
    const id = el.id || `section-${index + 1}`;
    
    // Human-friendly title
    let name = id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const heading = el.querySelector('h1, h2, h3');
    if (heading && heading.textContent?.trim()) {
      name = heading.textContent.trim().slice(0, 30);
    }

    scenes.push({
      id,
      name,
      selector: generateOptimalSelector(el),
      top: rect.top + (doc.defaultView?.scrollY || 0),
    });
  });

  return scenes;
}
