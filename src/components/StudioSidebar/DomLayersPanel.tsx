// ============================================================
// UndangYa! HTML Visual Studio — DomLayersPanel
// Hierarchical visual DOM tree inspector with instant canvas sync
// ============================================================
import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import type { DomNodeSummary } from '../../types/visualStudio';
import { extractElementInfo } from '../../utils/domUtils';

interface TreeNodeProps {
  node: DomNodeSummary;
  depth: number;
}

function DomTreeNode({ node, depth }: TreeNodeProps) {
  const {
    selectedElement,
    hoveredElementSelector,
    selectElement,
    setHoveredElementSelector,
  } = useStudio();

  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = selectedElement?.selector === node.id;
  const isHovered = hoveredElementSelector === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Query DOM in iframe to extract full styles and select
    const iframe = document.querySelector('.canvas-iframe') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentDocument) return;

    try {
      const el = iframe.contentDocument.querySelector(node.id) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const info = extractElementInfo(el, iframe);
        selectElement(info);
      }
    } catch {
      // Ignore query errors
    }
  };

  return (
    <div className="dom-tree-node">
      <div
        className={`dom-node-row ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        onClick={handleSelect}
        onMouseEnter={() => setHoveredElementSelector(node.id)}
        onMouseLeave={() => setHoveredElementSelector(null)}
      >
        {hasChildren ? (
          <button
            className="dom-node-toggle"
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: 14 }} />
        )}

        <span className="dom-node-tag">&lt;{node.tagName}&gt;</span>

        {node.idAttr && <span className="dom-node-id">#{node.idAttr}</span>}

        {node.classNames.length > 0 && (
          <span className="dom-node-class" title={node.classNames.join(' ')}>
            .{node.classNames.join('.')}
          </span>
        )}

        {node.textPreview && (
          <span className="dom-node-text" title={node.textPreview}>
            "{node.textPreview}"
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, idx) => (
            <DomTreeNode key={`${child.id}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DomLayersPanel() {
  const { domTree } = useStudio();

  if (domTree.length === 0) {
    return (
      <div style={{ padding: '20px 14px', color: '#7c7c84', fontSize: '12px', textAlign: 'center' }}>
        Memindai struktur DOM undangan...
      </div>
    );
  }

  return (
    <div className="dom-tree-list">
      <div className="sidebar-section-header">
        <span>Struktur Hirarki DOM</span>
        <span className="sidebar-badge">{domTree.length} Node Utama</span>
      </div>
      {domTree.map((node, idx) => (
        <DomTreeNode key={`${node.id}-${idx}`} node={node} depth={0} />
      ))}
    </div>
  );
}
