#!/bin/bash

# Government Portal Frontend Startup Script

echo "==================================="
echo "Government Portal Frontend Setup"
echo "==================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js version 14 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 14 ]; then
    echo "Error: Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm -v)"

# Navigate to project directory
cd "$(dirname "$0")"

echo "✓ Project directory: $(pwd)"

# Clean up any previous installation issues
if [ -d "node_modules" ]; then
    echo "Cleaning up previous installation..."
    rm -rf node_modules package-lock.json
fi

echo ""
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies."
    exit 1
fi

echo "✓ Dependencies installed successfully"

echo ""
echo "==================================="
echo "Starting Government Portal..."
echo "==================================="
echo ""
echo "The application will open in your browser at:"
echo "http://localhost:3000"
echo ""
echo "Note: Fast refresh is disabled to avoid module resolution issues"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server with environment variables
FAST_REFRESH=false npm start