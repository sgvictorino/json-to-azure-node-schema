# json-to-azure-node-schema
[![npm version](https://badge.fury.io/js/json-to-azure-node-schema.svg)](https://badge.fury.io/js/json-to-azure-node-schema)

(Not quite ready for production use)...generates Azure DB Static Schemas for Node from JSON
## Background
I was working with Azure Mobile App Easy Tables recently, and I learned a new kind of Node schema for backends. Wanting to use quicktype to write my data types once for the client and server, I didn't find anything that satisfies these requirements. I'm not sure what to call this format, but the format really isn't picky (key:type, like userName:"string"), so I built this "language".
## Example Usage
`npm install`

`npm install --only=dev`

`ts-node example/app.ts comment.json`
