import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';

const BoundingBoxImage = ({ imageUrl }) => {
  const [image] = useImage(imageUrl);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [newBox, setNewBox] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#FF0000');
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [newPolygon, setNewPolygon] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const stageRef = useRef(null);
  const trRef = useRef(null);

  // Reset boundingBoxes and polygons when imageUrl changes
  useEffect(() => {
    setBoundingBoxes([]);
    setPolygons([]);
  }, [imageUrl]);

  const handleMouseDown = (e) => {
    if (isDrawingPolygon) {
      const { x, y } = stageRef.current.getPointerPosition();
      setNewPolygon([...newPolygon, { x, y }]);
      return;
    }

    if (e.target.className === 'Image') {
      const { x, y } = stageRef.current.getPointerPosition();
      setNewBox({ id: uuidv4(), x, y, width: 0, height: 0, label: '', color });
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
    if (newBox && (newBox.width > 5 || newBox.height > 5)) {
      setBoundingBoxes([...boundingBoxes, newBox]);
    }
    setNewBox(null);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    const selectedBox = boundingBoxes.find(box => box.id === id);
    const selectedPolygon = polygons.find(polygon => polygon.id === id);
    if (selectedBox) {
      setLabel(selectedBox.label);
      setColor(selectedBox.color);
    }
    if (selectedPolygon) {
      setLabel(selectedPolygon.label);
      setColor(selectedPolygon.color);
    }
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    setBoundingBoxes(boundingBoxes.map(box =>
      box.id === selectedId ? { ...box, label: e.target.value } : box
    ));
    setPolygons(polygons.map(polygon =>
      polygon.id === selectedId ? { ...polygon, label: e.target.value } : polygon
    ));
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
    setBoundingBoxes(boundingBoxes.map(box =>
      box.id === selectedId ? { ...box, color: e.target.value } : box
    ));
    setPolygons(polygons.map(polygon =>
      polygon.id === selectedId ? { ...polygon, color: e.target.value } : polygon
    ));
  };

  const handleDelete = () => {
    setBoundingBoxes(boundingBoxes.filter(box => box.id !== selectedId));
    setPolygons(polygons.filter(polygon => polygon.id !== selectedId));
    setSelectedId(null);
  };

  const handleExport = () => {
    const exportData = boundingBoxes.map(box => ({
      label: box.label,
      color: box.color,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    }));

    const xml = `
<annotation>
  <folder>images</folder>
  <filename>${imageUrl}</filename>
  <path>${imageUrl}</path>
  <source>
    <database>Unknown</database>
  </source>
  <size>
    <width>${image ? image.width : 0}</width>
    <height>${image ? image.height : 0}</height>
    <depth>3</depth>
  </size>
  <segmented>0</segmented>
  ${exportData.map(box => `
  <object>
    <name>${box.label}</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</truncated>
    <bndbox>
      <xmin>${Math.round(box.x)}</xmin>
      <ymin>${Math.round(box.y)}</ymin>
      <xmax>${Math.round(box.x + box.width)}</xmax>
      <ymax>${Math.round(box.y + box.height)}</ymax>
    </bndbox>
  </object>`).join('\n')}
</annotation>`;

    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.xml';
    document.body.appendChild(a);
    a.click();
    document.bodyNaNpxoveChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedId) {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      windowNaNpxoveEventListener('keydown', handleKeyDown);
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

  const handleFinishPolygon = () => {
    if (newPolygon.length > 2) {
      setPolygons([...polygons, { id: uuidv4(), points: newPolygon, label: '', color }]);
    }
    setNewPolygon([]);
    setIsDrawingPolygon(false);
  };

  const handleStopDrawingPolygon = () => {
    setIsDrawingPolygon(false);
    setNewPolygon([]);
  };

  const handleDragPolygonPoint = (polygonId, pointIndex, x, y) => {
    setPolygons(polygons.map(polygon => 
      polygon.id === polygonId
        ? {
            ...polygon,
            points: polygon.points.map((point, index) =>
              index === pointIndex ? { x, y } : point
            )
          }
        : polygon
    ));
  };

  return (
    <div style={{ margin: '.625rem' }}>
      <div style={{ marginBottom: '.625rem' }}>
        <label style={{ marginRight: '.625rem' }}>
          Label: 
        </label>
        <input 
          type="text" 
          value={label} 
          onChange={handleLabelChange} 
          style={{ marginRight: '.625rem', padding: '.3125rem' }}
          placeholder="Enter label"
        />
        <label style={{ marginRight: '.625rem' }}>
          Color: 
        </label>
        <input 
          type="color" 
          value={color} 
          onChange={handleColorChange} 
          style={{ padding: '.3125rem' }}
        />
        <button onClick={handleExport} style={{ marginLeft: '.625rem' }}>Export</button>
        <button onClick={() => isDrawingPolygon ? handleStopDrawingPolygon() : setIsDrawingPolygon(true)} style={{ marginLeft: '.625rem' }}>
          {isDrawingPolygon ? 'Stop Drawing Polygon' : 'Draw Polygon'}
        </button>
        {isDrawingPolygon && <button onClick={handleFinishPolygon} style={{ marginLeft: '.625rem' }}>Finish Polygon</button>}
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
                  const { x, y } = e.target.position();
                  setBoundingBoxes(boundingBoxes.map(b => 
                    b.id === box.id 
                      ? { ...b, x, y } 
                      : b
                  ));
                }}
              />
              <Text
                text={box.label}
                x={box.x}
                y={box.y - 20}
                fontSize={18}
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
            />
          )}
          {polygons.map((polygon) => (
            <React.Fragment key={polygon.id}>
              <Line
                id={polygon.id}
                points={polygon.points.flatMap(point => [point.x, point.y])}
                closed
                stroke={polygon.color}
                strokeWidth={2}
                onClick={() => handleSelect(polygon.id)}
                onTap={() => handleSelect(polygon.id)}
              />
              {polygon.points.map((point, index) => (
                <Circle
                  key={index}
                  x={point.x}
                  y={point.y}
                  radius={5}
                  fill={polygon.color}
                  draggable
                  onDragMove={(e) => handleDragPolygonPoint(polygon.id, index, e.target.x(), e.target.y())}
                  onDragEnd={(e) => handleDragPolygonPoint(polygon.id, index, e.target.x(), e.target.y())}
                />
              ))}
              <Text
                text={polygon.label}
                x={polygon.points[0].x}
                y={polygon.points[0].y - 20}
                fontSize={18}
                fill={polygon.color}
              />
            </React.Fragment>
          ))}
          {isDrawingPolygon && (
            <Line
              points={newPolygon.flatMap(point => [point.x, point.y])}
              stroke={color}
              strokeWidth={2}
              dash={[4, 4]}
            />
          )}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default BoundingBoxImage;
