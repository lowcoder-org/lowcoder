package org.lowcoder.plugins;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.user.GreenMailUser;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import jakarta.mail.internet.MimeMessage;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The in-process GreenMail SMTP servers of the L5-10 tests and the helpers around them. Not a container: GreenMail runs inside
 * the test JVM. The server binds port 0, so the operating system assigns a free port, and the test reads the bound port back
 * ({@code getSmtp().getPort()}; probed in GreenMail 2.0.1, which reports the real port): no fixed port, no port race. Not a test.
 */
final class SmtpGreenMailSupport {

    static final String LOOPBACK = "127.0.0.1";
    static final String LOGIN = "mailer";
    static final String PASSWORD = "mailer-pw";
    static final String LOGIN_EMAIL = "mailer@example.com";

    private SmtpGreenMailSupport() {
    }

    /** A started server that wants the login {@link #LOGIN} with {@link #PASSWORD} (SMTP AUTH is checked). */
    static GreenMail startAuthenticating() {
        GreenMail server = new GreenMail(new ServerSetup(0, LOOPBACK, ServerSetup.PROTOCOL_SMTP));
        server.withConfiguration(GreenMailConfiguration.aConfig().withUser(LOGIN_EMAIL, LOGIN, PASSWORD));
        server.start();
        System.out.println("[SmtpGreenMailSupport] authenticating server on " + LOOPBACK + ":" + server.getSmtp().getPort());
        return server;
    }

    /** A started open relay: authentication is disabled. */
    static GreenMail startOpenRelay() {
        GreenMail server = new GreenMail(new ServerSetup(0, LOOPBACK, ServerSetup.PROTOCOL_SMTP));
        server.withConfiguration(GreenMailConfiguration.aConfig().withDisabledAuthentication());
        server.start();
        System.out.println("[SmtpGreenMailSupport] open relay on " + LOOPBACK + ":" + server.getSmtp().getPort());
        return server;
    }

    /** The datasource config map of a server, with the credentials given (null: absent). */
    static Map<String, Object> configMap(GreenMail server, String username, String password) {
        Map<String, Object> values = new HashMap<>();
        values.put("host", LOOPBACK);
        values.put("port", server.getSmtp().getPort());
        if (username != null) {
            values.put("username", username);
        }
        if (password != null) {
            values.put("password", password);
        }
        return values;
    }

    /** The messages in the inbox of {@code email} (the server creates a mailbox for each recipient it delivers to). */
    static List<MimeMessage> inboxOf(GreenMail server, String email) throws Exception {
        GreenMailUser user = server.getManagers().getUserManager().getUserByEmail(email);
        List<MimeMessage> messages = new ArrayList<>();
        if (user == null) {
            return messages;
        }
        for (var stored : server.getManagers().getImapHostManager().getInbox(user).getMessages()) {
            messages.add(stored.getMimeMessage());
        }
        return messages;
    }
}
