#!/bin/bash
set -e

# Configuration
PROJECT_ID="vital-octagon-19612"
REGION="us-central1"
SERVICE_NAME="lookbook-app"

# Ensure we have the environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "Deploying $SERVICE_NAME to Project: $PROJECT_ID in Region: $REGION"

# Deploy Lookbook from Source
# Note: Source is current directory (Lookbook/)
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 1 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GEMINI_API_KEY=$GEMINI_API_KEY"

# Get Service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
echo "Lookbook Application URL: $SERVICE_URL"

echo "Deployment Complete!"
