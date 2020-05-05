---
title: "Clustering"
linkTitle: "Clustering"
slug: clustering
weight: 5
description: |
  Configuring Statiko nodes in a cluster
---

The ability to run in a cluster is one of Statiko's distinguishing features.

You can run any number of Statiko nodes in a cluster, in the same datacenter or in multiple ones around the world, with inhomogeneous hardware. When configured in a cluster, each Statiko node maintains the same state, so they all serve the same sites, apps, TLS certificates, etc.

## Why clustering?

The first reason why you might want to run Statiko as a cluster is that it helps delivering **High-Availability** for your solution.

You can run multiple Statiko nodes side-by-side, and if one node fails, the apps don't go offline. Optionally, you can deploy your nodes across multiple datacenters/cloud providers, to ensure high availability even if the entire datacenter or cloud region goes down.

You can also distribute your nodes globally, to get multiple deployments around the world, and be close to your users. **Geo-redundancy** helps with ultra-high availability, as well as increased performance (decreased latency) for all users around the world.

Clustering also enables you to serve more requests by **scaling out** (horizontally) rather than up (vertically). Scaling vertically usually requires moving your apps to a bigger server, but there are limitations to how big you can get. When you scale horizontally, instead, you can add more servers side-by-side and distribute the load. Even better, you can enable **auto-scaling** if your infrastructure supports it, and automatically increase the number of nodes as your load increases.

Nodes in a Statiko cluster operate all in **active-active** mode. All nodes can serve all apps, so you can route traffic to all of them. Even more, because even the Statiko services themselves operate in active-active mode, all nodes can accept requests that alter the state of the cluster via management APIs.

> This website you're on is deployed on a geo-distributed Statiko cluster, with one node on Microsoft Azure in the US, and one on an ARM64 server from Scaleway in France! Read at the bottom for the architecture.

## Requirements for clustering

Clustering of Statiko nodes requires, and is made possible by, a working [etcd](https://etcd.io/) cluster. etcd is an open source solution to build distributed, reliable key-value stores with strong consistency. Statiko uses etcd to store the nodes' state, ensure that it's consistent across all nodes, and that all changes are propagate instantaneously to all nodes in the cluster.

Statiko nodes operate independently from etcd. In case of loss of the entire etcd cluster, Statiko nodes will remain online and they will continue serving all sites and apps. However, all operations that need to alter the state of the node(s) will fail, including adding/removing/editing sites, deploying new apps, updating TLS certificates. As soon as the connection with a healthy  etcd resumes, nodes' operativity will return to normal.

## Enabling clustering in Statiko

In order to enable clustering in Statiko, you first need to ensure that you have an etcd cluster available, version 3 or higher. Creating and bootstrapping an etcd cluster is beyond the scope of this article, and you can read more about it on the [official documentation](https://etcd.io/docs/v3.4.0/op-guide/clustering/).

> While a single etcd node would be sufficient to operate a Statiko cluster, you would need to operate etcd in a cluster itself to ensure high availability. etcd clusters require an odd number of nodes, either 3 or 5 recommended.

After you have an etcd cluster configured, you can enable as many Statiko nodes as you'd like to store (and share) their state on it.

On the Statiko nodes' configuration file, edit the `state` section to set `state.store` to `etcd`, then configure the connection to the etcd cluster. It is also very important to make sure that each node has a different `nodeName` (which can be determined automatically from the hostname, unless you're running in Docker).

```yaml
# State storage configuration
state:
  # Store state in etcd
  store: "etcd"

  # Configuration for connecting to etcd
  etcd:
    # Prefix for keys used by Statiko in etcd
    # Defaults to "/statiko" if not set
    keyPrefix: "/statiko"
    # Timeout in ms
    # Defaults to 10000 if not set
    timeout: 10000
    # List of etcd node addresses to connect to, comma-separated
    # For example: "http://host01:2379,http://host02:2379"
    # Note that your Statiko nodes must be able to connect to all those nodes, so configure your firewall rules accordingly
    # If you want to use TLS, change the protocol to "https", for example:
    # "https://host01:2379,https://host02:2379"
    address: ""
    # TLS certificate configuration connecting for etcd
    # This might be necessary if you're using TLS
    tlsConfiguration:
      # Certificate Authority that signed the certificate
      # This is used for both the server certificate and the client certificate (if configured)
      ca: ""
      # Public client certificate for the client
      # This is used for client authentication if desired
      clientCertificate: ""
      # Private key file for the client
      # This is used for client authentication if desired
      clientKey: ""
    # Skip verifying TLS certificates presented by etcd nodes
    # Defaults to "false" if not set
    tlsSkipVerify: false

# You need to set a unique nodeName for each node in the cluster, or conflicts might happen
# If nodeName is empty, Statiko will determine the name automatically from the machine's hostname, but that doesn't work reliably in containers
nodeName: ""

# You can prevent specific nodes to become leaders of the cluster by setting this option to true
# Use this option sparingly: a cluster without a leader will behave unexpectedly.
disallowLeadership: false
```

Save the changes above to the configuration file, then restart the Statiko service or container in all nodes. The nodes will all connect to the same etcd cluster, and they will sync their state.

> You can migrate the state from a file store to etcd using the stkcli commands [stkcli state get](/docs/cli/stkcli-state-get) to back up the state, and then restore it with [stkcli state set](/docs/cli/stkcli-state-set).

### Cluster leader

One of the nodes in the cluster will become the leader. The leader node takes on additional responsibilities such as generating self-signed TLS certificates and re-generating the DH parameters.

Tasks assigned to the leader can be CPU-intensive, so if you have the option to exclude certain nodes from the leader election by setting `disallowLeadership` to true.

You should plan to have at least one node capable of becoming a leader up at all times. Without that, certain tasks will not run (e.g. checking for expiring TLS certificates), and more importantly, state syncs that involve generating new self-signed certificates will not complete.

## Architecting the solution

TODO: ARCHITECTURE DIAGRAM

When you have multiple nodes, the architecture of the solution becomes more complex, with the need for load balancing and handling failed nodes. Additionally, should you decide to spread your cluster geographically, you also need to consider how to distribute the traffic to multiple areas around the world.

Consider this section as a reference architecture, similar to what this very same site you're browsing is running on.

### etcd cluster

As noted above, the first requirement is the etcd cluster.

From the point of view of Statiko, it's irrelevant what the cluster looks like, or where it's located, as long as each Statiko node can communicate with each node in the etcd cluster.

etcd could run on the same servers as Statiko, or on separate ones. You could run a single etcd instance if you don't need high-availability for etcd (as written above, Statiko will continue to work even without a connection to etcd, but you won't be able to do anything that alters the state of the Statiko node(s)). If you do require HA for etcd, then you need to deploy an odd number of instances, either 3 or 5.

### Load balancing within the same datacenter/region

If you have more than one Statiko node running in the same datacenter or cloud region, you will need to add a load balancer within the same region. This is a traditional HTTP load balancer, that proxies requests on ports 80 and 443. It could be a network-layer load balancer (such as HAProxy, or your cloud provider's standard load balancer), or a layer-7 one (such as Traefik, another nnginx server, etc).

If all of your Statiko nodes are behind the same load balancer, you can consider pointing a CDN to the address of the load balancer, and you'll have a complete working solution.

### Load balancing globally

A more interesting challenge is how to route the traffic when you have geo-redundant deployments. There are multiple approaches to this, in order of complexity:

1. Use a DNS resolver that supports geographic routing.<br/>The simplest examples include services like [NS1](https://ns1.com/geographic-routing) or [AWS Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html#routing-policy-geoproximity), both of which support responding to DNS queries based on clients' geography.
2. Use a DNS-based load balancer.<br/>An example in this category is [Azure Traffic Manager](https://docs.microsoft.com/en-us/azure/traffic-manager/traffic-manager-overview). By pointing your domain to Traffic Manager's CNAME record, it resolves with the address of the closest, healthy deployment. Traffic Manager periodically performs health checks (e.g. every 30 seconds) and excludes unhealthy deployments.<br/>You can (optionally) point a CDN, such as Cloudflare, to the Azure Traffic Manager endpoint (*this is how this website is run too*).
3. Use an integrated service that supports dynamic routing, caching, failover, etc, with a single global entrypoint.<br/>Examples include [AWS Global Accelerator](https://aws.amazon.com/global-accelerator/) and [Azure Front Door](https://docs.microsoft.com/en-us/azure/frontdoor/front-door-overview). These services act as a CDN as well.
