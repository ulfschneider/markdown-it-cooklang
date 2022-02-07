'use strict';

let isWhiteSpace;
let markdownIt;
const INGREDIENTS_PLACEHOLDER = /[[ingredients]]/i;

function render_cooklang_inline_ingredient(tokens, idx, options, env, slf) {

    let id = tokens[idx].meta.id;
    let children = tokens[idx].meta.children;
    let amount = tokens[idx].meta.amount;
    let unit = tokens[idx].meta.unit;

    let render = `<span id="${id}" class="cooklang-ingredient"`
    if (amount) {
        render += ` amount="${amount}"`;
    }
    if (unit) {
        render += ` unit="${unit}"`;
    }
    render += `>${markdownIt.renderer.render(children)}</span>`;

    return render;
}

function render_cooklang_ingredients_open(tokens, indx, options, env, slf) {
    return `<ul class="cooklang-ingredients">`;
}

function render_cooklang_ingredients_close(tokens, indx, options, env, slf) {
    return `</ul>`;
}

function render_cooklang_ingredients(tokens, idx, options, env, slf) {
    let ingredients = tokens[idx].meta.ingredients;
    let render = '';
    if (ingredients.length) {
        for (let ingredient of ingredients) {
            render += `<li><span class="ingredient">${markdownIt.renderer.render(ingredient.children)}</span>`;
            if (ingredient.amount) {
                render += ` <span class="amount">${ingredient.amount}</span>`;
            }
            if (ingredient.unit) {
                render += ` <span class="unit">${ingredient.unit}</span>`;
            }
            render += `</li>`;
        }
    }
    return render;
}

// Process inline ingredients: @ingredient<whitespace> as well as @ingredient{}
function cooklang_inline_ingredient(state, silent) {
    let ingredientId,
        token,
        tokens,
        content,
        amount,
        unit,
        start = state.pos,
        max = state.posMax;

    if (state.src.charCodeAt(start) !== 0x40 /* @ */) { return false; }
    if (start > 0 && !isWhiteSpace(state.src.charCodeAt(start - 1)) /*there must be whitespace before @*/) { return false; }
    if (start + 3 >= state.posMax) { return false; } /* @c{} */

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
        if (!state.env.cooklang) {
            state.env.cooklang = {};
        }
        if (!state.env.cooklang.ingredients) {
            state.env.cooklang.ingredients = [];
        }


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

        state.env.cooklang.ingredients.push({
            content: content,
            amount: amount,
            unit: unit,
            children: tokens
        });
        ingredientId = `ingredient-${state.env.cooklang.ingredients.length}`; //id counts start at 1, not at 0!
        token = state.push('cooklang_inline_ingredient', '', 0)
        token.meta = {
            id: ingredientId,
            content: content,
            amount: amount,
            unit: unit,
            children: tokens
        }
    }
    return true;
}


// Process ingredient list: [[ingredients]]
function cooklang_ingredients(state, startLine, endLine, silent) {
    let token;
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];

    // use whitespace as a line tokenizer and extract the first token
    // to test against the placeholder anchored pattern, rejecting if false
    const lineFirstToken = state.src.slice(pos, max).split(' ')[0]
    if (!INGREDIENTS_PLACEHOLDER.test(lineFirstToken)) {
        return false;
    }

    if (silent) {
        return true;
    }
    if (!state.env.cooklang) {
        state.env.cooklang = {};
    }
    if (!state.env.cooklang.ingredients) {
        state.env.cooklang.ingredients = [];
    }

    state.line = startLine + 1
    token = state.push('cooklang_ingredients_open', 'ul', 1);
    token.markup = '';
    token.map = [startLine, state.line];

    token = state.push('cooklang_ingredients', '', 0);
    token.markup = '';
    token.map = [startLine, state.line];
    token.children = [];
    token.meta = {
        ingredients: state.env.cooklang.ingredients
    }

    token = state.push('cooklang_ingredients_close', 'ul', -1);
    token.markup = '';

    return true;
}


module.exports = function cooklang_plugin(md) {
    isWhiteSpace = md.utils.isWhiteSpace;
    markdownIt = md;

    md.inline.ruler.after('html_inline', 'cooklang-inline-ingredient', cooklang_inline_ingredient);
    md.renderer.rules.cooklang_inline_ingredient = render_cooklang_inline_ingredient;

    md.block.ruler.after('html_block', 'cooklang-ingredients', cooklang_ingredients);
    md.renderer.rules.cooklang_ingredients_open = render_cooklang_ingredients_open;
    md.renderer.rules.cooklang_ingredients = render_cooklang_ingredients;
    md.renderer.rules.cooklang_ingredients_close = render_cooklang_ingredients_close;
};