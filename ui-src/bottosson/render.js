import { okhsl_to_srgb, srgb_to_okhsl } from "./colorconversion";

const picker_size = 257;
const slider_width = 31;

let lowres_picker_size = (picker_size+1)/2;
let picker_size_inv = 1/picker_size;

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
                let hsl_a = 2*(2*i*picker_size_inv)-1;
                let hsl_b = 2*(1 - 2*j*picker_size_inv)-1;

                let rgb = from_hsl(0.5+0.5*Math.atan2(hsl_a, hsl_b)/Math.PI, Math.sqrt(hsl_a**2 + hsl_b**2), hsl[2]);
                let index = 3*(i*lowres_picker_size + j);
                lowres_data[index + 0] = rgb[0];
                lowres_data[index + 1] = rgb[1];
                lowres_data[index + 2] = rgb[2];
                
                {
                    let alpha = 0.25*picker_size*(1 - (hsl_a**2 + hsl_b**2));
                    alpha = alpha > 1 ? 1 : alpha;
                    alpha = alpha < 0 ? 0 : alpha;
                    data[4*((2*i)*picker_size + 2*j) + 3] = 255*alpha; 
                }

                if (2*i + 1 < picker_size)
                {
                    let alpha = 0.25*picker_size*(1 - ((hsl_a + 2*picker_size_inv)**2 + hsl_b**2));
                    alpha = alpha > 1 ? 1 : alpha;
                    alpha = alpha < 0 ? 0 : alpha;
                    data[4*((2*i+1)*picker_size + 2*j) + 3] = 255*alpha; 
                }

                if (2*j + 1 < picker_size)
                {
                    let alpha = 0.25*picker_size*(1 - (hsl_a**2 + (hsl_b - 2*picker_size_inv)**2));
                    alpha = alpha > 1 ? 1 : alpha;
                    alpha = alpha < 0 ? 0 : alpha;
                    data[4*((2*i)*picker_size + 2*j+1) + 3] = 255*alpha; 
                }

                if (2*i + 1 < picker_size && 2*j + 1 < picker_size)
                {
                    let alpha = 0.25*picker_size*(1 - ((hsl_a + 2*picker_size_inv)**2 + (hsl_b - 2*picker_size_inv)**2));
                    alpha = alpha > 1 ? 1 : alpha;
                    alpha = alpha < 0 ? 0 : alpha;
                    data[4*((2*i+1)*picker_size + 2*j+1) + 3] = 255*alpha; 
                }
            }               
        }

        upscale(lowres_data, data);
        
        result[prefix + "_hs"] = new ImageData(data, picker_size);  
    }

    {
        let data = new Uint8ClampedArray(picker_size*picker_size*4);
        let lowres_data = new Float32Array(lowres_picker_size*lowres_picker_size*3);   

        for (let i = 0; i < lowres_picker_size; i++) 
        {
            for (let j = 0; j < lowres_picker_size; j++) 
            {
                let rgb = from_hsl(2*j*picker_size_inv, hsl[1], 1-2*i*picker_size_inv);
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

        result[prefix + "_hl"] = new ImageData(data, picker_size);
    }

    {
        let data = new Uint8ClampedArray(picker_size*slider_width*4);

        for (let i = 0; i < picker_size; i++) 
        {
            let rgb = from_hsl(hsl[0], 1-i*picker_size_inv, hsl[2]);

            for (let j = 0; j < slider_width; j++) 
            {
                let index = 4*(i*slider_width + j);
                data[index + 0] = rgb[0];
                data[index + 1] = rgb[1];
                data[index + 2] = rgb[2];
                data[index + 3] = 255;
            }               
        }

        result[prefix + "_s"] = new ImageData(data, slider_width);
    }

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