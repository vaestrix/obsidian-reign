import {validateCreativeBrief} from './creative-brief.js';
// This planner never generates media, spends credits or contacts customers.
const RECOMMENDATIONS=Object.freeze({
 emote:{stage:'static_concept',output:'transparent_png',needsAnimation:false},
 animated_emote:{stage:'static_concept_then_animation',output:'transparent_animation',needsAnimation:true},
 alert:{stage:'storyboard_then_motion',output:'video_and_audio',needsAnimation:true},
 overlay:{stage:'layout_then_export',output:'layered_graphics',needsAnimation:false},
 transition:{stage:'storyboard_then_motion',output:'video_with_alpha_if_supported',needsAnimation:true},
 creator_branding:{stage:'style_guide_then_assets',output:'brand_package',needsAnimation:false}
});
export function planCreativeProduction(input){
 const brief=validateCreativeBrief(input);
 if(!brief)return null;
 const recommendation=RECOMMENDATIONS[brief.assetType];
 return {brief,workflow:recommendation.stage,desiredOutput:recommendation.output,needsAnimation:recommendation.needsAnimation,
  producer:'vesper',customerContact:'savannah',ownerApprovalRequired:true,
  provider:'unselected',model:'unselected',estimatedCostCents:null,status:'planning_only'};
}
