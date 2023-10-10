package org.lowcoder.api.framework.plugin;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PluginJarClassLoader extends URLClassLoader 
{
	private ClassLoader parentCl;
	private Map<String, URL> jarResources = new HashMap<>();
	
	public PluginJarClassLoader(ClassLoader parent, Path jarPath)
	{
		super(pathToURLs(jarPath), parent);
		this.parentCl = parent;
		
	    try(JarInputStream jarFile = new JarInputStream(new FileInputStream(jarPath.toFile())))
	    {
	        JarEntry jar;
	        while ((jar = jarFile.getNextJarEntry()) != null) 
	        {
                String jarEntry = jar.getName();
                URL jarEntryUrl = new URL("jar:file:" + jarPath.toFile().toString() + "!/" + jarEntry);
                String jarEntryName = jarEntry;
                jarResources.put(jarEntryName, jarEntryUrl);
                if (jarEntry.endsWith(".class"))
                {
                	jarEntryName = StringUtils.removeEnd(jarEntry.replaceAll("/", "\\."), ".class");
                    jarResources.put(jarEntryName, jarEntryUrl);
                }
	        }
	    } 
	    catch (Exception cause) 
	    {
	        log.error("Error while getting resource names from plugin jar: {}!", jarPath.toString(), cause);
	    }
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

	
	@Override
	protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException 
	{
		Class<?> clazz = null;

		clazz = findLoadedClass(name);
		if (clazz != null)
		{
			log.trace("[{}]  ::  Class already loaded with [{}]", name,
					clazz.getClassLoader() != null ? clazz.getClassLoader().getClass().getSimpleName() : "System");
			return clazz;
		}
		
		clazz = loadClassFromJdk(name);
		if (clazz != null)
		{
			log.trace("[{}]  ::  Loaded with system ClassLoader  [{}]", name, 
					clazz.getClassLoader() != null ? clazz.getClassLoader().getClass().getSimpleName() : "System");
			return clazz;
		}
		
		clazz = loadClassFromParent(name);
		if (clazz != null)
		{
			log.trace("[{}]  ::  Loaded with parent ClassLoader  [{}]", name, clazz.getClassLoader().getClass().getSimpleName());
			return clazz;
		}
		
		clazz = loadClassFromJar(name, resolve);
		if (clazz != null)
		{
			log.trace("[{}]  ::  Loaded with custom ClassLoader  [{}]", name, clazz.getClassLoader().getClass().getSimpleName());			
			return clazz;
		}

		return null;
	}

	

	@Override
	public URL findResource(String name) {
		URL url = findInternal(name);
		log.trace("[{}]  :: Find resource:  {}", (url == null ? " FAIL " : " OK "), name);
		return url;
	}


	@Override
	public Enumeration<URL> findResources(String name) throws IOException 
	{
		Enumeration<URL> urls = null;
		
        URL url = jarResources.get(name);
        if (url != null)
        {
        	urls = Collections.enumeration(Arrays.asList(new URL[] { url }));
        	log.trace("[{}]  :: Found resources in jar:  {}", ((urls == null || !urls.hasMoreElements()) ? " FAIL " : " OK "), name);
        }
        else
        {
        	urls = super.findResources(name);
   			log.trace("[{}]  :: Found resources using super:  {}", ((urls == null || !urls.hasMoreElements()) ? " FAIL " : " OK "), name);
        }
		
		return urls;
	}


	@Override
	public URL getResource(String name) {
        Objects.requireNonNull(name);
		if (StringUtils.startsWithAny(name, "org/lowcoder/plugin/api/", "org.lowcoder.plugin.api."))
		{
			return parentCl.getResource(name);
		}
        return findResource(name);
    }


	@Override
	public Enumeration<URL> getResources(String name) throws IOException 
	{
		Objects.requireNonNull(name);
		if (StringUtils.startsWithAny(name, "org/lowcoder/plugin/api/", "org.lowcoder.plugin.api."))
		{
			return parentCl.getResources(name);
		}
		return findResources(name);
	}
	
	
	private URL findInternal(String name)
	{
		return jarResources.get(name);
	}
	
	private byte[] loadClassData(String name)
	{
		URL url = getResource(name);
		if (url == null)
		{
			return null;
		}
		
		try
		{
			return IOUtils.toByteArray(url);
		}
		catch(IOException cause)
		{
			log.warn("Unable to load class data for: {} !", name, cause);
		}
		
		return null;
	}
	
	private Class<?> loadClassFromJar(String name, boolean resolve)
	{
		try
		{
			byte[] classBytes = loadClassData(name);
			if (classBytes == null)
			{
				return null;
			}
			
			Class<?> clazz = defineClass(name, classBytes, 0, classBytes.length);
			if (resolve)
			{
				resolveClass(clazz);
			}
			return clazz;
		}
		catch(Throwable cause)
		{
			log.error("[{}]  ::  Error loading class - {}", name, cause.getMessage(), cause );
		}
		return null;
	}
	
	
	private Class<?> loadClassFromParent(String name)
	{
		if (name.startsWith("org.lowcoder.plugin.api."))
		{
			try 
			{
				Class<?> clazz = parentCl.loadClass(name);
				return clazz;
			}
			catch(Throwable cause)
			{
				log.trace("[{}]  ::  Error loading class - {}", name, cause.getMessage(), cause );
			}
		}

		return null;
	}
	

	private static final String[] excludedPackages = new String[] 
	{
		"com.sun.el."
	};
	
	private static final String[] jrtPackages = new String[] 
	{
		"com.sun.",
		"java.",
		"javax.",
		"jdk.",
		"org.jcp.xml.",
		"org.w3c.dom.",
		"org.xml.sax.",
		"sun.",
	};
	private Class<?> loadClassFromJdk(String name)
	{
		if (StringUtils.startsWithAny(name, jrtPackages) && !StringUtils.startsWithAny(name, excludedPackages))
		{
			try
			{
				
				Class<?> clazz = ClassLoader.getPlatformClassLoader().loadClass(name);
				return clazz;
			}
			catch(Throwable cause)
			{
				log.trace("[{}]  ::  Error loading class - {}", name, cause.getMessage(), cause );
			}
		}
		return null;
	}
}
