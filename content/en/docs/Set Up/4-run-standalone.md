---
title: "Run as a standalone app"
linkTitle: "Run as a standalone app"
slug: run-standalone
weight: 4
description: |
  Run Statiko as a standalone app
---

{{% pageinfo %}}
Make sure you've addressed all the [pre-requisites](/docs/set-up/pre-requisites) before continuing.
{{% /pageinfo %}}

You can run Statiko as a standalone app, alongside the nginx web server, on any Linux server. Statiko binaries are available [pre-compiled](/docs/downloads) for Linux server based on amd64/x86_64, arm32v7/armhf and arm64/aarch64.

Statiko should work with most Linux distributions, including those based on musl libc (like Alpine). The only two requirements are:

- The **[nginx](https://nginx.org) web server** must be pre-installed, version **1.14 or higher** (for http/2 support). Statiko is tested primarily against the "stable" branch of nginx, but it should work with the "mainline" branch as well. <br/>Most Linux distributions have pre-compiled packages for nginx available.
- You need a process manager, such as **Systemd** (recommended). Other process manager, such as SysV Init, could work, but you will need to write your own unit files/scripts, as the example below contains only a Systemd unit.<br/>Most modern Linux distributions come with Systemd out-of-the-box.

> Note: running Statiko using the official Docker container images is the [recommended approach](/docs/set-up/run-with-docker) for most users.

## Firewall rules

Statiko requires **inbound ports 80 and 443** (TCP) open to serve web traffic.

Additionally, in order to manage Statiko nodes remotely, ensure that port **2265** (TCP) is open as well. This port can be changed in the configuration file: see [`port`](TODO)

As for **outbound traffic**, Statiko requires making requests to remote servers via HTTPS, which are responding on port 443 (TCP).

## Download Statiko

Download the last Statiko release:

```sh
# Architecture to use
# Options are "amd64" (aka x86_64), "arm64v8" (aka aarch64) or "arm32v7" (aka armhf)
ARCH="amd64"

# Get the latest release's URL from the GitHub API
# Note: make sure the "jq" application is installed
URL=$(curl -s https://api.github.com/repos/ItalyPaleAle/Statiko/releases/latest -H "Accept: application/vnd.github.v3+json" \
  | jq -r ".assets[] | select(.name | test(\"linux_$ARCH\")) | .browser_download_url")
echo "Downloading Statiko: $URL"
sudo curl -L "$URL" -o /usr/local/sbin/statiko
sudo chmod +x /usr/local/sbin/statiko
```

## Set up filesystem

Statiko by defaults stores its configuration in `/etc/statiko` (*configuration folder*), and its data in `/var/statiko` (*data folder*). Both those locations are configurable, however.

Let's start by creating the folders:

```sh
# Configuration
sudo mkdir /etc/statiko
sudo chmod 0700 /etc/statiko

# Touch the state file to set the right permissions
sudo touch /etc/statiko/state.json
sudo chmod 0600 /etc/statiko/state.json

# Data
sudo mkdir /var/statiko
```

### About the data folder and temporary file systems

If your server is running within an **Azure Virtual Machine**, or another provider that offers an ephemeral, directly-attached disk, you might consider storing Statiko's data folder in there. Doing this can give you significant performance benefits, thanks to much faster disk I/O.

In fact, as long as the folder containing the configuration data for Statiko is on a durable storage, there is no harm in storing the data folder on a temporary disk. In case the data got lost, Statiko will easily re-create it once the app starts.

Assuming your temporary disk is mounted on `/mnt/data`, to store your Statiko data folder there run:

```sh
# Remove the data folder if it exists already
sudo rm -rf /var/statiko || true

# The mountpoint for the temporary disk might be different; check with `lsblk`
MOUNTPOINT="/mnt/data"
sudo mkdir -p $MOUNTPOINT/statiko-data
sudo ln -s $MOUNTPOINT/statiko-data /var/statiko
```

## TLS certificates

Clients (such as the stkcli) can communicate with Statiko nodes using REST APIs, which are used to configure the node: manage sites and apps, check status, etc. This communication happens on port 2265 (configurable with the [`port`](TODO) option), and uses TLS.

Place the TLS certificate in the configuration folder:

- Certificate: `/etc/statiko/node-public.crt`
- Private key: `/etc/statiko/node-private.key`

These locations can be changed with the [`tls.node.certificate`](TODO) and [`tls.node.key`](TODO) configuration options.

> If you don't have a TLS certificate, you can generate a self-signed one with this command:
>
> ````sh
> export DOMAIN="statiko.mydomain.com"
> echo "Generating TLS cert for: $DOMAIN"
> cat <<HEREDOC | sudo bash
>   openssl req -x509 \
>     -newkey rsa:4096 \
>     -nodes \
>     -reqexts SAN \
>     -extensions SAN \
>     -sha256 \
>     -config <(cat /etc/ssl/openssl.cnf \
>       <(printf "[SAN]\nsubjectAltName=DNS:${DOMAIN}")) \
>     -days 365 \
>     -keyout /etc/statiko/node-private.key \
>     -out /etc/statiko/node-public.crt \
>     -subj "/CN=${DOMAIN}"
> HEREDOC
> ````

You will also need to generate a DH Parameters file, which is used by Statiko app as well as by every site running on the server. The file should be placed at `/etc/statiko/dhparams.pem`, a location that can be configured with [`tls.dhparams`](TODO).

To generate a dhparams file (this might take a while!):

````sh
sudo sh -c "openssl dhparam 4096 > /etc/statiko/dhparams.pem"
````

> Using the [`tls.node.enabled`](TODO) configuration option, you can disable TLS for the Statiko app, which will listen on the configured port (default is 2265) without encryption. This is **not recommended** for security reasons, but it could be acceptable if management clients can connect to the Statiko node over an encrypted channel (e.g. VPN). When `tls.node.enabled` is false, you don't need to provide a TLS certificate and key for the Statiko node, however you are still **required to provide a dhparams file**.

## Configuration file

Statiko nodes are configured with a YAML file `/etc/statiko/node-config.yaml`

Many aspects of Statiko nodes and their behaviors are configurable, and the full list of options is available in the [Configuring nodes](/docs/set-up/connfiguring-nodes) article.

At the very minimum, the configuration file `/etc/statiko/node-config.yaml` for Statiko running as a standalone app should contain the following values (file must be owned by the root user):

```yaml
# Authorization for managing the node
auth:
  # Authorize with a pre-shared key
  psk:
    enabled: yes
    # Pre-shared key, for example a passphrase
    key: ""

  # Authorize with an OAuth 2.0 access token issued by Azure AD
  # If you generated an Azure AD app for authenticating with nodes as a pre-requisite, enable this and then add the Tenant ID and Client ID (App ID) here
  azureAD:
    enabled: yes
    tenantId: ""
    clientId: ""

# Encryption key for secrets. Must be a base64-encoded (standard encoding) key of 128-bit (16 byte).
# Generate it with a command like `openssl rand 16 | base64`
secretsEncryptionKey: ""

# Configuration for the nginx webserver
nginx:
  # User running nginx
  # This depends on your Linux distribution; it's usually "www-data" or "nginx"
  user: "www-data"
  # Shell commands to start/stop/restart(reload) nginx, and to check its status
  commands:
    # This command should start the nginx server
    # Another common option is "service nginx start"
    start: "systemctl start nginx"
    # This command should send a SIGHUP (reload config) to nginx if it's running, or start it if it's not
    # Another common option is "service nginx status > /dev/null && service nginx reload || service nginx restart"
    restart: "systemctl is-active --quiet nginx && systemctl reload nginx || systemctl restart nginx"
    # This command should print "1" if nginx is running, or "0" otherwise
    # Another common option is "service nginx status > /dev/null && echo 1 || echo 0"
    status: "systemctl is-active --quiet nginx && echo 1 || echo 0"
    # This command should test the nginx configuration file, printing only if there's an error
    test: "nginx -t -q"

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

# Name for the node (choose as you please)
# If nil, it will default to the system's hostname
nodeName: nil
```

## Run Statiko as a background service

This section shows how to run Statiko as a background service, using Systemd.

Copy this unit file to `/etc/systemd/system/statiko.service` (file must be owned by the root user):

```text
[Unit]
Description=Statiko is a platform for hosting, serving and managing static websites in production
After=nginx.service

[Service]
Type=simple
ExecStart=/usr/local/sbin/statiko
Restart=always
User=root
Wants=nginx.service

[Install]
WantedBy=multi-user.target
```

Then enable Statiko to start automatically at boot, and start it right away:

```sh
sudo systemctl enable statiko
sudo systemctl start statiko
```

Once the service has started, you can test that everything works by running sample commands like this from your server:

```sh
# Should show the status of the node
curl -k https://localhost/status
```

## Next steps

Now that your Statiko node is up and running, you can start creating sites and deploying apps on that. Check out how to [manage sites and apps](TODO).
