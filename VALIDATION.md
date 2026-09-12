# Release verification

- Node simulation tests: 22 passed, covering all three complete races, lap boundaries, moving hazards, boost/slow expiry, shielding, jump clearance, drift charge/release, lateral rail limits, pause, seeded layout fairness, wave inheritance and multiple steering sources.
- Production build and artifact scan pass; npm audit reports zero known vulnerabilities at release time.
- Browser: desktop 1280×720 and mobile 390×844 course picker, countdown, surface→underwater transitions, actual touch jump (airborne height 1.91 m observed), boost collection, shield collection, obstacle contact and mobile HUD checked. Vehicle remains above touch controls, notices are consolidated below the driving view.
- Pause retained exactly the same distance and effect timers across observations; resume returns input focus to the game canvas.
- Short touch/key taps are buffered: jump is queued until a simulation frame, steering has a 90 ms minimum pulse. Cancellation and focus loss still release all controls.
- WebGL runtime errors: none observed. Static course geometry is batched by material; nearby marine life is distance-culled. Sampled mobile course rendering was approximately 197–311 draw calls. This is not a benchmark across real mobile devices.
- Graphics use procedural 3D art with genuine geometry, reflective wave rendering and animated wakes; no postprocessing blur. Saved records belong only to the local browser.

- Actual browser full race: finished three laps in 3:48.60, displayed rank 4/4, 24 items and best-lap 1:15.20. Retry returned to a fresh 3-second countdown. Reloaded menu retained the 3:48.60 record.
- GitHub Actions deployment succeeded. Public HTML and every linked JS/CSS file matched the locally verified build byte for byte.
