#!/bin/bash
cd /home/kavia/workspace/code-generation/splitquest-107914-e48622fe/frontend_web_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

