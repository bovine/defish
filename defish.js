
function dist(x,y) {
    return Math.sqrt(x*x+y*y);
}

// compute the focal distance (radius of the sphere)
// crop_factor is ratio of sphere diameter to diagonal of the source image
function calculate_focal_distance(src_size_x,src_size_y,crop_factor) {
    var f = dist(src_size_x,src_size_y)*crop_factor/Math.PI;
    return f;
}

// returns a tuple of dest coordinates (dx,dy)
//       (note: values can be out of range)
// From http://stackoverflow.com/questions/2477774/correcting-fisheye-distortion-programmatically
// http://wiki.panotools.org/Fisheye_Projection
function fisheye_to_rectilinear(src_size_x,src_size_y,dest_size_x,dest_size_y,sx,sy,f,zoom) {
 
    // convert sx,sy to relative coordinates
    var rx = sx-(src_size_x/2);
    var ry = sy-(src_size_y/2);
    var r = dist(rx,ry);

    
    // calc theta: equisolid angle projection (FOV at infinity focus):
    var theta = Math.asin(r / (f * 4.0)) * 4.0;

    // calc theta: linear mapping (equidistance projection)
    //var theta = r / f;

    // calc theta: nonlinear mapping (orthogonal projection)
    // var theta = Math.asin(r / (f * 2.0)) * 2.0;
    
    // calc theta: stereographic projection:
    //var theta = Math.arctan(r / (f * 4.0)) * 4.0;

    
    // calc new radius
    var nr = Math.tan(theta) * zoom;

    // back to absolute coordinates
    var dx = (dest_size_x/2)+rx/r*nr;
    var dy = (dest_size_y/2)+ry/r*nr;
    
    //return new Array(int(round(dx)),int(round(dy)));
    
    var ox = Math.round(dx);
    var oy = Math.round(dy);
    if (ox < 0 || oy < 0 || ox >= dest_size_x || oy >= dest_size_y) {
        return -1;
    } else {
        return (ox + oy * dest_size_x);
    }
}


var image = document.getElementById('image');
var canvas = document.getElementById('defish');
var canvasContext = canvas.getContext('2d');

canvas.setAttribute('width', image.width);
canvas.setAttribute('height', image.height);
canvasContext.drawImage(image, 0, 0);

var canvas2 = document.getElementById('defish2');
var canvasContext2 = canvas2.getContext('2d');

canvas2.setAttribute('width', image.width);
canvas2.setAttribute('height', image.height);


//var panAngle = 45.0;
//var tiltAngle = 45.0;
var zoom_factor = 1.0;
var crop_factor = 0.88;
var focal_dist = calculate_focal_distance(image.width, image.height, crop_factor);


// Get the image data
var image_data = null;
try {
    try {
        image_data = canvasContext.getImageData(0, 0, image.width, image.height);
    } catch (e) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
        image_data = canvasContext.getImageData(0, 0, image.width, image.height);
    }
} catch (e) {
    throw new Error("unable to access image data: " + e)
} 
var image_data_array = image_data.data;


// Create the output buffer
/*
if (canvasContext2.createImageData) {
    temp_data = canvasContext2.createImageData(image.width, image.height);
} else if (canvasContext2.getImageData) {
    temp_data = canvasContext2.getImageData(0, 0, image.width, image.height);
} else {
    temp_data = {'width' : image.width, 'height' : image.height, 'data' : new Array(image.width*image.height*4)};
}
*/
//var temp_data = canvasContext2.getImageData(0, 0, image.width, image.height);
var temp_data = canvasContext2.createImageData(image.width, image.height);
var temp_data_array = temp_data.data;


var dstpos = 0;
for (y = 0; y < image.height; y++) {
    for (x = 0; x < image.width; x++) {
        var srcpos = 4 * fisheye_to_rectilinear(image.width, image.height, image.width, image.height, x, y, focal_dist, zoom_factor);
        //var srcpos = dstpos;
        if (srcpos >= 0) {
            temp_data_array[dstpos + 0] = 255 - image_data_array[srcpos + 0];
            temp_data_array[dstpos + 1] = 255 - image_data_array[srcpos + 1];
            temp_data_array[dstpos + 2] = 255 - image_data_array[srcpos + 2];
            temp_data_array[dstpos + 3] = 255;
            image_data_array[srcpos + 3] = 100;
        } else {
            temp_data_array[dstpos + 0] = 255;
            temp_data_array[dstpos + 1] = 0
            temp_data_array[dstpos + 2] = 0
            temp_data_array[dstpos + 3] = 255;
        }
        dstpos += 4;
    }
}

canvasContext.putImageData(image_data, 0, 0);

canvasContext2.putImageData(temp_data, 0, 0);
