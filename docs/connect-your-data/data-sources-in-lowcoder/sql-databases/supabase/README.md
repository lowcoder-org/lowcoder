# Supabase

Supabase is an open-source backend-as-a-service (BaaS) platform that provides developers with a set of tools to build, manage, and scale applications. It aims to simplify the process of setting up a backend by offering various services out of the box, similar to Firebase, but with an emphasis on open standards and flexibility.

### Key Features :

1. **PostgreSQL Database**: Provides a managed PostgreSQL database with SQL querying, relational data, and full-text search capabilities.
2. **Realtime Subscriptions**: Enables live updates by sending data changes (insert, update, delete) to connected clients in real time.
3. **Authentication**: Built-in authentication system supporting email/password, OAuth providers (Google, GitHub), and custom auth systems.
4. **Storage**: Offers scalable storage for managing media files like images and videos, ideal for handling user uploads.
5. **RESTful API**: Automatically generates RESTful APIs based on your database schema for easy interaction with the backend.
6. **Edge Functions**: Serverless functions that allow you to write custom backend logic without managing servers.
7. **Open-Source**: Fully open-source, enabling hosting on your own infrastructure and avoiding vendor lock-in.
8. **Frontend Integration**: Supports modern frontend frameworks like React, Vue, and Next.js, with SDKs for seamless backend interaction.

### Use Cases for Supabase :

* Building applications with real-time features like chat apps or live collaboration tools.
* Projects that require user authentication and role-based access control.
* Storing and managing media files like images, videos, or documents.
* Rapidly building and scaling applications without setting up custom backend infrastructure.

### Supabase SDK

We have integrated Supabase SDK to Lowcoder, so that our App Users can directly use it in the apps to its full potential.

Users can use all the functionalities provided by Supabase inside Lowcoder using "supabase" object. e.g. to interact with your Postgres database, listen to database changes, build login and user management functionality, and manage large files.

### Initialising Supabase Client&#x20;

Create a new client for use in the browser. You can initialize a new Supabase client using the `createClient()` method.

The Supabase client is your entry point to the rest of the Supabase functionality and is the easiest way to interact with everything Supabase offers within its ecosystem.

```
const supabase_client = supabase.createClient('supabase-project-url', 'public-anon-key')
```

Now, using this "supabase\_client" created above, we will interact with PostgreSQL DB in Supabase, explore Supabase Assets/Storage feature, setup an OAuth and use Supabase RealTime feature. Let's explain these one by one.

Let's explore some of the core features of Supabase, one by one.
