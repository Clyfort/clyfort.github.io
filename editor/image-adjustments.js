// Presets use the existing project adjustments, so saved files stay compatible.
export const imagePresets = [
 {id:'original',name:'原图',brightness:100,contrast:100,saturation:100},
 {id:'vivid',name:'鲜活',brightness:105,contrast:110,saturation:140},
 {id:'soft',name:'柔光',brightness:112,contrast:85,saturation:90},
 {id:'matte',name:'淡雅',brightness:108,contrast:90,saturation:65},
 {id:'cinema',name:'电影',brightness:95,contrast:125,saturation:75},
 {id:'mono',name:'黑白',brightness:100,contrast:115,saturation:0},
 {id:'high-key',name:'明亮',brightness:125,contrast:95,saturation:105},
 {id:'dramatic',name:'浓郁',brightness:90,contrast:140,saturation:115},
];
export const imageFilter = image => `brightness(${image.brightness}%) contrast(${image.contrast}%) saturate(${image.saturation}%)`;
export const matchesImagePreset = (image,preset) => ['brightness','contrast','saturation'].every(key=>image[key]===preset[key]);
