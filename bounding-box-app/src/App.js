import React, { useState } from 'react';
import BoundingBoxImage from './BoundingBoxImage';
import defaultImage from './assets/dog_bike_car.jpg';

const App = () => {
  const [imageUrl, setImageUrl] = useState(defaultImage);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ margin: '1.25rem' }}>
      <h1 style={{ margin: '.625rem' }}>Draw Bounding Box on Image</h1>
      <input style={{ margin: '.625rem' }} type="file" accept="image/*" onChange={handleImageUpload} />
      <BoundingBoxImage imageUrl={imageUrl} />
    </div>
  );
};

export default App;
