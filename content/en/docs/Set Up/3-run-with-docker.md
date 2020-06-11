---
title: "Run with Docker"
linkTitle: "Run with Docker"
slug: run-with-docker
weight: 3
description: |
  Run Statiko as a Docker container (recommended)
---

The recommended way to run Statiko is to leverage the official Docker images published on Docker Hub [statiko/statiko](https://hub.docker.com/r/statiko/statiko). These images are based on Alpine Linux and are available for amd64, arm64 and arm32v7.

The Docker images contain both the Statiko binary and the nginx web server, maintained by a process manager running within the container, and are automatically tested.

> This document assumes that you already have Docker (and possibly Docker Compose) available on your server. If you need to install Docker, check the [official documentation](https://docs.docker.com/install/).

> The images in the _statiko/statiko_ repository on Docker Hub are multi-arch, so Docker will pick the correct architecture automatically. However, continuous integration images (including those tagged with `:canary` and those with a tag starting with `:ci`) are available for amd64 only.

## Firewall rules

Statiko requires **inbound ports 80 and 443** (TCP) open to serve web traffic. Most deployments will require these ports to be open to the world.

Additionally, in order to manage Statiko nodes remotely, ensure that port **2265** (TCP) is open as well. Depending on your setup, this port could be restricted to certain IPs only, or you could connect to from the LAN or using a VPN only. This port can be changed in the configuration file: see [`port`](TODO)

As for **outbound traffic**, Statiko requires making requests to remote services via HTTPS, which are responding on port 443 (TCP).

## Set up filesystem

Statiko needs to have at least two Docker volumes where to store persistent data: one for the configuration, and one for the node's data. If you choose to have your app repository (where app bundles are stored) in the local node too, then you need to mount a third volume for that.

Let's start by creating a folder for all of Statiko data, which we'll call the **Statiko root**. We'll be using `/statiko` in this example, although you can use any other folder. Inside the Statiko root, we will create a folder for the configuration and one for the data.

```sh
export STATIKO_ROOT="/statiko"

# Configuration
sudo mkdir -p $STATIKO_ROOT/config
sudo chmod 0700 $STATIKO_ROOT/config

# Data
sudo mkdir -p $STATIKO_ROOT/data

# App repository (when storing it locally)
sudo mkdir -p $STATIKO_ROOT/repo
```

### About the data folder and temporary file systems

If your server is running within a platform that offers an ephemeral, directly-attached disk (e.g. Azure Virtual Machines), you might consider storing Statiko's data folder in there. Doing this can give you significant performance benefits, thanks to much faster disk I/O.

In fact, as long as the folder containing the configuration data for Statiko is on a durable storage, there is no harm in storing the data folder on a temporary disk. In case the data got lost, Statiko will easily re-create it as soon as the node starts.

Assuming your temporary disk is mounted on `/mnt/data`, to store your Statiko data folder there run:

```sh
# Remove the data folder if it exists already
sudo rm -rf $STATIKO_ROOT/data || true

# The mountpoint for the temporary disk might be different; check with `lsblk`
MOUNTPOINT="/mnt/data"
sudo mkdir -p $MOUNTPOINT/statiko-data
sudo ln -s $MOUNTPOINT/statiko-data $STATIKO_ROOT/data
```

## TLS configuration for the node

Clients (such as the stkcli) can communicate with Statiko nodes using REST APIs, which are used to configure the node: manage sites and apps, check status, etc. This communication happens on port 2265 (configurable with the [`port`](TODO) option) and uses TLS.

Statiko can automatically generate TLS certificates for the node's management interface, using the value of [`nodeName`](TODO) as hostname. If ACME (Let's Encrypt) is enabled, Statiko can request a certificate signed by the ACME authority. Otherwise, Statiko will generate a self-signed certificate.

Alternatively, you can provide your own TLS certificate for the node's management interface: see [Node TLS configuration](/docs/how-to/node-tls-configuration).

## Configuration file

Statiko nodes are configured with a YAML file `$STATIKO_ROOT/config/node-config.yaml`.

Many aspects of Statiko nodes and their behaviors are configurable, and the full list of options is available in the [Configuring nodes](/docs/set-up/configuring-nodes) article.

At the very minimum, the configuration file `$STATIKO_ROOT/config/node-config.yaml` for Statiko running as a Docker container and using a local repo for app bundles should contain the following values:

```yaml
# Authorization for managing the node
auth:
  # Authorize with a pre-shared key
  psk:
    enabled: yes
    # Pre-shared key, for example a passphrase
    key: ""

# App repository configuration
repo:
  # Store apps on the local disk
  type: "local"
  # Configuration for repositories of type "local"
  local:
    # Path to the app repository mounted inside the container
    path: "/repo"

# Encryption key for secrets. Must be a base64-encoded (standard encoding) key of 128-bit (16 byte).
# Generate it with a command like `openssl rand 16 | base64`
secretsEncryptionKey: ""

# Name for the node (choose as you please)
# Normally, this would be automatically set with the hostname; however, hostnames are usually random strings within a Docker container
nodeName: "mynode.example.com"
```

## Start the container

Now that everything is configured, we can start the Docker container:

```sh
sudo docker run \
  -d \
  --restart always \
  --name statiko \
  -v $STATIKO_ROOT/config:/etc/statiko \
  -v $STATIKO_ROOT/data:/data \
  -v $STATIKO_ROOT/repo:/repo \
  -p 80:80 \
  -p 443:443 \
  -p 2265:2265 \
  statiko/statiko:0.5
```

If you prefer to use Docker Compose, you can instead use this manifest. Ensure that the path on the local filesystem is correct based on your Statiko root folder (e.g. `/statiko`):

```yaml
version: 3.4

services:
  statiko:
    image: "statiko/statiko:0.5"
    restart: "always"
    container_name: "statiko"
    volumes:
      - "/statiko/config:/etc/statiko"
      - "/statiko/data:/data"
      - "/statiko/repo:/repo"
    ports:
      - "80:80"
      - "443:443"
      - "2265:2265"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Once the container has started, you can test that everything works by running sample commands like this from your server:

```sh
# Should show the status of the node
curl -k https://localhost/status
```

### There's no `:latest` tag

As a conscious decision, we do not publish a `:latest` tag in Docker Hub for Statiko. Experience with other infrastructure applications shows that many users automatically update their containers, and so publishing a `:latest` tag can wreck havoc when breaking changes are introduced.

Statiko follows the [semver](https://semver.org/) principles. This means that when the major version is updated, such as from 1.x to 2.x, there are breaking changes with the application, and your Statiko node configuration and state would likely require manual updating. For versions before 1.0, breaking changes can occur when the minor version changes too (e.g. from 0.4.x to 0.5.x).

When pulling Statiko from Docker Hub, you should pick a branch, for example `:0.5` (in the future, we'll have `0:6`, `:1`, `:2`, etc). We guarantee that all new container images pushed to that branch will never include breaking changes, so you can rest assured your Statiko cluster won't break because of an automatic update.

## Next steps

Now that your Statiko node is up and running, you can start creating sites and deploying apps on that. Check out how to [manage sites and apps](TODO).
