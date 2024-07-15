@echo off
echo Setting up and running the application...

:: Navigate to the React app directory
cd bounding-box-app

:: Attempt to install dependencies
cmd.exe /c npm install || (
  echo There was an error installing dependencies.
)

:: Start the React development server regardless of previous success
npm start || (
  echo There was an error starting the development server.
)

:: Pause to keep the terminal open
pause