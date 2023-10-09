![Easier color palettes and accessibility](readme-banner.webp)

# OkColor

This is a plugin for Figma, [see its community page](https://www.figma.com/community/plugin/1173638098109123591/OkColor).

–

Creating a balanced and accessible color palette with Figma is not an easy task, color models like HSB and HSL are not best suited for these tasks. To fix that, OkColor brings more uniform and predictable color models for a more convenient way to manipulate colors.

In short, with a color model like OkHSL, you can easily create perceptually uniform color palettes, and do more advanced things with OkLCH.

Note that to make your designer's life easier, you can use keyboard keys to constrain the movement in the color picker, maintain Shift to constrain to an axis, and Ctrl to move by steps of 5 (the Shift key also works in the inputs to change the value by steps of 5).

The plugin is also reactive to color changes made in Figma and vice versa, you can for example open at the same time the plugin and Figma's HSL color picker and move the manipulator in OkColor to see how it reacts in Figma. Keep in mind that the hues are not the same between them and that's normal (see FAQ in community page).

For more details, check [plugin community's page](https://www.figma.com/community/plugin/1173638098109123591/OkColor) for a FAQ and a playground file that explain in more details the plugin.

## Credits

This plugin is made possible by the [Culori JS library](https://culorijs.org/) and the creator of these color models: [Björn Ottosson](https://bottosson.github.io/).

The rendering of the color picker is done by [freydev](https://github.com/freydev) using WebGL shaders.

To know more about these uniform color spaces, you can check his original article: [Oksvh and Okhsl](https://bottosson.github.io/posts/colorpicker/) and the one from oklch.com's creators: [OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl).

# For developpers

## Why I don't use culori.mjs file from node_modules?

Instead of importing from "../node_modules/culori/bundled/culori.mjs", I duplicated the file on the src folder due to clampChroma's limitation. The problem here is that this function can only clamp in sRGB, so to make it clamp in any provided space, I created "clampChromaInGamut(color, mode = "lch", targetGamut = "rgb")". I will send the suggestion to CuloriJS's author to add it in its code.

I tried to use toGamut() but it changes the hue and luminosity of the final color, and what I needed, was to only clamp the chroma while keeping the two others values untouched.
