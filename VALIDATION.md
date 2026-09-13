# v1.0 browser verification (previous release)

- Node simulation tests: 22 passed, covering all three complete races, lap boundaries, moving hazards, boost/slow expiry, shielding, jump clearance, drift charge/release, lateral rail limits, pause, seeded layout fairness, wave inheritance and multiple steering sources.
- Production build and artifact scan pass; npm audit reports zero known vulnerabilities at release time.
- Browser: desktop 1280×720 and mobile 390×844 course picker, countdown, surface→underwater transitions, actual touch jump (airborne height 1.91 m observed), boost collection, shield collection, obstacle contact and mobile HUD checked. Vehicle remains above touch controls, notices are consolidated below the driving view.
- Pause retained exactly the same distance and effect timers across observations; resume returns input focus to the game canvas.
- Short touch/key taps are buffered: jump is queued until a simulation frame, steering has a 90 ms minimum pulse. Cancellation and focus loss still release all controls.
- WebGL runtime errors: none observed. Static course geometry is batched by material; nearby marine life is distance-culled. Sampled mobile course rendering was approximately 197–311 draw calls. This is not a benchmark across real mobile devices.
- Graphics use procedural 3D art with genuine geometry, reflective wave rendering and animated wakes; no postprocessing blur. Saved records belong only to the local browser.

- Actual browser full race: finished three laps in 3:48.60, displayed rank 4/4, 24 items and best-lap 1:15.20. Retry returned to a fresh 3-second countdown. Reloaded menu retained the 3:48.60 record.
- GitHub Actions deployment succeeded. Public HTML and every linked JS/CSS file matched the locally verified build byte for byte.


# v1.1 validation

- 30 Node tests cover the original race, physical rider/helmet geometry, transforms after mesh batching, seabed clearance throughout all three courses, terrain normals/height extent, independent rival movement with bounded pack separation, distinct bounded audio waveforms, exclusive surface/underwater mix targets and actual audio-graph mute/pause/re-enable behavior with an AudioContext test double.
- Local production build and public artifact scan pass.
- Current native browser and sound inspection was blocked by the Mac lock screen. The previous v1.0 screenshots and browser checks above do not validate this revision. Manual appearance/performance/listening review remains outstanding until the Mac is unlocked.

# v1.2 validation

- 43 Node tests pass, including complete races on all three actual 3D tracks. Added regression coverage for banked pickup fuel, manual spending/empty tanks/capacity, held-button repeats, brake cancellation, pause, dodge timing, shield/immunity exclusions, jump clearance, rounded-corner near misses, fast swept contact, already-passed obstacles, per-lap rewards and removal of rail-edge slowdown.
- Seeded layouts retain a safe item lane throughout animal animation. Consecutive safe lanes move at most one lane; tests check enough steering time at the fastest boosted course speed with a 250 ms allowance before steering.
- Rendering and collision share surface heave and animal bob calculations. Collision intentionally uses forgiving core volumes, excluding ornamental fins/spikes/limbs rather than claiming exact triangle contact.
- Production build and public artifact scan pass. Dependency audit: zero known vulnerabilities at validation time. Three.js retains the existing >500 kB vendor-chunk advisory.
- Browser inspection was attempted twice but the Mac remained locked. No v1.2 visual, touch, frame-rate or listening verification is claimed. The earlier v1.0 manual evidence above applies only to that release.

# v1.3 validation

- 49 Node tests pass. New cases measure sustained throttle versus cruise on every course, fuel-free acceleration, smooth release, throttle plus booster spending/recovery, brake priority, slowdown under throttle, countdown/pause immobility and bounded continuous rival pacing during sustained throttle.
- Safe-lane steering allowance regression now uses the new maximum speed (36 × 1.95 m/s). Existing full-track, jump, collision, audio and geometry regressions pass.
- Production build and public artifact scan pass; dependency audit reports zero known vulnerabilities. Literal HUD selectors and unique HTML IDs checked.
- Native browser inspection was attempted but the Mac is still locked. This revision has no manual visual, touch or listening sign-off; earlier manual checks apply to their stated release only.

# v1.4 validation

- 53 Node tests pass. New tests cover distinct four-character lineups/fallback, physical marine-head volume and silhouettes, preservation of every model during mesh batching, live rider/head/turbine animation and repeated switching through the actual scene's setRiders method with shield retention, updated rival labels and removal of old bikes.
- Offline front and rear three-quarter model previews were rendered directly from the Three.js meshes and visually inspected. This checks model shape/placement; it does not reproduce browser lighting, water, UI or performance.
- Native browser inspection was attempted but the Mac remained locked. No current browser visual/touch verification is claimed.
