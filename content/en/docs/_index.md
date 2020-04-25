---
title: "Statiko Documentation"
linkTitle: "Documentation"
weight: -1
menu:
  main:
    weight: -1
---

## What is Statiko

Statiko is a self-hosted platform that works alongisde the popular [nginx](https://nginx.org) web server (known for its speed, reliability and security) as a sidecar, and enables you to host, serve, and manage static web apps ([JAMstack apps](https://jamstack.org/)) in production.

With Statiko, you have advanced control on the web server, so you can for example add custom headers, manage redirects and clean URLs. This makes it possible to host [Progressive Web Apps (PWAs)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) effectively.

Statiko lets you control what sites and apps your nodes should be running, and takes care of automatically re-configuring the nginx server for you, with no downtime.

When building JAMstack apps, Statiko fits nicely in your DevOps toolset, enabling Continuous Delivery of your apps.

Statiko runs on any Linux server as a standalone app or a Docker container. You can also deploy Statiko on a Kubernetes cluster, alongside your back-end services. We publish binaries and Docker containers for amd64, arm64 and arm32v7 (armhf for Raspberry Pi).

Lastly, Statiko is designed to support scenarios that require horizontal scalability, high-availibity, and even geo-redundancy.

Statiko is free software, released under the GNU Affero General Public License v3.0 (see [LICENSE](https://github.com/Statiko-dev/Statiko/blob/master/LICENSE)).

## Features

Statiko's core features:

- Manage sites and apps via a REST API, or using the _[stkcli](/docs/cli)_ CLI
- Automatically reconfigure a nginx web server, with no downtime
- Ensure TLS certificates are present; supports generating self-signed certificates, and notifies admins when certificates are expiring (via webhook invocation)
- Apps can configure all response headers (e.g. Client-Caching, Content-Type, etc), configure redirects and clean URLs
- App bundles can be cryptographically signed with the _stkcli_ to ensure the integrity and origin of the code
- Distributed as a Docker container for simplified deployment, also on Kubernetes; however, you can run Statiko on any Linux server un-containerized if you prefer

Additionally, Statiko nodes can be configured in a cluster, delivering horizontal scalability and high-availability. Nodes can be geo-distributed for very high level of redundancy. Nodes are automatically kept in sync thanks to [etcd](https://etcd.io/).

## Why Statiko

TODO
