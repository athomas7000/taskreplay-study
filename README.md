# TaskReplay

TaskReplay is a usability sandbox for clickable prototypes. The DeepSpace
app administrator manages one study. Testers sign in and follow a task.
The administrator can watch activity live, replay past sessions, and review
patterns in the current study.

## Run

Use Node 24 and npm 11. Decide whether you want DeepSpace or GitHub to be the
app's source host before the first deploy. See the
[DeepSpace source control guide](https://docs.deep.space/guides/source-control).

```sh
npm ci
npx deepspace auth login
npx deepspace app init
npm run dev
```

The app owner uses /home to manage the study and shares /test. The built-in
templates are Juniper Matcha and Moonbase Rescue. Managers can also paste a
JSON prototype using the built-in templates as examples. A script is data:
a name, a map of screens with titles and optional body text, and lists of
[label, destination] pairs. Each script starts at home and ends at done.
Keep study text and prototype content fictional.

For DeepSpace-hosted source, commit the initialized project before
`npx deepspace deploy`. The CLI needs a signed-in DeepSpace account.
For the submission, ensure reviewers can open the repository URL you provide.

## What to verify

- Run `npm run type-check` and `node --test tests/replay.node-test.mts`.
- Use the app owner in one browser profile and a tester account in a second.
  Save the matcha study and open /test as the tester.
- Start the test, open Past Orders, then go back. The manager should see the
  activity and the tester's online status. Finish via Favorites. Refresh the
  manager's page and replay the Past Orders step.
- Run a second finished session with the same detour. The manager should see
  evidence links for both sessions. Repeating a detour several times in one
  session should count once.
- Publish Moonbase Rescue. Replay an earlier matcha session to confirm it
  still uses the original matcha prototype. Try importing a script with an
  invalid destination and confirm the active script is preserved.
- Sign in as the tester and visit /home. Confirm that manager access is denied.

## Implementation and tradeoff

DeepSpace authentication identifies test participants and the app administrator.
Record permissions give participants read access to their own events and give
the administrator access to the whole study. Confirmed writes append an event
before the tester moves on. The live dashboard and replay use the same event
log. A presence room indicates whether a tester is connected. The initial
event stores a script snapshot so later edits preserve old replays.

The prototype format is a screen graph. It gives managers multiple branching
flows without needing to host external code or capture screen recordings.
An event reaching the terminal screen counts as prototype completion. It does
not grade how closely the tester followed free-text instructions. Results
report repeated backtracks and the shortest observed completion without
backtracking for the active prompt and script. Each run counts as a session.
The matcha suggestion is a hypothesis to test, and the algorithm does not
infer user intent. A disconnected unfinished run stays available for replay
and is excluded from the finished-session analysis.

The coding agent scaffolded and implemented the app, ran type checking, and
tested script validation and the analysis functions. Deployment and the
two-account checks require an authenticated app environment. For the portal
writeup, record the live checks you personally ran and any changes you made.
