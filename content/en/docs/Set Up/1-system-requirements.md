---
title: "System Requirements"
linkTitle: "System Requirements"
slug: system-requirements
weight: 1
description: |
  Suggested minimum system requirements
---

Statiko runs on any Linux server, on any cloud and on-premises, ranging from large datacenter-scale servers to small Raspberry Pi boards.

The system requirements below are **suggested minimums**.

Nodes with high traffic will likely require larger (or significantly larger) servers, while nodes with very low traffic might be able to function well-enough with less resources.

## Using Docker

- OS: Any Linux server (any distribution) running Docker
- Architecture: Container images are available for amd64, arm64 and arm32v7 (armhf)
- Memory: At least 512 MB RAM
- Storage: At least 4GB disk space

## As a standalone app

- OS: Any Linux server (any distribution) with the nginx web server installed
- Architecture: Binaries are available for amd64, arm64 and arm32v7 (armhf)
- Memory: At least 512 MB RAM
- Storage: At least 4GB disk space

## Clustering

Statiko supports clustering natively, so you can also increase your overall resources by scaling horizontally (adding more servers).

While operating in a cluster, you can also achieve higher availability for your apps. Clusters can also be geo-distributed, with servers located in multiple datacenters around the world.

Check out the section on [clustering](/docs/how-to/clustering) for more details.
