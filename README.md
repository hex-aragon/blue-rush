# Blue Rush · 블루 러시

A standalone Three.js underwater arcade racer. Follow a looping rail, dodge wildlife, jump low obstacles, charge drift boosts, and finish three laps against three pacers.

## Play

- Left/right arrows or A/D: steer within the illuminated course.
- Space: jump. Release before jumping again. Rocks, small fish and ink hazards can be cleared; sharks require lateral avoidance.
- Shift + steering: charge a drift for at least 0.65 seconds; release for a boost.
- Down arrow / S: brake. Forward movement is automatic.
- Escape: pause/resume. Losing focus or hiding the tab pauses the race.
- Touch: simultaneous steering, jump, drift and brake buttons. Sound is opt-in. Low graphics reduces pixel density.

Mint lightning grants a 3.2-second speed boost. Blue shields absorb one hit within nine seconds. Purple ink slows the craft for 2.8 seconds. Impacts briefly slow the craft and grant temporary immunity. Hazard rows always retain an unobstructed lane; each run has a new seed. Marine creatures move within their lanes using the same positions for collision and rendering.

## Courses

- **산호빛 서킷**: reflective surface → coral canyon → surface.
- **심해의 궤도**: entirely underwater, glowing jellyfish and deeper rock gardens.
- **노을 웨이브**: mostly surface racing with a shallow dive.

Three laps per race, three computer pacers, ranking, lap splits and personal best saved locally by course. Pacers follow their lanes at varied speeds; this release has no online multiplayer or global leaderboard. Course distances/depths and the submersible are fictional arcade representations.

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
