![Easier color palettes and accessibility](readme-banner.webp)

# OkColor
This is a plugin for Figma, [see community page](https://www.figma.com/community/plugin/1173638098109123591/OkColor) (waiting Figma's validation).

Creating a balanced color palette with Figma's color picker is not an easy task, same for managing accessible colors. OkColor is a plugin with an improved HSL/HSB color picker that allows you to easily use uniform color spaces.

## What's wrong with HSL?
In short, **it is not perceptually uniform** so if you try to create a color palette (with the same hue) by using the “L” param (from 0 to 100 with a step of 10 for example), you will not get a uniform progression. For example with the green hue 120º, in the dark colors, you'll see more differences than in the lighter ones.

HSL color pickers in tools like Figma are not specifically made to be uniform, but because of its name it can be confusing. In HSL the luminosity param **is relative to the selected hue**, so for example between these colors: HSL(60, 100, 100) and HSL(240, 100, 100), even if they have the same “L” value, the perceived lightness will not be the same.

Not only that but if you try to create let's say a palette of 10 colors from the hue 100º to 190º with the same incremental value, you'll end up with a palette that perceptually has too many green colors.

Last but not least, with HSL (and HSB) we have a hue shift problem (known as the “Abney effect”) and it's more noticeable in the blue colors. For example if you take the hue 240º, from a lightness from 0 to 100, the perceived hue will shift from blue to purple.

## OkColor solves these problems
OkColor is an improved color picker that allows you to easily use OkHSL and OkHSV (more on that after) which are perceptually uniform color spaces.

Unlike normal HSL, with OkHSL the perceived luminosity of different colors with the same “L” value **will look the same no matter their hue and saturation.**

With this advantage, color palette creation and contrast checking are easier, for example, let's say you have a blue in OkHSL with a hue of 255º and a saturation of 95, to create a color palette of this color from black to white, you just have to use the luminosity param and you can be sure that for example “30” will mean “Blue300”, or better: “Blue30” as in this case the number is linked to a param you can easily change (Material Design v3 use this notation also now).

Regarding accessibility, you just have to make sure you have a luminosity of at least 50 between the foreground (like a text or an icon) and its background to get a 4.5:1 contrast (AA level for normal text, see WCAG 2.1 requirements). To be more precise, it should in fact be 52, check below the “Regarding accessibility” section for more info.

With OkColor, you also avoid the hue shift problem, so your blue color palette will stay blue no matter the luminosity.

## What about HSB and OkHSV?
HSB is similar to HSL but here the saturation and brightness are a bit different, without going too technical HSB can have its advantages over HSL. Note that HSB can also be called “HSV”, they are the same and I kept the original name from OkHSV's creator (credits at the end).

With OkHSV, its goal is not to have a different behavior for the “V” value compared to Figma HSB. It behaves very similarly but here we don't have the hue shift problem as described above.

## Regarding accessibility
To be fair, OkHSL's luminosity param is not 100% precise (more like 99%). If for example you take these two colors: OkHSL(0, 100, 50) and OkHSL(170, 100, 50), the perceived luminosity will be *slightly* different. One way to check is with a contrast checker like Stark's plugin.

With OkHSL(0, 100, 50) and a white text on it, we get a contrast of 5.09:1, but with OkHSL(170, 100, 50) we have 4.23:1 and while it's close to 4.5, if you really want to be precise, instead of 50 I recommend a difference of 52. For the AAA level on normal text, I recommend a difference of 65.

Note that this problem is also found in other uniform color pickers like HSLuv for example, and in the end is still better than normal HSL where the difference is much bigger.

## Useful details
You can use Figma's HEX input while OkColor is open, it will react to any color changes made on Figma, you can for example also open Figma's color picker and move the cursor to see how OkHSL/OkHSV behave (or the opposite).

The plugin doesn't support shapes with multiple colors and if you select one, the plugin will take the first color of the list (from the bottom).

Note that the hue in OkColor doesn't map the hue of HSL/HSB in Figma, for example here 0º doesn't mean pure red.

It also doesn't support shapes with gradient colors, but you can for example change the color of a shape with a solid fill and a gradient stroke.

Finally, keep in mind that OkHSL and OkHSV are made for the sRGB gamut, technically they will still work if Figma is in “Unmanaged” mode and you work on a P3 screen, but for more precise P3 work you can use for example [oklch.com](https://oklch.com/), which is also based on the work of the creator of OkHSL and OkHSV.

## Links
This plugin use the rendering and color conversion functions ([source code](https://github.com/bottosson/bottosson.github.io/tree/master/misc/colorpicker)) made by Björn Ottosson who created OkLAB which it's the base for OkHSL and OkHSV (which he also created).

To know more about uniform color spaces, I recommend checking his original article: [Oksvh and Okhsl](https://bottosson.github.io/posts/colorpicker/). You can also try this online app made by the same author to easily compare different color pickers: [Interactive color picker comparison](https://bottosson.github.io/misc/colorpicker/).