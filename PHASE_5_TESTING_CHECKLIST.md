# Phase 5: Testing & Validation Checklist

This document provides a comprehensive testing checklist for validating the shadcn/ui migration in the Piano Player app.

**Status**: Phase 3 (Component Migration) ✅ COMPLETED
**Current Phase**: Phase 5 (Testing & Validation) 🔄 IN PROGRESS

---

## Migration Status Overview

### Completed Migrations ✅

| Component | Old Implementation | New Implementation | Status |
|-----------|-------------------|-------------------|--------|
| TransportControls | Custom buttons | shadcn Button + Tooltip | ✅ Migrated |
| ThemeToggle | Custom button | shadcn Button + Tooltip | ✅ Migrated |
| Toast | Custom component | Sonner (shadcn toast) | ✅ Migrated |
| AISettings | Custom modal | shadcn Dialog + Input + Label | ✅ Migrated |
| AIMelodyGenerator | Custom modal | shadcn Dialog + Select + Slider | ✅ Migrated |
| ScaleSelector | Custom dropdown | shadcn Select | ✅ Migrated |
| Reset Modal | Custom modal | shadcn AlertDialog | ✅ Migrated |
| Export Menu | Custom dropdown | shadcn DropdownMenu | ✅ Migrated |

### Components Kept Custom (As Planned) ✅

- PianoRoll (canvas-based)
- VisualPiano (SVG-based)
- KeyboardGuide (unique UI)
- PianoKeys (custom rendering)
- TimeRuler (custom rendering)
- Playhead (custom rendering)

---

## 5.1: Functional Testing Checklist

### TransportControls Testing

**Location**: `src/components/TransportControls.tsx:13-67`

- [ ] **Play/Pause Button**
  - [ ] Play button displays when not playing (Play icon visible)
  - [ ] Pause button displays when playing (Pause icon visible)
  - [ ] Clicking toggles between play and pause states
  - [ ] Hover effect works (scale transform visible)
  - [ ] Active/click effect works (scale-down visible)
  - [ ] Gradient background renders correctly (indigo-purple)
  - [ ] Shadow effect appears on hover

- [ ] **Tooltip Display**
  - [ ] Hover over Play button shows "Play (Space)" tooltip
  - [ ] Hover over Pause button shows "Pause (Space)" tooltip
  - [ ] Tooltips appear after short delay
  - [ ] Tooltips disappear when mouse leaves

- [ ] **Stop Button**
  - [ ] Stop button displays square icon
  - [ ] Clicking stops playback
  - [ ] Hover effect works (scale transform)
  - [ ] Outline variant styling correct
  - [ ] Tooltip shows "Stop" on hover

- [ ] **Keyboard Shortcuts**
  - [ ] Space bar toggles play/pause (not triggered when typing in inputs)
  - [ ] Space works when piano roll is focused
  - [ ] No conflicts with other shortcuts

**Test Notes**: _______________________________________

---

### ThemeToggle Testing

**Location**: `src/components/ThemeToggle.tsx:7-36`

- [ ] **Theme Switching**
  - [ ] Moon icon displays in light mode
  - [ ] Sun icon displays in dark mode
  - [ ] Clicking toggles theme
  - [ ] Theme preference persists after page reload
  - [ ] Smooth transition between themes (300ms duration)

- [ ] **Visual Updates**
  - [ ] All shadcn components update colors (buttons, dialogs, inputs)
  - [ ] Piano roll updates background colors
  - [ ] Top bar updates background colors
  - [ ] Status bar updates colors
  - [ ] Border colors update
  - [ ] Text colors update (foreground)

- [ ] **Tooltip**
  - [ ] Hover shows "Switch to dark mode" in light mode
  - [ ] Hover shows "Switch to light mode" in dark mode
  - [ ] Tooltip styling matches theme

- [ ] **Button Styling**
  - [ ] Outline variant renders correctly
  - [ ] Icon size (h-5 w-5) is appropriate
  - [ ] Rounded corners (rounded-lg) visible
  - [ ] Hover effect works

**Test Notes**: _______________________________________

---

### Toast Notifications Testing

**Location**: `src/App.tsx:12,648` (Sonner Toaster)

- [ ] **Success Toasts**
  - [ ] AI melody import shows success toast
  - [ ] Toast message includes note count
  - [ ] Toast includes emoji (🎵)
  - [ ] Toast appears in bottom-right position
  - [ ] Toast has green accent (success variant)

- [ ] **Error Toasts**
  - [ ] Invalid AI request shows error toast
  - [ ] Failed API key test shows error
  - [ ] Export/import errors show toast
  - [ ] Toast has red accent (destructive variant)

- [ ] **Toast Behavior**
  - [ ] Auto-dismiss after ~5 seconds
  - [ ] Manual close button works (X button)
  - [ ] Multiple toasts stack properly
  - [ ] Toasts are dismissible by clicking
  - [ ] Rich colors enabled (richColors prop)

- [ ] **Theme Compatibility**
  - [ ] Toasts render correctly in light mode
  - [ ] Toasts render correctly in dark mode
  - [ ] Text is readable in both themes

**Test Notes**: _______________________________________

---

### AISettings Modal Testing

**Location**: `src/components/AISettings.tsx`

- [ ] **Modal Opening/Closing**
  - [ ] Opens when clicking AI button (if no API keys configured)
  - [ ] Opens from "Configure API Keys" link in AIMelodyGenerator
  - [ ] Closes when clicking backdrop
  - [ ] Closes when clicking X button (if present)
  - [ ] Closes when clicking "Close" button
  - [ ] Escape key closes modal

- [ ] **API Key Input**
  - [ ] Each provider (OpenAI, Gemini, Anthropic, Cohere) has input field
  - [ ] Password masking works by default (•••••)
  - [ ] Eye icon toggles show/hide password
  - [ ] Can type API key into field
  - [ ] Placeholder text shows when empty
  - [ ] Input disabled during loading

- [ ] **Save Functionality**
  - [ ] Save button disabled when input empty
  - [ ] Save button shows "Saving..." during save
  - [ ] Save button shows "✓ Saved" on success
  - [ ] Save button shows "✗ Error" on failure
  - [ ] API key persists after save (check by reopening modal)
  - [ ] "✓ Configured" badge appears after save

- [ ] **Test Connection**
  - [ ] Test button appears only when API key saved
  - [ ] Test button shows "Testing..." during test
  - [ ] Test shows "✓ Connected" on success
  - [ ] Test shows "✗ Failed" on error
  - [ ] Test disabled during loading

- [ ] **Delete Functionality**
  - [ ] Delete button appears only when API key saved
  - [ ] Delete button removes API key
  - [ ] "✓ Configured" badge disappears after delete
  - [ ] Input field resets to empty after delete

- [ ] **Provider Links**
  - [ ] Each provider has link to API key page
  - [ ] Links open in new tab
  - [ ] Links have correct URLs

- [ ] **Styling & Layout**
  - [ ] Modal width is appropriate (max-w-2xl)
  - [ ] Modal scrolls if content overflows (max-h-[80vh])
  - [ ] Border radius matches shadcn style
  - [ ] Spacing between providers consistent
  - [ ] Label text is readable
  - [ ] Helper text (text-muted-foreground) is subtle

**Test Notes**: _______________________________________

---

### AIMelodyGenerator Modal Testing

**Location**: `src/components/AIMelodyGenerator.tsx`

- [ ] **Modal Opening/Closing**
  - [ ] Opens when clicking AI button
  - [ ] Opens with Ctrl+Shift+G (or Cmd+Shift+G on Mac)
  - [ ] Closes when clicking backdrop
  - [ ] Closes when clicking X button
  - [ ] Closes after successful import
  - [ ] Escape key closes modal

- [ ] **Provider Selection**
  - [ ] Dropdown shows all providers (OpenAI, Gemini, Anthropic, Cohere)
  - [ ] Configured providers are selectable
  - [ ] Unconfigured providers show "(Not configured)"
  - [ ] Unconfigured providers are disabled
  - [ ] Selected provider persists during generation

- [ ] **Prompt Input**
  - [ ] Textarea accepts multi-line input
  - [ ] Textarea shows placeholder text
  - [ ] Can type description
  - [ ] Text wraps properly
  - [ ] Textarea disabled during generation

- [ ] **Measures Input**
  - [ ] Number input accepts values 1-16
  - [ ] Can type number
  - [ ] Can use arrow keys to increment/decrement
  - [ ] Helper text shows "(1-16 measures, 4 beats per measure)"
  - [ ] Input disabled during generation

- [ ] **Temperature Slider**
  - [ ] Slider displays current value (e.g., "1.0")
  - [ ] Can drag slider to change value
  - [ ] Range is 0.0-2.0
  - [ ] Step is 0.1
  - [ ] Labels show "Conservative (0.0)" and "Creative (2.0)"
  - [ ] Slider disabled during generation

- [ ] **Scale Selection**
  - [ ] Checkbox to "Use custom scale"
  - [ ] ScaleSelector appears when checked
  - [ ] ScaleSelector hidden when unchecked
  - [ ] Selected scale overrides track scale
  - [ ] Checkbox disabled during generation

- [ ] **Generate Functionality**
  - [ ] Generate button disabled when prompt empty
  - [ ] Generate button disabled when no provider configured
  - [ ] Generate button shows loading spinner during generation
  - [ ] Generate button shows elapsed time (e.g., "Generating... 3s")
  - [ ] Cancel button appears during generation (if canCancel=true)
  - [ ] Cancel button stops generation

- [ ] **Generated Response Preview**
  - [ ] Preview appears after generation
  - [ ] Shows note count
  - [ ] Shows duration in beats
  - [ ] Background styling (bg-muted) is visible

- [ ] **Import Functionality**
  - [ ] "Import to Piano Roll" button appears after generation
  - [ ] Clicking import adds notes to piano roll
  - [ ] Modal closes after import
  - [ ] Success toast appears with note count
  - [ ] "Generate New" button clears preview and allows new generation

- [ ] **Error Handling**
  - [ ] Error message displays when generation fails
  - [ ] Error has red background (bg-destructive/10)
  - [ ] Error text is readable

- [ ] **Settings Link**
  - [ ] "Configure API Keys" link button at bottom
  - [ ] Clicking opens AISettings modal
  - [ ] AIMelodyGenerator modal closes when opening settings

**Test Notes**: _______________________________________

---

### ScaleSelector Testing

**Location**: `src/components/ScaleSelector.tsx:11-51`

- [ ] **Dropdown Opening**
  - [ ] Clicking opens dropdown menu
  - [ ] Menu scrolls if content overflows (max-h-[400px])
  - [ ] Music icon visible in trigger button

- [ ] **Scale Selection**
  - [ ] "None" option available at top
  - [ ] "None" option shows "(No highlighting)" helper text
  - [ ] All 12 root notes available (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
  - [ ] Each root note has Major and Minor options
  - [ ] Root notes are grouped with labels

- [ ] **Selection Behavior**
  - [ ] Clicking a scale selects it
  - [ ] Dropdown closes after selection
  - [ ] Selected scale name displays in trigger
  - [ ] Selecting "None" clears scale highlighting

- [ ] **Piano Roll Integration**
  - [ ] Selected scale highlights notes in piano roll
  - [ ] Highlighted notes have visual distinction
  - [ ] Changing scale updates highlighting immediately
  - [ ] "None" removes all highlighting

- [ ] **Styling**
  - [ ] Trigger width is appropriate (w-[180px])
  - [ ] SelectLabel styling distinct from items
  - [ ] Music icon size correct (h-4 w-4)
  - [ ] Helper text subtle (text-muted-foreground)

**Test Notes**: _______________________________________

---

### Reset Modal Testing

**Location**: `src/App.tsx:551-610`

- [ ] **Modal Opening/Closing**
  - [ ] Opens when clicking Reset button
  - [ ] Closes when clicking Cancel button
  - [ ] Closes when clicking backdrop
  - [ ] Escape key closes modal
  - [ ] Closes after successful reset

- [ ] **Warning Display**
  - [ ] Warning icon visible (triangle with exclamation)
  - [ ] Icon has red/destructive color
  - [ ] Title "Reset Piano Roll" visible
  - [ ] Subtitle "This will clear all notes" visible
  - [ ] Description text is readable

- [ ] **Export MIDI & Clear**
  - [ ] Button displays MIDI icon
  - [ ] Button text is "Export MIDI & Clear"
  - [ ] Clicking exports MIDI file
  - [ ] Browser downloads file after click
  - [ ] Modal closes after export
  - [ ] Notes are cleared after export

- [ ] **Export JSON & Clear**
  - [ ] Button displays JSON/file icon
  - [ ] Button text is "Export JSON & Clear"
  - [ ] Clicking exports JSON file
  - [ ] Browser downloads file after click
  - [ ] Modal closes after export
  - [ ] Notes are cleared after export

- [ ] **Clear without Exporting**
  - [ ] Button has destructive/red styling
  - [ ] Button displays trash icon
  - [ ] Button text is "Clear without Exporting"
  - [ ] Clicking immediately clears notes
  - [ ] Modal closes after clearing
  - [ ] No file is downloaded

- [ ] **Cancel Button**
  - [ ] Button text is "Cancel"
  - [ ] Clicking closes modal
  - [ ] No notes are cleared
  - [ ] No file is downloaded

- [ ] **Layout**
  - [ ] Buttons stack properly on narrow screens
  - [ ] Two export buttons side-by-side
  - [ ] Clear button full width below
  - [ ] Cancel button full width at bottom
  - [ ] Spacing between buttons consistent (gap-2)

**Test Notes**: _______________________________________

---

### Export Menu Testing

**Location**: `src/App.tsx:368-386`

- [ ] **Menu Opening/Closing**
  - [ ] Clicking Export button opens dropdown
  - [ ] Menu aligns to right edge (align="end")
  - [ ] Clicking outside closes menu
  - [ ] Escape key closes menu

- [ ] **Export MIDI Option**
  - [ ] Menu item shows Music icon
  - [ ] Text is "Export as MIDI (default)"
  - [ ] Clicking exports MIDI file
  - [ ] Browser downloads .mid file
  - [ ] Menu closes after selection
  - [ ] File naming is appropriate

- [ ] **Export JSON Option**
  - [ ] Menu item shows FileJson icon
  - [ ] Text is "Export as JSON"
  - [ ] Clicking exports JSON file
  - [ ] Browser downloads .json file
  - [ ] Menu closes after selection
  - [ ] JSON structure is valid

- [ ] **Button Styling**
  - [ ] Outline variant visible
  - [ ] Download icon visible
  - [ ] "Export" text visible
  - [ ] ChevronDown icon visible
  - [ ] Gap between elements consistent

- [ ] **Icon Display**
  - [ ] Icons have correct size (h-4/h-5 w-4/w-5)
  - [ ] Icons have spacing from text (mr-2)
  - [ ] Icons render in both light and dark mode

**Test Notes**: _______________________________________

---

### Import Functionality Testing

**Location**: `src/App.tsx:286-320,401-408`

- [ ] **Import Button**
  - [ ] Button displays upload icon
  - [ ] "Import" text visible
  - [ ] Clicking triggers file picker
  - [ ] File picker accepts .json, .mid, .midi

- [ ] **JSON Import**
  - [ ] Can select .json file
  - [ ] Valid JSON imports successfully
  - [ ] Invalid JSON shows error alert
  - [ ] Notes appear in piano roll after import
  - [ ] Tracks are loaded
  - [ ] Success alert shows project name

- [ ] **MIDI Import** (if implemented)
  - [ ] Can select .mid or .midi file
  - [ ] Valid MIDI imports successfully
  - [ ] Invalid MIDI shows error alert
  - [ ] Notes converted correctly

- [ ] **Error Handling**
  - [ ] Corrupted file shows error
  - [ ] Wrong format shows error
  - [ ] Missing fields shows error
  - [ ] Error message is descriptive

- [ ] **File Input Reset**
  - [ ] File input clears after successful import
  - [ ] Can import same file again

**Test Notes**: _______________________________________

---

### Piano Roll Integration Testing

**Location**: `src/App.tsx:459-475`

- [ ] **Note Creation**
  - [ ] Click and drag creates note
  - [ ] Notes snap to grid when enabled
  - [ ] Note has correct color from track
  - [ ] Note appears immediately

- [ ] **Note Selection**
  - [ ] Clicking note selects it
  - [ ] Ctrl/Cmd+Click multi-selects
  - [ ] Selected notes have visual distinction
  - [ ] Selection count updates in status bar

- [ ] **Note Editing**
  - [ ] Can drag to move notes
  - [ ] Can drag edges to resize notes
  - [ ] Delete/Backspace removes selected notes
  - [ ] Escape clears selection

- [ ] **Playback**
  - [ ] Playhead moves during playback
  - [ ] Notes play at correct time
  - [ ] Volume/velocity respected
  - [ ] Playback loops automatically

- [ ] **Keyboard Shortcuts**
  - [ ] Ctrl/Cmd+C copies selected notes
  - [ ] Ctrl/Cmd+V pastes notes
  - [ ] Ctrl/Cmd+D duplicates notes
  - [ ] QWERTY keys play piano notes
  - [ ] Shortcuts don't trigger when typing in inputs

**Test Notes**: _______________________________________

---

## 5.2: Accessibility Testing Checklist

### Keyboard Navigation

- [ ] **Tab Navigation**
  - [ ] Tab moves through all interactive elements in logical order
  - [ ] Tab order: Top bar → Transport controls → Export → Import → AI → Reset → Theme → Piano roll
  - [ ] Focus indicator visible on all elements
  - [ ] No tab traps (can tab out of all containers)

- [ ] **Enter/Space Activation**
  - [ ] Enter activates buttons
  - [ ] Space activates buttons (except when it's play/pause shortcut)
  - [ ] Enter submits forms (AI settings save)
  - [ ] Space toggles checkboxes

- [ ] **Escape Key**
  - [ ] Escape closes all modals (AISettings, AIMelodyGenerator, Reset)
  - [ ] Escape closes dropdowns (ScaleSelector, Export menu)
  - [ ] Escape clears note selection in piano roll
  - [ ] Multiple escapes work correctly (close modal then clear selection)

- [ ] **Arrow Keys**
  - [ ] Arrow keys navigate dropdown menus (ScaleSelector, Export menu)
  - [ ] Up/Down arrows navigate select options
  - [ ] Arrow keys adjust number inputs (measures)
  - [ ] Arrow keys work in sliders (if focused)

### Screen Reader Testing

**Tools**: VoiceOver (macOS), NVDA (Windows), or JAWS

- [ ] **Button Labels**
  - [ ] Play/Pause button announces state ("Play" or "Pause")
  - [ ] Stop button announces "Stop"
  - [ ] Theme toggle announces "Toggle theme"
  - [ ] Export button announces "Export"
  - [ ] Import button announces "Import"
  - [ ] AI button announces "AI Melody Generator"
  - [ ] Reset button announces "Reset piano roll"

- [ ] **Form Inputs**
  - [ ] API key inputs have associated labels
  - [ ] Prompt textarea has label "Melody Description"
  - [ ] Measures input has label "Measures (bars)"
  - [ ] Temperature slider has label "Creativity"
  - [ ] Scale selector has label "Scale"

- [ ] **Modal Announcements**
  - [ ] AISettings modal announces title "AI Settings"
  - [ ] AIMelodyGenerator announces title "AI Melody Generator"
  - [ ] Reset modal announces "Reset Piano Roll" warning
  - [ ] Description text is announced

- [ ] **Status Messages**
  - [ ] Toast notifications are announced
  - [ ] Loading states are announced ("Generating...", "Saving...")
  - [ ] Error messages are announced
  - [ ] Success messages are announced

- [ ] **Hidden Content**
  - [ ] Theme toggle has sr-only "Toggle theme" text
  - [ ] Icon-only buttons have aria-label or sr-only text
  - [ ] Decorative icons have aria-hidden

### Focus Management

- [ ] **Modal Focus Trapping**
  - [ ] Opening AISettings modal focuses first input
  - [ ] Tab stays within modal while open
  - [ ] Closing modal returns focus to trigger button
  - [ ] Same for AIMelodyGenerator modal
  - [ ] Same for Reset AlertDialog

- [ ] **Dropdown Focus**
  - [ ] Opening ScaleSelector focuses first item
  - [ ] Tab moves to next item in dropdown
  - [ ] Closing returns focus to trigger
  - [ ] Same for Export DropdownMenu

- [ ] **Focus Loss Prevention**
  - [ ] Focus never disappears during interactions
  - [ ] Deleting notes doesn't lose focus
  - [ ] Clearing selection doesn't lose focus
  - [ ] Theme toggle maintains focus

### ARIA Attributes

- [ ] **Dialogs**
  - [ ] role="dialog" present
  - [ ] aria-labelledby points to title
  - [ ] aria-describedby points to description
  - [ ] aria-modal="true" present

- [ ] **Dropdowns**
  - [ ] role="menu" or "listbox" present
  - [ ] aria-expanded reflects open/closed state
  - [ ] aria-haspopup indicates dropdown presence

- [ ] **Buttons**
  - [ ] aria-label for icon-only buttons
  - [ ] aria-pressed for toggle buttons (if any)
  - [ ] disabled state reflected in aria-disabled

- [ ] **Form Controls**
  - [ ] aria-invalid on error
  - [ ] aria-describedby for helper text
  - [ ] aria-required for required fields

**Test Notes**: _______________________________________

---

## 5.3: Performance Testing Checklist

### Bundle Size Analysis

**Command**: `npm run build`

- [ ] **Pre-Migration Baseline**
  - Previous bundle size: _________ KB
  - Previous gzipped size: _________ KB

- [ ] **Post-Migration Measurements**
  - Current bundle size: _________ KB
  - Current gzipped size: _________ KB
  - Size increase: _________ KB (expected: ~50-100 KB gzipped)

- [ ] **Component Breakdown**
  - Check `dist/assets/*.js` files
  - Largest chunks identified: _________________
  - Radix UI primitives size: _________ KB
  - lucide-react icons size: _________ KB
  - Sonner toast size: _________ KB

- [ ] **Optimization Opportunities**
  - [ ] Tree-shaking working correctly
  - [ ] No duplicate dependencies
  - [ ] Code splitting configured
  - [ ] Lazy loading considered for large modals

**Build Output**:
```
[Paste npm run build output here after testing]
```

### Rendering Performance

**Tools**: Browser DevTools Performance tab, React DevTools Profiler

- [ ] **Modal Performance**
  - [ ] AISettings modal opens in < 100ms
  - [ ] AIMelodyGenerator modal opens in < 100ms
  - [ ] Reset AlertDialog opens in < 50ms
  - [ ] No frame drops during modal animations
  - [ ] Modal close animations smooth

- [ ] **Theme Toggle Performance**
  - [ ] Theme switch completes in < 300ms
  - [ ] No flash of unstyled content
  - [ ] All components update smoothly
  - [ ] No layout shift during toggle

- [ ] **Dropdown Performance**
  - [ ] ScaleSelector opens in < 50ms
  - [ ] Export menu opens in < 50ms
  - [ ] Large scale list (12 roots × 2 modes) scrolls smoothly
  - [ ] No lag when selecting items

- [ ] **Input Performance**
  - [ ] Typing in textarea is responsive
  - [ ] Slider drag is smooth (60fps)
  - [ ] Number input updates immediately
  - [ ] No input delay

### Piano Playback Performance

**Critical**: Ensure shadcn migration doesn't affect audio

- [ ] **Keyboard Playback**
  - [ ] QWERTY keys play notes instantly (< 10ms latency)
  - [ ] No delay between keypress and sound
  - [ ] Multiple simultaneous keys work
  - [ ] Key release stops notes immediately

- [ ] **Sequencer Playback**
  - [ ] Playback starts immediately when clicking Play
  - [ ] Playback tempo is accurate (verify with metronome)
  - [ ] Notes trigger at correct timestamps
  - [ ] No audio glitches or stuttering
  - [ ] Multi-track playback synchronized

- [ ] **Visual Piano Playback**
  - [ ] Clicking piano keys plays instantly
  - [ ] Visual feedback (key highlighting) is immediate
  - [ ] No lag between click and sound
  - [ ] Dragging across keys plays smoothly

### Memory Usage

**Tools**: Browser DevTools Memory tab

- [ ] **Memory Leaks**
  - [ ] Opening/closing modals 10 times doesn't increase memory significantly
  - [ ] Theme toggling doesn't leak memory
  - [ ] Playing notes doesn't accumulate memory
  - [ ] Toast notifications are garbage collected

- [ ] **Baseline Measurements**
  - Idle memory usage: _________ MB
  - After opening all modals: _________ MB
  - After 5 minutes of interaction: _________ MB

**Performance Notes**: _______________________________________

---

## 5.4: Browser Compatibility Checklist

### Chrome/Edge (Chromium)

**Version Tested**: _____________

- [ ] **Visual Rendering**
  - [ ] All components render correctly
  - [ ] Gradients display properly
  - [ ] Shadows render correctly
  - [ ] Rounded corners visible
  - [ ] Animations smooth

- [ ] **Functionality**
  - [ ] All buttons work
  - [ ] All modals work
  - [ ] All dropdowns work
  - [ ] Theme toggle works
  - [ ] Toast notifications work

- [ ] **Keyboard Shortcuts**
  - [ ] Space for play/pause
  - [ ] Ctrl+Shift+G for AI generator
  - [ ] Ctrl+C/V/D for copy/paste/duplicate
  - [ ] Delete for removing notes

- [ ] **Audio Playback**
  - [ ] Keyboard notes play
  - [ ] Sequencer playback works
  - [ ] Visual piano works
  - [ ] Volume control works

**Chrome Notes**: _______________________________________

---

### Firefox

**Version Tested**: _____________

- [ ] **Visual Rendering**
  - [ ] All components render correctly
  - [ ] Gradients display properly (check for Firefox-specific issues)
  - [ ] Shadows render correctly
  - [ ] Rounded corners visible
  - [ ] Animations smooth

- [ ] **Functionality**
  - [ ] All buttons work
  - [ ] All modals work
  - [ ] All dropdowns work
  - [ ] Theme toggle works
  - [ ] Toast notifications work

- [ ] **Keyboard Shortcuts**
  - [ ] Space for play/pause
  - [ ] Ctrl+Shift+G for AI generator (not Cmd on Mac)
  - [ ] Ctrl+C/V/D for copy/paste/duplicate
  - [ ] Delete for removing notes

- [ ] **Audio Playback**
  - [ ] Keyboard notes play
  - [ ] Sequencer playback works
  - [ ] Visual piano works
  - [ ] Volume control works

- [ ] **Firefox-Specific Checks**
  - [ ] Backdrop filter works (or fallback visible)
  - [ ] CSS Grid layout correct
  - [ ] Flexbox layout correct
  - [ ] Transform animations work

**Firefox Notes**: _______________________________________

---

### Safari (macOS)

**Version Tested**: _____________

- [ ] **Visual Rendering**
  - [ ] All components render correctly
  - [ ] Gradients display properly
  - [ ] Shadows render correctly
  - [ ] Rounded corners visible
  - [ ] Animations smooth (check for Safari lag)

- [ ] **Functionality**
  - [ ] All buttons work
  - [ ] All modals work
  - [ ] All dropdowns work
  - [ ] Theme toggle works
  - [ ] Toast notifications work

- [ ] **Keyboard Shortcuts**
  - [ ] Space for play/pause
  - [ ] Cmd+Shift+G for AI generator (not Ctrl)
  - [ ] Cmd+C/V/D for copy/paste/duplicate (not Ctrl)
  - [ ] Delete for removing notes

- [ ] **Audio Playback**
  - [ ] Keyboard notes play (check Web Audio API support)
  - [ ] Sequencer playback works
  - [ ] Visual piano works
  - [ ] Volume control works

- [ ] **Safari-Specific Checks**
  - [ ] Backdrop blur works (Safari can be buggy)
  - [ ] Transform animations work (Safari acceleration)
  - [ ] Radix UI Portals render correctly
  - [ ] Date/time pickers work (if any)
  - [ ] File upload works (Import button)

**Safari Notes**: _______________________________________

---

## Additional Testing Notes

### Regression Testing

Check that existing features still work:

- [ ] Piano roll note creation
- [ ] Piano roll note editing (move, resize)
- [ ] Multi-track system
- [ ] Track tempo controls
- [ ] Track mute/solo
- [ ] Scale highlighting
- [ ] MIDI export
- [ ] JSON export/import
- [ ] Project persistence
- [ ] AI melody generation
- [ ] Copy/paste/duplicate notes
- [ ] Keyboard shortcuts

### Edge Cases

- [ ] **Empty States**
  - [ ] Reset modal with 0 notes
  - [ ] AIMelodyGenerator with no providers configured
  - [ ] Export with 0 notes
  - [ ] Import with empty JSON

- [ ] **Large Datasets**
  - [ ] 1000+ notes in piano roll
  - [ ] Long melody generation (30+ seconds)
  - [ ] Very long prompt (1000+ characters)

- [ ] **Rapid Interactions**
  - [ ] Quickly opening/closing modals
  - [ ] Rapid theme toggling
  - [ ] Spam clicking play/pause
  - [ ] Rapid scale changes

- [ ] **Error Recovery**
  - [ ] Network error during AI generation
  - [ ] API key test failure
  - [ ] Corrupted import file
  - [ ] Audio playback failure

### Visual Regression

Compare screenshots before/after migration:

- [ ] Top bar layout unchanged
- [ ] Piano roll layout unchanged
- [ ] Button sizes consistent
- [ ] Spacing preserved
- [ ] Colors match design
- [ ] Typography correct

---

## Testing Summary

### Critical Issues (Must Fix)

_List any blocking issues found:_

1. _________________________________
2. _________________________________
3. _________________________________

### High Priority Issues

_List important issues:_

1. _________________________________
2. _________________________________
3. _________________________________

### Medium Priority Issues

_List nice-to-fix issues:_

1. _________________________________
2. _________________________________
3. _________________________________

### Low Priority / Enhancements

_List cosmetic or enhancement ideas:_

1. _________________________________
2. _________________________________
3. _________________________________

---

## Sign-off

**Testing Completed By**: _________________
**Date**: _________________
**Phase 5 Status**: ⬜ PASSED / ⬜ FAILED / ⬜ PASSED WITH ISSUES

**Final Recommendation**:
- [ ] Migration successful - ready to merge
- [ ] Minor fixes needed - address before merge
- [ ] Major issues - further work required

**Additional Comments**:

_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## Next Steps

After completing Phase 5:

1. **Address Issues**: Fix any critical or high-priority issues found
2. **Phase 6**: Optimize bundle size and performance if needed
3. **Phase 7**: Update documentation (CLAUDE.md, README)
4. **Phase 8**: Create git commit with migration summary
5. **Phase 9**: Optional - Add automated tests (Jest, Playwright)

**Migration Complete**: Once all tests pass! 🎉
