#!/bin/bash

# Default values
DEFAULT_BUCKET_NAME="url-shortener-frontend-website"
DEFAULT_PROFILE="gutkedu-terraform"
FRONTEND_DIR="front"
SRC_DIR="$FRONTEND_DIR/src"

# Parse command line arguments
BUCKET_NAME=$DEFAULT_BUCKET_NAME
PROFILE=$DEFAULT_PROFILE

# Show usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -b, --bucket BUCKET_NAME  Specify the S3 bucket name (default: $DEFAULT_BUCKET_NAME)"
  echo "  -p, --profile PROFILE     Specify the AWS CLI profile (default: $DEFAULT_PROFILE)"
  echo "  -h, --help                Show this help message"
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--bucket)
      BUCKET_NAME="$2"
      shift 2
      ;;
    -p|--profile)
      PROFILE="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      ;;
  esac
done

echo "===== Deploying frontend to S3 bucket: $BUCKET_NAME (using AWS profile: $PROFILE)"

# Check if the frontend directory exists
if [ ! -d "$SRC_DIR" ]; then
  echo "Error: Frontend source directory '$SRC_DIR' not found!"
  exit 1
fi

# Upload files to S3 without ACLs
echo "Syncing files with S3 bucket..."
echo "SRC_DIR: $SRC_DIR"

# Use sync without the --acl flag
aws s3 sync "$SRC_DIR/" "s3://$BUCKET_NAME/" --delete --profile $PROFILE

# Set content types for specific files if needed
echo "Setting content types..."
aws s3 cp "s3://$BUCKET_NAME/app.js" "s3://$BUCKET_NAME/app.js" --content-type "application/javascript" --metadata-directive REPLACE --profile $PROFILE
aws s3 cp "s3://$BUCKET_NAME/styles.css" "s3://$BUCKET_NAME/styles.css" --content-type "text/css" --metadata-directive REPLACE --profile $PROFILE

echo "Deployment complete!"