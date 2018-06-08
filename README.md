# json-to-azure-node-schema
[![npm version](https://badge.fury.io/js/json-to-azure-node-schema.svg)](https://badge.fury.io/js/json-to-azure-node-schema)

A [quicktype](https://github.com/quicktype/quicktype) library that generates Azure DB Static Schemas for Node from JSON.

Example input (`newtable.json`):

```
{
    "text": "Example",
    "complete": true
}
```

[Example output](https://docs.microsoft.com/en-us/azure/app-service-mobile/app-service-mobile-node-backend-how-to-use-server-sdk#howto-staticschema):

```
newtable.columns = {
    "text": "string",
    "complete": "boolean"
};
```

Because of the way this library was built, it is nearly as flexible as `quicktype`. Here is an example:
```
npm start -- "example/comment.json" --top-level NewTableName
```

## Background
I was working with Azure Mobile App Easy Tables recently, and I learned a new kind of Node schema for backends. Wanting to use `quicktype` to write my data models once for the client and server, I didn't find anything that satisfies these requirements. I'm not sure what to call this format, but the format really isn't picky, so I built this "language".

It has only been designed for the most basic types, so if you find a useful one that outputting incorrectly (or causes an error to be thrown) please file a [GitHub issue](https://github.com/json-helpers/json-to-azure-node-schema/issues/new), or feel free to contribute a new feature!

## Example Usage
`npm install`

`ts-node example/app.ts example/comment.json`
