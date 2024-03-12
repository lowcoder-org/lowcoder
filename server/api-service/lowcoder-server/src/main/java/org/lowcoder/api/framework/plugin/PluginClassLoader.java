package org.lowcoder.api.framework.plugin;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.Enumeration;
import java.util.Objects;

import org.apache.commons.lang3.StringUtils;

import lombok.extern.slf4j.Slf4j;


@Slf4j
public class PluginClassLoader extends URLClassLoader
{
	private static final ClassLoader baseClassLoader = ClassLoader.getPlatformClassLoader();
	private final ClassLoader appClassLoader = Thread.currentThread().getContextClassLoader();
	
	private static final String[] excludedPaths = new String[] {
			"org.lowcoder.plugin.api.",
			"org/lowcoder/plugin/api/"
	};
	
	public PluginClassLoader(String name, Path pluginPath) 
	{
		super(name, pathToURLs(pluginPath), baseClassLoader);
	}
	
	@Override
	protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException 
	{
		Class<?> clazz = findLoadedClass(name);
		if (clazz != null)
		{
			return clazz;
		}
		
		if (StringUtils.startsWithAny(name, excludedPaths))
		{
			try 
			{
				clazz = appClassLoader.loadClass(name);
				return clazz;
			}
			catch(Throwable cause)
			{
				log.error("[{}]  ::  Error loading class with appClassLoader - {}", name, cause.getMessage(), cause );
			}
		}
		
		
		try
		{
			clazz = super.loadClass(name, resolve);
			if (clazz != null)
			{
				return clazz;
			}
		}
		catch(NoClassDefFoundError cause)
		{
			log.error("[{}]  ::  Error loading class - {}", name, cause.getMessage(), cause );
		}
		
		return null; 
	}

	@Override
	public URL getResource(String name) {
        Objects.requireNonNull(name);
		if (StringUtils.startsWithAny(name, excludedPaths))
		{
			return appClassLoader.getResource(name);
		}
        return super.getResource(name);
    }


	@Override
	public Enumeration<URL> getResources(String name) throws IOException 
	{
		Objects.requireNonNull(name);
		if (StringUtils.startsWithAny(name, excludedPaths))
		{
			return appClassLoader.getResources(name);
		}
		return super.getResources(name);
	}

	private static URL[] pathToURLs(Path path)
	{
		URL[] urls = null;
		try
		{
			urls = new URL[] { path.toUri().toURL() };
		}
		catch(MalformedURLException cause)
		{
			/** should not happen **/
		}
		
		return urls;
	}

}
