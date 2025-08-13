package org.lowcoder.plugins;

import static jakarta.mail.Message.RecipientType.BCC;
import static jakarta.mail.Message.RecipientType.CC;
import static jakarta.mail.Message.RecipientType.TO;
import static org.apache.commons.collections4.MapUtils.getString;
import static org.apache.commons.lang3.ArrayUtils.isNotEmpty;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.lowcoder.sdk.exception.BizError.DATASOURCE_CLOSE_FAILED;
import static org.lowcoder.sdk.exception.PluginCommonError.DATASOURCE_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_ARGUMENT_ERROR;
import static org.lowcoder.sdk.exception.PluginCommonError.QUERY_EXECUTION_ERROR;
import static org.lowcoder.sdk.plugin.common.QueryExecutionUtils.querySharedScheduler;
import static org.lowcoder.sdk.util.ExceptionUtils.ofPluginException;
import static org.lowcoder.sdk.util.JsonUtils.fromJsonList;
import static org.lowcoder.sdk.util.JsonUtils.toJson;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheArrayJsonString;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheJsonString;
import static org.lowcoder.sdk.util.MustacheHelper.renderMustacheString;

import java.util.Base64;
import java.util.Base64.Decoder;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Stream;

import jakarta.activation.DataHandler;
import jakarta.annotation.Nonnull;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.util.ByteArrayDataSource;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.plugins.SmtpQueryExecutionContext.Attachment;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.exception.PluginException;
import org.lowcoder.sdk.models.DatasourceTestResult;
import org.lowcoder.sdk.models.QueryExecutionResult;
import org.lowcoder.sdk.plugin.common.DatasourceQueryEngine;
import org.lowcoder.sdk.query.QueryVisitorContext;
import org.lowcoder.sdk.util.JsonUtils;
import org.pf4j.Extension;
import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

public class SmtpPlugin extends Plugin {

    public SmtpPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class SmtpEngine implements DatasourceQueryEngine<SmtpDatasourceConfig, Session, SmtpQueryExecutionContext> {

        private static final int DEFAULT_PORT = 25;

        /**
         * session is thread-safe and can be reused
         * <a href="https://stackoverflow.com/question">...</a>s/12732584/threadsafety-in-javamail
         */
        @Override
        public Mono<Session> createConnection(SmtpDatasourceConfig connectionConfig) {

            Properties prop = new Properties();
            prop.put("mail.transport.protocol", "smtp");
            prop.put("mail.smtp.host", connectionConfig.getHost());
            prop.put("mail.smtp.port", connectionConfig.getPort() <= 0 ? DEFAULT_PORT : connectionConfig.getPort());
            prop.put("mail.smtp.auth", true);
            prop.put("mail.smtp.username", connectionConfig.getUsername());
            prop.put("mail.smtp.starttls.enable", "true");
            prop.put("mail.smtp.ssl.protocols", "TLSv1.2");
            prop.put("mail.smtp.ssl.checkserveridentity", false);

            return Mono.fromSupplier(() ->
                            // blocked call
                            Session.getInstance(prop, new Authenticator() {
                                @Override
                                protected PasswordAuthentication getPasswordAuthentication() {
                                    return new PasswordAuthentication(connectionConfig.getUsername(), connectionConfig.getPassword());
                                }
                            }))
                    .subscribeOn(querySharedScheduler());
        }

        @Override
        public Mono<Void> destroyConnection(Session session) {
            return Mono.<Void> fromRunnable(() -> {
                        try {
                            if (session.getTransport() != null) {
                                session.getTransport().close();
                            }
                        } catch (MessagingException e) {
                            throw new BizException(DATASOURCE_CLOSE_FAILED, "DATASOURCE_CLOSE_FAILED", e.getMessage());
                        }
                    })
                    .subscribeOn(querySharedScheduler());
        }

        @Override
        public Mono<DatasourceTestResult> testConnection(SmtpDatasourceConfig connectionConfig) {
            Mono<Session> sessionMono = doCreateConnection(connectionConfig).cache();
            return sessionMono
                    .map(session -> {
                        try {
                            if (connectionConfig.getUsername() != null) {
                                session.getTransport().connect(connectionConfig.getUsername(), connectionConfig.getPassword());
                            }
                            else {
                                session.getTransport().connect();
                            }
                            return DatasourceTestResult.testSuccess();
                        } catch (MessagingException e) {
                            log.debug("SmtpPlugin.testConnection() failed!", e);
                            return DatasourceTestResult.testFail(e);
                        }
                    })
                    .onErrorResume(throwable -> Mono.just(DatasourceTestResult.testFail(throwable)))
                    .doFinally(signalType -> sessionMono.flatMap(this::destroyConnection).subscribeOn(querySharedScheduler()).subscribe())
                    .subscribeOn(querySharedScheduler());
        }

        @Nonnull
        @Override
        public SmtpDatasourceConfig resolveConfig(Map<String, Object> configMap) {
            SmtpDatasourceConfig result = JsonUtils.fromJson(toJson(configMap), SmtpDatasourceConfig.class);
            if (result == null) {
                throw ofPluginException(DATASOURCE_ARGUMENT_ERROR, "INVALID_SMTP_CONFIG");
            }
            return result;
        }

        @Override
        public Set<String> validateConfig(SmtpDatasourceConfig connectionConfig) {
            Set<String> invalids = new HashSet<>();
            if (isBlank(connectionConfig.getHost())) {
                invalids.add("HOST_EMPTY");
            }
            if (connectionConfig.getPort() < 0) {
                invalids.add("INVALID_PORT");
            }
            return invalids;
        }

        @Override
        public SmtpQueryExecutionContext buildQueryExecutionContext(SmtpDatasourceConfig datasourceConfig, Map<String, Object> queryConfig,
                Map<String, Object> requestParams, QueryVisitorContext queryVisitorContext) {
            return SmtpQueryExecutionContext.builder()
                    .from(renderAsStringAndParse(getString(queryConfig, "from"), requestParams)[0])
                    .to(renderAsArrayAndParse(getString(queryConfig, "to"), requestParams))
                    .cc(renderAsArrayAndParse(getString(queryConfig, "cc", ""), requestParams))
                    .bcc(renderAsArrayAndParse(getString(queryConfig, "bcc", ""), requestParams))
                    .replyTo(renderAsArrayAndParse(getString(queryConfig, "replyTo", ""), requestParams))
                    .subject(renderMustacheString(getString(queryConfig, "subject"), requestParams))
                    .content(renderMustacheString(getString(queryConfig, "content", ""), requestParams))
                    .attachments(fromJsonList(renderMustacheJsonString(getString(queryConfig, "attachments", ""), requestParams), Attachment.class))
                    .build();
        }

        private InternetAddress[] renderAsStringAndParse(String template, Map<String, Object> paramMap) {
            if (StringUtils.isBlank(template)) {
                return new InternetAddress[0];
            }
            String rendered = renderMustacheString(template, paramMap);
            return parse(List.of(rendered));
        }

        private InternetAddress[] renderAsArrayAndParse(String template, Map<String, Object> paramMap) {
            if (StringUtils.isBlank(template)) {
                return new InternetAddress[0];
            }
            String rendered = renderMustacheArrayJsonString(template, paramMap);
            List<String> addresses = fromJsonList(rendered, String.class);
            return parse(addresses);
        }

        private InternetAddress[] parse(List<String> internetAddresses) {
            if (CollectionUtils.isEmpty(internetAddresses)) {
                return new InternetAddress[0];
            }
            return internetAddresses.stream()
                    .map(s -> {
                        try {
                            return InternetAddress.parse(s);
                        } catch (AddressException e) {
                            throw new PluginException(QUERY_ARGUMENT_ERROR, "QUERY_ARGUMENT_ERROR", e.getMessage());
                        }
                    })
                    .flatMap(Stream::of)
                    .toList()
                    .toArray(new InternetAddress[0]);
        }

        @Override
        public Mono<QueryExecutionResult> executeQuery(Session session, SmtpQueryExecutionContext queryExecutionContext) {
            return Mono.fromSupplier(() -> {
                        try {
                            Transport.send(buildMessage(session, queryExecutionContext));
                            return QueryExecutionResult.success(null);
                        } catch (MessagingException e) {
                            return QueryExecutionResult.error(QUERY_EXECUTION_ERROR, "QUERY_EXECUTION_ERROR", e.getMessage());
                        }
                    })
                    .subscribeOn(querySharedScheduler());
        }

        private Message buildMessage(Session session, SmtpQueryExecutionContext context) throws MessagingException {
            MimeMessage message = new MimeMessage(session);

            message.setFrom(context.getFrom());
            message.setReplyTo(context.getReplyTo());
            message.setRecipients(TO, context.getTo());
            if (isNotEmpty(context.getCc())) {
                message.setRecipients(CC, context.getCc());
            }
            if (isNotEmpty(context.getBcc())) {
                message.setRecipients(BCC, context.getBcc());
            }
            message.setSubject(context.getSubject());

            Multipart multipart = new MimeMultipart();
            MimeBodyPart contentPart = new MimeBodyPart();
            contentPart.setContent(context.getContent(), "text/html");// default mime type
            multipart.addBodyPart(contentPart);
            if (CollectionUtils.isNotEmpty(context.getAttachments())) {
                Decoder decoder = Base64.getDecoder();
                for (Attachment attachment : context.getAttachments()) {
                    MimeBodyPart attachmentPart = new MimeBodyPart();
                    attachmentPart.setDataHandler(
                            new DataHandler(new ByteArrayDataSource(decoder.decode(attachment.content()), attachment.contentType())));
                    attachmentPart.setDisposition(Part.ATTACHMENT);
                    attachmentPart.setFileName(attachment.name());
                    multipart.addBodyPart(attachmentPart);
                }
            }
            message.setContent(multipart);
            return message;
        }
    }
}
