const i18n = require('i18n');
const path = require('path');

// Configure i18n
i18n.configure({
  locales: ['en', 'fa', 'ru'], // English, Persian, Russian
  directory: path.join(__dirname, '../locales'),
  defaultLocale: 'en',
  queryParameter: 'lang',
  cookie: 'locale',
  autoReload: true,
  updateFiles: false,
  api: {
    __: 't',
    __n: 'tn'
  },
  register: global
});

module.exports = i18n;