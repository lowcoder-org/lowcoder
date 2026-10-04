// Control input: imports a Jackson mapper type but contains no listed call; must be reported as `ImportOnly.java:0 import`.
import com.fasterxml.jackson.databind.ObjectMapper;

class ImportOnly {
    void use(ObjectMapper mapper) { mapper.someMethodNotListed(); }
}
