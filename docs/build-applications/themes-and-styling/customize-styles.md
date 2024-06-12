# Customize Styles

## Using Webfonts

Based on the @import statement you can use external hosted Webfonts with Lowcoder.\
\
In the Workspace CSS or App CSS editor, you can add Font Family Import Statements

```
@import url('https://fonts.googleapis.com/css2?family=Abel&display=swap');
```

Based on the Text-Property "Font Family" you can then activate this Font Family in your Apps at many components.

You can use the interactive Demo to see the Steps based on the Component "Divider"

{% embed url="https://app.supademo.com/demo/cWzrhtxHJfJq9ZpgDOq4K" %}

## Customize Component Styles with CSS

With CSS you can further customize the Design of Components. You can use the same CSS Editor for every app or on the Workspace for all apps.

{% hint style="info" %}
To set CSS Styles for all apps in a Workspace, use the Editors in the Advanced Settings. <[yourLowcoderURL>/setting/advanced](https://app.lowcoder.cloud/setting/advanced)
{% endhint %}

Lowcoder Allows you to define Styles at "global Level". That means, you also can customize the style of the Admin Area and the Editor.

To limit the effect of a customized Styling to your Apps only, you can use the prefix class "root-container" in your selectors.

<pre class="language-css"><code class="lang-css">// Use the prefix-class in your Selectors to limit the customized CSS to your Apps only.

// will have an effect for all Buttons of Lowcoder (Editor + Apps)
.button1 {
<strong>    border-radius: 50px;
</strong>}

// will have an effect for all Buttons of your Lowcoder Apps only
.root-container .button1 {
    border-radius: 50px;
}

// from version v2.3.2 on this class get a new name
// will have an effect for all Buttons of your Lowcoder Apps only
.lowcoder-app-canvas .button {
    border-radius: 50px;
<a data-footnote-ref href="#user-content-fn-1">}</a>
</code></pre>

Each Lowcoder Component has a root element with the CSS class name "lowcoder-\<component-type>. This identifies the class, not the individual item. In styles that you develop for components, you can use this global class identifier to make sure your styles apply only to all children of a component type.

<figure><img src="../../.gitbook/assets/CSS Classes.webp" alt=""><figcaption><p>CSS Class names for Types of Components</p></figcaption></figure>

To address a specific instance of a Lowcoder Component, you can use the CSS Class which is available in the further tree.

<figure><img src="../../.gitbook/assets/CSS Class Selector.png" alt=""><figcaption><p>Address specific instances of a Lowcoder Component</p></figcaption></figure>

```css
// will apply to all Buttons in your App
.lowcoder-app-canvas .button {
    border-radius: 50px;
}

// will apply to the specific Button with the name button1 in your App
.lowcoder-app-canvas .button1 {
    border-radius: 50px;
}
```

[^1]: 
