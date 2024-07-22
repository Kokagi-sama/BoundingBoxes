# Project: Drawing Bounding Boxes on Images using ReactJS
## Overview
This project showcases a simple setup using ReactJS to draw bounding boxes on images

## Prerequisites
Node.js or nvm (for npm)
IDE or Text Editor (e.g., Visual Studio Code, PyCharm)

## Clone the Repository:
```
git clone https://github.com/Kokagi-sama/BoundingBoxes.git
```

## Easy Setup
Run the batch file `"setup_bounding_box_app.bat"`

## Manual Setup

### React Application
1. Navigate to the Application Directory:
```
cd bounding-box-app
```

2. Install Node Modules:
```
npm install
```

3. Start the React Development Server:
```
npm start
```

#### Note: The React development server will start at http://localhost:3000

## Usage:
- Drag around the object you wish to perform the bounding box.
- Assign the label/class of the bounding box/polygon after creation the boundingbox/polygon by selecting the desired bounding box and clicking on the Textbox next to the `Class:` label in the popup menu and typing the desired label/class .
- Change the color of the class by selecting the desired bounding box and clicking on the Color picker next to the `Color:` label in the popup menu and selecting the desired color.
- Delete the bounding box by pressing the `Del` or `Delete` button while it's being selected or the `Delete` button within the popup menu.
- Change the image you wish to draw the bounding box on by clicking on `Select File` button.
- Export the Pascal VOS (Visual Object Classes) format xml file via the `Export` button.
- Draw Polygons instead of Bounding Boxes via the `Draw Polygon` button.
- Cancel the polygon drawing via the `Cancel Polygon` button.
