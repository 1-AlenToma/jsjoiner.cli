# jsjoiner.cli

This lib solves issues of adding `html`, `js` and `css` files as assets to project.

It will join those files and add it to a single `index.js` file that could be added later on for `Webview` or any other use.

## Installations
```npm
npm install jsjoiner.cli
or globally
npm install -g jsjoiner.cli
```

## Usage

```js
jsjoiner join -o ./data/index.js
-f "/storage/emulated/0/Documents/Projects/ContextMenu/*.js.css"
```

## Options

```js
* `-o --output` the output file, its best that it point to an empty mapp as it will remove its content that include index.js

* `-f --files` comma seperated files or a search path like above.

* `-s --sort` comma seperated js execution order eg "2.js, 1.js"

```
