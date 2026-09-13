# Blue Rush · 블루 러시

[Play Blue Rush](https://hex-aragon.github.io/blue-rush/) · [Source repository](https://github.com/hex-aragon/blue-rush)

A standalone Three.js underwater arcade racer. Follow a looping rail, dodge wildlife, jump low obstacles, bank boost energy, and finish three laps against three competitive AI riders.

## Play

- Left/right arrows or A/D: steer within the illuminated course.
- Space: jump. Release before jumping again. Rocks, small fish and ink hazards can be cleared; a high enough jump also clears shark bodies.
- Shift + steering: charge a drift for at least 0.65 seconds; release to bank boost energy.
- Up arrow / W / hold the right-hand 엑셀 button: unlimited throttle to 1.5× cruise speed. Release to coast back to cruise; no boost energy required.
- E / booster button: spend 25 energy for a 1.8-second burst; tap again after it ends for the next burst.
- Down arrow / S: brake. Forward movement is automatic.
- Escape: pause/resume. Losing focus or hiding the tab pauses the race.
- Touch: simultaneous steering, jump, drift, throttle, booster and brake buttons. Sound is opt-in. Low graphics reduces pixel density.

Mint lightning banks 35 energy; clean obstacle passes bank 10 each, and charged drift releases bank 19–34. The tank holds 100. Acceleration consumes 25 and targets 1.95× cruising speed for 1.8 seconds, with quicker throttle response. Brake cancels the burst. Blue shields absorb one hit within nine seconds. Purple ink slows the craft for 2.8 seconds. Impacts briefly slow the craft and grant temporary immunity. Hazard rows are 72–90 metres apart and always retain an item-marked safe lane; consecutive safe lanes move by at most one lane; each run has a new seed. Marine creatures move within their lanes using the same positions for collision and rendering.

## Courses

- **산호빛 서킷**: reflective surface → coral canyon → surface.
- **심해의 궤도**: entirely underwater, glowing jellyfish and deeper rock gardens.
- **노을 웨이브**: mostly surface racing with a shallow dive.

Three laps per race, three computer riders, ranking, lap splits and personal best saved locally by course. Computer riders predict moving hazards, steer/brake/jump, collect their own pickups and spend earned energy on overtaking bursts; this release has no online multiplayer or global leaderboard. Course distances/depths and the submersible are fictional arcade representations.

## Development

Node.js 22 recommended.

```sh
npm ci
npm run dev
npm test
npm run build
npm run check:public
```

GitHub Actions builds, tests, audits dependencies, checks public artifacts and deploys only `dist/` to GitHub Pages. Relative asset paths support a repository subpath. No API key or server is required; no analytics, account or payment integration.

## Existing-game references

- Owner's `korean-blue-voyage` v1.18.0: four-wave spectrum, Water reflection/Fresnel and crest shader, normal texture, FoamWake spray/wake, and pointer-safe held steering are reused in `src/legacy`.
- Owner's `seoul-night-racer`: HUD layout reference (left/right bottom left, actions bottom right, centred speed, visible player craft). Only racing-relevant controls are carried over; the new required jump and drift are included.
- Existing conversation preferences: no blur over the vehicle; one nonblocking bottom notice; mobile controls and clear craft visibility.

See `THIRD_PARTY_NOTICES.md` for the MIT water texture/Three.js notice. All new vehicle, marine-life and reef models are original procedural geometry. No externally generated images or downloaded animal models are used.


## v1.1 — riders, 3D underwater terrain and layered sound

- Open saddle aqua-bike with a helmeted human rider, breathing tank, handlebars, animated leaning and twin waterjets. All three rivals use the same articulated human model with different equipment colors; name markers identify nearby opponents.
- Submerged road sheets and separate smooth ground pads replaced by one sculpted 3D seabed, rock outcrops and overhead arches. The illuminated guide rails remain suspended above the bottom. Real surface normals, directional shadows, headlights, volumetric rock silhouettes and a displaced water underside establish depth. Desktop/mobile use the same geometry; low graphics disables shadows and reduces pixel density.
- Separate synthesized surf/spray, underwater low-frequency water, motor and individual bubble layers. The listener's immersion crossfades the buses; fully submerged audio has zero surf gain, and fully surfaced audio has zero bubble/underwater gain. Pausing, hiding the tab or muting stops all buses. Sound still starts with the top sound button.
- Competitors never teleport or have their distance rewritten to match the player. Their catch-up pace is bounded and they retain independent race progress.


## v1.2 — banked acceleration and fairer avoidance

- Dedicated mint acceleration button with fuel gauge, keyboard E/Up, simultaneous touch support and buffered quick taps. Pickups, passes and drift charge the same tank. Holding the button cannot spend repeated bursts or drain an empty tank. Braking cancels acceleration; a new burst clears existing slowdown, while new impacts still slow the craft.
- Speed rises more quickly, the camera field of view smoothly widens with actual speed (disabled for reduced motion), and the twin bubble wake grows during acceleration.
- Replaced the old wide rectangle / 8 m shark wall with forgiving rounded 3D body cores. Swept contact follows lateral movement, jump altitude, track elevation, shared surface wave heave and shared animal animation time. Decorative fins/spikes/limbs do not count as hits. This is intentionally forgiving arcade collision, not per-triangle physics.
- Dodges are awarded after the whole craft clears an obstacle, once per lap. Contact during shield or immunity cannot earn a dodge. Passed obstacles cannot hit later. Touching the rail edge no longer causes hidden slowdown. All rows retain a marked safe lane and give enough room to change lanes while boosted.


## v1.3 — hold-to-accelerate pedal

The right thumb now has a dedicated mint 엑셀 pedal above the action row. Hold it (or Up/W) for sustained 1.5× cruising speed without spending fuel, and release to return smoothly to cruising speed. E/the left booster button spends stored energy for a separate 1.95× burst. Brake takes precedence over both. The pedal lights up with a speed fill and held state; instructions distinguish throttle from the booster.

Actual travel speed, smoothly widened camera view, larger twin-jet wake and speed-driven engine/bubble sound reinforce acceleration. Competitors pace at the new cruising speeds without teleporting. Hazard spacing is now 72–90 metres, retaining the safe-lane steering allowance at the higher peak speed. Camera widening still respects reduced-motion preferences.

## v1.4 — ridiculous sea riders

Choose your rider before starting: 펭대리 (penguin with a holiday cap and snorkel), 물개 회장 (seal with whiskers and a coral bow tie), 고등어 씨 (oversized googly-eyed fish head on a human rider), or 잠수 알바 (the original helmeted diver). All four ride the existing aqua-bike, lean into turns and jump; character choice is cosmetic and does not change speed or collision cores.

The three unselected characters become the opponents, with matching name labels and distinct bike colors. Selection persists locally when storage is available, and invalid stored selections fall back to the penguin. The menu updates its 3D rider when a character is selected. Character switches preserve the player's shield mesh and release the previous bikes' private geometry; mesh batching also releases orphaned source geometry.


## v1.5 — moving hazards, ambushes and competitive AI

- Small fish dart ±1.25 m at a faster rhythm; medium coral crabs patrol ±1.8 m with animated claws. All lateral movement is shared with collision prediction. Rows retain an item-marked safe lane and the existing boosted-speed steering allowance.
- Every fifth hazard row has one large ambush shark instead of the usual pair. The first approaching racer triggers a world-space orange ring, rising bubbles and a short sound/HUD warning from at least 96 m away (more at high speed). After 0.65 s it rises from below in 0.3 s. Hidden creatures are intangible; collision follows the visible body once it has nearly emerged. Each lap has its own shared activation, and pause freezes the sequence. The giant leaves adjacent escape lanes.
- Player and AI use the same acceleration, steering, gravity, forgiving swept collision, shield, slow, pickup and boost engine. AI predicts animal positions at arrival, weighs safe/pickup lanes, changes lanes around opponents, jumps low hazards and brakes when necessary. Pickups and dodge rewards are tracked separately per racer, like personal arcade item opportunities.
- Earned fuel powers visible BOOST overtakes; competitors use shorter boost cooldowns on the last lap. They modulate ordinary throttle/brake inputs to keep nearby and never teleport or rewrite distance. AI can be hit and lose shields. Character choices and player controls are unchanged.
