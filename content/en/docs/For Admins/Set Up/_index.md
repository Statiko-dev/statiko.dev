---
title: "Set Up Statiko"
linkTitle: "Set Up"
weight: 1
description: |
  Installation, pre-requisites, and system requirements
---

Statiko runs on Linux servers, as a Docker container (recommended) or as a standalone app. You can also run Statiko on a Kubernetes cluster, along with your back-end services.

You can install Statiko on **any cloud or on-premises**, and it runs on nodes of any size: from large datacenter-grade servers, to small **Raspberry Pi**'s.

While Statiko can run anywhere, there is a pre-requisite on a [Microsoft Azure](https://azure.com) subscription. Statiko needs this to store your apps' bundles inside Azure Blob Storage, and TLS certificates and codesigning keys safely inside Azure Key Vault. For most users these two services are going to be free or cost a nominal amount every month, less than $1/month after the free trial ends. <br/>
If you don't have one already, get an [Azure account](https://azure.com/free) and start the free trial.
