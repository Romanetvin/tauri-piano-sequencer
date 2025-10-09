Please perform the following tasks:

1. Search the codebase for debugging artifacts:
   - console.log statements
   - console.debug, console.warn, console.error (except intentional error handling)
   - Commented-out code blocks
   - Debug print statements (println!, dbg!, etc. in Rust)
   - TODO/FIXME comments that reference debugging

2. Review each finding and:
   - Remove debugging console.log statements
   - Keep intentional logging (like error handling or important user feedback)
   - Remove commented-out code that is no longer needed
   - Ask before removing anything ambiguous

3. After cleanup:
   - Show a summary of what was removed
   - Run the build to ensure nothing broke
   - Check git status for all modified files
   - Stage and commit ALL modified files (not just files with debugging artifacts removed)
   - Use a descriptive commit message that includes both the cleanup and any other changes

Please be thorough but careful - don't remove legitimate error handling or intentional logging.
