package org.lowcoder.plugin.databricks.model;

import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;

public final class DatabricksConnectionUriParser {

    /*
     * Regex for the full Databricks JDBC URL.
     * Uses named capture groups for hostname, port, httpPath, authMech, and optionalParams.
     *
     * Breakdown with Capture Groups:
     * ^jdbc:databricks:\/\/: Matches the literal prefix.
     * (?<hostname>[a-zA-Z0-9\.-]+): Captures the server hostname.
     * :(?<port>[0-9]{2,5}): Captures the port number.
     * ;httpPath=: Matches the literal string.
     * (?<httpPath>(?:sql\/1\.0\/warehouses\/[a-zA-Z0-9]+|sql\/protocolv1\/o\/[0-9]+\/[0-9]{4}-[0-9]{6}-[a-zA-Z0-9]+)): Captures the httpPath.
     * ;AuthMech=(?<authMech>[0-9]+): Captures the AuthMech value.
     * (?<optionalParams>(?:;[a-zA-Z0-9_]+=[^;]+)*): Captures all optional parameters as a single block.
     * ;?$: Matches an optional trailing semicolon and asserts the end of the string.
     */
    public static final String DATABRICKS_URL_REGEX = "^jdbc:databricks:\\/\\/(?<hostname>[a-zA-Z0-9\\.-]+):(?<port>[0-9]{2,5});httpPath=(?<httpPath>(?:sql\\/1\\.0\\/warehouses\\/[a-zA-Z0-9]+|sql\\/protocolv1\\/o\\/[0-9]+\\/[0-9]{4}-[0-9]{6}-[a-zA-Z0-9]+));AuthMech=(?<authMech>[0-9]+)(?<optionalParams>(?:;[a-zA-Z0-9_]+=[^;]+)*);?$";

    /*
     * Regex for parsing individual key-value pairs within the optionalParams string.
     * Uses named capture groups for key and value.
     */
    public static final String DATABRICKS_OPTIONAL_PARAMS_REGEX = "(?<key>[a-zA-Z0-9_]+)=(?<value>[^;]+)";

    private static final Pattern URL_PATTERN = Pattern.compile(DATABRICKS_URL_REGEX);
    private static final Pattern PARAM_PATTERN = Pattern.compile(DATABRICKS_OPTIONAL_PARAMS_REGEX);

    // Keys for the extracted information map
    public static final String KEY_HOSTNAME = "hostname";
    public static final String KEY_PORT = "port";
    public static final String KEY_HTTP_PATH = "httpPath";
    public static final String KEY_AUTH_MECH = "authMech";
    public static final String KEY_OPTIONAL_PARAMS = "optionalParams"; // This will hold a nested map of optional params

    // Common optional parameters that might be specifically looked for
    public static final String OPT_KEY_CONN_CATALOG = "ConnCatalog";
    public static final String OPT_KEY_CONN_SCHEMA = "ConnSchema";
    public static final String OPT_KEY_UID = "UID"; // Typically "token"
    public static final String OPT_KEY_PWD = "PWD"; // Personal Access Token

    public static boolean isValid(String uri) {
        return URL_PATTERN.asMatchPredicate().test(uri);
    }

    public static Map<String, Object> extractInfoFromConnectionStringURI(String uri) {
        if (!isValid(uri)) { // Use the isValid method to check first
            return null;
        }

        Matcher matcher = URL_PATTERN.matcher(uri);
        if (matcher.find()) {
            Map<String, Object> extractedInfoMap = new HashMap<>();

            // Extract main components using named capture groups
            extractedInfoMap.put(KEY_HOSTNAME, matcher.group("hostname"));
            extractedInfoMap.put(KEY_PORT, matcher.group("port"));
            extractedInfoMap.put(KEY_HTTP_PATH, matcher.group("httpPath"));
            extractedInfoMap.put(KEY_AUTH_MECH, matcher.group("authMech"));

            // Extract and parse optional parameters
            String optionalParamsRaw = matcher.group("optionalParams");
            Map<String, String> parsedOptionalParams = new HashMap<>();

            if (StringUtils.isNotBlank(optionalParamsRaw)) {
                Matcher paramMatcher = PARAM_PATTERN.matcher(optionalParamsRaw);
                while (paramMatcher.find()) {
                    String key = paramMatcher.group("key");
                    String value = paramMatcher.group("value");
                    parsedOptionalParams.put(key, value);
                }
            }
            extractedInfoMap.put(KEY_OPTIONAL_PARAMS, parsedOptionalParams);

            return extractedInfoMap;
        }

        return null;
    }

    /**
     * Parses the default database (schema) from the connection URI.
     * This now relies on the 'ConnSchema' optional parameter.
     *
     * @param uri The Databricks JDBC connection URI.
     * @return The database (schema) name.
     * @throws org.lowcoder.sdk.exception.PluginException if the URI is invalid or the schema is missing.
     */
    public static String parseDatabaseFrom(String uri) {
        Map<String, Object> extractedInfo = extractInfoFromConnectionStringURI(uri);
        if (extractedInfo == null) {
            throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "INVALID_DATABRICKS_URL");
        }

        // Get the map of optional parameters
        @SuppressWarnings("unchecked") // Safe cast given our controlled map structure
        Map<String, String> optionalParams = (Map<String, String>) extractedInfo.get(KEY_OPTIONAL_PARAMS);

        String database = null;
        if (optionalParams != null) {
            database = optionalParams.get(OPT_KEY_CONN_SCHEMA);
        }

        if (StringUtils.isBlank(database)) {
            throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "DATABRICKS_DATABASE_EMPTY");
        }
        return database;
    }

    // You might want to add similar methods for retrieving ConnCatalog, UID, PWD, etc.
    public static String parseCatalogFrom(String uri) {
        Map<String, Object> extractedInfo = extractInfoFromConnectionStringURI(uri);
        if (extractedInfo == null) {
            throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "INVALID_DATABRICKS_URL");
        }
        @SuppressWarnings("unchecked")
        Map<String, String> optionalParams = (Map<String, String>) extractedInfo.get(KEY_OPTIONAL_PARAMS);

        String catalog = null;
        if (optionalParams != null) {
            catalog = optionalParams.get(OPT_KEY_CONN_CATALOG);
        }
        // Whether to throw error if catalog is blank depends on your plugin's requirements.
        // For Databricks, ConnCatalog is often optional.
        return catalog; // Can return null if not present
    }

    public static String parseAuthTokenFrom(String uri) {
        Map<String, Object> extractedInfo = extractInfoFromConnectionStringURI(uri);
        if (extractedInfo == null) {
            throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "INVALID_DATABRICKS_URL");
        }
        @SuppressWarnings("unchecked")
        Map<String, String> optionalParams = (Map<String, String>) extractedInfo.get(KEY_OPTIONAL_PARAMS);

        String token = null;
        if (optionalParams != null) {
            token = optionalParams.get(OPT_KEY_PWD); // The password field holds the token
        }
        return token; // Can return null if not present or using other auth
    }

    // Add other helper methods as needed for specific optional parameters
}