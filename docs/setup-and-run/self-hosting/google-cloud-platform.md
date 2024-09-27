---
description: How to Setup Seperate Images on Google Cloud Platform
---

# Google Cloud Platform

## Google Cloud Console Lowcoder Setup

### Creating a VPC Network

1. In the Google Cloud Console, in VPC Network, click on VPC Networks
   * Enable Compute Engine API
2. Create a VPC Network
   * Name the VPC Network
   * Disable IPv6
   * Create a custom subnet
     * Name the subnet
     * Choose the region best for your
     * Choose an IP Range
     * Private Google Access: On
     * Flow Logs: Off
     * In the subnet, setting turn on Private Google Access (it is necessary to enable this setting otherwise the cloud-run services will not be able to communicate with one another)
       * This will be in the Edit subnet section using a custom subnet creation mode
       * If the subnet creation mode is automatic, you will have to go to the region of your VPC network and enable the Private Google Access setting from there once the VPC is created.

<figure><img src="../../.gitbook/assets/VPC Network Setup.JPG" alt=""><figcaption></figcaption></figure>

### Creating a Serverless VPC Access Connector

1. In the VPC Network, create a Connector
   * Enable serverless VPC access API
2. Create a Serverless VPC Connector
   * Name the Serverless VPC Connector
   * Choose the same region as the VPC Network
   * Network: Select the VPC Network that was previously created
   * Subnet:
     * Custom IP range
     * IP range (cannot be the same subnet that was created before)

<figure><img src="../../.gitbook/assets/Serverless VPC Access Connector Setup.JPG" alt=""><figcaption></figcaption></figure>

### Creating a Cloud NAT

* Creating a Cloud NAT is necessary because when connecting the lowcoder services to MongoDB, you must whitelist an IP address that can access the MongoDB cluster.
  * Google Cloud services will use different IP addresses each time to communicate with the internet unless a Cloud NAT is set up on the VPC

1. Within the “Network Services” in the Google Cloud Console click on “Cloud NAT” and then “Create Cloud NAT gateway”
2. Name the Cloud NAT gateway
3. Set the NAT type to public
4. Select a Cloud Router
   * Connect it to the VPC Network created previously
   * Select the region for your Router (the one VPC are running on)
   * Create a New Router
     * Name the router
5. Cloud NAT mapping
   * Source: Primary and secondary ranges for all subnets
   * Cloud NAT IP Addresses: Manual
     * IP Addresses:
       * Premium Network Service Tier
       * IP address:
         * Create and Name an IP address and then click on “Reserve”
       * IP draining: Off (default)
6. Click on Create Cloud NAT
7. After creating a Cloud NAT IP address, whitelist this IP address on your MongoDB cluster

<figure><img src="../../.gitbook/assets/Cloud NAT Setup.JPG" alt=""><figcaption></figcaption></figure>

### Creating a Redis Instance

1. Within Google Cloud Console in Memorystore, on the Redis page, create a Redis instance
2. Enable Google Cloud Memorystore for Redis API
3.  Create a Redis Instance:

    * Name Redis instance in the Instance ID
    * Basic Tier
    * 1 GB of capacity is more than sufficient in our environment however if you face trouble then you can always adjust the capacity as necessary
    * Choose the same region as the VPC Network
    * Set up Connection: connect your Redis instance to the VPC network created previously



<figure><img src="../../.gitbook/assets/Redis Instance Setup.JPG" alt=""><figcaption></figcaption></figure>

### Setting up the Node Service

1. In the Google Console go to Cloud Run
2. Create a Service
3. In the Container Image URL input: lowcoderorg/lowcoder-ce-node-service
   * This is from the lowcoder docker hub (https://hub.docker.com/r/lowcoderorg/lowcoder-ce-node-service)
4. Select the Region, same as the region for the VPC Network
5. CPU allocation and pricing: CPU is only allocated during request processing
6. Ingress Control is set to Internal (this is necessary to not expose the Node Service to the rest of the internet)
7. Authentication: Allow unauthenticated access invocations

<figure><img src="../../.gitbook/assets/Node Service Settings.JPG" alt=""><figcaption></figcaption></figure>

#### Container Settings

1. Container port: 6060
2. CPU allocation:
   * Only allocated during the request processing
3. Capacity (allocate as necessary)
   * Memory: 1 GiB
   * CPU: 1
4. Execution environment: Default

<figure><img src="../../.gitbook/assets/Node Service Container Settings.JPG" alt=""><figcaption></figcaption></figure>

5. Environment Variable:

* Name 1: LOWCODER\_API\_SERVICE\_URL
* Value 1: Paste the API Service URL (Once the API Service is created after the next step

<figure><img src="../../.gitbook/assets/Node Service Environment Variables.JPG" alt=""><figcaption></figcaption></figure>



#### Networking Settings

* Connect to a VPC for outbound traffic
  * Use Serverless VPC Access Connectors
    * Network: Select the VPC network that was created
  * Traffic routing:
    * Route only requests to private IPs to the VPC (this is necessary to not expose the Node Service to the rest of the internet)

<figure><img src="../../.gitbook/assets/Node Service Networking Settings.JPG" alt=""><figcaption></figcaption></figure>

### Setting up the API Service

1. In the Google Console go to Cloud Run
2. Create a Service
3. In the Container Image URL input: lowcoderorg/lowcoder-ce-api-service
   * This is from the lowcoder docker hub (https://hub.docker.com/r/lowcoderorg/lowcoder-ce-api-service)
4. Select the Region, same as the region for the VPC Network
5. CPU allocation and pricing: CPU is only allocated during request processing
6. Ingress Control is set to Internal (this is necessary to not expose the API Service to the rest of the internet)
7. Authentication: Allow unauthenticated access invocations

<figure><img src="../../.gitbook/assets/API Service Settings.JPG" alt=""><figcaption></figcaption></figure>

#### Container Settings

1. Container port: 8080
2. Capacity (allocate as necessary)
   * Memory: 1 GiB
   * CPU: 1
3. Execution environment: Second generation

<figure><img src="../../.gitbook/assets/API Service Container Settings.JPG" alt=""><figcaption></figcaption></figure>

4. Environment Variable: add any other environment variable as per your requirement (list of environment variables https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose-multi.yaml)

* Variable 1:
  * Name 1: REDIS\_URL
  * Value 1: use: redis://10.0.0.0:6379?db=databasename and replace 10.0.0.0 with your Redis instance IP address and database name with the name of your database
* Variable 2:
  * Name 2: MONGODB\_URL
  * Value 2: Paste the MongoDB URL
* Variable 3:
  * Name 3: LOWCODER\_NODE\_SERVICE\_URL
  * Value 3: Paste the Node Service URL
* Variable 4:
  * Name 4: ENABLE\_USER\_SIGN\_UP
  * Value 4: TRUE&#x20;
    * If it is a new setup then set it to true; if it will be used for an existing setup then set it to FALSE
* Variable 5:
  * Name 5: ENCRYPTION\_PASSWORD
  * Value 5: lowcoder.org
* Variable 6:
  * Name 6: ENCRYPTION\_SALT
  * Value 6: lowcoder.org
* Variable 7:
  * Name 7: CORS\_ALLOWED\_DOMAINS
  * Value 7: \*

<figure><img src="../../.gitbook/assets/API Service Envirnoment Variables.JPG" alt=""><figcaption></figcaption></figure>

#### Networking Settings

* Connect to a VPC for outbound traffic
  * Use Serverless VPC Access Connectors
    * Network: Select the VPC network that was created
  * Traffic routing:
    * Route all traffic to the VPC

<figure><img src="../../.gitbook/assets/API Service Networking Settings.JPG" alt=""><figcaption></figcaption></figure>

### Setting up the Front-End Service

1. In the Google Console go to Cloud Run
2. Create a Service
3. In the Container Image URL input: lowcoderorg/lowcoder-ce-frontend
   * This is from the lowcoder docker hub (https://hub.docker.com/r/lowcoderorg/lowcoder-ce-frontend)
4. Select the Region, same as the region for the VPC Network
5. CPU allocation and pricing: CPU is only allocated during request processing
6. Ingress Control is set to all (the front-end should be exposed to the internet)
7. Authentication: Allow unauthenticated access invocations

<figure><img src="../../.gitbook/assets/Frontend Service Settings.JPG" alt=""><figcaption></figcaption></figure>

#### Container Settings

1. Container port: 3000
2. Capacity (allocate as necessary)
   * Memory: 512 MiB
   * CPU: 1
3. Execution environment: Default



<figure><img src="../../.gitbook/assets/Frontend Service Container Settings.JPG" alt=""><figcaption></figcaption></figure>

4. Environment Variable: add any other environment variable as per your requirement (list of environment variables https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose-multi.yaml)

* Variable 1:
  * Name 1: LOWCODER\_API\_SERVICE\_URL
  * Value 1: Paste the API Service URL
* Variable 2:
  * Name 2: LOWCODER\_NODE\_SERVICE\_URL
  * Value 2: Paste the Node Service URL

<figure><img src="../../.gitbook/assets/Frontend Service Environment Variables.JPG" alt=""><figcaption></figcaption></figure>

#### Networking Settings

* Connect to a VPC for outbound traffic
  * Use Serverless VPC Access Connectors
    * Network: Select the VPC network that was created
  * Traffic routing:
    * Route all traffic to the VPC

<figure><img src="../../.gitbook/assets/Frontend Service Networking Settings.JPG" alt=""><figcaption></figcaption></figure>

#### Post Deployment Settings

* Can set up a DNS for the front URL through Google Domains



Author: Eshaan V Saxena, (10/10/2023)
