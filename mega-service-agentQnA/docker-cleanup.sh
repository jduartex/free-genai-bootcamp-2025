#!/bin/bash
# Script to stop and optionally clean up Docker resources

# Function to print section headers
print_section() {
    echo ""
    echo "=============================="
    echo "$1"
    echo "=============================="
}

print_section "Docker Cleanup Utility"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker daemon is not running."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Display running containers
echo "Currently running containers:"
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}"

# Stop all running containers
print_section "Stopping Containers"
echo "Stopping all running Docker containers..."

RUNNING_CONTAINERS=$(docker ps -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
    docker stop $RUNNING_CONTAINERS
    echo "✅ All containers stopped successfully"
else
    echo "ℹ️ No running containers found"
fi

# Ask about removing containers
print_section "Container Removal Options"
read -p "Do you want to remove all stopped containers? (y/N): " remove_containers

if [[ $remove_containers =~ ^[Yy]$ ]]; then
    echo "Removing all stopped containers..."
    docker container prune -f
    echo "✅ All stopped containers have been removed"
fi

# Ask about image cleanup
print_section "Image Cleanup Options"
echo "1) Keep all images (default)"
echo "2) Remove unused images (preserves tagged images)"
echo "3) Remove all images (complete cleanup)"
read -p "Select an option [1-3]: " image_cleanup

case $image_cleanup in
    2)
        echo "Removing unused images..."
        docker image prune -f
        echo "✅ Unused images removed"
        ;;
    3)
        echo "⚠️ WARNING: This will remove ALL Docker images ⚠️"
        read -p "Are you sure? Type 'yes' to confirm: " confirmation
        if [ "$confirmation" = "yes" ]; then
            echo "Removing all images..."
            docker rmi $(docker images -q) -f
            echo "✅ All images removed"
        else
            echo "Operation canceled"
        fi
        ;;
    *)
        echo "Keeping all images"
        ;;
esac

# Show final status
print_section "Cleanup Complete"
echo "Remaining containers:"
docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Image}}"

echo "Remaining images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}"
