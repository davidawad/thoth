#!/bin/bash

# Clear out any old test containers with label 'thoth_test'
old_containers=$(docker ps -aq --filter "label=thoth_test")
if [ -n "$old_containers" ]; then
    echo "Removing old test containers: $old_containers"
    docker rm -f $old_containers
else
    echo "No old test containers found."
fi

# Build the Docker image using the tester stage
echo "Building Docker image for testing..."
docker build --target tester -t thoth:test .

# Run tests in Docker container
echo "Running tests in Docker container..."
docker run --rm --label thoth_test thoth:test
