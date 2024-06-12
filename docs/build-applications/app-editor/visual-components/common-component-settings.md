# Common Component Settings

The visual Components of Lowcoder share some general Settings and Configurations. You may find nevertheless Components, for which these or that Setting may not apply - and so it's not shown in the Application Editor.

<figure><img src="../../../.gitbook/assets/App Editor  Show Component Settings.png" alt=""><figcaption><p>Click on any Component opens the Properties panel to show all Settings &#x26; Configurations.</p></figcaption></figure>

### Component Name

The component Name is important as it is the same time the identifier to address a visual Component via Javascript or in any dynamic way.

{% hint style="info" %}
It makes sense to decide in general between [Snake- and Camel-Case](https://www.freecodecamp.org/news/snake-case-vs-camel-case-vs-pascal-case-vs-kebab-case-whats-the-difference/). Kebab case is not suggested, as the "-" between words can be interpreted in Javascript as minus-operation in edge cases.
{% endhint %}

<figure><img src="../../../.gitbook/assets/App Editor  Component Name Definition.png" alt=""><figcaption><p>Make sure you give every component a self-speaking name</p></figcaption></figure>

<figure><img src="../../../.gitbook/assets/App Editor  Component Name.png" alt=""><figcaption><p>The component name is a selector for example in ui based Event handlers</p></figcaption></figure>

<figure><img src="../../../.gitbook/assets/App Editor  Component Name in use.png" alt=""><figcaption><p>Also in Javascript you use the same name to address the Object, its Attributes and Functions.</p></figcaption></figure>

### Label

Many Components have the possibility to show Labels for the user, so it is clealy communicated what for example an input field is meant for.

<figure><img src="../../../.gitbook/assets/App Editor  Label.png" alt=""><figcaption><p>Labels helps the users of Apps to understand interaction.</p></figcaption></figure>

#### Orientation

<figure><img src="../../../.gitbook/assets/App Editor  Label top.png" alt=""><figcaption><p>Labels can have different orientations.</p></figcaption></figure>

<figure><img src="../../../.gitbook/assets/App Editor  Label top right.png" alt=""><figcaption><p>Labels can be oriented left or top of a component. The text itself can additionally be oriented left-side or right side.</p></figcaption></figure>

#### Tooltip

<figure><img src="../../../.gitbook/assets/App Editor  Label Tooltip.png" alt=""><figcaption><p>Additionally it can be helpful for users to use Tooltips for descriptions and suggestions.</p></figcaption></figure>

#### Internationalization

Based on the language information of the browser, one can translate text in Lowcoder on the fly.&#x20;

<figure><img src="../../../.gitbook/assets/Internationalization  User Language.png" alt=""><figcaption><p>get the User-Language from the Browser</p></figcaption></figure>

For Labels and Tooltips, a [Handlebar Javascript expression](../data-selection-and-javascript.md) can get used to reading from a translation register (JSON).

```javascript
// reading the User Language from Browser 
{{navigator.language || navigator.userLanguage}}
```

```json
// a Translation Register as JSON
{
	"product_price": [{
		"en-US": "Price"
	}, {
		"de-DE": "Preis"
	}, {
		"fr-FR": "Prix"
	}],
	"product_name": [{
		"en-US": "Product Name"
	}, {
		"de-DE": "Produktname"
	}, {
		"fr-FR": "Nom de produit"
	}]
}
```

<figure><img src="../../../.gitbook/assets/Internationalization  Use translation register.png" alt=""><figcaption><p>Use a Translation Register as JSON</p></figcaption></figure>

```
// dynamically reading from the Translation Register JSON for the label
{{translations.value.product_price.find(item => item.hasOwnProperty(userLanguage.value))[userLanguage.value]}}
```

### Layout

The Layout Settings section can display different settings, based on the selected Component. I most of the cases here you find Settings for the placement of a Component.

* Orientation (left center right justify) (where applicable)

<figure><img src="../../../.gitbook/assets/App Editor  Layout 3.png" alt=""><figcaption></figcaption></figure>

* Vertical space (fixed, automatic) (where applicable)

<figure><img src="../../../.gitbook/assets/App Editor  Layout 2.png" alt=""><figcaption></figcaption></figure>

* Prefix and Suffix Icons (where applicable)

<figure><img src="../../../.gitbook/assets/App Editor  Layout 1.png" alt=""><figcaption></figcaption></figure>

### Disable & hide

Most of the Components can be hidden and/or disabled dynamically by a [Handlebar Javascript expression](../data-selection-and-javascript.md).

#### Disable Components

<figure><img src="../../../.gitbook/assets/App Editor  Disable Component.png" alt=""><figcaption><p>Many components can set in "disabled" State to not hide Components - but indicate that User cannot enter Data right now.</p></figcaption></figure>

#### Hide Components

Nearly every Component can get "hidden and shown" dynamically. This is useful to switch dynamically between Application elements upon user input or interaction.

<figure><img src="../../../.gitbook/assets/App Editor  Hide Components.png" alt=""><figcaption><p>Components can get hidden by static or dynamic Setting</p></figcaption></figure>

#### Vertical space of hidden Components

When Components are hidden, they do not consume vertical space. This is a special ability, which comes with a small challenge in the Application Editor. The advantage is, that multiple Components could get dynamically switched (shown or hidden), so you can dynamically react to user inputs or interactions.&#x20;

<figure><img src="../../../.gitbook/assets/App Editor  Hide Component placing 1.png" alt=""><figcaption><p>hidden Components does not consume vertical space, but can get selected.</p></figcaption></figure>

As soon as a Component is hidden, a "small closed eye icon" indicates this state in the App Editor. The component can still get dragged and selected. As soon as selected, it will show as long as selected its true height.

<figure><img src="../../../.gitbook/assets/App Editor  Hide Component placing 2.png" alt=""><figcaption><p>As soon as selected or dragged, a Component shows it height.</p></figcaption></figure>

You can now place other components in the same vertical place as the hidden Component. This can lead to a small challenge in the App Editor to drag and place Components that overlap. It is suggested to work then with static true/false setting for the attribute "Hidden", so you can find the desired Component displayed with its height when you need it.

<figure><img src="../../../.gitbook/assets/App Editor  Hide Component placing 3.png" alt=""><figcaption><p>Components that are hidden can pe placed vertically at the same position.</p></figcaption></figure>

{% hint style="info" %}
In Lowcoder v2.0.0 the fields "Hidden" and "Disabled" are unfortunately at different places in the Properties Panel across the components. We will fix and order this in a future version.
{% endhint %}

### Event handlers

One of the powerful concepts of Lowcoder are the Event handlers. Based on User interaction almost every Component can release Events, on which you can react with different actions.

<figure><img src="../../../.gitbook/assets/App Editor  Event Types.png" alt=""><figcaption><p>For each components a set of possible User interaction Events is accessible</p></figcaption></figure>

#### User Interaction Event Types

* Change (when user input data changes)
* Focus (when the user points to the component
* Blur (when the user left the Component)
* Submit (when the user submits a Form, where the Component belongs to)
* Click (when a button like Component is clicked)
* Open / Close (for collapsible Components)
* Switch Tab (for Tabbed containers)

{% hint style="info" %}
You can find a list of Event Handlers here: [https://app.lowcoder.cloud/apps/648cd237a0308d4efcc64571/view](https://app.lowcoder.cloud/apps/648cd237a0308d4efcc64571/view)
{% endhint %}

When a Component supports User interaction Events, you can have one or multiple actions based on a single Event type or different Event types.

<figure><img src="../../../.gitbook/assets/App Editor  Event multiple Actions.png" alt=""><figcaption><p>Each Component which supports Events can have multiple Handlers (Actions) for Event Types.</p></figcaption></figure>

#### Actions for Events

Each Event handler has an Action out of a list of possible Actions. Each action has individual Settings.

* Run Query
* Control Component
* Run Javascript
* Set temporary State
* Go to App
* Show Notification
* Go to URL
* Copy to Clipboard
* Export Data

[More about the Event Handlers you can find here](../../app-interaction/event-handlers.md).

#### Order of Event Actions

{% hint style="info" %}
In a future version of Lowcoder, we will make sure it is possible to change the order of the Event Handlers. As for now, it is not possible and you would need to plan the order of Event Actions if your App needs multiple Event Handlers for a single Component.
{% endhint %}

### Style

Components support a variety of [Styling settings](../../themes-and-styling/) like colors, borders, and backgrounds.

<figure><img src="../../../.gitbook/assets/App Editor  Styling.png" alt=""><figcaption><p>Different Components have different support for styleable Attributes</p></figcaption></figure>
