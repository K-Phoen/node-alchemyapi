# node-alchemyapi

A node.js SDK for [AlchemyAPI](http://www.alchemyapi.com)

Basically the same as the [official one](https://github.com/alchemyapi/alchemyapi_node),
but with a few additions and improvements.

# Status

This project is **DEPRECATED** and should NOT be used. 

If someone magically appears and wants to maintain this project, I'll gladly give access to this repository.

# Installation

```
npm install node-alchemyapi
```

# Usage

```javascript
var AlchemyAPI = require('node-alchemyapi'),
    api = new AlchemyAPI('<YOUR API KEY>');

api.entities('url', 'https://github.com/K-Phoen/node-alchemyapi', {'sentiment': 1}, function(response) {
    // do something
});
```

# License

This library is released under the Apache 2.0 license. See the bundled LICENSE
file for details.
