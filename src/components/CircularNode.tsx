import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import './CircularNode.css';

export interface CircularNodeData {
  label: string;
}

const CircularNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CircularNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(nodeData.label);

  useEffect(() => {
    const nodeData = data as unknown as CircularNodeData;
    setValue(nodeData.label);
  }, [data]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const nodeData = data as unknown as CircularNodeData;
    nodeData.label = value;
  }, [value, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const nodeData = data as unknown as CircularNodeData;
    if (e.key === 'Enter') {
      setIsEditing(false);
      nodeData.label = value;
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(nodeData.label);
    }
  }, [value, data]);

  return (
    <div
      className={`circular-node ${selected ? 'selected' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="handle"
        id="top"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="handle"
        id="top-source"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="handle"
        id="bottom"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="handle"
        id="bottom-source"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="handle"
        id="left"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="handle"
        id="left-source"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="handle"
        id="right"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="handle"
        id="right-source"
      />
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="node-input"
          autoFocus
        />
      ) : (
        <div className="node-label">{value || 'Double-click to edit'}</div>
      )}
    </div>
  );
};

export default CircularNode;
