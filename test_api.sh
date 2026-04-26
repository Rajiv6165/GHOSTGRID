#!/bin/bash

# Test API Script for GhostGrid Backend
# Usage: ./test_api.sh

echo "========================================"
echo "GhostGrid API Testing Script"
echo "========================================"
echo

# API Base URL
API_URL="http://127.0.0.1:8000/api"

echo "Testing API endpoints..."
echo

# Test 1: GET all boards (List all)
echo "1. Testing GET /boards/ (List all boards)"
echo "----------------------------------------"
curl -v -L "${API_URL}/boards/"
echo
echo

# Test 2: GET specific board (Get one)
echo "2. Testing GET /boards/board-netflix/ (Get specific board)"
echo "----------------------------------------"
curl -v -L "${API_URL}/boards/board-netflix/"
echo
echo

# Test 3: POST new board (Create new)
echo "3. Testing POST /boards/ (Create new board)"
echo "----------------------------------------"
curl -v -L -X POST \
  "${API_URL}/boards/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Board from API",
    "data": {
      "nodes": [],
      "edges": []
    }
  }'
echo
echo

echo "========================================"
echo "API Testing Complete!"
echo "========================================"