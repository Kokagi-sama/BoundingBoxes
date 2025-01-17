//Import dependencies
import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';

//Random Number Generators
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

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
  const [classes, setClasses] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const colorMap = useRef({});
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [hoveringFirstPoint, setHoveringFirstPoint] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    setBoundingBoxes([]);
    setPolygons([]);
  }, [imageUrl]);

  //Mouse functions
  const handleMouseDown = (e) => {
    if (isDrawingPolygon) {
      const { x, y } = stageRef.current.getPointerPosition();
      if (newPolygon.length > 0 && Math.hypot(x - newPolygon[0].x, y - newPolygon[0].y) < 10) {
        handleFinishPolygon();
      } else {
        setNewPolygon([...newPolygon, { x, y }]);
      }
      return;
    }

    if (e.target.className === 'Image') {
      const { x, y } = stageRef.current.getPointerPosition();
      setNewBox({ id: uuidv4(), x, y, width: 0, height: 0, label: '', color });
      setSelectedId(null);
      setShowMenu(false);
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
  
    if (isDrawingPolygon && newPolygon.length > 0) {
      const { x, y } = stageRef.current.getPointerPosition();
      setCurrentMousePos({ x, y });
      const firstPoint = newPolygon[0];
      const distance = Math.hypot(x - firstPoint.x, y - firstPoint.y);
      setHoveringFirstPoint(distance < 10);
    }
  };
  
  const handleMouseUp = (e) => {
    if (newBox && (newBox.width > 5 || newBox.height > 5)) {
      const { x, y } = stageRef.current.getPointerPosition();
      setMenuPosition({ x, y });
      setShowMenu(true);
      setBoundingBoxes([...boundingBoxes, newBox]);
      setSelectedId(newBox.id);
      setLabel(''); // Clear the text field each time the menu pops up
    }
    setNewBox(null);
  };

  const handleSelect = (id, type, x, y) => {
    if (isDrawingPolygon) return; // Prevent selection while drawing a polygon
  
    setSelectedId(id);
    setMenuPosition({ x, y });
    setShowMenu(true);
  
    const index = getIdIndex(id);
    setSelectedIndex(index);
  
    if (type === 'box') {
      const selectedBox = boundingBoxes.find(box => box.id === id);
      if (selectedBox) {
        setLabel(selectedBox.label);
        setColor(selectedBox.color);
      }
    } else if (type === 'polygon') {
      const selectedPolygon = polygons.find(polygon => polygon.id === id);
      if (selectedPolygon) {
        setLabel(selectedPolygon.label);
        setColor(selectedPolygon.color);
      }
    }
  };
  
  const getIdIndex = (id) => {
    const boxIndex = boundingBoxes.findIndex(box => box.id === id);
    if (boxIndex !== -1) return boxIndex;
    return boundingBoxes.length + polygons.findIndex(polygon => polygon.id === id);
  };
  

  //Label change function
  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    const newColor = colorMap.current[newLabel] || generateRandomColor();
    if (!colorMap.current[newLabel]) {
      colorMap.current[newLabel] = newColor;
    }
    setColor(newColor);

    setBoundingBoxes(boundingBoxes.map(box =>
      box.id === selectedId ? { ...box, label: newLabel, color: newColor } : box
    ));
    setPolygons(polygons.map(polygon =>
      polygon.id === selectedId ? { ...polygon, label: newLabel, color: newColor } : polygon
    ));
  };

  //Color change function
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
  
    setBoundingBoxes(boundingBoxes.map(box =>
      box.label === label ? { ...box, color: newColor } : box
    ));
    setPolygons(polygons.map(polygon =>
      polygon.label === label ? { ...polygon, color: newColor } : polygon
    ));
    colorMap.current[label] = newColor;
  };
  
  const handleDelete = () => {
    setBoundingBoxes(boundingBoxes.filter(box => box.id !== selectedId));
    setPolygons(polygons.filter(polygon => polygon.id !== selectedId));
    setSelectedId(null);
    setShowMenu(false);
  };

  const handleExport = () => {
    const exportData = boundingBoxes.map(box => ({
      type: 'box',
      label: box.label,
      color: box.color,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      occluded: 0,
      truncated: 0,
      difficult: 0
    })).concat(polygons.map(polygon => ({
      type: 'polygon',
      label: polygon.label,
      color: polygon.color,
      points: polygon.points,
      occluded: 0,
      truncated: 0,
      difficult: 0,
      xmin: Math.min(...polygon.points.map(point => point.x)),
      xmax: Math.max(...polygon.points.map(point => point.x)),
      ymin: Math.min(...polygon.points.map(point => point.y)),
      ymax: Math.max(...polygon.points.map(point => point.y))
    })));
  
    const xml = `<annotation>
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
    <segmented>0</segmented>${exportData.map(data => data.type === 'box' ? `
    <object>
      <name>${data.label}</name>
      <pose>Unspecified</pose>
      <truncated>${data.truncated}</truncated>
      <difficult>${data.difficult}</difficult>
      <occluded>${data.occluded}</occluded>
      <bndbox>
        <xmin>${Math.round(data.x)}</xmin>
        <ymin>${Math.round(data.y)}</ymin>
        <xmax>${Math.round(data.x + data.width)}</xmax>
        <ymax>${Math.round(data.y + data.height)}</ymax>
      </bndbox>
    </object>` : `
    <object>
      <name>${data.label}</name>
      <pose>Unspecified</pose>
      <truncated>${data.truncated}</truncated>
      <difficult>${data.difficult}</difficult>
      <occluded>${data.occluded}</occluded>
      <polygon>${data.points.map((point, index) => `
        <x${index + 1}>${Math.round(point.x)}</x${index + 1}>
        <y${index + 1}>${Math.round(point.y)}</y${index + 1}>`).join('')}
      </polygon>
      <bndbox>
        <xmin>${Math.round(data.xmin)}</xmin>
        <ymin>${Math.round(data.ymin)}</ymin>
        <xmax>${Math.round(data.xmax)}</xmax>
        <ymax>${Math.round(data.ymax)}</ymax>
      </bndbox>
    </object>`).join('')}
</annotation>`;
  
    const blob = new Blob([xml.trim()], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  //Polygon functions
  const handleFinishPolygon = () => {
    if (newPolygon.length > 2) {
      const newPoly = { id: uuidv4(), points: newPolygon, label: '', color };
      setPolygons([...polygons, newPoly]);
      setMenuPosition({ x: newPolygon[0].x, y: newPolygon[0].y });
      setSelectedId(newPoly.id);
      setShowMenu(true);
      setLabel(""); // Reset the text field
    }
    setNewPolygon([]);
    setIsDrawingPolygon(false);
    setHoveringFirstPoint(false); // Reset hovering state
  };
  
  const handleStopDrawingPolygon = () => {
    setIsDrawingPolygon(false);
    setNewPolygon([]);
    setHoveringFirstPoint(false); // Reset hovering state
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

  const handleDragEnd = (e, type) => {
    const id = e.target.id();
    const node = e.target;
  
    if (type === 'box') {
      setBoundingBoxes(boundingBoxes.map(box =>
        box.id === id ? { ...box, x: node.x(), y: node.y() } : box
      ));
    } else if (type === 'polygon') {
      const polygon = polygons.find(polygon => polygon.id === id);
      if (!polygon) return;
  
      const deltaX = node.x();
      const deltaY = node.y();
  
      const newPoints = polygon.points.map(point => ({
        x: point.x + deltaX,
        y: point.y + deltaY
      }));
  
      node.position({ x: 0, y: 0 });
  
      setPolygons(polygons.map(polygon =>
        polygon.id === id ? { ...polygon, points: newPoints } : polygon
      ));
    }
  };  
    
  //Label/Class (Menu Popup) functions
  const handleClassSelect = (className) => {
    const selectedColor = colorMap.current[className] || generateRandomColor();
    if (!colorMap.current[className]) {
      colorMap.current[className] = selectedColor;
    }
    setLabel(className);
    setColor(selectedColor);

    setBoundingBoxes(boundingBoxes.map(box =>
      box.id === selectedId ? { ...box, label: className, color: selectedColor } : box
    ));
    setPolygons(polygons.map(polygon =>
      polygon.id === selectedId ? { ...polygon, label: className, color: selectedColor } : polygon
    ));
    setShowMenu(false);
  };

  const handleNewClassSubmit = (e) => {
    e.preventDefault();
    const className = label.trim();
    if (className && !classes.includes(className)) {
      setClasses([...classes, className]);
      colorMap.current[className] = color;
    }
    setShowMenu(false);
  };

  //Navigation functions
  const handleNext = () => {
    if (selectedIndex !== null) {
      const nextIndex = selectedIndex + 1;
      if (nextIndex < boundingBoxes.length + polygons.length) {
        setSelectedIndex(nextIndex);
        setSelectedId(getIdByIndex(nextIndex));
      }
    }
  };
  
  const handlePrevious = () => {
    if (selectedIndex !== null) {
      const prevIndex = selectedIndex - 1;
      if (prevIndex >= 0) {
        setSelectedIndex(prevIndex);
        setSelectedId(getIdByIndex(prevIndex));
      }
    }
  };

  //For the actual menu navigation
  const getIdByIndex = (index) => {
    if (index < boundingBoxes.length) {
      return boundingBoxes[index].id;
    }
    return polygons[index - boundingBoxes.length].id;
  };

  const handleTransformPolygon = (e, polygonId) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const deltaX = node.x();
    const deltaY = node.y();
  
    const newPoints = polygons
      .find(polygon => polygon.id === polygonId)
      .points.map((point) => {
        const x = point.x * scaleX;
        const y = point.y * scaleY;
        const rad = (rotation * Math.PI) / 180;
        return {
          x: (x * Math.cos(rad) - y * Math.sin(rad)) + deltaX,
          y: (x * Math.sin(rad) + y * Math.cos(rad)) + deltaY,
        };
      });
  
    node.scaleX(1);
    node.scaleY(1);
    node.rotation(0);
    node.position({ x: 0, y: 0 });
  
    setPolygons(polygons.map(polygon =>
      polygon.id === polygonId ? { ...polygon, points: newPoints } : polygon
    ));
  };
    
  //Html/UI
  return (
    <div>
      <div style={{ padding: '1.25 rem' }}>
        <button onClick={() => {
          if (isDrawingPolygon) {
            handleStopDrawingPolygon();
          } else {
            setIsDrawingPolygon(true);
          }
        }} style = {{margin: '.625rem'}}>
          {isDrawingPolygon ? 'Cancel Polygon' : 'Draw Polygon'}
        </button>
        <button onClick={handleExport} style = {{margin: '.625rem'}}>Export</button>
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
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
              onClick={(e) => handleSelect(box.id, 'box', e.evt.clientX, e.evt.clientY)}
              onDragEnd={(e) => handleDragEnd(e, 'box')}
            />
            <Text
              x={box.x}
              y={box.y - 20}
              text={box.label}
              fontSize={14}
              fill={box.color}
              stroke="black"
              strokeWidth={1}
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
            points={polygon.points.flatMap(p => [p.x, p.y])}
            stroke={polygon.color}
            strokeWidth={2}
            closed
            draggable
            onClick={(e) => handleSelect(polygon.id, 'polygon', e.evt.clientX, e.evt.clientY)}
            onDragEnd={(e) => handleDragEnd(e, 'polygon')}
            onTransformEnd={(e) => handleTransformPolygon(e, polygon.id)}
          />
            {polygon.points.map((point, index) => (
              <Circle
                key={`${polygon.id}-${index}`}
                x={point.x}
                y={point.y}
                radius={5}
                fill={polygon.color}
                draggable
                onDragMove={(e) => handleDragPolygonPoint(polygon.id, index, e.target.x(), e.target.y())}
              />
            ))}
            <Text
              x={polygon.points[0].x}
              y={polygon.points[0].y - 20}
              text={polygon.label}
              fontSize={14}
              fill={polygon.color}
              stroke="black"
              strokeWidth={1}
            />
          </React.Fragment>
        ))}
            {newPolygon.length > 0 && (
            <>
              <Line
                points={[...newPolygon.flatMap(p => [p.x, p.y]), currentMousePos.x, currentMousePos.y]}
                stroke={color}
                strokeWidth={2}
              />
              {newPolygon.map((point, index) => (
                <Circle
                  key={`new-point-${index}`}
                  x={point.x}
                  y={point.y}
                  radius={5}
                  fill={index === 0 && hoveringFirstPoint ? 'green' : color}  // Change color of the first point
                />
              ))}
            </>
          )}
          <Transformer ref={trRef} />
        </Layer>
      </Stage>
      {showMenu && selectedIndex !== null && (
      <div style={{
        position: 'absolute',
        top: menuPosition.y,
        left: menuPosition.x,
        backgroundColor: 'white',
        padding: '.625rem',
        border: '.0625rem solid black',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '.625rem' }}>
          <button onClick={handlePrevious} disabled={selectedIndex === 0}>←</button>
          <span style={{ margin: '0 .625rem' }}>
            {selectedIndex + 1}/{boundingBoxes.length + polygons.length}
          </span>
          <button onClick={handleNext} disabled={selectedIndex === boundingBoxes.length + polygons.length - 1}>→</button>
        </div>
        <label style = {{margin: '.625rem'}}>
          Class:
          <input style = {{margin: '.625rem'}} type="text" value={label} onChange={handleLabelChange} />
        </label>
        <label style = {{margin: '.625rem'}}>
          Color:
          <input style = {{margin: '.625rem'}} type="color" value={color} onChange={handleColorChange} />
        </label>
        <button style = {{margin: '.625rem'}} onClick={handleDelete}>Delete</button>
        <div style = {{margin: '.625rem'}}>
          Existing Classes:
          <ul style = {{margin: '.125rem'}}>
            {classes.map(className => (
              <li key={className}>
                <button onClick={() => handleClassSelect(className)}>{className}</button>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleNewClassSubmit}>
          <button type="submit">Add Class</button>
        </form>
      </div>
    )}

    </div>
  );
};

export default BoundingBoxImage;
