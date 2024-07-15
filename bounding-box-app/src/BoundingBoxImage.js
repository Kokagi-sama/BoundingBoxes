import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';

const BoundingBoxImage = ({ imageUrl }) => {
  const [image] = useImage(imageUrl);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [newBox, setNewBox] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#FF0000');
  const stageRef = useRef(null);
  const trRef = useRef(null);

  // Reset boundingBoxes when imageUrl changes
  useEffect(() => {
    setBoundingBoxes([]);
  }, [imageUrl]);

  const handleMouseDown = (e) => {
    if (e.target.className === 'Image') {
      const { x, y } = stageRef.current.getPointerPosition();
      setNewBox({ id: uuidv4(), x, y, width: 0, height: 0, label, color });
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e) => {
    if (newBox) {
      const { x, y } = stageRef.current.getPointerPosition();
      setNewBox((prevBox) => ({
        ...prevBox,
        width: x - prevBox.x,
        height: y - prevBox.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (newBox && (newBox.width > 5 || newBox.height > 5)) {  // Ensure minimum size
      setBoundingBoxes([...boundingBoxes, newBox]);
    }
    setNewBox(null);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    const selectedBox = boundingBoxes.find(box => box.id === id);
    if (selectedBox) {
      setLabel(selectedBox.label);
      setColor(selectedBox.color);
    }
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    setBoundingBoxes(boundingBoxes.map(box =>
      box.id === selectedId ? { ...box, label: e.target.value } : box
    ));
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
    setBoundingBoxes(boundingBoxes.map(box =>
      box.id === selectedId ? { ...box, color: e.target.value } : box
    ));
  };

  const handleDelete = () => {
    setBoundingBoxes(boundingBoxes.filter(box => box.id !== selectedId));
    setSelectedId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedId) {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      trRef.current.nodes([selectedNode]);
      trRef.current.getLayer().batchDraw();
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  return (
    <div style={{ margin: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ marginRight: '10px' }}>
          Label: 
        </label>
        <input 
          type="text" 
          value={label} 
          onChange={handleLabelChange} 
          style={{ marginRight: '10px', padding: '5px' }}
          placeholder="Enter label"
        />
        <label style={{ marginRight: '10px' }}>
          Color: 
        </label>
        <input 
          type="color" 
          value={color} 
          onChange={handleColorChange} 
          style={{ padding: '5px' }}
        />
      </div>
      <Stage
        ref={stageRef}
        width={image ? image.width : 0}
        height={image ? image.height : 0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          <KonvaImage image={image} />
          {boundingBoxes.map((box) => (
            <React.Fragment key={box.id}>
              <Rect
                id={box.id}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                stroke={box.color}
                strokeWidth={2}
                draggable
                onClick={() => handleSelect(box.id)}
                onTap={() => handleSelect(box.id)}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  setBoundingBoxes(boundingBoxes.map(b => 
                    b.id === box.id
                      ? {
                          ...b,
                          x: node.x(),
                          y: node.y(),
                          width: Math.max(5, node.width() * scaleX),
                          height: Math.max(5, node.height() * scaleY),
                        }
                      : b
                  ));
                }}
                onDragEnd={(e) => {
                  const node = e.target;
                  setBoundingBoxes(boundingBoxes.map(b => 
                    b.id === box.id
                      ? {
                          ...b,
                          x: node.x(),
                          y: node.y(),
                        }
                      : b
                  ));
                }}
              />
              <Text
                x={box.x}
                y={box.y - 20}
                text={box.label}
                fontSize={16}
                fill={box.color}
              />
            </React.Fragment>
          ))}
          {newBox && (
            <Rect
              x={newBox.x}
              y={newBox.y}
              width={newBox.width}
              height={newBox.height}
              stroke={newBox.color}
              strokeWidth={2}
              dash={[10, 5]}
            />
          )}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default BoundingBoxImage;
