#!/usr/bin/env bash
# Shared by build.sh/dev.sh: makes sure cargo and the MinGW linker are on PATH even in a shell
# opened before the one-time setup in ../README.md ran (rustup/winget write to the Windows User
# PATH registry value, which an already-open terminal never re-reads).
set -euo pipefail

if ! command -v cargo >/dev/null 2>&1; then
  for candidate in "$HOME/.cargo/bin" "$USERPROFILE/.cargo/bin"; do
    [ -d "$candidate" ] && export PATH="$candidate:$PATH"
  done
fi

if ! command -v dlltool >/dev/null 2>&1; then
  # WinLibs installs under a version-stamped folder name - glob for it rather than hardcoding one.
  mingw_bin=$(find "$LOCALAPPDATA/Microsoft/WinGet/Packages" -maxdepth 2 -type d \
    -iname "BrechtSanders.WinLibs*" 2>/dev/null | head -n1)
  [ -n "${mingw_bin:-}" ] && export PATH="$mingw_bin/mingw64/bin:$PATH"
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "[toolchain] cargo not found. Open a new terminal (PATH was updated after install), or" >&2
  echo "[toolchain] see desktop/README.md's one-time setup if Rust isn't installed yet." >&2
  exit 1
fi
