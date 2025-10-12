const i18n = require('../config/i18n');

// Middleware to set locale based on user preference or request
const setLocale = (req, res, next) => {
  try {
    // Initialize i18n on the request object
    i18n.init(req, res);
    
    // Check if user is authenticated and has a language preference
    if (req.user && req.user.preferences && req.user.preferences.language) {
      i18n.setLocale(req, req.user.preferences.language);
    } else {
      // Set locale from query parameter, cookie, or default to English
      const locale = req.query.lang || req.cookies?.locale || 'en';
      
      // Validate locale
      if (['en', 'fa', 'ru'].includes(locale)) {
        i18n.setLocale(req, locale);
        // Set cookie for future requests
        res.cookie('locale', locale, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
      } else {
        i18n.setLocale(req, 'en');
      }
    }
    
    next();
  } catch (error) {
    console.error('i18n middleware error:', error);
    // Fallback to English if there's an error
    i18n.init(req, res);
    i18n.setLocale(req, 'en');
    next();
  }
};

// Helper function to get translated message
const getMessage = (req, key, params = {}) => {
  try {
    let message = req.t ? req.t(key) : key;
    
    // Replace parameters in message
    Object.keys(params).forEach(param => {
      message = message.replace(`{${param}}`, params[param]);
    });
    
    return message;
  } catch (error) {
    console.error('getMessage error:', error);
    return key; // Return the key as fallback
  }
};

// Helper function to send localized response
const sendLocalizedResponse = (res, success, messageKey, data = null, params = {}) => {
  const message = getMessage(res.req, messageKey, params);
  
  const response = {
    success,
    message
  };
  
  if (data) {
    response.data = data;
  }
  
  res.json(response);
};

module.exports = {
  setLocale,
  getMessage,
  sendLocalizedResponse,
  i18n
};