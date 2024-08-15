# App(s) Navigation

In Lowcoder, you can create "Apps". These are single-screen applications, which can be simple or truly complex and include navigation elements and dynamically loaded areas, with even child-app embedding.

{% hint style="info" %}
However, a Mobile App or Typical Desktop Application has multiple screens with a typical navigation. Mobile apps will always be 100% of the screen height, and the navigation is, for example, expected to be fixed at the bottom.&#x20;
{% endhint %}

To achieve this and create a "collection of App Screens," Lowcoder has the so-called "**App Navigation**."

Lowcoder's "App Navigation" feature allows you to aggregate multiple app screens into a cohesive, multi-page application with a fully functional menu. This feature is available in both desktop and mobile variants, with hierarchical navigation on desktop and flat navigation on mobile. You can create menus manually or dynamically using data queries.

## **Demo ( Desktop Navigation )**

{% embed url="https://demos.lowcoder.cloud/demo/clztrrle711us4oytvazqslk8" %}

## **Steps to Create an App Navigation**

1. **Create Individual Apps:**
   * Begin by creating the individual app screens that you want to include in your navigation. These app screens will form the different pages of your final application.
2. **Create a Navigation Page:**
   * On the Lowcoder homepage, click on "New" and select "Navigation" to create a new navigation page.
3. **Add Menu Items:**
   * In the Navigation editor, click "+ New" to add menu items.
   * Select a menu item, choose the app it should navigate to, and customize the label and icon as needed. The selected app will be displayed on the canvas in real time.
4. **Add Submenu Items (Desktop Only):**
   * To add submenu items, click the more options icon (···) next to a menu item and select "Add submenu item," or drag the handle (⋮⋮) to nest one menu item under another.
   * Note: Parent menu items can only expand or fold their submenu items and cannot directly link to an app. Deleting a parent menu item will also delete all its submenu items.
5. **Add Apps by selecting them - or route to URLs, including Parameters**
   * From your existing Apps, you can choose in the select box the one you want to get displayed for a selected menu item.
   * You can also add URL query parameters or hash parameters to a menu item by specifying key-value pairs.
     * Click the menu item on the canvas to append these parameters to the app's URL. You can reference these parameters in your app using `{{url.query.key1}}` or `{{url.hash.key1}}`.
     * For more details on URL parameters, refer to the "[Go to app](../app-interaction/event-handlers.md#go-to-app)" section.
6. **Publish the Navigation App**
   * As the last step, you need to decide with whom you will share the app and publish it. You can read about [app publishing here](../../publish-apps/publish-an-app.md). Navigation Apps behave exactly the same way.

On the Lowcoder Admin homepage, click **New** and select **Navigation** to create a navigation page.

## **Demo ( Mobile Navigation )**

{% embed url="https://demos.lowcoder.cloud/demo/clyso4e9b0uwkz9kd066pvs7n" %}

## Menu items

In the **Navigation** editor on the right panel, click **+ New** to add menu items.

Select a menu item, choose the app to navigate to, and change the label and icon if needed. The app is displayed on the canvas in real-time.

### Add submenu items

To add submenu items, click `···` > **Add submenu item**, or drag `⋮⋮` to make one menu item subordinated to another.

{% hint style="danger" %}
Sub-menu items are only possible in Desktop Navigation Apps.
{% endhint %}

### Add Apps

From your existing Apps, you can choose in the select box the one you want to get displayed for a selected menu item.

{% hint style="warning" %}
The app you want to connect to a Menu item must exist already.
{% endhint %}

### Add URL (and parameters)

Instead of existing apps, you can also link any website url.

{% hint style="warning" %}
You can only use websites that open in an iFrame. If you own the website or web app, make sure to check the X-Frame-Options Header. If there is an HTTP Header set with X-Frame-Options = deny, you can't use this website then.
{% endhint %}

Add URL query parameters or hash parameters to a menu item with `key` and `value`.

Then, click the menu item on the canvas, and the parameters are appended to the URL of the app to be opened. You can check in the **Globals** tab in the left pane.

{% hint style="info" %}
To reference the URL parameters, use `{{url.query.key1}}` or `{{url.hash.key1}}` in your app.
{% endhint %}

For more information of URL parameters, see Go to app.

## Visibility of app menu items

By default, menu items are hidden for users without the necessary app permissions. You can toggle this option off to allow users to see the menu item but not access the referenced app.

## Permissions

The permissions for navigations are the same as those for modules and apps. See Permissions for resources.
