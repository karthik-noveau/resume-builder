# Project terminals

New macOS terminals use the **Resume Builder (persistent)** profile. Each tab
reconnects to an unused saved tmux session or creates its own shell. Concurrent
tabs have independent shells. Reopened tabs may reclaim saved sessions in a
different order, but the running commands and working directories are retained.

The startup script replaces itself with tmux; it does not leave a Python process
running. It requires the existing `python3` and Homebrew tmux installation at
`/opt/homebrew/bin/tmux`.

VS Code retains 1,000 display lines, disables terminal images and tab animation,
and uses automatic GPU rendering. New tmux shells retain 10,000 history lines;
existing pane history is not cleared. Use **Ctrl+B, then [** to browse tmux history
and **Q** to leave history view.

Closing a tab or VS Code detaches its session: programs keep running and keep
using resources. Press **Ctrl+C** to stop a foreground command, then type `exit`
when finished with a shell. Mac restarts end running sessions.

Existing terminals keep their original launch command. Use **Terminal > New
Terminal** for the updated profile. Application tasks use a regular login zsh
shell so build/test commands do not attach to interactive sessions.
