# Last Survivor

A post-apocalyptic outback driving and survival game. Almost everything is in `index.html`; character, car and building models are in `models/`, textures in `textures/`. The 3D view uses three.js from a CDN.

## Workflow

- After pushing work to a branch, always open a pull request into `main` and merge it, unless told not to.
- Every published build bumps `VERSION` by 0.1 and the `?v=` on the model scripts to match.

## Testing

- `window.__TEST=true` before load stops the frame loop; `window.__LT` exposes game internals (`G`, `update`, `setState`, `startTalk`, `chooseOpt`, and so on) for scripted checks.
- Loading with `#testrange` opens the test range, with a Tools panel for calling up raiders, storms, wildlife and roadside encounters.
