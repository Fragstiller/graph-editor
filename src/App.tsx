import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CircularNode from './components/CircularNode';
import './App.css';

const nodeTypes: NodeTypes = {
  circular: CircularNode,
};

const STORAGE_KEY = 'graph-editor-data';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

function FlowComponent() {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeId, setNodeId] = useState(1);
  const [edgeId, setEdgeId] = useState(1);
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { nodes: savedNodes, edges: savedEdges }: GraphData = JSON.parse(savedData);
        if (savedNodes && savedNodes.length > 0) {
          setNodes(savedNodes);
          setEdges(savedEdges || []);
          const maxId = Math.max(...savedNodes.map(n => parseInt(n.id) || 0));
          setNodeId(maxId + 1);
        }
        setHasLoadedSavedData(true);
      } catch (error) {
        console.error('Failed to load saved graph:', error);
        setHasLoadedSavedData(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedData) return;
    const graphData: GraphData = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graphData));
  }, [nodes, edges, hasLoadedSavedData]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        id: `edge-${edgeId}`,
        type: 'straight',
        label: `New Connection`,
        labelStyle: { fill: '#e0e0e0', fontWeight: 700 },
        labelBgStyle: { fill: '#1e1e1e' },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      };
      // @ts-expect-error whatever
      setEdges((eds) => addEdge(edge, eds));
      setEdgeId((id) => id + 1);
    },
    [edgeId]
  );

  const onAddNode = useCallback(() => {
    const position = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: Node = {
      id: `${nodeId}`,
      type: 'circular',
      position,
      data: { label: `New Node` },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeId((id) => id + 1);
  }, [nodeId, reactFlowInstance]);

  const onClearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeId(1);
    setEdgeId(1);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const onExportJSON = useCallback(() => {
    const graphData: GraphData = { nodes, edges };
    const dataStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const onImportJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const { nodes: importedNodes, edges: importedEdges }: GraphData = JSON.parse(content);
          setNodes(importedNodes || []);
          setEdges(importedEdges || []);
          const maxNodeId = Math.max(...(importedNodes || []).map(n => parseInt(n.id) || 0));
          const maxEdgeId = Math.max(...(importedEdges || []).map(e => {
            const match = e.id.match(/edge-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }), 0);
          setNodeId(maxNodeId + 1);
          setEdgeId(maxEdgeId + 1);
        } catch (error) {
          console.error('Failed to import graph:', error);
          alert('Failed to import graph. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const onDeleteKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);

        if (selectedNodes.length > 0) {
          const selectedNodeIds = selectedNodes.map(n => n.id);
          setNodes((nds) => nds.filter((node) => !node.selected));
          setEdges((eds) => eds.filter((edge) =>
            !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
          ));
        }

        if (selectedEdges.length > 0) {
          setEdges((eds) => eds.filter((edge) => !edge.selected));
        }
      }
    },
    [nodes, edges]
  );

  useEffect(() => {
    document.addEventListener('keydown', onDeleteKey);
    return () => {
      document.removeEventListener('keydown', onDeleteKey);
    };
  }, [onDeleteKey]);

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const newLabel = prompt('Enter edge label:', edge.label as string || '');
      if (newLabel !== null) {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === edge.id
              ? { ...e, label: newLabel }
              : e
          )
        );
      }
    },
    []
  );

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={onAddNode} className="toolbar-button">
          Add Node
        </button>
        <button onClick={onClearGraph} className="toolbar-button">
          Clear Graph
        </button>
        <button onClick={onExportJSON} className="toolbar-button">
          Export JSON
        </button>
        <label className="toolbar-button">
          Import JSON
          <input
            type="file"
            accept=".json"
            onChange={onImportJSON}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        deleteKeyCode={['Delete']}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="react-flow-dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'circular':
                return '#4a9eff';
              default:
                return '#808080';
            }
          }}
          style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #404040',
          }}
        />
      </ReactFlow>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}

export default App;
