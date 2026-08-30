import { useEffect, useRef, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { getNodeColor, RISK_COLORS } from '../../utils/colorMap';

export default function TransactionGraph({
  nodes = [],
  edges = [],
  selectedNodeId,
  onNodeSelect,
  className = '',
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // Build Cytoscape elements
  const elements = useMemo(() => {
    const cyNodes = nodes.map((n) => ({
      data: {
        id: String(n.id),
        label: String(n.id),
        riskScore: n.risk_score ?? 0,
        trueClass: n.true_class || 'unknown',
        predictedClass: n.predicted_class || 'unknown',
        timeStep: n.time_step,
        volume: n.volume_normalized ?? 0.3,
        isCenter: n.is_center || false,
      },
    }));

    const cyEdges = edges.map((e, i) => ({
      data: {
        id: `e-${i}`,
        source: String(e.source),
        target: String(e.target),
        amount: e.amount_normalized ?? 0.2,
      },
    }));

    return [...cyNodes, ...cyEdges];
  }, [nodes, edges]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || elements.length === 0) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      layout: {
        name: 'cose',
        animate: false,
        animationDuration: 300,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 80,
        gravity: 0.4,
        padding: 40,
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) =>
              getNodeColor(ele.data('trueClass'), ele.data('riskScore')),
            width: (ele) => 20 + ele.data('volume') * 40,
            height: (ele) => 20 + ele.data('volume') * 40,
            label: (ele) => ele.data('isCenter') ? ele.data('label') : '',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            color: '#374151',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'border-width': (ele) => (ele.data('isCenter') ? 3 : 0),
            'border-color': RISK_COLORS.selected,
            'overlay-padding': 4,
            'transition-property': 'border-width, border-color',
            'transition-duration': '0.15s',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': RISK_COLORS.selected,
            label: (ele) => ele.data('label'),
          },
        },
        {
          selector: 'edge',
          style: {
            width: (ele) => 1 + ele.data('amount') * 4,
            'line-color': '#D1D5DB',
            'target-arrow-color': '#D1D5DB',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            opacity: 0.6,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': RISK_COLORS.selected,
            'target-arrow-color': RISK_COLORS.selected,
            opacity: 1,
          },
        },
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      minZoom: 0.3,
      maxZoom: 3,
    });

    // Click handler
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      onNodeSelect?.(nodeId);
    });

    // Tooltip on hover
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      node.style('label', node.data('label'));
      containerRef.current.style.cursor = 'pointer';
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      if (!node.data('isCenter') && !node.selected()) {
        node.style('label', '');
      }
      containerRef.current.style.cursor = 'default';
    });

    cyRef.current = cy;

    return () => {
      if (cy) {
        cy.stop(true, true);
        cy.destroy();
      }
      cyRef.current = null;
    };
  }, [elements, onNodeSelect]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId) return;

    cy.nodes().unselect();
    const node = cy.getElementById(String(selectedNodeId));
    if (node.length) {
      node.select();
    }
  }, [selectedNodeId]);

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 ${className}`}
        style={{ minHeight: 400 }}
      >
        <p className="text-[13px] text-gray-400">No graph data to display</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="cytoscape-container rounded-lg bg-white border border-gray-200" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 text-[11px] font-medium text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Illicit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Model-Flagged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Licit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Unknown
        </span>
      </div>
    </div>
  );
}
