# App Editor

In Lowcoder, the app editor is where you assemble components, create queries to interact with data, and publish your apps. It consists of five areas:

1. Toolbar on top
2. Canvas (yellow)
3. Data browser (blue)
4. Query editor (green)
5. Component and property pane (red)

<figure><img src="../../.gitbook/assets/App Editor  Main Screeen.png" alt=""><figcaption><p>The standard view of the App Editor</p></figcaption></figure>

The left pane is switchable, so you can view the Data browser or App-wide settings for layout and page includes (Javascript and CSS). You can:

* Set Canvas size&#x20;
* [Set App Theme](../themes-and-styling/)
* Manage included JavaScripts and CSS style

The right pane is switchable too and offers the searchable list of all Components that can get placed in your App. In the "properties Mode" you can see all customization details for the currently selected Component on the Canvas.

<figure><img src="../../.gitbook/assets/App Editor  Main Screen 2.png" alt=""><figcaption><p>The Details / Settings Panels of the App Editor Screen</p></figcaption></figure>

## Toolbar

The Toolbar is made up of a top bar and a left sidebar.

On the top bar, you can:

* Change the App name
* Export to a JSON file
* Control the visibility of the left and right panes as also the query editor (middle)
* Share your App
* Preview and deploy your App
* Check the history versions on an App

On the left sidebar, you can:

* Show or hide the **Data Browser**
* Start tutorial for app editor

## Canvas

The canvas (yellow) at the center of the editor is where you design and see the overall UI. Drag and drop components onto the canvas. You can imagine it like a blank page at the beginning.

The canvas has an automatic, magnetic Grid system. Components will visually always snap to the nearest left and top grid line. This allows a fast but ordered layout of the Application.

<figure><img src="../../.gitbook/assets/App-Editor  Snap-Grid.gif" alt="" width="563"><figcaption></figcaption></figure>

You can influence the background color as also the horizontal amount of grid cells in the [theme](../themes-and-styling/).

## Data Browser

The data browser (blue) on the left pane contains **Queries**, **Components,** and **Globals** sections. Here you can inspect the data in a tree structure in real-time. For example, to check the returned data of a specific query or component, find its node in the belonging section and click to expand.

<figure><img src="../../.gitbook/assets/App Editor  Data Browser.png" alt=""><figcaption></figcaption></figure>

## Query editor

The query editor (green) is at the bottom and consists of two sections: query list (with **Queries** and **Metadata** tabs) on the left, and query settings ( with **General**, **Notification,** and **Advanced** tabs) on the right. Create queries to interact with data sources here.

<figure><img src="../../.gitbook/assets/App Editor  Database Query GUI.png" alt=""><figcaption></figcaption></figure>

Queries link data sources to your apps and perform CRUD (create, read, update, and delete) operations on data sources.

The query editor is flexible and adapts the options to build queries to the data source. You can compare SQL Database and OpenAPI queries for example.

## Component and property pane

The component and property pane (red) is located on the right of the window. Drag components onto the canvas from the **Insert** tab and edit the properties of the components in the **Properties** tab.

When a component is selected on the canvas, the **Properties** tab will be activated automatically and display the properties of that component.
