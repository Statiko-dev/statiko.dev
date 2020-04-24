---
title: "Health check"
linkTitle: "Health check"
slug: health-check
weight: 3
description: |
  Checking nodes' health with the `/status` endpoint
---

The ability to run health checks is important to get an understanding of the sites and apps running in the node, and their status. It's especially important if you're operating Statiko nodes in a [cluster](/docs/how-to/clustering), as load balancers will be able to probe the health check endpoint to make decisions on which nodes are included in the rotation.

## The `/status` endpoint

On Statiko nodes, you can request the `/status` endpoint to get an overview of the node's health. This endpoint does not require authentication.

Here's the response from one of the nodes hosting this own site (pretty-printed for clarity):

```json
{
  "nginx": {
    "running": true
  },
  "sync": {
    "running": false,
    "lastSync": "2020-02-25T07:39:19.086829926Z"
  },
  "health": [
    {
      "domain": "staging.statiko.dev",
      "app": "statiko-docs-20200225.1",
      "status": 200,
      "size": 9703,
      "time": "2020-02-25T15:24:23.973859497Z"
    },
    {
      "domain": "statiko.dev",
      "app": "statiko-docs-20200225.1",
      "status": 200,
      "size": 9703,
      "time": "2020-02-25T15:24:23.972776124Z"
    }
  ]
}
```

There are three main keys in this JSON document:

- `nginx` contains the status of the nginx server, if it's up and running
- `sync` lets you know if the node is performing a sync, and the last time it completed one. A sync happens every time the node receives a new state (e.g. new site to be created, new app to be deployed, etc).
- `health` lists all the sites configured and the apps (if any) deployed to them. Statiko periodically requests the app from the web server (last time is reported in the `time` key), storing the status code it received and the size of the response for the index file, in bytes. Responses for healthy sites are cached for a few minutes (to avoid probing all sites on each status request), and the cache is purged right away if the state of the node changes (e.g. a new app is deployed).

You can also probe the status endpoint for a single domain by appending it to the path, for example `/status/statiko.dev`. This will have the same structure, but only one site in the response body:

```json
{
  "nginx": {
    "running": true
  },
  "sync": {
    "running": false,
    "lastSync": "2020-02-25T07:39:19.086829926Z"
  },
  "health": [
    {
      "domain": "statiko.dev",
      "app": "statiko-docs-20200225.1",
      "status": 200,
      "size": 9703,
      "time": "2020-02-25T15:29:24.662973622Z"
    }
  ]
}
```

## Status codes

Just as important as the content is the status code of the response, which can be used by load balancers to make decisions on the health of the node.

The `/status` endpoint will return a **503 (Service Unavailable)** status code if the nginx server is not running, or if all sites shown (excluding those with no apps deployed) are un-healthy. A site is un-healthy if the periodic probes fails with non-2xx response or if the size of the response is 0 bytes.

You might also get another **5xx status code** if the server encountered an internal error processing your request (this in uncommon). Lastly, if you request the health for a site that does not exist (in the example above, something like `/status/foo.com`), you'll get a 404 (Not Found) response.

In all other cases, the status code will be **200 (OK)**, meaning load balancers should consider this node as healthy.

## Accessing the status endpoint

You can access the `/status` endpoint by making the requests to the Statiko node's management interface just like any other API port.

Additionally, the `/status` endpoint is proxied by the nginx server on the "default site". That is the site that nginx displays when the value of the request's _Host_ header is not empty or does not map to a domain or alias configured in the node.

For example, assume that the Statiko node above had a public IP 10.20.30.40. Requesting `https://10.20.30.40/status` (or without TLS, `http://10.20.30.40/status`) will show the status endpoint. Likewise, DNS names pointing to the IP that aren't mapped to a site will resolve to the default site too, so something like `https://instance-name.cloud-provider.com/status` would work too.

Having the status endpoint responding through nginx might be necessary for load balancers to perform health checks.
