# Design QA

## Comparison target

- Source visual truth: `/Users/lzg/.codex/generated_images/01a0cc48-a36a-7f11-8c47-fd93ee25f131/exec-016ccf4a-ed63-41f6-b00e-773e41292091.png`
- Source pixels: `1586 x 992`
- Implementation screenshot: `/Users/lzg/Library/CloudStorage/OneDrive-个人/中科院/碳专项/HS-Tracker-UN/qa-artifacts/implementation-1440x1000.png`
- Implementation pixels: `1440 x 1000`
- CSS viewport: `1440 x 1000`; density normalization: not required for the implementation capture.
- State: sample conversion `390760`, source `AUTO`, target year `2005`; results rendered.

## Evidence

Full-view comparison checked the header, input card, full-width path card, stacked target-year result card, source footer, and WTO-style five-state color legend. The implementation preserves the reference's pale blue background, navy typography, rounded glass cards, colored label blocks, blue primary action, vertical results composition, and version-by-version mapping table.

Focused comparison checked the WTO-style path visualizer and target result card. For `390760`, the path shows the one-to-many split from HS12 to `390761` and `390769`, with colored cross-column arrows and a separate HS-year timeline. The target-year card preserves all returned codes without averaging or merging.

Primary interactions tested in the local browser:

- `390760 + AUTO + 2005` renders both HS2017 branches with cross-column arrows and all seven timeline labels visible in the desktop browser.
- `HS02 + 2005` renders the seven-version path and target `HS02` result.
- Changing the target year to `2020` updates the target version to `HS17` and renders two mapped codes.
- Invalid input is rejected by `POST /api/convert` with a readable validation message.

## Findings

No actionable P0, P1, or P2 differences remain.

## Comparison history

1. Initial browser capture showed the external icon library as empty colored blocks. Replaced it with local visible icon glyph assets and removed the external dependency. The revised capture at `qa-artifacts/implementation-1440x1000.png` shows all label, heading, and footer icons visibly rendered.
2. The version select initially duplicated `HS92`, and the API only accepted internal `H0` labels. Removed the duplicate option and added public `HS92`-style label parsing. The revised browser state shows one option per HS version and the `HS02` example remains functional.
3. Input `010121` was initially forced to `HS92`, causing an incorrect identity path. Added automatic source-version inference from the observed adjacent conversion relations and reject incompatible manual source selections. The browser state now infers `HS12` and matches the WTO example path.
4. Removed the explanatory subtitles and implicit-continuation footer from the visible interface. Rebuilt the path section with a WTO-style edge layer, branch arrows, compact fixed-width nodes, a separate HS-year timeline, and a five-state color legend.
5. Moved the target-year result card below the full-width path card so the seven-version graph has enough horizontal space for visible branch lines and arrows.

## Follow-up polish

- The reference mockup uses a 3-code sample target card; the implementation intentionally displays the actual number returned by the selected code, source version, and target year.
- The narrow in-app browser view uses horizontal scrolling for the seven-column path table; desktop width shows all columns in one row.

## Implementation checklist

- [x] Match reference layout and visual tokens.
- [x] Render all HS92–HS22 version columns.
- [x] Preserve one-to-many code branches.
- [x] Map 2005, 2010, 2015, and 2020 to target HS versions.
- [x] Verify primary conversion interaction, validation, and stacked full-width results layout.

final result: passed
