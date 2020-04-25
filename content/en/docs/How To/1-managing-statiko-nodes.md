---
title: "Managing Statiko nodes"
linkTitle: "Managing Statiko nodes"
slug: managing-statiko-nodes
weight: 1
description: |
  Managing Statiko nodes: the stkcli and REST APIs
---

Statiko offers two ways to manage nodes dynamically and programmatically, also remotely. They let you:

- Add and remove sites, and change the sites' configuration
- Deploy apps
- Check the node and sites' health
- Backup and restore the node state

At the low level, Statiko nodes are managed via a set of [REST APIs](/docs/rest). Each node includes an API server that listens to HTTPS requests made on port 2265 (both the port and the use of TLS are configurable).

Admins and developers, however, might find it simpler to use [stkcli](/docs/cli), a cross-platform CLI that wraps all REST endpoints and offers other features designed to make managing Statiko nodes more convenient. stkcli is open source ([project on GitHub](https://github.com/Statiko-dev/stkcli)) and comes with [pre-compiled binaries](/docs/downloads#stkcli) for Windows, macOS and Linux.

## Using stkcli

After having [installed](/docs/downloads#stkcli) the stkcli, you should be able to invoke it with the `stkcli` command.

All commands contain help pages that can be invoked with `--help`, for example:

```sh
# Show usage of stkcli all-up
stkcli --help
# Show usage of the stkcli auth command
stkcli auth --help
```

### Common flags

There are **four flags** that are common among most stkcli commands:

- `--node address` or `-n address` is the address (hostname or IP) of the Statiko node you want to manage. For example, if your Statiko node is at `statiko.mydomain.com`, you'd add `--node statiko.mydomain.com` to each command. This flag is required for all commands, to identify what node we're connecting to.
- `--insecure` or `-k` tells stkcli to skip validating the TLS certificates the Statiko node offers. This is useful for example to accept self-signed TLS certificates. Using this option will emit a warning, as stkcli won't be able to verify the identity of the node.
- `--port port` or `-p port` is the port where the Statiko management interface is listening to. By default this is 2265, and you need to specify this flag only if you are using a non-default port.
- `--http` or `-S` tells stkcli to use un-encrypted HTTP to communicate with the Statiko node. If you disable TLS for the management interface in the node's configuration (see [`tls.node.enabled`](TODO)), you need to use the `--http` option with stkcli, or connections will fail.

You need to specify these flags every time you run a command with stkcli. For example, to check the status of the Statiko node `statiko.mydomain.com`, where Statiko listens on port 3000 and has a self-signed certificate, you'd run the [`stkcli status`](/docs/cli/stkcli-status) command like this:

```sh
stkcli status --node statiko.mydomain.com --port 3000 --insecure
# Or, using short flags
stkcli status -n statiko.mydomain.com -p 3000 -k
```

Repeating these flags on each request is cumbersome. Thankfully, the stkcli offers a way to set default flags in your machine. With the [`stkcli defaults`](/docs/cli/stkcli-defaults) group of commands you can set flags that will be automatically added to each stkcli command:

```sh
# After running this, all commands will automatically have `--node statiko.mydomain.com --port 3000 --insecure`
stkcli defaults set --node statiko.mydomain.com --port 3000 --insecure

# Check the current list of defaults
stkcli defaults get
# Should print: `--node statiko.mydomain.com --port 3000 --insecure`

# Override the list of defaults; note that this replaces the entire list of defaults with the ones provided
stkcli defaults set --node statiko.mydomain.com
stkcli defaults get
# Should print: `--node statiko.mydomain.com`

# Remove all defaults
stkcli defaults remove
```

### Authorizing stkcli

Most, but not all, Statiko endpoints require authorization.

As you might recall from the Set Up instructions, Statiko nodes support authentication with at least one of the following options:

- A pre-shared key (`psk`), which is a string (like a passphrase) that is set in the node's configuration and that the clients send with each request to authenticate themselves. Pre-shared keys are particularly useful in scripts such as Continuous Integration or Continuous Delivery pipelines, as they don't expire.
- An Azure AD token (`azuread`). Clients can use an Azure AD account (including Office 365 "work and school" accounts) to authenticate with the Azure AD OAuth server, and obtain an access token that can be sent to Statiko nodes. The node will recognize valid access tokens for the app that you created in the pre-requisites step, and will grant access to management endpoints. The benefits of using an Aure AD token is that they are short-lived (refresh tokens have a configurable life of at most 90 days, the default), can be revoked at any time, and allow granting (and revoking) access conveniently to a set of users.

To authenticate with a **pre-shared key**, you can use the [`stkcli auth psk`](/docs/cli/stkcli-auth-psk) command, which is an interactive command that will ask you to type the pre-shared key.

```sh
stkcli auth psk
# Then type the pre-shared key when asked
```

To use an **Azure AD account**, you can instead use [`stkcli auth azuread`](/docs/cli/stkcli-auth-azuread). This will open your web browser and point you to a specially-crafted URL within Azure AD to authenticate and authorize the OAuth application you created in the [pre-requisites step](/docs/set-up/pre-requisites). The stkcli will automatically capture the response from Azure AD and store the authorization token.

```sh
stkcli auth azuread
# Your browser will launch automatically: follow the instructions there
```

Both the options above are interactive, and as such are not well-suited for **scripting use-cases** (including CI/CD pipelines). In those cases, you can pass stkcli commands the value for the Authorization header directly with the **`NODE_KEY`** environmental variable. The value of `NODE_KEY` can be the full pre-shared key, or an Azure AD auth token that you obtained in another way. Using this environmental variable with stkcli commands allow for non-interactive uses.

For example:

```sh
# Skip running `stkcli auth` and pass the pre-shared key or the Azure AD auth token directly

# For example, passing a pre-shared key
export NODE_KEY="my-psk"
stkcli site list

# You can also pass an Azure AD auth token (a JWT)
# The token is truncated for simplicity in this example
export NODE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IkhsQzBSMTJza3hOWjFX..."
stkcli site list
```

## REST APIs

At its core, stkcli is just a wrapper around Statiko nodes' REST APIs, although it does pack a bunch of convenience methods, such as simplifying uploading apps and certificates. You can invoke those APIs with any HTTP(S) client, such as [curl](https://curl.haxx.se/), or your own application.

You can see the full reference for REST APIs in the [REST](/docs/rest) section, as well as instructions for authenticating calls.

## Next steps

Check out how to use stkcli to perform common tasks, such as [working with sites and apps](/docs/how-to/working-with-sites-apps).
