import { TIER_BG, TIER_COLOR } from '../../utils/helpers.js';

function TierBadge({ tier }) {
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',
      width:22,height:22,borderRadius:4,
      background:TIER_BG[tier],color:TIER_COLOR[tier],
      fontSize:11,fontWeight:800,letterSpacing:0.5,
      border:`1px solid ${TIER_COLOR[tier]}33`,flexShrink:0
    }}>{tier}</span>
  );
}

export default TierBadge;
