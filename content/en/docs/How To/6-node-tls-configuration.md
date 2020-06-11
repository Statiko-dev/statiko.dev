---
title: "Node TLS Configuration"
linkTitle: "Node TLS Configuration"
slug: node-tls-configuration
weight: 6
description: |
  Configuring TLS certificates for the node and DH parameters
---

# TODO

Place the TLS certificate in the configuration folder (where `$STATIKO_ROOT` is the path of the Statiko root folder)

- Certificate: `$STATIKO_ROOT/config/node-public.crt`
- Private key: `$STATIKO_ROOT/config/node-private.key`

These locations can be changed with the [`tls.node.certificate`](TODO) and [`tls.node.key`](TODO) configuration options, but keep in mind that the paths in the config file are relative to the paths within the Docker container (see below for Docker volume mountpoints).

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
>     -keyout $STATIKO_ROOT/config/node-private.key \
>     -out $STATIKO_ROOT/config/node-public.crt \
>     -subj "/CN=${DOMAIN}"
> HEREDOC
> ````

Statiko automatically generates a set of DH parameters for the TLS server. When a Statiko cluster is first launched, it uses a set of built-in parameters, then it generates a new set of DH parameters for the cluster in background. Those parameters are re-generated every 120 days by default (automatic regeneration can be disabled with the [`tls.dhparams.maxAge`](TODO) option).

> Using the [`tls.node.enabled`](TODO) configuration option, you can disable TLS for the Statiko app, which will listen on the configured port (default is 2265) without encryption. This is **not recommended** for security reasons, but it could be acceptable if management clients can connect to the Statiko node over an encrypted channel (e.g. VPN). When `tls.node.enabled` is false, you don't need to provide a TLS certificate and key for the Statiko node.
