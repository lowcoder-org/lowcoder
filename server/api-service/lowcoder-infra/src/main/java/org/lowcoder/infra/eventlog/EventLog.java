package org.lowcoder.infra.eventlog;

import java.util.Map;

public record EventLog(String deploymentId, String deploymentVersion, String eventType, Map<String, Object> log) {

}
