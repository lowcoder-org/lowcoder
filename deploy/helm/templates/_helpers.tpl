{{/*
Expand the name of the chart.
*/}}
{{- define "lowcoder.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "lowcoder.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Allow the release namespace to be overridden for multi-namespace deployments in combined charts.
*/}}
{{- define "lowcoder.namespace" -}}
    {{- if .Values.global -}}
        {{- if .Values.global.namespaceOverride }}
            {{- .Values.global.namespaceOverride -}}
        {{- else -}}
            {{- .Release.Namespace -}}
        {{- end -}}
    {{- else -}}
        {{- .Release.Namespace -}}
    {{- end }}
{{- end -}}


{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "lowcoder.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "lowcoder.labels" -}}
helm.sh/chart: {{ include "lowcoder.chart" . }}
{{ include "lowcoder.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "lowcoder.selectorLabels" -}}
{{- $name := include "lowcoder.name" . -}}
{{- $componentName := .component | default "" -}}
{{- if ne $componentName "" -}}
app.kubernetes.io/name: {{ $name }}-{{ $componentName }}
{{- else -}}
app.kubernetes.io/name: {{ $name }}
{{- end }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "lowcoder.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "lowcoder.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Value of a setting, or its default when the setting is not set at all.
Unlike `default`, keeps false and 0 (e.g. enableEmailAuth: false, apiRateLimit: 0).
Usage: include "lowcoder.orDefault" (dict "value" .Values.x "default" "true")
*/}}
{{- define "lowcoder.orDefault" -}}
{{- if kindIs "invalid" .value -}}
{{- .default -}}
{{- else -}}
{{- .value -}}
{{- end -}}
{{- end }}

{{/*
Percent-encode a value for the user/password part of a URL (RFC 3986).
urlquery escapes every reserved character (a literal "+" as %2B) and only a space as "+".
*/}}
{{- define "lowcoder.urlUserinfo" -}}
{{- . | toString | urlquery | replace "+" "%20" -}}
{{- end }}

{{/*
Name of the redis subchart's resources, the same rule as Bitnami's common.names.fullname
evaluated for the redis subchart (its master Service is "<name>-master").
*/}}
{{- define "lowcoder.redis.fullname" -}}
{{- if .Values.redis.fullnameOverride -}}
{{- .Values.redis.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "redis" .Values.redis.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end }}

{{/*
Redis password when redis.auth.enabled: auth.password, else key auth.existingSecretPasswordKey
(Bitnami's default "redis-password") of auth.existingSecret, read with lookup at install/upgrade
time (empty under helm template / --dry-run). Fails when neither is set: Bitnami would generate
a random password this chart cannot know at render time.
*/}}
{{- define "lowcoder.redis.password" -}}
{{- $auth := .Values.redis.auth | default dict -}}
{{- if $auth.password -}}
{{- $auth.password -}}
{{- else if $auth.existingSecret -}}
{{- $secret := lookup "v1" "Secret" (include "lowcoder.namespace" .) $auth.existingSecret | default dict -}}
{{- $key := $auth.existingSecretPasswordKey | default "redis-password" -}}
{{- index ($secret.data | default dict) $key | default "" | b64dec -}}
{{- else -}}
{{- fail "redis.auth.enabled is true: set redis.auth.password or redis.auth.existingSecret" -}}
{{- end -}}
{{- end }}

{{/*
LOWCODER_REDIS_URL. External redis (redis.enabled false): redis.externalUrl starting with
redis:// or rediss:// is used as given (credentials are the user's), otherwise it is host[:port]
and the URL is built like for the in-chart redis: redis://[:<password>@]host[:port].
*/}}
{{- define "lowcoder.redis.url" -}}
{{- $external := .Values.redis.externalUrl | default "" | toString -}}
{{- if and (not .Values.redis.enabled) (or (hasPrefix "redis://" $external) (hasPrefix "rediss://" $external)) -}}
{{- $external -}}
{{- else -}}
{{- $host := $external -}}
{{- if .Values.redis.enabled -}}
{{- $host = printf "%s-master.%s.svc.cluster.local:6379" (include "lowcoder.redis.fullname" .) (include "lowcoder.namespace" .) -}}
{{- else if not $host -}}
{{- fail "redis.enabled is false: set redis.externalUrl" -}}
{{- end -}}
{{- if (.Values.redis.auth | default dict).enabled -}}
{{- printf "redis://:%s@%s" (include "lowcoder.urlUserinfo" (include "lowcoder.redis.password" .)) $host -}}
{{- else -}}
{{- printf "redis://%s" $host -}}
{{- end -}}
{{- end -}}
{{- end }}

{{/*
Websocket URL browsers use for hocuspocus (LOWCODER_HOCUSPOCUS_URL of proxy-service).
hocuspocus.publicUrl if set; else, with the ingress route of hocuspocus enabled, derived from the
single ingress host and hocuspocus.ingress.path (wss when the host is listed in ingress.tls).
Fails when it cannot be derived (several hosts or a hostless rule): there is one URL per
deployment, the frontend has the same URL baked in. Empty when hocuspocus has no ingress route.
*/}}
{{- define "lowcoder.hocuspocus.publicUrl" -}}
{{- if .Values.hocuspocus.publicUrl -}}
{{- .Values.hocuspocus.publicUrl -}}
{{- else if and .Values.ingress.enabled .Values.hocuspocus.enabled .Values.hocuspocus.ingress.enabled -}}
{{- $hosts := .Values.ingress.hosts | default list -}}
{{- if ne (len $hosts) 1 -}}
{{- fail (printf "hocuspocus.publicUrl must be set: it cannot be derived from %d ingress hosts" (len $hosts)) -}}
{{- end -}}
{{- $host := (first $hosts).host | default "" -}}
{{- if not $host -}}
{{- fail "hocuspocus.publicUrl must be set: it cannot be derived from an ingress rule without host" -}}
{{- end -}}
{{- $scheme := "ws" -}}
{{- range .Values.ingress.tls -}}
{{- if has $host (.hosts | default list) -}}
{{- $scheme = "wss" -}}
{{- end -}}
{{- end -}}
{{- printf "%s://%s%s" $scheme $host .Values.hocuspocus.ingress.path -}}
{{- end -}}
{{- end }}

{{/*
Container resources of a service, falling back to the top-level `resources`.
Usage: include "lowcoder.resources" (dict "service" .Values.apiService "root" .)
*/}}
{{- define "lowcoder.resources" -}}
{{- toYaml (.service.resources | default .root.Values.resources) -}}
{{- end }}
