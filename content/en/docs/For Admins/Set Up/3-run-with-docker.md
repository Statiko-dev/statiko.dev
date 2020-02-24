---
title: "Run with Docker"
linkTitle: "Run with Docker"
slug: run-with-docker
weight: 3
description: |
  Run Statiko as a Docker container (recommended)
---

{{% pageinfo %}}
Make sure you've addressed all the [pre-requisites](/docs/for-admins/set-up/pre-requisites) before continuing.
{{% /pageinfo %}}

The recommended way to run Statiko is to leverage the official Docker images published on Docker Hub [statiko/statiko](https://hub.docker.com/r/statiko/statiko). These images are based on Alpine Linux and are available for amd64, arm64 and arm32v7.

The Docker images contain both the Statiko binary and the nginx web server, maintained by a process manager running within the container, and are automatically tested.

> This document assumes that you already have Docker (and possibly Docker Compose) available on your server. If you need to install Docker, check the [official documentation](https://docs.docker.com/install/).

# Firewall rules

Statiko requires **inbound ports 80 and 443** (TCP) open to serve web traffic.

Additionally, in order to manage Statiko nodes remotely, ensure that port **2265** (TCP) is open as well. This port can be changed in the configuration file: see [`port`](TODO)

As for **outbound traffic**, Statiko requires making requests to remote servers via HTTPS, which are responding on port 443 (TCP).

# Set up filesystem

Statiko needs to have two Docker volumes where to store persistent data: one for the configuration, and one for the node's data.

Let's start by creating a folder for all of Statiko data, which we'll call the **Statiko root**. We'll be using `/statiko` in this example, although you can use any other folder. Inside the Statiko root, we will create a folder for the configuration and one for the data.

```sh
STATIKO_ROOT="/statiko"
# Configuration
sudo mkdir -p $STATIKO_ROOT/config
sudo chmod 0700 $STATIKO_ROOT/config

# Data
sudo mkdir -p $STATIKO_ROOT/data
```

### About the data folder and temporary file systems

If your server is running within an **Azure Virtual Machine**, or another provider that offers an ephemeral, directly-attached disk, you might consider storing Statiko's data folder in there. Doing this can give you significant performance benefits, thanks to much faster disk I/O.

In fact, as long as the folder containing the configuration data for Statiko is on a durable storage, there is no harm in storing the data folder on a temporary disk. In case the data got lost, Statiko will easily re-create it once the app starts.

Assuming your temporary disk is mounted on `/mnt/data`, to store your Statiko data folder there run:

```sh
# Remove the data folder if it exists already
sudo rm -rf $STATIKO_ROOT/data || true

# The mountpoint for the temporary disk might be different; check with `lsblk`
MOUNTPOINT="/mnt/data"
sudo mkdir -p $MOUNTPOINT/statiko-data
sudo ln -s $MOUNTPOINT/statiko-data $STATIKO_ROOT/data
```

# TLS certificates

Clients (such as the stkcli) can communicate with Statiko nodes using REST APIs, which are used to configure the node: manage sites and apps, check status, etc. This communication happens on port 2265 (configurable with the `port` option), and uses TLS.

Place the TLS certificate in the configuration folder (where `$STATIKO_ROOT` is the path of the Statiko root folder)

- Certificate: `$STATIKO_ROOT/config/node-public.crt`
- Private key: `$STATIKO_ROOT/config/node-private.key`

The path can be changed with the [`tls.node.certificate`](TODO) and [`tls.node.key`](TODO) configuration options, but keep in mind that the paths in the config file are relative to the paths within the Docker container (see below for Docker volume mountpoints).

> If you don't have a TLS certificate, you can generate a self-signed one with this command:
>
> ````sh
> DOMAIN="statiko.mydomain.com"
> echo "Generating TLS cert for: $DOMAIN"
> sudo openssl req -x509 -newkey rsa:4096 -nodes -reqexts SAN -extensions SAN > -sha256 \
>   -config <(sudo cat /etc/ssl/openssl.cnf \
>     <(printf "[SAN]\nsubjectAltName=DNS:${DOMAIN}")) \
>   -days 365 \
>   -keyout $STATIKO_ROOT/config/node-private.key \
>   -out $STATIKO_ROOT/config/node-public.crt \
>   -subj "/CN=${DOMAIN}"
> ````

You will also need to generate a DH Parameters file, which is used by Statiko app as well as by every site running on the server. The file should be placed at `$STATIKO_ROOT/config/dhparams.pem`, a location that can be configured with [`tls.dhparams`](TODO) (but keep in mind the configuration option is relative to the path within the container!).

To generate a dhparams file (this might take a while!):

````sh
sudo sh -c "openssl dhparam 4096 > $STATIKO_ROOT/config/dhparams.pem"
````

> Using the [`tls.node.enabled`](TODO) configuration option, you can disable TLS for the Statiko app, which will listen on the configured port (default is 2265) without encryption. This is **not recommended** for security reasons, but it could be acceptable if management clients can connect to the Statiko node over an encrypted channel (e.g. VPN). When `tls.node.enabled` is false, you don't need to provide a TLS certificate and key for the Statiko node, however you are still **required to provide a dhparams file**.

# Configuration file

Statiko nodes are configured with a YAML file `$STATIKO_ROOT/config/node-config.yaml`.

Many aspects of Statiko nodes and their behaviors are configurable, and the full list of options is available in the [Configuration Options](TODO) article. You can also see an example of a complete configuration file, including optional settings, [here](https://github.com/ItalyPaleAle/Statiko/blob/master/node-config.yaml).

At the very minimum, the configuration file should contain the following values:

```yaml
# Authorization for managing the node
auth:
  # Authorize with a pre-shared key
  psk:
    enabled: yes
    # Pre-shared key, for example a passphrase
    key: ""

  # Authorize with an OAuth 2.0 access token issued by Azure AD
  # If you generate an Azure AD app for authenticating with nodes as a pre-requisite, enable this and then add the Tenant ID and Client ID (App ID) here
  azureAD:
    enabled: yes
    tenantId: ""
    clientId: ""

# Encryption key for secrets. Must be a base64-encoded (standard encoding) key of 128-bit (16 byte).
# Generate it with a command like `openssl rand 16 | base64`
secretsEncryptionKey: ""

# Azure configuration
azure:
  # Service Principal details
  # Complete this section with the details (tenant ID, client/app ID, client secret) for the Service Principal generated in the pre-requisites step
  sp:
    tenantId: ""
    clientId: ""
    clientSecret: ""

  # Azure Storage
  storage:
    # Name of the Storage Account created as a pre-requisite
    account: ""

  # Azure Key Vault
  keyVault:
    # Name of the Key Vault created as a pre-requisite
    name: ""

    # Code signing key
    codesignKey:
      # Name of the code signing key inside the Key Vault (normally, "codesign")
      name: "codesign"

# Node name for the node (choose as you please)
# Normally, this would be automatically set with the hostname; however, hostnames might be random within a Docker container
nodeName: "mynode"
```

# Start the container

Now that everything is configured, we can start the Docker container:

```sh
sudo docker run \
  -d \
  --restart always \
  --name statiko \
  -v $STATIKO_ROOT/config:/etc/statiko \
  -v $STATIKO_ROOT/data:/data \
  -p 80:80 \
  -p 443:443 \
  -p 2265:2265 \
  statiko/statiko:latest
```

If you prefer to use Docker Compose, you can instead use this manifest:

```yaml
version: 3.4

services:
  statiko:
    image: "statiko/statiko:latest"
    restart: "always"
    container_name: "statiko"
    # Ensure that the path is correct based on your Statiko root folder
    volumes:
      - "/statiko/config:/etc/statiko"
      - "/statiko/data:/data"
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

# Next steps

Now that your Statiko node is up and running, you can start creating sites and deploying apps on that. Check out how to [manage sites and apps](TODO).
