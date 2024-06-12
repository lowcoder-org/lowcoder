# Migration from Openblocks

With **Lowcoder v1.1.8** we created a drop-in replacement for **Openblocks** **v1.1.8**. \
To run it, no changes were required.

However, to **migrate** from Openblocks or Lowcoder 1.1.8 to **Lowcoder 2.0,0**, some changes are required and these are the steps to be followed:

### Migrating from Openblocks (or Lowcoder v1.1.8) to **Lowcoder v2.0.0**

{% hint style="info" %}
if not using Lowcoder v1.1.8 or the latest Openblocks released version (v1.1.8), please upgrade first to Openblocks v1.1.8
{% endhint %}

### 1) stop your Openblocks/Lowcoder:

{% tabs %}
{% tab title="All-in-one Docker image" %}
`docker-compose down`
{% endtab %}

{% tab title="Multi-Image Deployment" %}
`docker-compose -f docker-compose-multi.yaml down`
{% endtab %}
{% endtabs %}

### 2) create a backup copy of the **openblocks-stacks** folder

### 3) rename the **openblocks-stacks** folder to **lowcoder-stacks**

\
`mv openblocks-stacks lowcoder-stacks`

### 4) Download the latest docker-compose file.

download [docker-compose.yaml](https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose.yaml) or [docker-compose-multi.yaml](https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose-multi.yaml) file depending on which installation you prefer (all-in-one or multi-images)\


### 5) Adapt standard values to your Installation

Edit the docker-compose file and make sure to update these settings - values have to match exactly what you had in your Openblocks version:

```
ENCRYPTION_PASSWORD: 
ENCRYPTION_SALT: 
MONGODB_URL:
```

### 6) start your Lowcoder&#x20;

{% tabs %}
{% tab title="All-in-one Docker image" %}
`docker-compose up -d`
{% endtab %}

{% tab title="Multi-Image Deployment" %}
`docker-compose -f docker-compose-multi.yaml up -d`
{% endtab %}
{% endtabs %}
