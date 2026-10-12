/** Two people in dialogue across languages. Editorial aesthetic, strictly palette-only. */
export default function Illustration({ className = 'illus' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 600"
      role="img"
      aria-label="Two figures in dialogue across languages, with speech bubbles in French, Arabic, Hindi, and Japanese"
    >
      <defs>
        <clipPath id="arch-clip">
          <path d="M40 600 V270 C40 120 150 20 280 20 C410 20 520 120 520 270 V600 Z" />
        </clipPath>
      </defs>

      {/* Main arch background */}
      <path d="M40 600 V270 C40 120 150 20 280 20 C410 20 520 120 520 270 V600 Z" fill="#D5DDD9" />

      {/* Internal decorative contour curves clipped inside arch */}
      <g clipPath="url(#arch-clip)" fill="none" stroke="#829A96" strokeWidth="1.2" opacity="0.45">
        <path d="M20 340 Q160 300 280 340 T540 330" />
        <path d="M20 380 Q170 340 300 380 T540 370" />
        <path d="M20 420 Q180 390 310 430 T540 410" />
        <path d="M40 500 Q200 460 360 510 T540 480" />
        <path d="M40 540 Q220 500 380 550 T540 520" />
      </g>

      {/* Globe linework */}
      <g fill="none" stroke="#829A96" strokeWidth="1.4">
        <circle cx="410" cy="140" r="72" />
        <ellipse cx="410" cy="140" rx="32" ry="72" />
        <path d="M338 140 H482 M348 104 H472 M348 176 H472" />
      </g>

      {/* Botanical sprig on left */}
      <g fill="#829A96" opacity="0.85">
        <path d="M70 410 C75 330 95 260 145 190" stroke="#829A96" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="120" cy="226" rx="10" ry="24" transform="rotate(28 120 226)" />
        <ellipse cx="102" cy="272" rx="10" ry="24" transform="rotate(-32 102 272)" />
        <ellipse cx="128" cy="286" rx="10" ry="24" transform="rotate(34 128 286)" />
        <ellipse cx="94" cy="330" rx="10" ry="24" transform="rotate(-30 94 330)" />
        <ellipse cx="118" cy="342" rx="10" ry="24" transform="rotate(32 118 342)" />
      </g>

      {/* Editorial text */}
      <text x="140" y="88" fontSize="24" fontStyle="italic" fill="#29302E" fontFamily="'Newsreader', Georgia, serif">
        Not just words,
      </text>
      <text x="140" y="118" fontSize="24" fontStyle="italic" fill="#29302E" fontFamily="'Newsreader', Georgia, serif">
        but meaning.
      </text>

      {/* Speech bubbles positioned with generous clearance */}
      {/* 1. Japanese bubble (top left) */}
      <g>
        <rect x="64" y="160" width="144" height="42" rx="21" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" />
        <path d="M96 202 L92 214 L108 202 Z" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="94" y="199" width="16" height="5" fill="#F3F4F1" />
        <text x="136" y="188" textAnchor="middle" fontSize="19" fill="#29302E" fontFamily="'Noto Serif JP', 'Noto Sans JP', serif">
          こんにちは
        </text>
      </g>

      {/* 2. Arabic bubble (top right) */}
      <g>
        <rect x="306" y="196" width="130" height="42" rx="21" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" />
        <path d="M400 238 L404 250 L388 238 Z" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="386" y="235" width="20" height="5" fill="#F3F4F1" />
        <text x="371" y="225" textAnchor="middle" fontSize="22" fill="#29302E" direction="rtl" fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', serif">
          مرحبا
        </text>
      </g>

      {/* 3. Hindi bubble (mid left) */}
      <g>
        <rect x="76" y="234" width="138" height="42" rx="21" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" />
        <path d="M108 276 L104 288 L120 276 Z" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="106" y="273" width="16" height="5" fill="#F3F4F1" />
        <text x="145" y="262" textAnchor="middle" fontSize="20" fill="#29302E" fontFamily="'Noto Serif Devanagari', 'Noto Sans Devanagari', serif">
          नमस्ते
        </text>
      </g>

      {/* 4. French bubble (mid right) */}
      <g>
        <rect x="330" y="268" width="136" height="42" rx="21" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" />
        <path d="M424 310 L428 322 L412 310 Z" fill="#F3F4F1" stroke="#29302E" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="410" y="307" width="20" height="5" fill="#F3F4F1" />
        <text x="398" y="295" textAnchor="middle" fontSize="20" fill="#29302E" fontFamily="'Newsreader', Georgia, serif">
          Bonjour
        </text>
      </g>

      {/* Dialogue flow dashed arc between the speakers */}
      <path
        d="M210 370 Q280 320 350 370"
        fill="none"
        stroke="#829A96"
        strokeWidth="1.6"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="210" cy="370" r="3.5" fill="#829A96" />
      <polygon points="354,370 346,365 348,373" fill="#829A96" />

      {/* Center thematic badge stack */}
      <g transform="translate(236 332)">
        {/* Language */}
        <rect x="0" y="0" width="88" height="24" rx="12" fill="#B47763" />
        <text x="44" y="16" textAnchor="middle" fontSize="12" fontWeight="600" fill="#F3F4F1" letterSpacing="0.04em">
          Language
        </text>
        {/* Culture */}
        <rect x="0" y="28" width="88" height="24" rx="12" fill="#29302E" />
        <text x="44" y="44" textAnchor="middle" fontSize="12" fontWeight="600" fill="#F3F4F1" letterSpacing="0.04em">
          Culture
        </text>
        {/* People */}
        <rect x="0" y="56" width="88" height="24" rx="12" fill="#829A96" />
        <text x="44" y="72" textAnchor="middle" fontSize="12" fontWeight="600" fill="#F3F4F1" letterSpacing="0.04em">
          People
        </text>
      </g>

      {/* Silhouette Figures */}
      {/* Left bust - Charcoal (#29302E) */}
      <g fill="#29302E" transform="translate(50 330)">
        <path d="M0 270 C0 200 48 170 100 162 L150 162 C204 170 246 200 246 270 Z" />
        <path d="M104 170 C86 150 78 116 86 82 C93 48 122 30 154 34 C180 38 194 56 194 76 C194 84 200 92 208 97 C200 102 197 104 197 110 C198 116 200 122 195 128 C193 136 188 142 178 146 L178 170 Z" />
      </g>

      {/* Right bust - Clay (#B47763), facing left */}
      <g fill="#B47763" transform="translate(510 340) scale(-0.92 0.92)">
        <path d="M0 270 C0 200 48 170 100 162 L150 162 C204 170 246 200 246 270 Z" />
        <path d="M104 170 C86 150 78 116 86 82 C93 48 122 30 154 34 C180 38 194 56 194 76 C194 84 200 92 208 97 C200 102 197 104 197 110 C198 116 200 122 195 128 C193 136 188 142 178 146 L178 170 Z" />
      </g>

      {/* Baseline cut */}
      <path d="M0 600 V578 H560 V600 Z" fill="#F3F4F1" />
    </svg>
  )
}
