# Drawer

In Lowcoder, **Drawer** is an overlay sidebar to display information or perform operations, without interrupting the workflow on the main window.

<figure><img src="../../../../.gitbook/assets/image (13).png" alt=""><figcaption></figcaption></figure>

The following example builds a shopping cart using a drawer.

## Layout

When inserted by drag-and-drop operation, a **Drawer** floats on the right side (by default) of the main window. Then, you can add components onto the **Drawer** according to your needs. In the editing mode of a **Drawer**, other components on the canvas are not editable.

{% hint style="info" %}
When a drawer is closed, you can re-open it by clicking the corresponding label in the **Modals** tab in the left pane.
{% endhint %}

### Position

In the **Properties** tab, you can set the position of the drawer. The default position is the right side of the main window.

### Resize

In **Properties** tab, you can set the width of the drawer by pixels or percentage. Note that the height of a drawer is the same as the main window and is not customizable.

## Events

You can reference a drawer in JS code anywhere in your app or call it through a "control component" action in **Properties** > **Interaction** > **Event handlers**.

The following sections guide you through how to open and close a drawer by clicking a button in an online shopping app.

### Trigger openDrawer

Usually, in an app, you trigger opening a drawer by an event such as clicking a button. For example, in the [Online Shopping demo](https://cloud.lowcoder.dev/apps/63a422a344075b798fe3ae06/view), opening a drawer to display the shopping cart is implemented in the following steps.

1. Add a button and rename it as `gotoCart`.
2. Set the event handler of the button. Select "Control component" as the **Action** and select the component "cart" and method "openDrawer". All these settings are auto-saved.
3. Click the button `gotoCart` and the binded drawer "cart" is open.

```javascript
// Some code
drawer1.openDrawer();
```

### Trigger closeDrawer

Triggerring "closeDrawer" is similar to triggering "openDrawer". When setting up the event handler, select the method "closeDrawer". For example, in the [Online Shopping demo](https://cloud.lowcoder.dev/apps/63a422a344075b798fe3ae06/view), closing a drawer that displays the shopping cart is implemented in the following steps.

1. Add a button and rename it as `gobackShopping`.
2. Set the event handler of the button. Select "Control component" as the **Action** and select the component "cart" and method "closeDrawer". All these settings are auto-saved.
3. Click the "Continue Shopping" button and the binded drawer "cart" is closed.

```javascript
// Some code
drawer1.closeDrawer();
```

### Component Playground

On Component Playground, you can interact with the Drawer component and explore it's Properties, Events and Methods. Play with different Styling properties to see the effect on the Drawer component.

{% embed url="https://app.lowcoder.cloud/playground/drawer/1" %}

### Component Auto-Docs

In the Auto-Docs of Drawer component, we have shown how to use different properties of the Drawer component. It also includes the Styling properties of the Drawer component.

{% embed url="https://app.lowcoder.cloud/components/drawer" %}

### Properties of the Drawer component

<table><thead><tr><th>Property Name</th><th width="425.77734375">Description</th></tr></thead><tbody><tr><td>visibile</td><td>Returns True or False based on whether the Drawer component is visible or not</td></tr></tbody></table>

### Methods

You have the capability to engage with components via their respective methods, which can be accessed by their designated names within any segment where JavaScript is utilized. Additionally, these components can be activated through the 'Control Component' action, which is triggered in response to specific events.

**setVisible() :**&#x20;

drawer1.setVisible() method sets the Drawer's Visible property, due to which Drawer component is shown or not.

```javascript
drawer1.setVisible(true);
```

**clearVisible() :**&#x20;

drawer1.clearVisible() clears the Drawer's Visible property and empties the already set value in the Drawer component.

```javascript
drawer1.clearVisible();
```

**resetVisible() :**&#x20;

drawer1.resetVisible()  method resets the drawer's visible property to the default value of the drawer component.

```javascript
drawer1.resetValue();
```
