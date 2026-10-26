import {removeColorBackground} from './remove-color.js?v=20261023-2';
self.onmessage=event=>{try{const options=event.data,result=removeColorBackground({...options,pixels:new Uint8ClampedArray(options.pixels)});self.postMessage({pixels:result.pixels.buffer,changed:result.changed},[result.pixels.buffer]);}catch(error){self.postMessage({error:error.message});}};
