# Messages / Toast

The Toast component is a versatile tool for displaying brief notifications ("toasts") within an application. It supports various configurations to customize the appearance, behavior, and placement of toasts. Below is the documentation for the Toast component and its methods.

#### Syntax

```javascript
toast.open(title, options);
// toast.open( title: string, options?: { message?: string, duration?: number = 3, id?: string, placement?: "top" | "topLeft" | "topRight" | "bottom" | "bottomRight", "bottomRight" = "bottomRight", dismissible?: boolean = true } )
```

#### Parameters

* **`title`** (string): The title of the toast notification. This is a required parameter and will be displayed prominently on the toast.
* **`options`** (Object): An optional configuration object that allows you to customize the toast notification. The properties available in this object include:
  * **`message`** (string): Optional. The message to be displayed on the toast. Provides additional information about the toast notification.
  * **`duration`** (number): Optional. The duration for which the toast should remain on the screen, specified in seconds. The default value is `3` seconds.
  * **`id`** (string): Optional. A unique identifier for the toast. This can be used for targeting specific toast notifications if needed.
  * **`placement`** (string): Optional. Defines where on the screen the toast will appear. Possible values are `"top"`, `"topLeft"`, `"topRight"`, `"bottom"`, `"bottomRight"`. The default placement is `"bottomRight"`.
  * **`dismissible`** (boolean): Optional. Determines whether the toast can be dismissed by the user before the duration expires. The default value is `true`, making the toast dismissible.

#### Return Value

The `toast.open` method does not return a value.

#### Examples

**Basic Usage**

To display a simple toast with just a title:

```javascript
toast.open('Hello World!');
```

**With Message and Duration**

To display a toast with a title, message, and custom duration:

```javascript
toast.success("Query runs successfully", {duration: 10});
```

**Custom Placement and Dismissibility**

To display a toast at the top of the screen, which is not dismissible:

```javascript
toast.warn('Alert!', { message: 'System will undergo maintenance tonight.', placement: 'top', dismissible: false });
```

#### Customization

<figure><img src="../../../.gitbook/assets/Screenshot 2024-03-03 at 00.37.51.png" alt=""><figcaption></figcaption></figure>

The Toast component also provides additional methods for displaying toasts with predefined styles and icons corresponding to different notification types: `info`, `success`, `warn`, and `error`. These methods have the same signature and options as `toast.open`, but they display toasts with colors and icons that are appropriate for their respective notification types.

* The toast will automatically disappear after the duration has elapsed unless `dismissible` is set to `false`. In that case, the user must manually close the toast.
* If multiple toasts are triggered with the same `id`, they will be treated as separate instances unless custom logic is implemented to handle such cases.
* The placement of the toast might need to be adjusted based on the overall layout and responsiveness of the application to ensure optimal visibility on different devices.

Each of these methods accepts the same parameters as `toast.open`, allowing for customization of the message, duration, ID, placement, and dismissibility.

* **`toast.info(title, options?)`**: Displays an informational toast with a blue icon.
* **`toast.success(title, options?)`**: Displays a success toast with a green icon.
* **`toast.warn(title, options?)`**: Displays a warning toast with a yellow icon.
* **`toast.error(title, options?)`**: Displays an error toast with a red icon.

**Additional Methods**

**`toast.destroy(id?)`**

Destroys an open toast. If no ID is provided, all toasts will be closed.

* **Parameters**:
  * `id` (string, optional): The unique identifier of the toast to destroy. If not specified, all toasts will be destroyed.
