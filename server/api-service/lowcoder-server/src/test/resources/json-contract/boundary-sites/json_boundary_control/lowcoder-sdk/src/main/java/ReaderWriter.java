class ReaderWriter {
    void use(Object mapper, java.io.OutputStream out, Object value) throws Exception {
        ((com.fasterxml.jackson.databind.ObjectMapper) mapper).writeValue(out, value);
        ((com.fasterxml.jackson.databind.ObjectMapper) mapper).readerFor(String.class);
    }
}
