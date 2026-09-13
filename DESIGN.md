# Blue Rush design

Use the owner's Korean Blue Voyage wave spectrum, normal map, Fresnel/crest shader, spray/wake and held steering. Preserve the quiet racing HUD: left/right at bottom left, speed in the middle, actions bottom right, craft unobstructed, one notice near the bottom. New jump/drift buttons are necessary for this racing mode.

Palette: abyss #062b42, lagoon #137d93, sea glass #94efe1, pearl #eefaf6, signal coral #ff927a, drift gold #ffd58b. Typeface: locally available Avenir Next / Korean system sans; bold oblique Latin game title, tabular numerals for instruments. No remote font dependency.

Opening: live 3D course as the entire canvas, compact left-aligned race preparation panel, wide open right-hand view of the submersible and water. In play, only corner instruments and bottom controls; no central warning overlays except starting countdown. Avoid dashboard card grids. The memorable element is the illuminated ribbon descending from the reflective ocean into a living reef.

Review: the palette/HUD intentionally match the existing games rather than an unrelated website template. Keep readable track geometry and foreground clarity; underwater distance fog is spatial depth, with no blur postprocessing. Respect reduced motion by removing camera sway and decorative menu animation.

## Rider and submerged-world revision

Keep the established typography, controls and mint/gold signals. Replace the closed capsule with an open saddle aqua-bike: orange fairings, exposed dark seat, silver twin waterjets, handlebars and a helmeted wetsuit rider. Competitors use blue, rose and lime equipment and lean their bodies into turns.

Underwater the broad translucent road is removed. Physical luminous guide rails float above a continuous sculpted seabed; tall rock outcrops, branching coral, kelp and rock arches provide foreground/background overlap and changing silhouettes. Lower ambient light, directional shadows, focused headlights and the visible underside of the wavy surface establish depth. The camera remains behind and above the rider, with ample room over the bottom controls. No underwater screen image or flat background substitute.

Review: address the flat appearance by geometry, occlusion and lighting rather than stronger full-screen effects. Ocean surface retains the original wave reflection/wake code. Separate surface surf/spray from underwater low-frequency water, motor and individual bubble events, crossfaded with listener immersion. Muting, pausing and tab hiding mute every audio branch.


## Banked acceleration

Place the mint acceleration button and charge gauge directly above the two steering buttons, leaving the existing right-hand actions and central speed readout in place. The compact 98 px mobile width preserves the gap around the speedometer on narrow phones. Fuel-ready mint and active pale gold distinguish stored energy from a running burst. Acceleration changes physical speed, smooth camera field of view and the 3D wake; never add blur over the rider. Safe lanes carry items, with wider row spacing and no sudden two-lane switches.


## Held throttle pedal

Reserve a second compact 98 px mobile control above the right-hand action buttons for the mint 엑셀 pedal. Match the left booster row's height, leaving the speedometer in between. Show “누르고 가속”, then “가속 중” with a lit pedal and rising fill while held. Up/W is always throttle; E is always the banked booster. Emphasize the unlimited hold action on the start/help UI, with brake taking priority if both pedals are pressed.
