import static org.springframework.web.reactive.function.BodyInserters.fromValue;

class StaticInserter {
    Object body(Object value) {
        return fromValue(value);
    }
}
