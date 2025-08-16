#!/bin/bash
set -e

# Configuration
DOCKER_USERNAME="clapptastic"
IMAGE_NAME="manito-debug"
VERSION=$(git describe --tags --always --dirty)
LATEST_TAG="latest"

echo "🐳 Building and pushing ManitoDebug Docker containers"
echo "=================================================="
echo "Docker Username: $DOCKER_USERNAME"
echo "Image Name: $IMAGE_NAME"
echo "Version: $VERSION"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo "⚠️  Not logged into Docker Hub. Please run 'docker login' first."
    echo "   You can create an account at https://hub.docker.com/"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build development image
echo "🔨 Building development image..."
docker build -f Dockerfile.dev -t $DOCKER_USERNAME/$IMAGE_NAME:dev-$VERSION .
docker tag $DOCKER_USERNAME/$IMAGE_NAME:dev-$VERSION $DOCKER_USERNAME/$IMAGE_NAME:dev-$LATEST_TAG

# Build production image
echo "🔨 Building production image..."
docker build -f Dockerfile.prod -t $DOCKER_USERNAME/$IMAGE_NAME:prod-$VERSION .
docker tag $DOCKER_USERNAME/$IMAGE_NAME:prod-$VERSION $DOCKER_USERNAME/$IMAGE_NAME:prod-$LATEST_TAG

# Tag latest versions
docker tag $DOCKER_USERNAME/$IMAGE_NAME:prod-$VERSION $DOCKER_USERNAME/$IMAGE_NAME:$VERSION
docker tag $DOCKER_USERNAME/$IMAGE_NAME:prod-$VERSION $DOCKER_USERNAME/$IMAGE_NAME:$LATEST_TAG

echo ""
echo "✅ Build completed successfully!"
echo ""

# Show built images
echo "📋 Built images:"
docker images | grep $DOCKER_USERNAME/$IMAGE_NAME
echo ""

# Push to Docker Hub
echo "🚀 Pushing images to Docker Hub..."
echo ""

# Push development image
echo "📤 Pushing development image..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:dev-$VERSION
docker push $DOCKER_USERNAME/$IMAGE_NAME:dev-$LATEST_TAG

# Push production image
echo "📤 Pushing production image..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:prod-$VERSION
docker push $DOCKER_USERNAME/$IMAGE_NAME:prod-$LATEST_TAG

# Push version tags
echo "📤 Pushing version tags..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION
docker push $DOCKER_USERNAME/$IMAGE_NAME:$LATEST_TAG

echo ""
echo "🎉 All images pushed successfully!"
echo ""
echo "📋 Available tags:"
echo "   • $DOCKER_USERNAME/$IMAGE_NAME:dev-$VERSION"
echo "   • $DOCKER_USERNAME/$IMAGE_NAME:dev-$LATEST_TAG"
echo "   • $DOCKER_USERNAME/$IMAGE_NAME:prod-$VERSION"
echo "   • $DOCKER_USERNAME/$IMAGE_NAME:prod-$LATEST_TAG"
echo "   • $DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
echo "   • $DOCKER_USERNAME/$IMAGE_NAME:$LATEST_TAG"
echo ""
echo "🚀 Quick start commands:"
echo "   Development: docker run -p 3000-3010:3000-3010 -p 5173-5180:5173-5180 $DOCKER_USERNAME/$IMAGE_NAME:dev-$LATEST_TAG"
echo "   Production:  docker run -p 3000:3000 $DOCKER_USERNAME/$IMAGE_NAME:prod-$LATEST_TAG"
echo ""
echo "📚 Full documentation: https://github.com/Clapptastic/ManitoDebug"
