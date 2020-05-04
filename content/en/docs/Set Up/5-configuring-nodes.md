---
title: "Configuring nodes"
linkTitle: "Configuring nodes"
slug: configuring-nodes
weight: 5
description: |
  Full list of configuration options for Statiko nodes
---

Statiko nodes have multiple configuration settings, many of which optional.

The main way you can configure Statiko nodes is by creating a YAML file in `/etc/statiko/node-config.yaml` (if you're running Statiko in a container, you need to ensure that your config file is in a Docker volume mounted to `/etc/statiko`).

## Full configuration

The structure and the full list of options for the `node-config.yaml` file is listed here:

```yaml
# Authorization for managing the node
# At least one of the options must be enabled
auth:
  # Authorize with a pre-shared key
  psk:
    # Enabled
    # Defaults to "no" if not set
    enabled: yes
    # Key
    # *Required* if psk authorization is enabled
    # Can also be passed with environmental variable AUTH_KEY
    key: ""

  # Authorize with an OAuth 2.0 access token issued by Azure AD
  azureAD:
    # Enabled
    # Defaults to "no" if not set
    enabled: no
    # Tenant ID of the application used to authenticate users
    # *Required* if azureAD authorization is enabled
    # Can also be passed with environmental variable AUTH_AZUREAD_TENANT_ID
    tenantId: ""
    # Client ID of the application used to authenticate users
    # *Required* if azureAD authorization is enabled
    # Can also be passed with environmental variable AUTH_AZUREAD_CLIENT_ID
    clientId: ""

# Encryption key for secrets. Must be a base64-encoded (standard encoding) key of 128-bit (16 byte).
# *Required*. Generate it with a command like `openssl rand 16 | base64`
# Can also be passed with environmental variable SECRETS_ENCRYPTION_KEY
secretsEncryptionKey: ""

# Port the server is listening on
# Defaults to "2265" if not set
# Can also be passed with environmental variable PORT
port: "2265"

# State storage configuration
state:
  # Where to store state - can be "file" or "etcd"
  # Defaults to "file" if not set
  # Can also be passed with environmental variable STATE_STORE
  store: "file"

  # Configuration for when "store" is "file"
  file:
    # File containing the state persistently stored on disk
    # Defaults to "/etc/statiko/state.json" if not set
    # Can also be passed with environmental variable STATE_FILE_PATH
    path: "/etc/statiko/state.json"

  # Configuration for when "store" is "etcd"
  etcd:
    # Prefix for keys used by Statiko in etcd
    # Defaults to "/statiko" if not set
    # Can also be passed with environmental variable STATE_ETCD_KEY_PREFIX
    keyPrefix: "/statiko"
    # Timeout in ms
    # Defaults to 10000 if not set
    # Can also be passed with environmental variable STATE_ETCD_TIMEOUT
    timeout: 10000
    # List of etcd node addresses to connect to, comma-separated
    # *Required* if state store is etcd
    # Can also be passed with environmental variable STATE_ETCD_ADDRESS
    address: "http://localhost:2379,http://etcd:2379"
    # TLS certificate configuration connecting for etcd
    tlsConfiguration:
      # Certificate Authority that signed the certificate
      # This is used for both the server certificate and the client certificate (if configured)
      # Can also be passed with environmental variable STATE_ETCD_TLS_CA
      ca: ""
      # Public client certificate for the client
      # This is used for client authentication if desired
      # Can also be passed with environmental variable STATE_ETCD_TLS_CLIENT_CERTIFICATE
      clientCertificate: ""
      # Private key file for the client
      # This is used for client authentication if desired
      # Can also be passed with environmental variable STATE_ETCD_TLS_CLIENT_KEY
      clientKey: ""
    # Skip verifying TLS certificates presented by etcd nodes
    # Defaults to "false" if not set
    tlsSkipVerify: false

# Configuration for the nginx web server
nginx:
  # Path where the nginx config is stored
  # Defaults to "/etc/nginx/" if not set
  configPath: "/etc/nginx/"
  # User running nginx
  # Defaults to "www-data" if not set
  # Another common option is "nginx", depending on the distribution
  # Can also be passed with environmental variable NGINX_USER
  user: "www-data"
  # Shell commands to start/stop/restart(reload) nginx, and to check its status
  commands:
    # This command should start the nginx server
    # Another common option is "service nginx start"
    # The value below is the default one
    # Can also be passed with environmental variable NGINX_START
    start: "systemctl start nginx"
    # This command should send a SIGHUP (reload config) to nginx if it's running, or start it if it's not
    # Another common option is "service nginx status > /dev/null && service nginx reload || service nginx restart"
    # The value below is the default one
    # Can also be passed with environmental variable NGINX_RESTART
    restart: "systemctl is-active --quiet nginx && systemctl reload nginx || systemctl restart nginx"
    # This command should print "1" if nginx is running, or "0" otherwise
    # Another common option is "service nginx status > /dev/null && echo 1 || echo 0"
    # The value below is the default one
    # Can also be passed with environmental variable NGINX_STATUS
    status: "systemctl is-active --quiet nginx && echo 1 || echo 0"
    # This command should test the nginx configuration file, printing only if there's an error
    # Can also be passed with environmental variable NGINX_TEST
    test: "nginx -t -q"

# Statiko data folder
# Defaults to "/var/statiko" if not set
# Can also be passed with environmental variable APP_ROOT
appRoot: "/var/statiko"

# Azure configuration
azure:

  # Service Principal details
  sp:
    # Tenant ID of the Service Principal
    # *Required*
    # Can also be passed with environmental variable AZURE_TENANT_ID
    tenantId: ""
    # Client ID of the Service Principal
    # *Required*
    # Can also be passed with environmental variable AZURE_CLIENT_ID
    clientId: ""
    # Client Secret of the Service Principal
    # *Required*
    # Can also be passed with environmental variable AZURE_CLIENT_SECRET
    clientSecret: ""

  # Azure Storage
  storage:
    # Storage account name
    # *Required*
    # Can also be passed with environmental variable AZURE_STORAGE_ACCOUNT
    account: ""
    # Container name
    # Defaults to "apps" if not set
    # Can also be passed with environmental variable AZURE_STORAGE_APPS_CONTAINER
    appsContainer: "apps"

  # Azure Key Vault
  keyVault:
    # Name of the Key Vault
    # *Required*
    # Can also be passed with environmental variable AZURE_KEYVAULT_NAME
    name: ""

    # Code signing key
    codesignKey:
      # Name of the code signing key inside the Key Vault
      # Defaults to "codesign" if not set
      # Can also be passed with environmental variable CODESIGN_KEY_NAME
      name: "codesign"
      # Version of the code signing key inside the Key Vault
      # Defaults to the latest one if not set
      # Can also be passed with environmental variable CODESIGN_KEY_VERSION
      version: null

# TLS
tls:
  # TLS configuration for the node's management APIs
  node:
    # Enable TLS for connections with the node's management APIs
    # Using TLS is strongly recommended
    # This impacts the node's management APIs only, and not individual websites
    # Defaults to true if not set
    enabled: yes
    # Path to the TLS certificate for the node's management APIs
    # Defaults to "/etc/statiko/node-public.crt" if not set
    certificate: "/etc/statiko/node-public.crt"
    # Path to the TLS key for the node's management APIs
    # Defaults to "/etc/statiko/node-private.key" if not set
    key: "/etc/statiko/node-private.key"
  # Configuration for DH parameters generation
  dhparams:
    # Automatically re-generate DH parameters after a specified number of days
    # When this is 0, DH parameters are not automatically re-generated at certain intervals; however, the cluster will still generate cluster-specific parameters when first started
    # Defaults to 120 (days) if not set
    maxAge: 120
    # Number of bits for the generated DH parameters
    # Must be 1024, 2048 or 4096. Using 1024 bits is strongly discouraged
    # Defaults to 4096 if not set
    bits: 4096

# Node name
# Defaults to the hostname if not set
# Can also be passed with environmental variable NODE_NAME
nodeName: nil

# Name for the manifest file inside app bundles
# Defaults to "_statiko.yaml" if not set
manifestFile: "_statiko.yaml"

# Set to true to require all deployed apps to be cryptographically signed
# Defaults to false if not set (allow unsigned apps)
disallowUnsignedApps: false

# Configuration for sending notifications to admins
notifications:
  # Notification method: "webhook" or "off"
  # Defaults to "off" if not set
  # Can also be passed with environmental variable NOTIFICATIONS_METHOD
  method: "webhook"
  # Configuration for when method is "webhook"
  webhook:
    # URL to invoke
    # Message is a POST request containing payload `{"<payloadKey>": "message"}`, where `<payloadKey>` is defined below
    # Can also be passed with environmental variable NOTIFICATIONS_WEBHOOK_URL
    url: "https://maker.ifttt.com/trigger/<event>/with/key/<key>"
    # Key for the message in the JSON object
    # If you're using IFTTT for the webhook, set this to `value1`; other webhook services might support different values or custom ones
    # Defaults to "value1" if not set
    # Can also be passed with environmental variable NOTIFICATIONS_WEBHOOK_PAYLOAD_KEY
    payloadKey: "value1"
```

## Minimum required keys

At the very minimum, the following keys must be set in the configuration file for Statiko to work:

- `auth`:
  - At least one of `auth.*.enabled` must be `yes` (either `auth.psk.enabled` or `auth.azureAD.enabled`)
  - If using psk authorization, then `auth.psk.key` must be set
  - If using azureAD authorization, then `auth.azureAD.tenantId` and `auth.azureAD.clientId` must be set
- `secretsEncryptionKey` must be set; you should generate it with `openssl rand 16 | base64`
- `azure`:
  - `azure.sp.tenantId`, `azure.sp.clientId` and `azure.sp.clientSecret` must be set with the details of the Azure Service Principal
  - `azure.storage.account` must be set with the name of the Azure Storage Account created in the pre-requisites step
  - `azure.keyVault.name` must be set with the name of the Azure Key Vault created in the pre-requisites step
