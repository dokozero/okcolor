// TODO add MODIFIED comments (and take back original file before?)

import { okhsl_to_srgb, srgb_to_okhsl, srgb_to_okhsv, okhsv_to_srgb } from "./colorconversion";

const picker_size = 257;
const slider_width = 15;

let lowres_picker_size = (picker_size+1)/2;
let picker_size_inv = 1/picker_size;


export function render_static()
{
    let result = {};

    {
        let data = new Uint8ClampedArray(picker_size*slider_width*4);

        for (let i = 0; i < picker_size; i++) 
        {

            let a_ = Math.cos(2*Math.PI*i*picker_size_inv);
            let b_ = Math.sin(2*Math.PI*i*picker_size_inv);

            let rgb = okhsl_to_srgb(i/picker_size, 0.9, 0.65 + 0.17*b_ - 0.08*a_);

            for (let j = 0; j < slider_width; j++) 
            {
                let index = 4*(i*slider_width + j);
                data[index + 0] = rgb[0];
                data[index + 1] = rgb[1];
                data[index + 2] = rgb[2];
                data[index + 3] = 255;
            }               
        }

        result["okhsl_h"] = new ImageData(data, slider_width);
    }

    return result;
}


function upscale(lowres_data, data)
{
    for (let i = 0; i < lowres_picker_size-1; i++) 
    {
        for (let j = 0; j < lowres_picker_size-1; j++) 
        { 
            let source_index_00 = 3*(i*lowres_picker_size + j);
            let source_index_01 = 3*(i*lowres_picker_size + j+1);
            let source_index_10 = 3*((i+1)*lowres_picker_size + j);
            let source_index_11 = 3*((i+1)*lowres_picker_size + j+1);

            let r00 = lowres_data[source_index_00 + 0];
            let r01 = lowres_data[source_index_01 + 0];
            let r10 = lowres_data[source_index_10 + 0];
            let r11 = lowres_data[source_index_11 + 0];

            let g00 = lowres_data[source_index_00 + 1];
            let g01 = lowres_data[source_index_01 + 1];
            let g10 = lowres_data[source_index_10 + 1];
            let g11 = lowres_data[source_index_11 + 1];

            let b00 = lowres_data[source_index_00 + 2];
            let b01 = lowres_data[source_index_01 + 2];
            let b10 = lowres_data[source_index_10 + 2];
            let b11 = lowres_data[source_index_11 + 2];

            let target_index_00 = 4*(2*i*picker_size + 2*j);
            let target_index_01 = 4*(2*i*picker_size + 2*j+1);
            let target_index_10 = 4*((2*i+1)*picker_size + 2*j);
            let target_index_11 = 4*((2*i+1)*picker_size + 2*j+1);

            data[target_index_00 + 0] = r00;
            data[target_index_00 + 1] = g00;
            data[target_index_00 + 2] = b00;

            data[target_index_01 + 0] = 0.5*(r00+r01);
            data[target_index_01 + 1] = 0.5*(g00+g01);
            data[target_index_01 + 2] = 0.5*(b00+b01);

            data[target_index_10 + 0] = 0.5*(r00+r10);
            data[target_index_10 + 1] = 0.5*(g00+g10);
            data[target_index_10 + 2] = 0.5*(b00+b10);

            data[target_index_11 + 0] = 0.25*(r01+r01+r10+r11);
            data[target_index_11 + 1] = 0.25*(g01+g01+g10+g11);
            data[target_index_11 + 2] = 0.25*(b01+b01+b10+b11);
        }

        let source_index0 = 3*(i*lowres_picker_size + lowres_picker_size-1);
        let source_index1 = 3*((i+1)*lowres_picker_size + lowres_picker_size-1);

        let r0 = lowres_data[source_index0 + 0];
        let g0 = lowres_data[source_index0 + 1];
        let b0 = lowres_data[source_index0 + 2];

        let r1 = lowres_data[source_index1 + 0];
        let g1 = lowres_data[source_index1 + 1];
        let b1 = lowres_data[source_index1 + 2];

        let target_index0 = 4*(2*i*picker_size + picker_size-1);
        let target_index1 = 4*((2*i+1)*picker_size + picker_size-1);

        data[target_index0 + 0] = r0;
        data[target_index0 + 1] = g0;
        data[target_index0 + 2] = b0;

        data[target_index1 + 0] = 0.5*(r0+r1);
        data[target_index1 + 1] = 0.5*(g0+g1);
        data[target_index1 + 2] = 0.5*(b0+b1);
    }

    for (let j = 0; j < lowres_picker_size-1; j++) 
    { 
        let source_index0 = 3*((lowres_picker_size-1)*lowres_picker_size + j);
        let source_index1 = 3*((lowres_picker_size-1)*lowres_picker_size + j+1);

        let r0 = lowres_data[source_index0 + 0];
        let g0 = lowres_data[source_index0 + 1];
        let b0 = lowres_data[source_index0 + 2];

        let r1 = lowres_data[source_index1 + 0];
        let g1 = lowres_data[source_index1 + 1];
        let b1 = lowres_data[source_index1 + 2];

        let target_index0 = 4*((picker_size-1)*picker_size + 2*j);
        let target_index1 = 4*((picker_size-1)*picker_size + 2*j+1);

        data[target_index0 + 0] = r0;
        data[target_index0 + 1] = g0;
        data[target_index0 + 2] = b0;

        data[target_index1 + 0] = 0.5*(r0+r1);
        data[target_index1 + 1] = 0.5*(g0+g1);
        data[target_index1 + 2] = 0.5*(b0+b1);
    }

    let source_index = 3*(lowres_picker_size*lowres_picker_size - 1);
    let target_index = 4*(picker_size*picker_size - 1);

    let r = lowres_data[source_index + 0];
    let g = lowres_data[source_index + 1];
    let b = lowres_data[source_index + 2];

    data[target_index + 0] = r;
    data[target_index + 1] = g;
    data[target_index + 2] = b;
}





export function render(r,g,b)
{

    let result = {};

    {
        let hsv = srgb_to_okhsv(r,g,b);

        let data = new Uint8ClampedArray(picker_size*picker_size*4);
        let lowres_data = new Float32Array(lowres_picker_size*lowres_picker_size*3);

        for (let i = 0; i < lowres_picker_size; i++) 
        {
            for (let j = 0; j < lowres_picker_size; j++) 
            {
                let rgb = okhsv_to_srgb(hsv[0], 2*j*picker_size_inv, 1-2*i*picker_size_inv);

                let index = 3*(i*lowres_picker_size + j);
                lowres_data[index + 0] = rgb[0];
                lowres_data[index + 1] = rgb[1];
                lowres_data[index + 2] = rgb[2];
            }               
        }

        for (let i = 0; i < picker_size; i++) 
        {
            for (let j = 0; j < picker_size; j++) 
            {
                let index = 4*(i*picker_size + j);
                data[index + 3] = 255;
            }               
        }

        upscale(lowres_data, data);

        result["okhsv_sv"] = new ImageData(data, picker_size);
    }

    // MODIFIED - we don't need these calculations for the plugin and it allow a faster render.
    // {
    //     let lab = linear_srgb_to_oklab(
    //         srgb_transfer_function_inv(r/255),
    //         srgb_transfer_function_inv(g/255),
    //         srgb_transfer_function_inv(b/255)
    //     );

    //     l = Math.sqrt(lab[1]*lab[1] +lab[2]*lab[2]);
    //     let a_ = lab[1]/l;
    //     let b_ = lab[2]/l;

    //     let lowres_data = new Float32Array(lowres_picker_size*lowres_picker_size*3);
    //     let data = new Uint8ClampedArray(picker_size*picker_size*4);

    //     for (let i = 0; i < lowres_picker_size; i++) 
    //     {
    //         let L1 = toe_inv(1-(2*i)*picker_size_inv);
    //         let L2 = toe_inv(1-(2*i+1)*picker_size_inv);
    //         let max_C1 = find_gamut_intersection(a_,b_,L1,1,L1);
    //         let max_C2 = find_gamut_intersection(a_,b_,L2,1,L2);

    //         let La = toe_inv(1-(2*i-0.5)*picker_size_inv);
    //         let Lb = toe_inv(1-(2*i+0.5)*picker_size_inv);
    //         let Lc = toe_inv(1-(2*i+1.5)*picker_size_inv);
    //         let max_Ca = find_gamut_intersection(a_,b_,La,1,La);
    //         let max_Cb = find_gamut_intersection(a_,b_,Lb,1,Lb);
    //         let max_Cc = find_gamut_intersection(a_,b_,Lc,1,Lc);
    //         let aa_scale_1  = (oklab_C_scale*picker_size_inv + Math.abs(max_Ca - max_Cb));
    //         let aa_scale_2  = (oklab_C_scale*picker_size_inv + Math.abs(max_Cb - max_Cc));

    //         for (let j = 0; j < lowres_picker_size; j++) 
    //         {   
    //             let C1 = oklab_C_scale*(2*j)*picker_size_inv;
    //             let C2 = oklab_C_scale*(2*j+1)*picker_size_inv;
    //             let rgb = oklab_to_linear_srgb(L1, C1*a_, C1*b_);

    //             let index = 3*(i*lowres_picker_size + j);

    //             lowres_data[index + 0] = 255*srgb_transfer_function(rgb[0]);
    //             lowres_data[index + 1] = 255*srgb_transfer_function(rgb[1]);
    //             lowres_data[index + 2] = 255*srgb_transfer_function(rgb[2]);
                
    //             {
    //                 let alpha = ((max_C1)-C1)/aa_scale_1;
    //                 alpha = alpha > 1 ? 1 : alpha;
    //                 alpha = alpha < 0 ? 0 : alpha;
    //                 data[4*((2*i)*picker_size + 2*j) + 3] = 255*alpha; 
    //             }

    //             if (2*i + 1 < picker_size)
    //             {
    //                 let alpha = ((max_C2)-C1)/aa_scale_2;
    //                 alpha = alpha > 1 ? 1 : alpha;
    //                 alpha = alpha < 0 ? 0 : alpha;
    //                 data[4*((2*i+1)*picker_size + 2*j) + 3] = 255*alpha; 
    //             }

    //             if (2*j + 1 < picker_size)
    //             {
    //                 let alpha = ((max_C1)-C2)/aa_scale_1;
    //                 alpha = alpha > 1 ? 1 : alpha;
    //                 alpha = alpha < 0 ? 0 : alpha;
    //                 data[4*((2*i)*picker_size + 2*j+1) + 3] = 255*alpha; 
    //             }

    //             if (2*i + 1 < picker_size && 2*j + 1 < picker_size)
    //             {
    //                 let alpha = ((max_C2)-C2)/aa_scale_2;
    //                 alpha = alpha > 1 ? 1 : alpha;
    //                 alpha = alpha < 0 ? 0 : alpha;
    //                 data[4*((2*i+1)*picker_size + 2*j+1) + 3] = 255*alpha; 
    //             }
    //         }               
    //     }


    //     for (let i = 0; i < lowres_picker_size-1; i++) 
    //     {
    //         for (let j = 0; j < lowres_picker_size-1; j++) 
    //         { 
    //             let source_index_00 = 3*(i*lowres_picker_size + j);
    //             let source_index_01 = 3*(i*lowres_picker_size + j+1);
    //             let source_index_10 = 3*((i+1)*lowres_picker_size + j);
    //             let source_index_11 = 3*((i+1)*lowres_picker_size + j+1);

    //             r00 = lowres_data[source_index_00 + 0];
    //             r01 = lowres_data[source_index_01 + 0];
    //             r10 = lowres_data[source_index_10 + 0];
    //             r11 = lowres_data[source_index_11 + 0];

    //             g00 = lowres_data[source_index_00 + 1];
    //             g01 = lowres_data[source_index_01 + 1];
    //             g10 = lowres_data[source_index_10 + 1];
    //             g11 = lowres_data[source_index_11 + 1];

    //             b00 = lowres_data[source_index_00 + 2];
    //             b01 = lowres_data[source_index_01 + 2];
    //             b10 = lowres_data[source_index_10 + 2];
    //             b11 = lowres_data[source_index_11 + 2];

    //             let target_index_00 = 4*(2*i*picker_size + 2*j);
    //             let target_index_01 = 4*(2*i*picker_size + 2*j+1);
    //             let target_index_10 = 4*((2*i+1)*picker_size + 2*j);
    //             let target_index_11 = 4*((2*i+1)*picker_size + 2*j+1);

    //             data[target_index_00 + 0] = r00;
    //             data[target_index_00 + 1] = g00;
    //             data[target_index_00 + 2] = b00;

    //             data[target_index_01 + 0] = 0.5*(r00+r01);
    //             data[target_index_01 + 1] = 0.5*(g00+g01);
    //             data[target_index_01 + 2] = 0.5*(b00+b01);

    //             data[target_index_10 + 0] = 0.5*(r00+r10);
    //             data[target_index_10 + 1] = 0.5*(g00+g10);
    //             data[target_index_10 + 2] = 0.5*(b00+b10);

    //             data[target_index_11 + 0] = 0.25*(r01+r01+r10+r11);
    //             data[target_index_11 + 1] = 0.25*(g01+g01+g10+g11);
    //             data[target_index_11 + 2] = 0.25*(b01+b01+b10+b11);
    //         }
    //     }

    //     result["oklch_lc"] = new ImageData(data, picker_size);
    // }

    // render_hsl("hsl", rgb_to_hsl, hsl_to_rgb, result);

    return result;
}





function render_hsl(r, g, b, prefix, to_hsl, from_hsl, result)
{
    let hsl = to_hsl(r,g,b);

    {
        let data = new Uint8ClampedArray(picker_size*picker_size*4);
        let lowres_data = new Float32Array(lowres_picker_size*lowres_picker_size*3);   

        for (let i = 0; i < lowres_picker_size; i++) 
        {
            for (let j = 0; j < lowres_picker_size; j++) 
            {
                let rgb = from_hsl(hsl[0], 2*j*picker_size_inv, 1-2*i*picker_size_inv);

                let index = 3*(i*lowres_picker_size + j);
                lowres_data[index + 0] = rgb[0];
                lowres_data[index + 1] = rgb[1];
                lowres_data[index + 2] = rgb[2];
            }               
        }

        for (let i = 0; i < picker_size; i++) 
        {
            for (let j = 0; j < picker_size; j++) 
            {
                let index = 4*(i*picker_size + j);
                data[index + 3] = 255;
            }               
        }

        upscale(lowres_data, data);

        result[prefix + "_sl"] = new ImageData(data, picker_size);
    }
}


export function render_okhsl(r,g,b)
{
    let result = {};
    render_hsl(r, g, b, "okhsl", srgb_to_okhsl, okhsl_to_srgb, result);
    return result;
}

