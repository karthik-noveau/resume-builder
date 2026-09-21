"""Reconnect a saved shell or create an independent shell for a new VS Code tab."""

import fcntl
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import uuid


ROOT = Path(__file__).resolve().parent.parent
SOCKET = os.environ.get('RESUME_TERMINAL_SOCKET', 'resume-builder')
TMUX = ['/opt/homebrew/bin/tmux', '-L', SOCKET, '-f', str(ROOT / '.vscode/tmux.conf')]


def tmux(*args, check=True):
    return subprocess.run(TMUX + list(args), text=True, capture_output=True, check=check)


def process_started(pid):
    result = subprocess.run(
        ['/bin/ps', '-p', str(pid), '-o', 'lstart='], text=True, capture_output=True
    )
    return result.stdout.strip() if result.returncode == 0 else ''


def launch():
    if not sys.stdin.isatty() or not sys.stdout.isatty():
        raise RuntimeError('Open this profile in an interactive terminal.')
    if not Path(TMUX[0]).is_file():
        raise RuntimeError('tmux is missing. Install it with: brew install tmux')

    # Serialize startup only. No Python helper remains running after exec.
    # A reservation bridges the interval between unlocking and tmux attaching,
    # so even terminals restored simultaneously cannot claim the same shell.
    lock_path = Path(tempfile.gettempdir()) / f'{SOCKET}-{os.getuid()}.launch.lock'
    with lock_path.open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        result = tmux(
            'list-sessions', '-F',
            '#{session_name}\t#{session_attached}\t#{@vscode_owner_pid}\t#{@vscode_owner_started}',
            check=False,
        )
        session = None
        for row in result.stdout.splitlines():
            name, attached, owner, started = row.split('\t')
            if name != 'resume-builder' and not name.startswith('terminal-'):
                continue
            if attached != '0':
                continue
            if owner.isdigit() and started and process_started(owner) == started:
                continue
            session = name
            break

        if session is None:
            session = 'terminal-' + uuid.uuid4().hex[:12]
            tmux('new-session', '-d', '-s', session, '-c', str(ROOT))

        pid = os.getpid()
        started = process_started(pid)
        if not started:
            raise RuntimeError('Could not identify the terminal launcher process.')
        tmux('set-option', '-t', session, '@vscode_owner_pid', str(pid))
        tmux('set-option', '-t', session, '@vscode_owner_started', started)

    # Give each tab a stable title, then replace this short-lived launcher with
    # the tmux client. The PID/start time reservation remains valid across exec.
    title = 'Resume Builder' if session == 'resume-builder' else 'Shell ' + session[-6:]
    sys.stdout.write(f'\033]0;{title}\007')
    sys.stdout.flush()
    os.execv(TMUX[0], TMUX + ['attach-session', '-t', session])


if __name__ == '__main__':
    try:
        launch()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        detail = getattr(error, 'stderr', '') or str(error)
        print(f'Persistent terminal could not open: {detail.strip()}', file=sys.stderr)
        sys.exit(1)
