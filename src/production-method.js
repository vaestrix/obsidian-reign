// Capture production method expectations before a customer order enters production.
export const PRODUCTION_METHODS=Object.freeze(['digital_design','ai_assisted','hand_drawn','hybrid','undecided']);
export function validateProductionMethod(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const method=input.method;
 if(!PRODUCTION_METHODS.includes(method))return null;
 const notes=typeof input.notes==='string'?input.notes.trim():'';
 if(notes.length>1500)return null;
 const explicitlyHandcrafted=method==='hand_drawn'||method==='hybrid';
 const handcraftedConfirmed=input.handcraftedConfirmed===true;
 if(explicitlyHandcrafted&&!handcraftedConfirmed)return null;
 return {method,notes,handcraftedConfirmed,customerAcknowledged:input.customerAcknowledged===true};
}
export function authorizeProductionMethod(method){
 if(!method)return {allowed:false,reason:'invalid_method'};
 if(method.method==='undecided')return {allowed:false,reason:'method_not_selected'};
 if(!method.customerAcknowledged)return {allowed:false,reason:'customer_acknowledgment_required'};
 if(['hand_drawn','hybrid'].includes(method.method)&&!method.handcraftedConfirmed)return {allowed:false,reason:'handcrafted_service_unconfirmed'};
 return {allowed:true};
}
