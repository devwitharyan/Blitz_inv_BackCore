# HomeService Platform API Docs

## Overview
This folder contains the OpenAPI 3.0 documentation for the API.

- `swagger.yaml`: The main specification file
- `swagger.config.js`: Integration with Express server

## Usage

To view the docs locally:

1. Run the Node.js server
2. Open your browser and visit: `http://localhost:3000/api-docs`

## Structure

- **Paths** section lists all API endpoints
- **Components** defines common schemas and security settings
- **Tags** help navigating sections like Auth, Services, Bookings, etc.

## Extending

- Add more routes/models in `swagger.yaml` as your project grows
- Use `$ref` to reuse schemas between endpoints
