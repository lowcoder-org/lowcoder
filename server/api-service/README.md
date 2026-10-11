# Server Setup

This document explains how to start Lowcoder server locally.

## System Prerequisites

Java - OpenJDK 17 Maven - Version 3+ (preferably 3.8+)

### MongoDB

If you don't have an available MongoDB, you can start a local MongoDB service with docker:

```shell
docker run -d  --name lowcoder-mongodb -p 27017:27017 -e MONGO_INITDB_DATABASE=lowcoder mongo
```

Configure the MongoDB connection URI in the server/api-service/lowcoder-server/src/main/resources/application-lowcoder.yml


### Redis

If you don't have an available Redis, you can start a local Redis service with docker:

```shell
docker run -d --name lowcoder-redis -p 6379:6379 redis
```

Configure the Redis connection URI in the server/api-service/lowcoder-server/src/main/resources/application-lowcoder.yml

## Clone the Repository

Now you can clone the Repository from Github: https://github.com/lowcoder-org/lowcoder

```shell
git@github.com:lowcoder-org/lowcoder.git
```

## Using VS Code

Create a launch.json file in the .vscode folder of your new opened workspace.
The contents should look like this:

```JSON
{
    "version": "0.0.1",
    "configurations": [
        {
            "type": "java",
            "name": "ServerApplication",
            "request": "launch",
            "mainClass": "org.lowcoder.api.ServerApplication",
            "projectName": "lowcoder-server",
            "vmArgs": "-Dpf4j.mode=development -Dpf4j.pluginsDir=server/api-service/lowcoder-plugins -Dspring.profiles.active=lowcoder-local-dev -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED"
        }
    ],
}
```

Important is here the command -Dspring.profiles.active= - as it is responsible for the selection of the right apllication settings file too. 

## Build locally

Next action is to build the project, so all lowcoder-plugins are built. This is a precondition for the lowcoder-server to start.

```shell
cd server/api-service

mvn clean package
```

## Start the debug locally

Make sure that the apllication settings file contains the full local configuration you need. The apllication settings file is named application-\<profile>.yaml and reside in server/api-service/lowcoder-server/src/main/resources. The profile relates to your setting in the launch file. For example: -Dspring.profiles.active=lowcoder would make sure, lowcoder seeks the right config at application-lowcoder.yaml

Navigate to the file server/api-service/lowcoder-server/src/main/java/org/lowcoder/api/ServerApplication.java 
This is the main class. Now you can use the IDE to "run" it or "debug it".

You should see after approx a minute "Server Started" in the Logs and can then access the API via http://localhost:8080

Before v2.4.0 you will get a HTTP Status 404 (which is ok in case).

From v2.4.1 on you should see the status message:

```JSON
{
    "code": 1,
    "message": "Lowcoder API is up and runnig",
    "success": true
}
```

## Using IntelliJ IDEA

Configure the Run/Debug configuration as shown below.

<table>
    <tr>
        <td style="width: 115px">JDK version</td>
        <td>Java 17  </td>
    </tr>
    <tr>
        <td>-cp </td>
        <td>lowcoder-server </td>
    </tr>
    <tr>
        <td>VM options </td>
        <td>-Dpf4j.mode=development -Dpf4j.pluginsDir=lowcoder-plugins -Dspring.profiles.active=lowcoder -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED</td>
    </tr>
    <tr>
        <td>Main class </td>
        <td>com.lowcoder.api.ServerApplication </td>
    </tr>
</table>

## Build locally

Next action is to build the project, so all lowcoder-plugins are built. This is a precondition for the lowcoder-server to start.

```shell
cd server/api-service

mvn clean package
```

After Maven package runs successfully, you can start the Lowcoder server with IntelliJ IDEA.


## Start the Lowcoder server jar

```shell
java -Dpf4j.mode=development -Dspring.profiles.active=lowcoder -Dpf4j.pluginsDir=lowcoder-plugins -jar lowcoder-server/target/lowcoder-api-service.jar
```
or respective for debugging: Navigate to the file server/api-service/lowcoder-server/src/main/java/org/lowcoder/api/ServerApplication.java This is the main class. Now you can use the IDE to "run" it or "debug it".


Now, you can check the status of the service by visiting http://localhost:8080 through your browser.

For information on how to contribute to Lowcoder, please view our [Contribution Guide](https://docs.lowcoder.cloud/lowcoder-documentation/lowcoder-extension/opensource-contribution).

## Subscription seat synchronization

Support and AI Robot use the number of distinct current workspace admins (including super admins) and members of the system Developers group. Viewers and stale group memberships for removed workspace members do not count. Stripe remains authoritative for prices; synchronization changes only the quantity of existing licensed subscription items.

The request travels **browser → local API service → flow.lowcoder.cloud → Stripe**. n8n does not call the API service, so no inbound firewall access is required. The browser sends only the workspace ID to `/api/flow`, using the path `webhook/secure/sync-workspace-seats`. The API checks the authenticated workspace membership, reads its own deployment ID and current member count, and authenticates the outbound request with a server-only credential. Browser-supplied quantities, deployment IDs, and headers are ignored on this path.

### Configuration and rollout

The source workflow is [deploy/n8n/seat-sync/workflow.json](../../deploy/n8n/seat-sync/workflow.json). It is inactive and contains configuration placeholders. The draft prepared in flow.lowcoder.cloud is also unpublished, with its webhook disabled. Neither is ready to receive billing updates until the following configuration is completed.

1. Create a private n8n Header Auth credential with header name `Lowcoder-Seat-Sync-Token`. Give it a new random secret; do not reuse the existing browser-visible subscription API credential. Store that same secret in the API service environment as `LOWCODER_BILLING_SEAT_SYNC_TOKEN`. Never place it in frontend environment variables or source control.
2. In the workflow, select the private credential on **Seat sync webhook**, select the correct Stripe credential on every Stripe request node, and replace `REPLACE_WITH_DEPLOYMENT_ID` in **Validate snapshot** with this installation's existing `deployment.id` (also exposed as `deploymentId` in the client). This must match the `lowcoder_hostId` metadata on its Stripe customers. Use a separate credential and webhook path for each deployment; do not let one deployment authenticate as another.
3. Set `LOWCODER_BILLING_SEAT_SYNC_URL` on the API service if using a deployment-specific webhook path. Its default is `https://flow.lowcoder.cloud/webhook/secure/sync-workspace-seats`. The browser's `/api/flow` path remains unchanged; the API routes it to the configured destination.
4. Keep the workflow execution timeout at **60 seconds** and production/manual execution-data saving disabled. Confirm these settings after importing into an existing workflow: n8n may merge nodes without applying imported settings and may auto-select an unrelated credential. Remove any old manual-test nodes before enabling it.
5. Deploy the API and frontend together. Validate with test Stripe customers/subscriptions and test credentials first; the sample product allowlist in `logic.cjs` contains the live Support and AI Robot IDs and must be replaced with test product IDs for that test workflow. Verify additions, removals, promotion/demotion, viewer-only changes, and retries. Then bind the production credentials, enable the webhook and publish the production workflow.

The client triggers reconciliation after successful membership changes, on opening/focusing the workspace, on reconnecting, and once per minute while open. It currently starts only when the subscription list exposes an active Support or AI Robot subscription. The relay also handles trialing and past-due subscriptions for a workspace that triggers a request; a workspace with only subscriptions omitted by the existing active-subscription listing does not start automatic reconciliation. Changes from invitations, other clients, or direct API calls are picked up by periodic reconciliation or the next qualifying workspace visit. This is not a background worker when all clients are closed. After self-removal, another member's session must reconcile that workspace.

Both increases and decreases use Stripe `proration_behavior=create_prorations`: the adjustment is left for the next invoice. The workflow does not create invoices, initiate payments, change prices, or cancel subscriptions. It handles zero billable members without inventing a minimum seat. All matching active/trialing/past-due Support and AI Robot items are updated, including across multiple matching customer records, with paginated reads and exact host/workspace metadata checks. Retired media products are excluded.

The API uses a shared Redis lease per deployment/workspace to serialize clients. Failed or ambiguous requests retain the 180-second lease; the relay accepts only snapshots no older than 30 seconds and has a 60-second execution timeout. Stripe retries reuse the same idempotency key. A failed read never becomes a zero count. Failed synchronization does not undo workspace changes; the client retries and displays a pending warning in subscription settings.

### Focused verification

Regenerate the workflow after changing relay logic, and run its tests:

```shell
node deploy/n8n/seat-sync/build-workflow.cjs
node --test deploy/n8n/seat-sync/logic.test.cjs
```

From `server/api-service`, run the server count, authentication, serialization and existing flow-contract tests:

```shell
mvn -pl lowcoder-server -am -Dtest=WorkspaceSeatCounterTest,WorkspaceSeatSyncServiceTest,ApiFlowEndpointsContractTest -Dsurefire.failIfNoSpecifiedTests=false -DskipIntegrationTests=true package
```

The frontend scheduler and hook regression tests are in `client/packages/lowcoder/src/util/seatSyncScheduler.test.ts` and `workspaceSeatSync.test.ts`. They cover successful membership notifications, local API routing without a browser-supplied count, focus/reconnect, workspace changes, cleanup, and retry/warning behavior.

### Local Stripe sandbox verification (2026-10-10)

An isolated API instance on the developer Mac, with a separate MongoDB database and Redis namespace, was tested against the published [local-test relay](https://flow.lowcoder.cloud/workflow/jibHQZta4HXeMegf). This relay uses test-only products, a separate private Header Auth credential, and a Stripe `livemode === false` guard before customer lookup or quantity updates. The existing development API and live Stripe customer quantities were not changed.

Ten API integration scenarios passed: viewer addition, editor promotion, combined admin/editor membership counted once, editor removal while still an admin, admin demotion, viewer-triggered reconciliation, another editor addition, workspace removal, anonymous rejection, and foreign-workspace rejection. Each changed count updated both Support and AI Robot items; unchanged counts performed no Stripe writes. Forged browser quantities, deployment IDs and relay headers did not override the server calculation.

The [read-only Stripe verification workflow](https://flow.lowcoder.cloud/workflow/Shjkkr96VBwqakh8) independently confirmed both subscription items returned to quantity 2 after the 2 → 3 → 2 → 3 → 2 sequence. Stripe held 16 pending proration lines (8 positive and 8 negative, all with `proration: true` and no assigned invoice). Only the original subscription invoice existed; reconciliation created no additional invoice. These test prices use EUR 3.49 monthly per seat, covering the first pricing tier; volume-tier transitions were not exercised.

This verifies real API membership changes through n8n to Stripe test mode. Frontend trigger behavior is covered by the hook/scheduler tests, rather than a full browser membership-edit test. The production relay remains unpublished with its webhook disabled; production rollout still requires the deployment-specific configuration above.
