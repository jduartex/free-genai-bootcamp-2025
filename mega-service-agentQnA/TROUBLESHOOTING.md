# Troubleshooting Guide

## Docker Build Issues

### Manifold3D Package Build Failure

**Problem:** When building the Docker image, you may encounter errors related to the `manifold3d` package:

**Solution:** To resolve this issue, you can try the following steps:
1. Ensure that you have the latest version of Docker installed.
2. Check if the `manifold3d` package has any specific dependencies that need to be installed.
3. Try building the Docker image again after installing the required dependencies.

## Docker Run Issues

### Container Fails to Start

**Problem:** After building the Docker image, the container fails to start.

**Solution:** To resolve this issue, you can try the following steps:
1. Check the Docker logs for any error messages.
2. Ensure that all required environment variables are set correctly.
3. Verify that the necessary ports are open and not being used by other services.

## Docker Network Issues

### Unable to Connect to Container

**Problem:** You are unable to connect to the running container.

**Solution:** To resolve this issue, you can try the following steps:
1. Check if the container is running by using the `docker ps` command.
2. Ensure that the container's network settings are configured correctly.
3. Verify that the host machine's firewall is not blocking the connection.

## Docker Volume Issues

### Data Not Persisting

**Problem:** Data is not persisting between container restarts.

**Solution:** To resolve this issue, you can try the following steps:
1. Ensure that you are using Docker volumes to persist data.
2. Check if the volume is mounted correctly in the container.
3. Verify that the data is being written to the correct location within the container.

