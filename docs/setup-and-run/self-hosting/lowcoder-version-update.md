# Lowcoder Version Update

## Lowcoder Versioning Scheme

We try to respect as good as possible the Semantic Versioning for Lowcoder Versions

v2.4.1 for example, means:

* Major Version **"2"**. It changes when there are truly big updates that might break old features or add significant new ones. It comes when we introduce fundamentally new concepts inti the Software
* Minor Version **"4"**. It changes when new features are added in a way that doesn’t break existing ones. It should be possible to update the version and expect a working continuation of existing apps.
* Patch Version **"1"**. It changes when we do bug-fixes or improvements, that don't affect overall functionality.

We work with initiatives to add new functionality. This comes normally with the increase of the minor version. When we have a new bigger feature set ready, we introduce it as 2.4.0 for example. The Patch Version is "0". This updates should work in general, but we never can fully exclude not having introduced bugs or unexpected behaviour. Naturally we increase every day the tests and production quality and invest a lot of development time to keep also new features backward compatible.

{% hint style="warning" %}
It is suggested to test a new Minor Version with a Patch Version "0" separately as a Test-Installation. We do not suggest to update this simply on the existing older version.
{% endhint %}

After a new Minor Version we deliver typically the next patch version quite fast, considering all bugs, that we found or that was reported. The first and second Patch Versions we can count in typical cases as Stabe Versions.

{% hint style="info" %}
The patch versions > 0 are typically seen as Stable Version. It should be ok to install these directly as update.
{% endhint %}

### Lowcoder SDK

The SDK has an independent versioning - yet still following the Semantic Versioning Scheme.

Since Lowcoder v2.4.0 we follow the principle, that the SDK will have the same Major and Minor Version as the Main Lowcoder Version - but it can have an independent Patch-Version.

### External Component Plugins

Also external Component Plugins follow the Sematic Versioning Scheme with Major, Minor, and Patch versions. However, they are independent from the Lowcoder or Lowcoder SDK Versions.

### Docker Images

The provided Docker Images from Lowcoder-Org follow the Sematic Versioning of Lowcoder. For every Release of the Codebase with a new Version, we also offer the pre-built Docker Containers for the All-in-one and Multi-Docker installation.

{% embed url="https://hub.docker.com/r/lowcoderorg/lowcoder-ce/tags" %}
Lowcoder pre-built Docker Images on Docker Hub
{% endembed %}

Next to the released Version Tags of Lowcoder there are 2 more tags with relevance:

* /latest - These images contain typically a state of development which is somewhat stable - but not yet a released Patch Version. Critical Bugs, that we solved are fastest to get in the /latest tag. The /latest tag always based on the previous last published Patch Version.
* /dev - these images can be seen like Nightly Builds. They contain evetually the latest stage of our development and are only for testing purposes.

{% hint style="danger" %}
Do not use a /dev tag image in production. These images are only to use in test installations aside.
{% endhint %}

{% hint style="info" %}
We suggest only a Multi-Docker Image installation for Production use. The all-in-one image "lowcoderorg/lowcoder-ce" is suitable to test and introduce Lowcoder in an easy way.
{% endhint %}

## Version Update

To **update** from an older to a newer version or Lowcoder, please follow this guide:

{% hint style="warning" %}
Please always make a Backup / Copy of your /lowcoder-stacks folder.
{% endhint %}

The magic behind an easy update is to make use of the /lowcoder-stacks mounted folder in the docker installations. That enables you to change the Versions of Lowcoder but not touch the Application Data. In the mounted /lowcoder-stacks folder, all MongoDB application data as also Logs and Assets are stored.&#x20;

In other words, if you not use an external MongoDB Service, the Lowcoder MongoDB stores the Application Data of all your workspaces and Apps there, enabling you to exchange the docker without needing further backup and restore actions.

Based on the lowcoder-stacks folder, the data of a Lowcoder Installation can be transitioned without losses when you update to a new version of Lowcoder.&#x20;

<figure><img src="../../.gitbook/assets/Deployment  Docker lowcoder-stacks.png" alt="" width="563"><figcaption><p>Mount local folder - f.e. in Docker Desktop</p></figcaption></figure>

### 1) Stop your Lowcoder Docker Containers:

With Docker Compose

{% tabs %}
{% tab title="All-in-one Docker image" %}
`docker-compose down`
{% endtab %}

{% tab title="Multi-Image Deployment" %}
`docker-compose -f docker-compose-multi.yaml down`
{% endtab %}
{% endtabs %}

With pure Docker

<pre class="language-bash"><code class="lang-bash"><strong>docker stop [container-id]
</strong></code></pre>

Or in Docker Desktop

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-23 at 14.18.08.png" alt=""><figcaption><p>This deletes the current Conatiner Instance - not the Docker Image itself.</p></figcaption></figure>

Stop and delete the "Container" you did run based on the old version.&#x20;

{% hint style="info" %}
If you did follow the /lowcoder-stacks folder mounting, no data would be lost.
{% endhint %}

### 2) Create a backup copy of the **lowcoder-stacks** Folder

Even if it should be never a problem, still we ask you kindly always to make a copy of the whole folder. Sometimes we have no other channce than to introduce breaking changes and we want to make sure you will never loss any data.

### 3) Download the latest Lowcoder Docker images.

#### With Docker Compose

download [docker-compose.yaml](https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose.yaml) or [docker-compose-multi.yaml](https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose-multi.yaml) file depending on which installation you prefer (all-in-one or multi-images)

#### With pure Docker

If you use Docker Desktop, you can pull the /latest tag or a specific version tag.

<figure><img src="../../.gitbook/assets/Screenshot 2024-03-23 at 14.06.42.png" alt=""><figcaption></figcaption></figure>

### 4) Adapt standard values to your Installation

{% hint style="warning" %}
For every Major Version, we likely introduce new ENV Variables. This is the reason to download the latest docker compose file. Naturally, you also can update your local copy with the new ENV Variables and other new config structures.
{% endhint %}

Edit the docker-compose file to your needs, but make sure to update only the settings. The following values must match your previous version to keep the Lowcoder MongoDB accessible for your stored Data Source Secrets.

* LOWCODER\_DB\_ENCRYPTION\_PASSWORD
* LOWCODER\_DB\_ENCRYPTION\_SALT

{% hint style="info" %}
If you lose or change the Encryption Password & Salt, the Lowcoder Database on MongoDB will work as expected - only the existing stored Credentials to Data Sources are "lost" / not accessible.
{% endhint %}

### 5) Run the new Lowcoder Docker-Image

After the image is pulled, you can run the image (create a new container) and configure directly the Ports as well as the ENV Variables.&#x20;

{% hint style="warning" %}
Mind to re-connect (mount) the /lowcoder-stacks folder
{% endhint %}

#### With Docker Compose

{% tabs %}
{% tab title="All-in-one Docker image" %}
`docker-compose up -d`
{% endtab %}

{% tab title="Multi-Image Deployment" %}
`docker-compose -f docker-compose-multi.yaml up -d`
{% endtab %}
{% endtabs %}

## Multi Image Docker Version handling

Technically, the Docker Versions and releases go "Hand in Hand". That means that you should always operate the same backend version of API-Service-Image & Node-Service-Image as the Frontend-Image. However, in special situations, the separation of these concerns into different images gives you a degree of freedom to update only one of the images and check the compatibility.
