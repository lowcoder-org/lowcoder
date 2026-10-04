class Wrap {
    public static String render(Object value) {
        return toJson(value);
    }

    private static String hidden(Object value) {
        return toJson(value);
    }
}
