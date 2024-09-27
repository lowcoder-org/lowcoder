# Update MongoDB Versions

## Version Update of MongoDB

MongoDB stopped the support for versions < 5 already and will stop the support for version < 6 soon. It is suggested to update the MongoDB Server / Infrastructure.

The lowcoder application continues to operate smoothly on MongoDB version 4.4. However, to ensure compatibility with official MongoDB releases, an update is necessary. This update is specifically required for the all-in-one deployment of lowcoder, which includes MongoDB.

It is important to note that MongoDB version 5.0 and above requires the AVX (Advanced Vector Extensions) feature of the processor. While this feature is standard in all newer processors, it may not be supported by older hardware. Therefore, users with older systems might encounter issues running MongoDB 5.0+.

An incremental update procedure is possible without losing data. However, the major versions of MongoDB cannot be overjumped. You cannot jump to v 6 from v 4; you would first need to adapt to v 5.

Suppose you currently run v4 and want to update to v7- these are the necessary steps for the all-in-one docker image. If you operate a multi-image installation, adap the paths to your data location for your MongoDB and the database must be stopped before the process is started.

### 1) Stop Lowcoder

Stop your Lowcoder instance and wait for it to completely stop the service.

```bash
docker-compose down
```

### 2) Create a Backup Copy of the **lowcoder-stacks** folder

```bash
cp -rp lowcoder-stacks lowcoder-stacks.backup
```

### 3) Run upgrade-mongo-4x-to-5x docker compose file

{% file src="../../.gitbook/assets/upgrade-mongo-4x-to-5x.yaml" %}
Update MongoDB from v4 to v5
{% endfile %}

```bash
docker-compose -f upgrade-mongo-4x-to-5x.yaml up -d && sleep 30
```

### 4) Set MongoDB Compatibility-Version to 5

```bash
docker exec mongodb-5 /usr/bin/mongosh --eval 'use admin' --eval 'db.adminCommand( { setFeatureCompatibilityVersion: "5.0" } )'
```

### 5) Stop and remove MongoDB 5 Update-Container

```bash
docker-compose -f upgrade-mongo-4x-to-5x.yaml down
```

### 6) Run upgrade-mongo-5x-to-6x docker compose file

{% file src="../../.gitbook/assets/upgrade-mongo-5x-to-6x.yaml" %}
Update MongoDB from v5 to v6
{% endfile %}

```bash
docker-compose -f upgrade-mongo-5x-to-6x.yaml up -d && sleep 30
```

### 7) Set MongoDB Compatibility-Version to 6

```bash
docker exec mongodb-6 /usr/bin/mongosh --eval 'use admin' --eval 'db.adminCommand( { setFeatureCompatibilityVersion: "6.0" } )'
```

### 8) Stop and remove MongoDB 6 Update-Container&#x20;

```bash
docker-compose -f upgrade-mongo-5x-to-6x.yaml down
```

### 9) Run upgrade-mongo-6x-to-7x docker compose file

{% file src="../../.gitbook/assets/upgrade-mongo-6x-to-7x.yaml" %}
Update MongoDB from v6 to v7
{% endfile %}

```bash
docker-compose -f upgrade-mongo-6x-to-7x.yaml up -d && sleep 30
```

### 10) Stop and remove MongoDB 7 Update-Container

```bash
docker-compose -f upgrade-mongo-6x-to-7x.yaml down
```

As result your MongoDB is now updated to Version 7 without Data loss.
