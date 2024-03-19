# Lowcoder backend plugin system

This is an ongoing effort to refactor current plugin system based on pf4j library.

## Reasoning

1. create a cleaner and simpler plugin system with clearly defined purpose(s) (new endpoints, new datasource types, etc..)
2. lowcoder does not need live plugin loading/reloading/unloading/updates, therefore the main feature of pf4j is rendered useless, in fact it adds a lot of complexity due to classloaders used for managing plugins (especially in spring/boot applications)
3. simpler and easier plugin detection - just a jar with a class implementing a common interface (be it a simple pojo project or a complex spring/boot implementation)

## How it works

The main entrypoint for plugin system is in **lowcoder-server** module with class **org.lowcoder.api.framework.configuration.PluginConfiguration**  
It creates:
- LowcoderPluginManager bean which is responsible for plugin lifecycle management
- Adds plugin defined endpoints to lowcoder by creating **pluginEndpoints** bean
- TODO: Adds plugin defined datasources to lowcoder by creating **pluginDatasources** bean

### lowcoder-plugin-api library

This library contains APIs for plugin implementations.  
It is used by both, lowcoder API server as well as all plugins.

### PluginLoader

The sole purpose of a PluginLoader is to find plugin candidates and load them into VM.  
There is currently one implementation that based on paths - **PathBasedPluginLoader**, it:
- looks in folders and subfolders defined in **application.yaml** - entries can point to a folder or specific jar file. If a relative path is supplied, the location of lowcoder API server application jar is used as parent folder (when run in non-packaged state, eg. in IDE, it uses the folder where ServerApplication.class is generated)

```yaml
common:
  plugin-dirs:
  - plugins
  - /some/custom/path/myGreatPlugin.jar
```
- finds all **jar**(s) and inspects them for classes implementing **LowcoderPlugin** interface
- instantiates all LowcoderPlugin implementations

### LowcoderPluginManager

The main job of plugin manager is to:
- register plugins found and instantiated by **PluginLoader**
- start registered plugins by calling **LowcoderPlugin.load()** method
- create and register **RouterFunction**(s) for all loaded plugin endpoints
- TODO: create and register datasources for all loaded plugin datasources

## Plugin project structure

Plugin jar can be structured in any way you like. It can be a plain java project, but also a spring/boot based project or based on any other framework.

It is composed from several parts:
- class(es) implementing **LowcoderPlugin** interface
- class(es) implementing **PluginEndpoint** interface, containing endpoint handler functions marked with **@EndpointExtension** annotation. These functions must obey following format:

```java
	@EndpointExtension(uri = <endpoint uri>, method = <HTTP method>)
	public EndpointResponse <handler name>(EndpointRequest request) 
	{
	   ... your endpoint logic implementation		
	}
```
- TODO: class(es) impelemting **LowcoderDatasource** interface

