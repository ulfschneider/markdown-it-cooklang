# markdown-it-cooklang

An early incomplete implementation of [cooklang.org](https://cooklang.org) for markdown-it.

For now implemented are:

- Ingredients. The placehloder \[\[ingredients\]\] in your text will be replaced by a list of all of your ingredients.
- Cookware. The placeholder \[\[cookware\]\] in your text will be replaced by a list of all of your cookware.

Missing implementation:

- Timers
- Comments
- Metadata
- Shopping list specification

I used the logic for a different thing than a cooking recipe. Instead, I described on my 11ty powered website the process of building a bicycle with all reguired ingredients (parts), and cookware (tools). At the end of the document you see a list of parts to order and tools to use. Those lists are created by using markdown-it-cooklang. See [Fairlight Strael Build Notes](https://ulf.codes/2022-02-27-fairlight-strael-build-notes/).


## Install

```shell
npm i markdown-it-cooklang
```

## Usage

```js
var markdownIt = require('markdown-it');
var markdownItCooklang = require('markdown-it-cooklang');
 
markdownIt({
    html: true
    })
    .use(markdownItCooklang);
```

## Configuration

There is no configuration.

