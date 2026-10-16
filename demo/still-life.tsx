export function StillLife() {
  return <svg viewBox="0 0 560 490" role="img" aria-label="An illustration of ceramic vessels and an olive branch in warm sunlight" className="still-life">
    <defs><linearGradient id="wall" x2="1" y2="1"><stop stopColor="#e7dfd1"/><stop offset="1" stopColor="#c8c0ae"/></linearGradient><linearGradient id="vase"><stop stopColor="#9c6d50"/><stop offset=".45" stopColor="#c69c78"/><stop offset=".8" stopColor="#c09674"/><stop offset="1" stopColor="#94664d"/></linearGradient><linearGradient id="pot"><stop stopColor="#bcb8a5"/><stop offset=".45" stopColor="#e0dccb"/><stop offset="1" stopColor="#aaa791"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="10"/></filter><pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".6" fill="#4a4439" opacity=".12"/></pattern></defs>
    <path fill="url(#wall)" d="M0 0h560v490H0z"/><path fill="#f8f3e5" opacity=".5" d="m280 0 280 0v80L120 405 0 306Z"/>
    <path fill="#c4baa5" d="M0 360h560v130H0z"/><path fill="#eee7d7" opacity=".4" d="M0 360h560v5H0z"/>
    <ellipse cx="300" cy="420" rx="170" ry="20" fill="#625a49" opacity=".22" filter="url(#blur)"/>
    <path d="M277 280c-7-80 23-133 73-208M284 209l-40-80m53 37 62-39m-38-1-8-61" fill="none" stroke="#646b49" strokeWidth="3"/>
    {[[336,92,-35],[322,116,35],[305,146,-30],[294,174,25],[286,201,-35],[257,155,-35],[247,133,25],[336,137,35],[357,124,-20],[316,85,-25]].map(([x,y,r],i) => <ellipse key={i} cx={x} cy={y} rx="7" ry="23" fill={i%2 ? '#7b815a' : '#596847'} transform={`rotate(${r} ${x} ${y})`} />)}
    <path d="M254 266h52l-4 49c41 35 50 62 40 93-8 25-119 25-128 0-12-32 2-59 44-93Z" fill="url(#vase)"/>
    <path d="M254 266h52l-4 49c41 35 50 62 40 93-8 25-119 25-128 0-12-32 2-59 44-93Z" fill="url(#grain)"/>
    <ellipse cx="280" cy="266" rx="26" ry="6" fill="#9b7258"/><ellipse cx="280" cy="266" rx="20" ry="3" fill="#655643"/>
    <path d="M113 360h116l-13 65c-3 12-86 12-90 0Z" fill="url(#pot)"/><ellipse cx="171" cy="360" rx="58" ry="13" fill="#e8e3d2"/><ellipse cx="171" cy="360" rx="48" ry="8" fill="#979781"/>
    <path d="M366 402h97l-7 25h-84Z" fill="#9c7756"/><ellipse cx="414" cy="402" rx="49" ry="9" fill="#c4a17c"/><ellipse cx="414" cy="402" rx="41" ry="5" fill="#ac8966"/>
    <path fill="url(#grain)" d="M0 0h560v490H0z"/>
  </svg>;
}
