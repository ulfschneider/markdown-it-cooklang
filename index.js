'use strict';

/* this is the markdown-it implementation of https://cooklang.org */

let isWhiteSpace;
let markdownIt;

let COOKLANG = {
    ingredient: {
        startWith: '@',
        singular: 'ingredient',
        plural: 'ingredients'
    },
    cookware: {
        startWith: '#',
        singular: 'cookware',
        plural: 'cookware'
    },
    timer: {
        startWith: '~',
        singular: 'timer',
        plural: 'timers'
    }
}

for (let part in COOKLANG) {
    COOKLANG[part].placeholder = new RegExp(`^\\s*(\\[\\[${COOKLANG[part].plural}\\]\\]|\\[${COOKLANG[part].plural}\\]|\\$\\{${COOKLANG[part].plural}\\})\\s*$`, 'ig');
}

function prepareCooklangState(state) {
    if (!state.env.cooklang) {
        state.env.cooklang = {};
    }
    for (let part in COOKLANG) {
        if (!state.env.cooklang[COOKLANG[part].plural]) {
            state.env.cooklang[COOKLANG[part].plural] = [];
        }
    }
}



/* render generic */

function render_cooklang_inline(tokens, idx, options, env, slf, part) {
    let id = tokens[idx].meta.id;
    let children = tokens[idx].meta.children;
    let amount = tokens[idx].meta.amount;
    let unit = tokens[idx].meta.unit;

    let render = `<span id="${id}" class="cooklang-${part.singular}"`
    if (amount) {
        render += ` cooklang-amount="${amount}"`;
    }
    if (unit) {
        render += ` cooklang-unit="${unit}"`;
    }
    render += `>${markdownIt.renderer.render(children)}</span>`;

    return render;
}

function render_cooklang_list(tokens, idx, options, env, slf, part) {
    let list = tokens[idx].meta[part.plural];
    let render = '';
    if (list.length) {
        for (let item of list) {
            render += `<li>`;
            if (item.amount || item.unit) {
                render += '<span class="amount-and-unit">';

                if (item.amount) {
                    render += `<span class="amount">${item.amount}</span>`;
                }
                if (item.unit) {
                    if (item.amount) {
                        render += '&#x202f;';
                    }
                    render += `<span class="unit">${item.unit}</span>`;
                }
                render += '</span> '
            }
            render += `<span class="${part.singular}">${markdownIt.renderer.render(item.children)}</span>`;
            render += `</li>`;
        }
    }
    return render;
}


/* inline rule generic */

function cooklang_inline(state, silent, part) {
    let id,
        token,
        tokens,
        content,
        amount,
        unit,
        start = state.pos,
        max = state.posMax;

    prepareCooklangState(state);

    if (state.src.charCodeAt(start) !== part.startWith.charCodeAt(0)) { return false; }
    if (start > 0 && !isWhiteSpace(state.src.charCodeAt(start - 1)) /*there must be whitespace before the starting identifier*/) { return false; }
    if (start + 3 >= state.posMax) { return false; }

    state.pos++;
    let openCurlPos, closeCurlPos, spacePos;

    while (state.pos < max && !closeCurlPos) {
        if (!spacePos && isWhiteSpace(state.src.charCodeAt(state.pos))) {
            spacePos = state.pos;
        } else if (!openCurlPos && state.src.charCodeAt(state.pos) === 0x7B /* { */) {
            openCurlPos = state.pos;
        } else if (openCurlPos && state.src.charCodeAt(state.pos) === 0x7D /* } */) {
            closeCurlPos = state.pos;
            break;
        }

        state.pos++;
    }

    if (!spacePos && !closeCurlPos) {
        spacePos = max;
        state.pos = max;
    } else if (spacePos && !closeCurlPos) {
        state.pos = spacePos;
    } else if (closeCurlPos) {
        state.pos = closeCurlPos + 1;
    }

    //found!
    if (!silent) {
        if (closeCurlPos) {
            content = state.src.slice(start + 1, openCurlPos).trim();
            amount = state.src.slice(openCurlPos + 1, closeCurlPos).trim();
            let pos = amount.indexOf('%');
            if (pos >= 0) {
                unit = amount.substring(pos + 1).trim();
                amount = amount.substring(0, pos).trim();
            }
        } else {
            content = state.src.slice(start + 1, spacePos).trim();
        }

        state.md.inline.parse(
            content,
            state.md,
            state.env,
            tokens = []
        );

        state.env.cooklang[part.plural].push({
            content: content,
            amount: amount,
            unit: unit,
            children: tokens
        });
        id = `${part.singular}-${state.env.cooklang[part.plural].length}`; //id counts start at 1, not at 0!
        token = state.push(`cooklang_inline_${part.singular}`, '', 0)
        token.meta = {
            id: id,
            content: content,
            amount: amount,
            unit: unit,
            children: tokens
        }
    }
    return true;
}

/* block rule generic */

function cooklang_block(state, startLine, endLine, silent, part) {
    let token;
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    if (!part.placeholder.test(state.src.slice(pos, max))) {
        return false;
    }

    if (silent) {
        return true;
    }
    prepareCooklangState(state);

    state.line = startLine + 1;

    token = state.push(`cooklang_${part.plural}_open`, 'ul', 1);
    token.markup = '';
    token.map = [startLine, state.line];

    token = state.push(`cooklang_${part.plural}`, '', 0);
    token.markup = '';
    token.map = [startLine, state.line];
    token.children = [];
    token.meta = {};
    token.meta[part.plural] = state.env.cooklang[part.plural];

    token = state.push(`cooklang_${part.plural}_close`, 'ul', -1);
    token.markup = '';

    return true;
}


/* render specific */

function render_cooklang_inline_ingredient(tokens, idx, options, env, slf) {
    return render_cooklang_inline(tokens, idx, options, env, slf, COOKLANG.ingredient);
}

function render_cooklang_inline_cookware(tokens, idx, options, env, slf) {
    return render_cooklang_inline(tokens, idx, options, env, slf, COOKLANG.cookware);
}

function render_cooklang_inline_timer(tokens, idx, options, env, slf) {
    return render_cooklang_inline(tokens, idx, options, env, slf, COOKLANG.timer);
}

function render_cooklang_ingredients_open(tokens, indx, options, env, slf) {
    return `<ul class="cooklang-${COOKLANG.ingredient.plural}">`;
}

function render_cooklang_cookware_open(tokens, indx, options, env, slf) {
    return `<ul class="cooklang-${COOKLANG.cookware.plural}">`;
}

function render_cooklang_timers_open(tokens, indx, options, env, slf) {
    return `<ul class="cooklang-${COOKLANG.timer.plural}">`;
}

function render_cooklang_list_close(tokens, indx, options, env, slf) {
    return `</ul>\n`;
}

function render_cooklang_ingredients(tokens, idx, options, env, slf) {
    return render_cooklang_list(tokens, idx, options, env, slf, COOKLANG.ingredient);
}

function render_cooklang_cookware(tokens, idx, options, env, slf) {
    return render_cooklang_list(tokens, idx, options, env, slf, COOKLANG.cookware);
}

function render_cooklang_timers(tokens, idx, options, env, slf) {
    return render_cooklang_list(tokens, idx, options, env, slf, COOKLANG.timer);
}


// Process ingredient list: [[ingredients]]
function cooklang_ingredients(state, startLine, endLine, silent) {
    return cooklang_block(state, startLine, endLine, silent, COOKLANG.ingredient);
}

// Process cookware list: [[cookware]]
function cooklang_cookware(state, startLine, endLine, silent) {
    return cooklang_block(state, startLine, endLine, silent, COOKLANG.cookware);
}

// Process timer list: [[timers]]
function cooklang_timers(state, startLine, endLine, silent) {
    return cooklang_block(state, startLine, endLine, silent, COOKLANG.timer);
}

// Process inline ingredients: @ingredient<whitespace> as well as @ingredient{}
function cooklang_inline_ingredient(state, silent) {
    return cooklang_inline(state, silent, COOKLANG.ingredient);
}

// Process inline cookware: #cookware<whitespace> as well as #cookware{}
function cooklang_inline_cookware(state, silent) {
    return cooklang_inline(state, silent, COOKLANG.cookware);
}

// Process inline timers: ~timer<whitespace> as well as ~timer{}
function cooklang_inline_timer(state, silent) {
    return cooklang_inline(state, silent, COOKLANG.timer);
}

module.exports = function cooklang_plugin(md) {
    isWhiteSpace = md.utils.isWhiteSpace;
    markdownIt = md;

    md.inline.ruler.after('html_inline', 'cooklang-inline-ingredient', cooklang_inline_ingredient);
    md.renderer.rules.cooklang_inline_ingredient = render_cooklang_inline_ingredient;

    md.block.ruler.after('html_block', 'cooklang-ingredients', cooklang_ingredients);
    md.renderer.rules.cooklang_ingredients_open = render_cooklang_ingredients_open;
    md.renderer.rules.cooklang_ingredients = render_cooklang_ingredients;
    md.renderer.rules.cooklang_ingredients_close = render_cooklang_list_close;


    md.inline.ruler.after('html_inline', 'cooklang-inline-cookware', cooklang_inline_cookware);
    md.renderer.rules.cooklang_inline_cookware = render_cooklang_inline_cookware;

    md.block.ruler.after('html_block', 'cooklang-cookware', cooklang_cookware);
    md.renderer.rules.cooklang_cookware_open = render_cooklang_cookware_open;
    md.renderer.rules.cooklang_cookware = render_cooklang_cookware;
    md.renderer.rules.cooklang_cookware_close = render_cooklang_list_close;


    md.inline.ruler.after('html_inline', 'cooklang-inline-timer', cooklang_inline_timer);
    md.renderer.rules.cooklang_inline_timer = render_cooklang_inline_timer;

    md.block.ruler.after('html_block', 'cooklang-timer', cooklang_timers);
    md.renderer.rules.cooklang_timers_open = render_cooklang_timers_open;
    md.renderer.rules.cooklang_timers = render_cooklang_timers;
    md.renderer.rules.cooklang_timers_close = render_cooklang_list_close;
};