# markdown-it-cooklang

An early incomplete implementation of [cooklang.org](https://cooklang.org) for markdown-it.

For now implemented are:

- Ingredients. The placehloder \[\[ingredients\]\] in your text will be replaced by a list of all of your ingredients.
- Cookware. The placeholder \[\[cookware\]\] in your text will be replaced by a list of all of your cookware.
- Timers. The placeholder \[\[timers\]\] in your text will be replaced by a list of all of your timers.

I used the logic for a different thing than a cooking recipe. Instead, I described on my 11ty powered website the process of building a bicycle with all reguired ingredients (parts), and cookware (tools). See [Fairlight Strael Build Notes](https://ulf.codes/2022-02-27-fairlight-strael-build-notes/).


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

