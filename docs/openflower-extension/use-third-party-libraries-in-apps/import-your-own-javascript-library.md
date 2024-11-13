# Import your own JavaScript Library

The custom JavaScript library needs to be imported using the UMD approach.

That means the following approach will fail:

```javascript
function ULID() {
    ... 
    return function() {
        ... 
    };
}
exports.ULID = ULID
```

UMD uses a single wrapper function to check for the presence of `module.exports` (indicating a CommonJS environment) and `define.amd` (indicating an AMD environment). If neither is found, it assumes it is running in a browser and attaches the module to the global `window` object.

Here is a simplified example of a UMD module:

```javascript
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.myModule = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    // Your module code goes here

    var myModule = {};
    myModule.hello = function () {
        return 'Hello, world!';
    };

    return myModule;
}));
```

In the example case, the new code structure would be:

```javascript
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.ULID = mod.exports;
    }
})(this, function (exports) {
    function ULID() {
       ... 
    }

    function generator(){
        var ulid = new ULID()
        return ulid()
    }
    exports.generator = generator;
});
```

Find the discussion to it in our Github: [https://github.com/lowcoder-org/lowcoder/discussions/524](https://github.com/lowcoder-org/lowcoder/discussions/524)
