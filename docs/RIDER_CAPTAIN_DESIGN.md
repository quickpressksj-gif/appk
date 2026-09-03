# QuickPress Captain — Design System & UX Specification (`DESIGN.md`)

**Design System Name:** Captain OS (Rapido Gig Edition)  
**Inspiration:** Rapido Captain App · Uber Driver · Zomato Delivery Partner  
**Visual Style:** High-Visibility Daylight Contrast · Pure White Canvas · Rapido Vibrant Yellow  

---

## 1. Design Principles for Delivery Captains

1. **Sunlight-Optimized Contrast**: Two-wheeler riders operate under direct Indian sun. Backgrounds must be pure `#FFFFFF` with jet black typography (`#09090B`). Faint gray text and pastel glow clouds are prohibited.
2. **One-Handed / Bike Mount Ergonomics**: Primary action targets must have a minimum height of `56px` to `64px`, placed in the bottom thumb-friendly screen zone.
3. **Pocket Protection (Swipe to Confirm)**: Critical actions that move an order forward or accept dispatch use **Swipe Sliders** rather than single taps to prevent unintended activations while the phone is in a pocket or wet from rain.
4. **Glanceability (The 2-Second Rule)**: A rider glancing at their bike mount at a red light must absorb order earnings, pickup distance, and drop area in under 2 seconds.

---

## 2. Color Palette & Design Tokens

### Primary Palette
| Token | Hex Code | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| **Canvas / Background** | `#FFFFFF` | `bg-white` | Root background for all screens, sheets, and cards |
| **Rapido Yellow (Primary)** | `#FFD200` / `#FACC15` | `bg-amber-400` / `bg-yellow-400` | Primary action buttons, swipe knobs, online indicators |
| **Rapido Yellow Hover** | `#EAB308` | `hover:bg-amber-500` | Pressed / active states |
| **Ink Black (Text 100)** | `#09090B` | `text-slate-950` / `text-zinc-900` | Headings, large numbers, active button text |
| **Muted Slate (Text 60)** | `#64748B` | `text-slate-500` | Subtitles, labels, distance markers |
| **Card Border** | `#E2E8F0` | `border-slate-200` | Crisp 1px card and sheet dividers |

### Feedback & Status Palette
| Token | Hex Code | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| **Duty Online (Green)** | `#10B981` | `bg-emerald-500 text-white` | Active radar pulse, completed order badge |
| **Duty Offline (Slate)** | `#64748B` | `bg-slate-200 text-slate-700` | Offline status bar, disabled actions |
| **Urgent Alert (Red)** | `#EF4444` | `bg-rose-500 text-white` | Countdown timer warning, reject trip, SOS |
| **COD Cash Highlight** | `#3B82F6` | `bg-blue-600 text-white` | "Collect Cash from Customer" chip |

---

## 3. Typography Hierarchy

Using `Inter`, `Outfit`, or System Sans:

| Style | Size / Weight | Example Usage |
| :--- | :--- | :--- |
| **Hero Earnings Number** | `32px` (`text-3xl`) / `font-black` | `₹1,240` (Today's Earnings) |
| **Order Payout Banner** | `24px` (`text-2xl`) / `font-extrabold` | `₹65 Guaranteed` (Incoming Order) |
| **Screen Title** | `20px` (`text-xl`) / `font-bold` | `Duty Cockpit`, `Order Details` |
| **Section Header** | `15px` (`text-sm`) / `font-bold` / `uppercase tracking-wider` | `PICKUP DETAILS`, `PAYMENT BREAKDOWN` |
| **Body Primary** | `15px` (`text-sm`) / `font-medium` | Customer address, store instructions |
| **Caption / Distance** | `13px` (`text-xs`) / `font-semibold` | `0.8 km away · 4 mins` |

---

## 4. Key UI Components & Interaction Specs

### 4.1. `<RapidoDutyToggle />` (The Online / Offline Switch)
- **Position**: Sticky top header on the cockpit screen.
- **Visual Design**:
  - **Offline State**: Clean white card with red dot:  
    `🔴 YOU ARE OFFLINE` · *"Go Online to receive laundry pickups"* ➡️ Large Yellow Toggle Switch.
  - **Online State**: High-visibility yellow banner with green pulsing radar:  
    `🟢 YOU ARE ONLINE` · *"Searching high-demand zones nearby..."* ➡️ Green radar pulse ring.
- **Audio & Haptics**: Triggers voice confirmation and two short vibration pulses (`navigator.vibrate([60, 40, 60])`).

```
+-------------------------------------------------------------+
|  [Q Captain Logo]   [🟢 ONLINE]   [🔔]   [SOS]              |
+-------------------------------------------------------------+
|  🟢 Searching for Laundry Pickups near Indiranagar...       |
+-------------------------------------------------------------+
```

---

### 4.2. `<SwipeToConfirm />` (Rapido-Style Slider)
- **Use Cases**:
  - `Swipe to Accept` (Incoming order alert)
  - `Swipe to Arrive` (Reached pickup/delivery point)
  - `Swipe to Complete Order` (Handover finished)
- **Interaction Spec**:
  - Full width track (`bg-slate-100 border border-slate-200 rounded-full h-16`).
  - Draggable Knob: `56px × 56px` Rapido Yellow circle with double chevron icon `>>`.
  - Shimmering Guide Text: *"Swipe to Accept order"* moving toward the right.
  - Threshold: Must cross **80% of track width** to trigger confirmation.
  - Reset: Automatically springs back if released before 80%.
  - Haptic: Strong 80ms haptic buzz on successful trigger.

---

### 4.3. `<IncomingDispatchModal />` (Rapido Order Alert Sheet)
- **Appearance**: Bottom sheet animated with `slide-in-from-bottom` spring motion.
- **Components**:
  1. **Circular Countdown Ring**: 30-second timer expiring with ticking audio beep.
  2. **Big Payout Banner**: `₹65 Payout` (Highlighted in high-contrast yellow badge).
  3. **Trip Route Card**:
     - Store Pickup point: `FreshFold Laundry · 0.8 km away`
     - Customer Drop point: `Flat 402, Green Acres · 2.4 km away`
     - Total Distance: `3.2 km total`
  4. **Payment Mode**: `Prepaid · No Cash Collection` or `Cash on Delivery: Collect ₹420`.
  5. **Action Controls**:
     - Primary: `<SwipeToConfirm label="Swipe to Accept (₹65)" />`
     - Secondary: `Decline (Pass to another rider)`

---

### 4.4. `<ActiveTripHUD />` (Turn-by-Turn Bottom Drawer)
- Fixed at the bottom of the screen above bottom navigation:
  - **Current Stage Indicator**: Step 1 of 2: `Pickup Laundry from Store`.
  - **Action Buttons Grid**:
    - `[ 📞 Call Customer / Store ]` (White button, slate border)
    - `[ 📍 Google Maps Navigation ]` (Rapido Yellow button with directional arrow)
  - **Verification Input**: Big 4-digit PIN input for store bag handover OTP.
  - **Main Progression Slider**: `<SwipeToConfirm label="Swipe when Bag Collected" />`

---

### 4.5. `<EarningsSummaryCard />` (Home Cockpit)
- Pure white container with subtle drop shadow:
```
+-------------------------------------------------------------+
|  TODAY'S EARNINGS                               [Details >] |
|  ₹840.00                                                   |
|                                                             |
|  [ 12 Trips ]       [ 4.2 hrs Online ]      [ 28.5 km ]     |
+-------------------------------------------------------------+
```

---

### 4.6. `<CaptainBottomNav />` (Mobile Navigation Bar)
- Height: `64px`, fixed at the bottom with safe-area padding for mobile home bars.
- Background: Pure White (`#FFFFFF`) with top border `#E2E8F0`.
- Tabs:
  1. **Duty (Home)**: Steering wheel / radar icon.
  2. **Orders**: Clipboard checklist icon with live count badge.
  3. **Wallet**: Rupee wallet icon with live balance display.
  4. **Account**: Captain profile & vehicle icon.
- Active Tab Indicator: Bold black icon with high-contrast yellow pill indicator.

---

## 5. Soundscape & Audio Triggers

| Trigger | Audio Profile | Description |
| :--- | :--- | :--- |
| **Go Online** | Ascending chime (`440Hz -> 880Hz`) | High-tempo double tone indicating duty active |
| **Go Offline** | Descending chime (`880Hz -> 440Hz`) | Soft single tone indicating duty paused |
| **Incoming Order** | Piercing pulse alarm (`900Hz / 0.2s pulse`) | Loud sound repeating every 1.5s until accepted |
| **Order Delivered** | Cash register "Ka-Ching" | Rewarding positive sound on money credited |
| **SOS Triggered** | High-pitch dual-tone siren | Loud emergency beacon sound |

---

## 6. Implementation Checklist for New Rider UI

- [ ] Configure Tailwind theme with Rapido Captain token colors (`amber-400`, `slate-950`, `white`).
- [ ] Implement `<SwipeToConfirm />` gesture component using pointer events.
- [ ] Implement `<RapidoDutyToggle />` with Web Audio API sound triggers.
- [ ] Build `<IncomingDispatchModal />` with 30s countdown and swipe acceptance.
- [ ] Build `<ActiveTripHUD />` with Google Maps intent launching.
- [ ] Update Navigation Bar to high-contrast Captain Bottom Bar.
- [ ] Test in Mobile Safari & Chrome DevTools with touch simulation and daylight contrast.
