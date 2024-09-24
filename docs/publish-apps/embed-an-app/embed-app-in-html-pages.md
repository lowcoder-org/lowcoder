# Embed App in HTML Pages

It is also possible to embed Lowcoder Apps on any HTML Page with simple Scripts, that we provide on sdk.lowcoder.cloud. This enables you to embed Lowcoder Apps even without deep knowledge of React or Web Development.

Place the standard JavaScript Files in your \<HEAD> part of the HTML page.

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
          app_id_information.setAttribute("value", "6533c298b3f4097d93c215d8");
          document.getElementById('lowcoder-embedding').appendChild(app_id_information);  
      </script>
    </div>
</div>
```

You can embed in this way multiple apps on an HTML page.

The result of the above code in an HTML page is shown below in the Demo. The List component with Yellow background is the Lowcoder App :&#x20;

{% embed url="https://www.loom.com/share/ad204fdbce674882a4c993d53c93b4a1?sid=4a2b982d-e915-4f63-9bd5-7b22c455c702" %}
