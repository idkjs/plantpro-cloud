# Cloud-side PlantPi

At the moment, this subproject is managed through Trello. This is still up for discussion, but in my experience Trello is pretty great.

# Git Etiquette

- **never** do your work on `master`
- it's your responsibility to make sure that all of your MR's are up-to-date (i.e. rebase your branch on `master` before you submit an MR)
- prefix branch names with their role, e.g.
  - `feat/user-control-panel` would be a branch for adding a user control panel
  - `bug/immortal-sessions` would be a branch for fixing some sort of problem with user session tokens living too long (*cough* Facebook writes terrible software *cough, cough*)
  - `refactor/login` would be a branch for refactoring the login handler
  - `test/login` would be a branch for adding test cases to the login handler
  - `doc/login` would be a branch for documenting the login handler
  - there's a StackOverflow thread that lists a bunch of these; we could also use emoji's for this? e.g. :poop: for bug fixes, :sparkles: for features, etc.
- commits should be semi-functional and atomic, i.e. don't make a commit with clearly broken code e.g. half-written functions
- unless you're certain that you won't use them again, please keep your branches, as it could be convenient for someone later on to figure out what you've been doing.
- please don't edit other people's branches. Instead, do one of the following things:
  - If it's an MR, drop a comment asking the author to fix it.
  - Fork the branch, make your change, then create an MR from your new branch into the branch you'd like to change.
- CI is your friend

## Deps

```sh
esy add @opam/calendar @opam/extlib @opam/opium.unix @opam/lwt @opam/unix @opam/yojson @opam/ppx_deriving_yojson @opam/sqlexpr.ppx @opam/cryptokit @opam/lwt.ppx @opam/netstring @opam/rresult @opam/ppx_netblob @opam/reason
```
