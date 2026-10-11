// Internal planning only. Inputs are assumptions, never changes to published prices.
export function priceModel({hours,revisionHours,hourlyCost,generationCost,softwareAllocation,complexity,urgency,feePercent,feeFixed,marginPercent,publishedPrice}) {
 const inputs=[hours,revisionHours,hourlyCost,generationCost,softwareAllocation,feeFixed,publishedPrice];
 if(inputs.some(x=>!Number.isFinite(x)||x<0)||![complexity,urgency].every(x=>Number.isFinite(x)&&x>=1)||![feePercent,marginPercent].every(x=>Number.isFinite(x)&&x>=0)||feePercent+marginPercent>=100)throw new Error('Use nonnegative costs, multipliers of at least 1, and combined fees and margin below 100%.');
 const cost=(hours+revisionHours)*hourlyCost*complexity*urgency+generationCost+softwareAllocation;
 const recommended=(cost+feeFixed)/(1-(feePercent+marginPercent)/100);
 const contribution=publishedPrice*(1-feePercent/100)-feeFixed-cost;
 return {cost,recommended,contribution,margin:publishedPrice?contribution/publishedPrice*100:null};
}
