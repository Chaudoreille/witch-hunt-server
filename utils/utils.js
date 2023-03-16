/**
 * Email validation helper
 * @param {String} email 
 * @returns 
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  return emailRegex.test(email) ? true : false;
}

module.exports = { isValidEmail };