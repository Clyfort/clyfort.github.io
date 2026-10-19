// Browser editing can introduce DIV/BR line breaks. Keep one text/offset model
// for serialization and native selections, including empty lines.
function richModel(root){
 const tokens=[],points=new WeakMap();let text='';
 const block=node=>node.nodeType===1&&['DIV','P','LI'].includes(node.tagName);
 const append=(value,node,before,after)=>{const start=text.length;text+=value;tokens.push({text:value,node,start,end:text.length,before,after});};
 function walk(node){
  if(node.nodeType===Node.TEXT_NODE){const start=text.length;append(node.data.replace(/\u00a0/g,' '),node,[node,0],[node,node.length]);points.set(node,{start,end:text.length});return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const children=[...node.childNodes],boundaries=[text.length];
  if(node.tagName==='BR'){
   const start=text.length;if(!node.hasAttribute('data-placeholder')&&(node.hasAttribute('data-newline')||node.nextSibling))append('\n',node,[node.parentNode,[...node.parentNode.childNodes].indexOf(node)],[node.parentNode,[...node.parentNode.childNodes].indexOf(node)+1]);
   points.set(node,{start,end:text.length,boundaries:[start]});return;
  }
  const start=text.length;
  children.forEach((child,i)=>{if(i&&(block(child)||block(children[i-1])))append('\n',null,[node,i],[child,0]);boundaries[i]=text.length;walk(child);boundaries[i+1]=text.length;});
  points.set(node,{start,end:text.length,boundaries});
 }
 walk(root);
 const offset=(node,index)=>{const point=points.get(node);if(!point)return 0;return node.nodeType===Node.TEXT_NODE?point.start+Math.min(index,node.length):point.boundaries?.[index]??point.end;};
 return {text,tokens,offset};
}
export function richSelection(root){
 const selection=window.getSelection();if(!selection?.rangeCount)return null;const range=selection.getRangeAt(0);
 if(!root.contains(range.startContainer)||!root.contains(range.endContainer))return null;
 const model=richModel(root);return {start:model.offset(range.startContainer,range.startOffset),end:model.offset(range.endContainer,range.endOffset)};
}
export function setRichSelection(root,start,end=start){
 const model=richModel(root);
 const point=offset=>{offset=Math.max(0,Math.min(model.text.length,offset));const token=model.tokens.find(t=>t.node?.nodeType===Node.TEXT_NODE&&offset>=t.start&&offset<=t.end);if(token)return [token.node,offset-token.start];const line=model.tokens.find(t=>offset>=t.start&&offset<=t.end);return line?(offset===line.start?line.before:line.after):[root,0];};
 const range=document.createRange();range.setStart(...point(start));range.setEnd(...point(end));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
}
export function renderRichText(root,layer,fontString){
 const fragment=document.createDocumentFragment();let index=0;
 const paragraphs=layer.text.split('\n');
 paragraphs.forEach((text,paragraphIndex)=>{
  const paragraph=document.createElement('div');paragraph.style.margin=`0 0 ${paragraphIndex<paragraphs.length-1?layer.paragraphSpacing:0}px`;
  let key=null,run='',style;
  const flush=()=>{if(!run)return;const span=document.createElement('span');span.style.font=fontString(layer,style);span.style.lineHeight=String(layer.lineHeight);span.style.color=style.fill;span.style.textDecoration=[style.underline?'underline':'',style.strike?'line-through':''].filter(Boolean).join(' ')||'none';span.dataset.fontFamily=style.fontFamily;span.textContent=run;paragraph.append(span);run='';};
  for(const ch of text){const local=layer.charStyles?.[index]||{},next=JSON.stringify(local);if(next!==key){flush();key=next;style={...layer,...local};}run+=ch;index+=ch.length;}
  flush();if(!text){const br=document.createElement('br');br.dataset.placeholder='';paragraph.append(br);}fragment.append(paragraph);index++;
 });
 root.replaceChildren(fragment);
}
export function readRichText(root,layer,resolveFamily){
 const model=richModel(root),charStyles={};
 for(const token of model.tokens){
  const node=token.node;if(node?.nodeType!==Node.TEXT_NODE)continue;
  const parent=node.parentElement,css=getComputedStyle(parent),content=token.text;
  let underline=false,strike=false,explicitDecoration=false;
  for(let el=parent;el&&el!==root;el=el.parentElement){const decoration=getComputedStyle(el).textDecorationLine;explicitDecoration||=decoration!=='none'||!!el.style.textDecoration||!!el.style.textDecorationLine;underline||=decoration.includes('underline');strike||=decoration.includes('line-through');}
  if(!explicitDecoration){underline=layer.underline;strike=layer.strike;}
  const rgb=css.color.match(/[\d.]+/g)||[0,0,0];const fill='#'+rgb.slice(0,3).map(v=>Math.round(Number(v)).toString(16).padStart(2,'0')).join('');
  const effective={fontFamily:resolveFamily(css.fontFamily,layer.fontFamily),fontSize:Math.max(1,Math.min(1000,parseFloat(css.fontSize))),bold:Number(css.fontWeight)>=600,italic:css.fontStyle!=='normal',underline,strike,fill};
  const local={};for(const [key,value]of Object.entries(effective))if(value!==layer[key])local[key]=value;
  let index=token.start;for(const ch of content){if(Object.keys(local).length)charStyles[index]={...local};index+=ch.length;}
 }
 return {text:model.text,charStyles};
}
// Insert plain text without introducing browser-specific block wrappers. The
// editor records these changes in its own undo history, including line breaks.
export function insertRichText(root,text){
 text=text.replace(/\r\n?/g,'\n');
 const selection=window.getSelection();if(!selection?.rangeCount||!root.contains(selection.anchorNode))return;
 const range=selection.getRangeAt(0);range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStart(node,node.length);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
 root.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
}
