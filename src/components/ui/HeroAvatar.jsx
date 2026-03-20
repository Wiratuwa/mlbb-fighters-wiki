import { useState } from "react";
import { heroAvatarColor } from '../../utils/helpers.js';

function HeroAvatar({ hero, size = 56, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [bg, fg] = heroAvatarColor(hero.name || hero.icon || '');
  const initials = (hero.icon || hero.name?.slice(0,2) || '??').toUpperCase();
  return (
    <div className={`hero-avatar ${className}`} style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:bg,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
      {!imgFailed && hero.img && (
        <img src={hero.img} alt={hero.name} referrerPolicy="no-referrer" loading="lazy"
          onError={() => setImgFailed(true)}
          style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center',display:'block'}} />
      )}
      {imgFailed && (
        <span style={{color:fg,fontWeight:700,fontSize:size*0.3,letterSpacing:1}}>{initials}</span>
      )}
    </div>
  );
}

export default HeroAvatar;
