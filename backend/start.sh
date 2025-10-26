#!/bin/bash

export PYTHONPATH="${PYTHONPATH}:$(pwd)"

uvicorn main:app