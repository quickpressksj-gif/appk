const courier = "/images/courier-real.png";

export function DeliveryAnimation() {
  return (
    <div className="qp-ride relative mx-auto w-full max-w-[16rem] select-none">
      <svg
        viewBox="0 0 320 170"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {/* motion trails */}
        <g className="qp-trail" strokeLinecap="round" strokeWidth="3">
          <line x1="6" y1="70" x2="48" y2="70" className="text-primary/50" stroke="currentColor" />
          <line x1="0" y1="92" x2="34" y2="92" className="text-secondary/40" stroke="currentColor" />
          <line x1="14" y1="112" x2="44" y2="112" className="text-primary/30" stroke="currentColor" />
        </g>

        {/* floating soap bubbles */}
        <g className="text-secondary/40">
          <circle className="qp-bubble qp-bubble-1" cx="66" cy="40" r="6" fill="currentColor" />
          <circle className="qp-bubble qp-bubble-2" cx="40" cy="28" r="4" fill="currentColor" />
          <circle className="qp-bubble qp-bubble-3" cx="92" cy="26" r="3.5" fill="currentColor" />
        </g>


        {/* road */}
        <line
          x1="0"
          y1="160"
          x2="320"
          y2="160"
          className="qp-road text-border"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="26 18"
        />
      </svg>

      <img
        src={courier}
        alt="QuickPress courier riding a scooter with a laundry delivery box"
        width={1024}
        height={768}
        className="qp-bob relative w-full drop-shadow-[0_18px_24px_rgba(17,24,39,0.18)]"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
