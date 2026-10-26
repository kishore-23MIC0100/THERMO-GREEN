# VibeWise development plugin

The requested [nykooi1/vibe-wise](https://github.com/nykooi1/vibe-wise) plugin was installed and enabled in the local Codex environment at version **0.1.44**. Verified using `codex plugin list --marketplace vibe-wise --json`.

VibeWise is a development-learning plugin, not a browser UI library or runtime dependency. It does not change the dashboard's visual design, telemetry, or firmware safety.

To install it in another Codex environment, run these separately:

```sh
codex plugin marketplace add nykooi1/vibe-wise
codex plugin add vibe-wise@vibe-wise
codex plugin list --marketplace vibe-wise --json
```

Start Codex in this project and invoke `$vibe-wise:learn` when you want its guided learning workflow. If the current chat does not discover newly installed skills, open a new Codex chat. Installing it does not automatically enable its checkpoint-driven learning mode in an existing build task. `$vibe-wise:reset` resets only its learning notes after the plugin's own confirmation.

The optional `.vibe-wise/` learner notes are ignored by Git. No plugin source or account-specific Codex configuration is embedded in the application repository. The upstream README documents updating and scope.
