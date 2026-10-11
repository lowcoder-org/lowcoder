# Environments

In Lowcoder Enterprise Edition, we introduce the concept of **Environments** — also referred to as **Instances** or **Stages** — to support professional-grade development workflows across multiple deployment layers (e.g., Development, Staging, Production).

These are **isolated but connected deployments** of Lowcoder that allow you to develop, test, and release apps and their dependencies in a controlled and auditable way.

<figure><img src="../../../../.gitbook/assets/frame_generic_light (5) (4).png" alt=""><figcaption></figcaption></figure>

An **Environment** represents a full, self-contained instance of Lowcoder, with its own MongoDB Meta-Database. [It can be a single-docker or a multi-docker installation.](../../../self-hosting/)

A typical setup contains 3 stages:

<table><thead><tr><th width="148.3046875">Environment</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>Development</strong></td><td>Build and test new features, apps, queries, or UI changes safely</td></tr><tr><td><strong>Test / QA</strong></td><td>Preview and validate deployments in a production-like setting</td></tr><tr><td><strong>Production</strong></td><td>Live environment used by end-users or business-critical applications</td></tr></tbody></table>

### Environment Isolation with Selective Deployment

To avoid chaos from accidental deployments, Lowcoder introduces:

* **Managed vs. Unmanaged Objects**
  * All apps, queries, and data sources start as **unmanaged**
  * You explicitly **mark them as managed** to indicate that they are deployment candidates
* **Selective Deployments**
  * You choose _which_ managed objects to deploy
  * **Dependent objects** (e.g., queries, data sources) are automatically bundled and deployed or matched if they already exist in the target environment

This ensures you only move forward the artifacts that are ready — no unintentional deployments or inconsistent app states.

### Lifecycle Flow Example

1. Developer builds a new app in the **Dev** environment
2. App gets marked as **Managed**
3. Developer clicks “Deploy to Staging”
4. Lowcoder copies the app and all required objects to the **Staging** environment
5. QA verifies it and then pushes the same version to **Production**

Each step is **auditable**, and **consistent** — just like enterprise-grade deployment pipelines, but **fully visual and no-Git-required**.

### Why Not Git-based CI/CD?

In traditional CI/CD, Git is often used as the control mechanism. However, Lowcoder supports **deeply linked, runtime-bound components** like:

* Shared **data sources** used across multiple apps
* Dynamically generated **queries**
* User-created **runtime components**

Pushing only an app’s DSL (App-JSON) into Git would miss its **operational context.** Therefore we offer Lowcoder’s native environment-aware transport system that’s UI-driven, selective, and dependency-aware.
