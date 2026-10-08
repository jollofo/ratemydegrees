# RateMyDegree Reels

Independent Remotion project. The website does not import this project.

From this directory:

- `npm ci` installs the pinned dependencies.
- `npm run studio` opens the editable composition.
- `npm run render` exports `../../artifacts/uf-cs-reel.mp4`.

UFReview: 1080 × 1920, 30 fps, 18 seconds, H.264 MP4. Silent for optional music selection in Instagram.

0–4s: opening question. 4–13s: verbatim student quote. 13–18s: comment prompt.

The source record is in source.json. The quote preserves original spelling. No aggregate program rating or claim of representativeness is used.

## Computer Science question pilot

`cs-pilot.jsx` is a six-scene, 21-second, 1080 x 1920 composition. Edit the on-screen copy and provenance in `cs-pilot-props.json`. It reuses the original `public/dms-pulse.wav` soundtrack. The pilot asks for firsthand CS experiences; it does not quote a review or claim outcomes, salaries, or consensus.

```powershell
node node_modules/@remotion/cli/remotion-cli.js render cs-pilot.jsx CSPilot ../../artifacts/cs-question-pilot.mp4 --codec=h264 --crf=18
```
