#!/bin/bash

source ~/say-like-a-native/backend/venv/bin/activate

export PYTHONPATH="${PYTHONPATH}:$(pwd)"

nohup uvicorn main:app