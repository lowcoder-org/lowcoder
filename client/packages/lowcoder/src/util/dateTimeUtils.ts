import { time } from "console";
import dayjs from "dayjs";
var relativeTime = require ("dayjs/plugin/relativeTime");
var timezone = require ("dayjs/plugin/timezone");
var duration = require ("dayjs/plugin/duration");
var utc = require ("dayjs/plugin/utc");
var quarterOfYear = require ("dayjs/plugin/quarterOfYear");
var weekOfYear = require ("dayjs/plugin/weekOfYear");
var isBetween = require ("dayjs/plugin/isBetween");
var isToday = require ("dayjs/plugin/isToday");
var isTomorrow = require ("dayjs/plugin/isTomorrow");
var isYesterday = require ("dayjs/plugin/isYesterday");
var customParseFormat = require ("dayjs/plugin/customParseFormat");
var advancedFormat = require ("dayjs/plugin/advancedFormat");
var updateLocale = require ("dayjs/plugin/updateLocale");
var localeData = require ("dayjs/plugin/localeData");
var localizedFormat = require ("dayjs/plugin/localizedFormat");
var isLeapYear = require ("dayjs/plugin/isLeapYear");
var isSameOrAfter = require ("dayjs/plugin/isSameOrAfter");
var isSameOrBefore = require ("dayjs/plugin/isSameOrBefore");
var isoWeek = require ("dayjs/plugin/isoWeek");
var isoWeeksInYear = require ("dayjs/plugin/isoWeeksInYear");
var weekYear = require ("dayjs/plugin/weekYear");
var isMoment = require ("dayjs/plugin/isMoment");
var calendar = require ("dayjs/plugin/calendar");
var buddhistEra = require ("dayjs/plugin/buddhistEra");
var minmax = require ("dayjs/plugin/minMax");
var relativetime = require ("dayjs/plugin/relativeTime");
var bigIntSupport = require("dayjs/plugin/bigIntSupport");
var localizedFormat = require('dayjs/plugin/localizedFormat');
var objectSupport = require("dayjs/plugin/objectSupport");
var pluralGetSet = require('dayjs/plugin/pluralGetSet');
var preParsePostFormat = require('dayjs/plugin/preParsePostFormat');
var toObject = require('dayjs/plugin/toObject');
var toUnix = require('dayjs/plugin/toUnix');
var toArray = require('dayjs/plugin/toArray');

dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(updateLocale);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(isLeapYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);
dayjs.extend(isoWeeksInYear);
dayjs.extend(weekYear);
dayjs.extend(isMoment);
dayjs.extend(calendar);
dayjs.extend(buddhistEra);
dayjs.extend(minmax);
dayjs.extend(relativetime);
dayjs.extend(bigIntSupport);
dayjs.extend(localizedFormat);
dayjs.extend(objectSupport);
dayjs.extend(pluralGetSet);
dayjs.extend(preParsePostFormat);
dayjs.extend(toObject);
dayjs.extend(toUnix);
dayjs.extend(toArray);

export const TIME_FORMAT = "HH:mm:ss";
export const TIME_12_FORMAT = "HH:mm:ss:a";
export const TIME_FORMAT_MINUTES = "HH:mm"
export const DATE_FORMAT = "YYYY-MM-DD";
export const DATE_FORMAT_EN = "MM/DD/YYYY";
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const DATE_TIME_12_FORMAT = "YYYY-MM-DD HH:mm:ss:a";
export const TIMESTAMP_FORMAT = "x";
export const DateParser = [DATE_TIME_FORMAT, DATE_TIME_12_FORMAT, DATE_FORMAT, TIMESTAMP_FORMAT, DATE_FORMAT_EN];
export const TimeParser = [TIME_12_FORMAT, TIME_FORMAT, TIMESTAMP_FORMAT];
export type PickerMode = "date" | "week" | "month" | "quarter" | "year";

/**
 * timestamp to date string
 * @param timestamp timestamp milliseconds
 * @returns string YYYY-MM-DD HH:mm
 */
export function formatTimestamp(timestamp: number): string {
  return dayjs.unix(timestamp / 1000).format("YYYY-MM-DD HH:mm");
}

/**
 * timestamp to human readable string
 * - if timestamp is less than *intervalMillis* ms from now, transform to a time description related to now;
 * - otherwise return the absolute time string
 *
 * @param timestamp timestamp milliseconds
 * @param intervalMillis default value is an hour
 * @returns readable string
 */
export function timestampToHumanReadable(
  timestamp?: number,
  intervalMillis: number = 3600000
): string {
  if (!timestamp) {
    return "";
  }
  const now = Date.now();
  const TIME_FORMAT = "YYYY-MM-DD HH:mm";
  let timeInfo;
  if (now - new Date(timestamp).getTime() <= intervalMillis) {
    timeInfo = dayjs(timestamp).fromNow();
  } else {
    timeInfo = dayjs(timestamp).format(TIME_FORMAT);
  }
  return timeInfo;
}
