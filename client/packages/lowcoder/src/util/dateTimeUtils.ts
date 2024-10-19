import { time } from "console";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isLeapYear from "dayjs/plugin/isLeapYear";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import isoWeeksInYear from "dayjs/plugin/isoWeeksInYear";
import weekYear from "dayjs/plugin/weekYear";
import isMoment from "dayjs/plugin/isMoment";
import calendar from "dayjs/plugin/calendar";
import buddhistEra from "dayjs/plugin/buddhistEra";
import minmax from "dayjs/plugin/minMax";
import bigIntSupport from "dayjs/plugin/bigIntSupport";
import objectSupport from "dayjs/plugin/objectSupport";
import pluralGetSet from 'dayjs/plugin/pluralGetSet';
import preParsePostFormat from 'dayjs/plugin/preParsePostFormat';
import toObject from 'dayjs/plugin/toObject';
import toArray from 'dayjs/plugin/toArray';

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
dayjs.extend(relativeTime);
dayjs.extend(bigIntSupport);
dayjs.extend(localizedFormat);
dayjs.extend(objectSupport);
dayjs.extend(pluralGetSet);
dayjs.extend(preParsePostFormat);
dayjs.extend(toObject);
dayjs.extend(toArray);

export const TIME_FORMAT = "HH:mm:ss";
export const TIME_12_FORMAT = "HH:mm:ss:a";
export const TIME_FORMAT_MINUTES = "HH:mm"
export const DATE_FORMAT = "YYYY-MM-DD";
export const DATE_FORMAT_EN = "MM/DD/YYYY";
export const DATE_FORMAT_EN_2 = "M/D/YYYY";
export const DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const DATE_TIME_12_FORMAT = "YYYY-MM-DD HH:mm:ss:a";
export const TIMESTAMP_FORMAT = "x";
export const DateParser = [DATE_TIME_FORMAT, DATE_TIME_12_FORMAT, DATE_FORMAT, TIMESTAMP_FORMAT, DATE_FORMAT_EN, DATE_FORMAT_EN_2];
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
