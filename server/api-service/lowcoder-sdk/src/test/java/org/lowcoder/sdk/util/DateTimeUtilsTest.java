package org.lowcoder.sdk.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** {@link DateTimeUtils}: the day format (which follows the JVM default time zone) and the conversion to {@link Instant}. */
public class DateTimeUtilsTest {

    private static final long LAST_MILLI_OF_DAY_ONE_UTC = 86_399_999L;
    private static final long ONE_HOUR_MILLIS = 3_600_000L;
    private TimeZone previous;

    @BeforeEach
    public void remember() {
        previous = TimeZone.getDefault();
    }

    @AfterEach
    public void restore() {
        TimeZone.setDefault(previous);
    }

    @Test
    public void theDayIsFormattedInTheDefaultTimeZoneSoTheSameInstantCanShowTwoDates() {
        Date late = new Date(LAST_MILLI_OF_DAY_ONE_UTC);
        Date early = new Date(ONE_HOUR_MILLIS);

        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        String utcLate = DateTimeUtils.format(late);
        String utcEarly = DateTimeUtils.format(early);
        TimeZone.setDefault(TimeZone.getTimeZone("Pacific/Auckland"));
        String aucklandLate = DateTimeUtils.format(late);
        TimeZone.setDefault(TimeZone.getTimeZone("America/Los_Angeles"));
        String losAngelesEarly = DateTimeUtils.format(early);

        System.out.println("[DateTimeUtilsTest] 23:59:59.999 UTC -> UTC " + utcLate + ", Auckland " + aucklandLate + "; 01:00 UTC -> UTC " + utcEarly + ", Los Angeles " + losAngelesEarly);
        assertEquals("1970-01-01", utcLate);
        assertEquals("1970-01-01", utcEarly);
        assertEquals("1970-01-02", aucklandLate, "23:59 UTC is 12:00 the next day in UTC+12");
        assertEquals("1969-12-31", losAngelesEarly, "01:00 UTC is 17:00 the previous day in UTC-8");
    }

    @Test
    public void aDateConvertsToTheInstantOfTheSameMillisecond() {
        Date date = new Date(1_700_000_000_123L);

        assertEquals(Instant.ofEpochMilli(1_700_000_000_123L), DateTimeUtils.toInstant(date));
    }

    @Test
    public void anObjectConvertsOnlyWhenItIsAnInstantOrADate() {
        Instant instant = Instant.parse("2024-02-29T12:00:00Z");

        assertSame(instant, DateTimeUtils.toInstant((Object) instant));
        assertEquals(Instant.ofEpochMilli(5), DateTimeUtils.toInstant((Object) new Date(5)));
        assertNull(DateTimeUtils.toInstant((Object) "2024-02-29"));
        assertNull(DateTimeUtils.toInstant((Object) 5L));
        assertNull(DateTimeUtils.toInstant((Object) null));
    }

    @Test
    public void theDateTimeFormatterUsesTheTwentyFourHourClock() {
        assertEquals("2024-02-29 13:05:09", DateTimeUtils.DATE_TIME_FORMAT.format(LocalDateTime.of(2024, 2, 29, 13, 5, 9)));
        assertEquals("2024-01-02 00:00:00", DateTimeUtils.DATE_TIME_FORMAT.format(LocalDateTime.of(2024, 1, 2, 0, 0, 0)));
    }
}
