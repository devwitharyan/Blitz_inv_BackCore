/**
 * Capitalizes the first letter of each word in a string
 */
exports.capitalizeEachWord = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Formats price to two decimal points
 */
exports.formatPrice = (amount) => {
  return amount ? parseFloat(amount).toFixed(2) : '0.00';
};

/**
 * Converts SQL DATETIME string to ISO format
 */
exports.formatDate = (sqlDate) => {
  return sqlDate ? new Date(sqlDate).toISOString() : null;
};
