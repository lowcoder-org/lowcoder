# Embed App in WordPress Pages

It is also possible to embed Lowcoder Apps on any WordPress Page with simple Scripts, that we provide on sdk.lowcoder.cloud. This enables you to embed Lowcoder Apps even without deep knowledge of React or Web Development.

Place the standard JavaScript Files in your \<HEAD> part of the WordPress page.

```
<script src="https://unpkg.com/react@16.4.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@16.4.1/umd/react-dom.production.min.js"></script>
```

And now the Lowcoder SDK Scripts, as the last tags before the \</BODY> closing tag.

```
<script src="https://sdk.lowcoder.cloud/bundle.js"></script>
```

Now you can place a small HTML snippet at the place where your App should be embedded:

```
<div class="lowcoder-module-container">
    <div id="lowcoder-embedding">
      <div class="lowcoder-module-display"></div>
      <input type="hidden" class="locoder-backend-url" value="https://api-service.lowcoder.cloud" />
      <script>
          var app_id_information = document.createElement("input");
          app_id_information.setAttribute("type", "hidden");
          app_id_information.setAttribute("class", "module-id");
          app_id_information.setAttribute("value", "66ab6af10390b00771b2e649");
          document.getElementById('lowcoder-embedding').appendChild(app_id_information);  
      </script>
    </div>
</div>
```

You can embed in this way multiple apps on a WordPress page.

We have created a WordPress Website and added two Lowcoder components. The 1st component is a sign up modal, and the 2nd component is an App. You may visit this site, below.

{% embed url="http://demo-lowcoder.42web.io/" %}
