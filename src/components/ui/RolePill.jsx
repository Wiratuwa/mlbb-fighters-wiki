import { roleColor } from '../../utils/helpers.js';

function RolePill({ role }) {
  const c = roleColor(role);
  return (
    <span style={{
      display:'inline-block',padding:'1px 7px',borderRadius:20,
      fontSize:10,fontWeight:700,letterSpacing:0.8,
      background:`${c}18`,color:c,border:`1px solid ${c}30`
    }}>{role.toUpperCase()}</span>
  );
}

export default RolePill;
