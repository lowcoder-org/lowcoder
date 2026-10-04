// Control input for docs/tools/json_boundary_sites.py (never compiled). Expected output: json-boundary-control.out
class Ctl {
    public static Object readTree(String s) { return null; }
    Object a() { return readTree("x"); }
    // fromJson(x)
    String s = "fromJson(";
    Object b() { return JsonUtils.fromJson(
            "x", Object.class); }
    java.util.function.Function<Object, Object> f = Ctl::fromJsonNode;
    Object m = new ObjectMapper();
    void w(Object x) { client.post().bodyValue(x).retrieve().bodyToMono(Map.class); }
    Object i = BodyInserters.fromValue(x);
    Object r = Role.fromValue("admin");
    Object e = ExchangeStrategies.builder().codecs(c -> c.defaultCodecs().maxInMemorySize(-1)).build();
}
class CtlCodecs {
    void configure(ServerCodecConfigurer c) { c.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(JsonUtils.getObjectMapper())); }
}
