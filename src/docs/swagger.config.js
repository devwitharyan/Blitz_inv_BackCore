const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

module.exports = (app) => {
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument, {
    customSiteTitle: 'HomeService Platform API Docs',
    customfavIcon: '/path/to/favicon.ico' // optional
  }));
};
