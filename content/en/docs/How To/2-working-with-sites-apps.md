---
title: "Working with sites and apps"
linkTitle: "Working with sites and apps"
slug: working-with-sites-apps
weight: 2
description: |
  Creating and managing sites and apps
---

After you've launched your Statiko node(s), it's time to add sites and deploy apps to them.

{{% pageinfo %}}
Before running the commands below, make sure you've read the [Managing Statiko nodes](/docs/how-to/managing-statiko-nodes) article to learn how to authorize stkcli with your nodes.
{{% /pageinfo %}}

## Create a new site

Before we can host any app, we need to create a new site. Statiko needs to know what sites you want nginx to respond to, and which TLS certificate they should offer.

- Each site is identified by its **primary domain name** (`--domain` or `-d`). For example, this very site you're visiting (which is of course hosted on a Statiko cluster) is `statiko.dev`.
- Sites can also have one or more **aliases** (`--alias` or `-a`). When visiting an alias, Statiko redirects users to the main domain automatically. For example, `www.statiko.dev` is an alias for `statiko.dev`: if you try to visit that site, you'll be automatically redirected to the main domain without `www`, but preserving the path (e.g. from `https://www.statiko.dev/docs` to `https://statiko.dev/docs`).
- Lastly, sites need to have a **TLS certificate** (`--certificate` or `-c`), which is required for each site. The TLS certificate and key is safely stored on Azure Key Vault, unless you want Statiko to generate a self-signed one.

To start, let's create a site for `statiko.dev`, with a self-signed certificate, and two aliases `www.statiko.dev` and `another-site.com`. We'll use [`stkcli site add`](/docs/cli/stkcli-site-add):

```sh
stkcli site add \
  --domain statiko.dev \
  --alias www.statiko.dev \
  --alias another-site.com \
  --certificate selfsigned

# "selfsigned" is the default value for the certificate, so we can omit the last parameter
stkcli site add \
  --domain statiko.dev \
  --alias www.statiko.dev \
  --alias another-site.com
```

After adding the site, you can point your domain's DNS records to your server, and then you can visit the site you just created. You will see the placeholder page for Statiko sites that don't have an app deployed.

> In addition to redirecting from aliases to the main domain, Statiko also redirects HTTP URLs to HTTPS ones automatically. However, Statiko does not set any [HSTS header](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) for you; if you want to set them, you can do so with a [manifest file](/docs/how-to/manifest-files).

## Add a TLS certificate

Rather than using a self-signed certificate, we can upload our own.

stkcli includes the [`stkcli upload certificate`](/docs/cli/stkcli-upload-certificate) command, which automatically does all the steps for you to prepare and store a TLS certificate inside Azure Key Vault.

> **Important:** This command requires interacting with the Azure Key Vault directly. For security reasons, the Statiko node isn't able to proxy requests to Azure Key Vault, so you need to have the Azure CLI installed in your machine, and you need to be authenticated to Azure (with `az login`); stkcli will automatically pick up the credentials from the Azure CLI. Additionally, your account on Azure needs permissions to "import" certificates in Azure Key Vault. If you created the Azure Key Vault following the instructions in the [Pre-requisites](/docs/set-up/pre-requisites article, then you should have everything you need already.

To upload a certificate, you will need two files:

- `--certificate path` or `-f path`: Path to the PEM-encoded certificate (in the example below, called `certificate.pem`)
- `--certificate-key path` or `-p path`: Path to the PEM-encoded private key for the certificate, without encryption/passphrase (in the example below, called `key.pem`)

The format for the certificate and key is the same one used by popular servers like nginx or Apache2, and all issuers of TLS certificates should offer that as option.

You will also need to set a name for the certificate (for the `--name string` or `-c string` parameter), which per Azure Key Vault naming rules must be between 1 and 127 characters, and can only contain letters (`a-z` and `A-Z`), numbers and the dash symbol (`-`).

In our example, we're naming the certificate `statiko-dev`, based on the domain name. This certificate is valid for the primary domain as well as all aliases:

```sh
stkcli upload certificate \
  --name statiko-dev \
  --certificate certificate.pem \
  --certificate-key key.pem
```

> Note that Statiko won't check that certificates are valid for the domain(s) you're mapping them to, and will serve whatever TLS certificate you tell it to!

After the certificate is stored in Azure Key Vault, we can use [`stkcli site set`](/docs/cli/stkcli-site-set) to edit the site's configuration and set the correct certificate:

```sh
# Set the new certificate
# Make sure you repeat all aliases, or they'll be removed while editing the site!
stkcli site set \
  --domain statiko.dev \
  --certificate statiko-dev \
  --alias www.statiko.dev \
  --alias another-site.com
```

## Deploy an app

Before we can deploy an app, we need to upload it to Azure Blob Storage.

Each app is bundled in a tar.bz2 archive. We should also calculate the SHA-256 checksum of the app bundle to ensure its integrity, and then sign the checksum with the code signing key (using RSA-4096) to guarantee that it won't be tampered with. Then, the bundle is uploaded to Azure Blob Storage, with the signature added as metadata. If all these steps sound complicated and time-consuming, it's because they are.

Thankfully, the Statiko CLI has a convenient method that can take a tar.bz2 archive or just a folder, and will take care of doing everything else for us: the [`stkcli upload app`](/docs/cli/stkcli-upload-app) command.

The command takes three arguments:

- `--path path` or `-f path` is the path to a tar.bz2 archive or a folder containing the static web app
- `--app name` or `-a name` is the name of the app, which can be anything you'd like
- `--version version` or `-v version` is the version of the app, which again can be anything you'd like

> **Important:** Just like the command to upload a TLS certificate, this one requires you to be authenticated to Azure with an account that has permission to do "sign" operation with keys stored in your Azure Key Vault. If you created the Azure Key Vault following the instructions in the [Pre-requisites](/docs/set-up/pre-requisites article, then you should have everything you need already.<br/>
> As an alternative, you can tell stkcli to skip signing app bundles with the `--no-signature`. This way, you won't need to be authenticated with Azure. However, your bundles won't be cryptographically signed, potentially making them more susceptible to tampering. Statiko nodes can also be configured to refuse non-signed bundles with the [`disallowUnsignedApps`](TODO) configuration option.

For example, let's say we have a tar.bz2 archive containing our app called `myapp.tar.bz2`, and this is the first version of the app:

```sh
stkcli upload app \
  -f myapp.tar.bz2 \
  -a myapp \
  -v 1.0
```

We can also upload a folder containing the files of the app, for example called `public`:

```sh
stkcli upload app \
  -f public \
  -a myapp \
  -v 2.0
```

The commands above will take care of creating the tar.bz2 archive if necessary, calculating the checksum and the signature, and upload everything to Azure Blob Storage.

> For each app, there can be only one bundle with the same version. Trying to re-upload an app with the same number and version will throw an error.

After the app has been uploaded, we can tell Statiko to deploy it to a site with [`stkcli deploy`](/docs/cli/stkcli-deploy), by specifying the primary domain name (`--domain` or `-d`) and the app's name and version:

```sh
stkcli deploy \
  -d statiko.dev \
  -a myapp \
  -v 2.0
```

If you open your site now in your browser, you should see the app running.
