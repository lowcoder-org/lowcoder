package org.lowcoder.api.framework.plugin;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;

import org.lowcoder.plugin.api.LowcoderPlugin;
import org.lowcoder.plugin.api.LowcoderServices;
import org.lowcoder.plugin.api.PluginEndpoint;

/** Plugin fixtures and a jar builder shared by the plugin loading and manager tests (new test support, L2-7). */
public final class PluginTestSupport {

    public static final String SERVICES_ENTRY = "META-INF/services/" + LowcoderPlugin.class.getName();

    private PluginTestSupport() {
    }

    /**
     * A plugin that records how it was loaded: {@link #pluginInfo()} returns a future of
     * {@code {thread name, context class loader, env, services}}, completed by {@code load}. Instances created by a
     * {@code PluginClassLoader} cannot share static state with the test, so the future is the way out.
     */
    public static class RecordingPlugin implements LowcoderPlugin {
        private final CompletableFuture<Object[]> loaded = new CompletableFuture<>();

        @Override
        public boolean load(Map<String, Object> env, LowcoderServices services) {
            loaded.complete(new Object[]{Thread.currentThread().getName(), Thread.currentThread().getContextClassLoader(), env, services});
            return true;
        }

        @Override
        public void unload() {
        }

        @Override
        public String pluginId() {
            return "recording-plugin";
        }

        @Override
        public Object pluginInfo() {
            return loaded;
        }

        @Override
        public String description() {
            return "records its load";
        }

        @Override
        public int loadOrder() {
            return 0;
        }

        @Override
        public List<PluginEndpoint> endpoints() {
            return List.of();
        }
    }

    /** A second plugin with another id. */
    public static class SecondPlugin extends RecordingPlugin {
        @Override
        public String pluginId() {
            return "second-plugin";
        }

        @Override
        public String description() {
            return "the second plugin";
        }
    }

    /** A plugin with the same id as {@link RecordingPlugin}. */
    public static class SameIdPlugin extends RecordingPlugin {
        @Override
        public String description() {
            return "same id as the recording plugin";
        }
    }

    /** A class whose superclass is missing from every jar built here. */
    public static class MissingBase {
    }

    public static class OrphanClass extends MissingBase {
    }

    /** Resource path of a class file. */
    public static String classEntry(Class<?> type) {
        return type.getName().replace('.', '/') + ".class";
    }

    /**
     * Writes a jar with the class files of {@code classes}, and, when {@code serviceClasses} is not empty, a
     * {@code META-INF/services} entry naming them.
     */
    public static Path jar(Path directory, String fileName, List<Class<?>> serviceClasses, Class<?>... classes) throws IOException {
        Files.createDirectories(directory);
        Path jar = directory.resolve(fileName);
        try (OutputStream out = Files.newOutputStream(jar); JarOutputStream jarOut = new JarOutputStream(out)) {
            for (Class<?> type : classes) {
                jarOut.putNextEntry(new JarEntry(classEntry(type)));
                try (InputStream in = type.getClassLoader().getResourceAsStream(classEntry(type))) {
                    in.transferTo(jarOut);
                }
                jarOut.closeEntry();
            }
            if (!serviceClasses.isEmpty()) {
                jarOut.putNextEntry(new JarEntry(SERVICES_ENTRY));
                String names = String.join("\n", serviceClasses.stream().map(Class::getName).toList());
                jarOut.write(names.getBytes(StandardCharsets.UTF_8));
                jarOut.closeEntry();
            }
        }
        return jar;
    }

    /** Writes a jar with the given raw entries (entry name to bytes). */
    public static Path rawJar(Path directory, String fileName, Map<String, byte[]> entries) throws IOException {
        Files.createDirectories(directory);
        Path jar = directory.resolve(fileName);
        try (OutputStream out = Files.newOutputStream(jar); JarOutputStream jarOut = new JarOutputStream(out)) {
            for (Map.Entry<String, byte[]> entry : entries.entrySet()) {
                jarOut.putNextEntry(new JarEntry(entry.getKey()));
                jarOut.write(entry.getValue());
                jarOut.closeEntry();
            }
        }
        return jar;
    }

    /** Bytes of an empty public class with the given internal name (for example {@code a/b/C}). */
    public static byte[] emptyClass(String internalName) {
        org.springframework.asm.ClassWriter writer = new org.springframework.asm.ClassWriter(0);
        writer.visit(org.springframework.asm.Opcodes.V17, org.springframework.asm.Opcodes.ACC_PUBLIC, internalName, null, "java/lang/Object", null);
        writer.visitEnd();
        return writer.toByteArray();
    }
}
