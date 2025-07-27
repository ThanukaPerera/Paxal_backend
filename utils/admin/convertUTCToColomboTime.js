const { toZonedTime, format } = require("date-fns-tz");

const TIMEZONE_COLOMBO = "Asia/Colombo"; // UTC+05:30

/**
 * Converts a UTC date to Colombo time (Asia/Colombo) and optionally formats it.
 * @param {Date} utcDate - The UTC date to convert.
 * @param {string|boolean} [formatString=false] - The format for the output date string, or false to return raw Date.
 * @returns {string|Date} - Formatted date string in Colombo time if formatString is provided, otherwise raw Date object.
 * @throws {Error} - If the input date is invalid.
 */
function convertUTCToColomboTime(utcDate, formatString = false) {
  if (!(utcDate instanceof Date) || isNaN(utcDate)) {
    throw new Error("Invalid date provided");
  }

  // Convert UTC date to Colombo time
  const colomboDate = toZonedTime(utcDate, TIMEZONE_COLOMBO);

  // Return formatted date if formatString is provided, otherwise return raw Date
  if (formatString && typeof formatString === "string") {
    return format(colomboDate, formatString, { timeZone: TIMEZONE_COLOMBO });
  }
  console.log(utcDate,"Converted date to Colombo time:", colomboDate);

  return colomboDate;
}

const safeConvertDate = (dateValue) => {
      if (!dateValue) return null;

      try {
        // Ensure we have a valid Date object
        const date =
          dateValue instanceof Date ? dateValue : new Date(dateValue);

        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn("Invalid date found:", dateValue);
          return null;
        }

        return convertUTCToColomboTime(date, false);
      } catch (error) {
        console.error("Error converting date:", dateValue, error.message);
        return null;
      }
    };

module.exports = { convertUTCToColomboTime, safeConvertDate };