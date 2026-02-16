# QA Checklist - Reading Plan & Biblical Chronology

## Reading Plan Feature

### Core Functionality
- [ ] Plan selection screen shows both Canonical and Chronological plans
- [ ] Plan locks immediately after selection (cannot change)
- [ ] Day list displays correctly (365 days)
- [ ] Current day is highlighted
- [ ] Completed days show checkmark and strikethrough
- [ ] Progress percentage calculates correctly
- [ ] Streak tracking works (current and longest)

### Reading Verification System ✅ NEW
- [ ] "Begin Reading" button navigates to Verses screen with correct params
- [ ] VersesScreen receives: fromReadingPlan, planDay, totalChapters
- [ ] Each chapter viewed is tracked automatically
- [ ] Progress indicator shows "X/Y capítulos" in real-time
- [ ] Progress bar fills as chapters are read
- [ ] "Mark as Completed" button disabled until all chapters read
- [ ] Alert shows if user tries to complete without reading all chapters
- [ ] Success message appears when day is marked complete
- [ ] Completed day persists after app restart

### Navigation
- [ ] Back arrow works on all screens
- [ ] Bottom tabs visible on all screens (no hiding)
- [ ] Navigation from plan list to day detail works
- [ ] Navigation from day detail to Bible works
- [ ] Return from Bible to day detail preserves state

### Notifications
- [ ] Reminder toggle works
- [ ] Time picker shows native UI (iOS wheel, Android dialog)
- [ ] Daily notifications scheduled correctly
- [ ] Notifications can be disabled

### Data Persistence
- [ ] Selected plan persists across app restarts
- [ ] Completed days persist
- [ ] Reading progress per day persists
- [ ] Reminder settings persist
- [ ] Plan lock status persists

---

## Biblical Chronology Feature

### Core Functionality
- [ ] Timeline shows all 223 events
- [ ] Events grouped by 18 eras
- [ ] Eras display in chronological order (4004 BC to 100 AD)
- [ ] Event count badge shows correct number per era
- [ ] Expand/collapse eras works smoothly

### Event Cards ✅ NEW STYLING
- [ ] Holographic border effect visible (cyan #00F3FF)
- [ ] Cards have subtle glow/shadow
- [ ] Semi-transparent background
- [ ] Rounded corners (12px)
- [ ] Proper spacing between cards

### Search & Filter
- [ ] Search bar filters events by name, description, persons
- [ ] Testament filter (All, OT, NT) works correctly
- [ ] Search clears with X button
- [ ] Empty state shows when no results

### Event Details
- [ ] Clicking event navigates to detail screen
- [ ] Event detail shows all information:
  - [ ] Date display
  - [ ] Event title
  - [ ] Description
  - [ ] Key persons (chips)
  - [ ] Location
  - [ ] Certainty level (badge with color)
  - [ ] Significance
  - [ ] Related verses (clickable)
  - [ ] Related events (clickable)
- [ ] Share button works
- [ ] Back button returns to timeline

### Bible References
- [ ] Clicking verse reference navigates to Bible
- [ ] Reference parsing works (e.g., "Génesis 1:1", "Éxodo 12:1-14")
- [ ] Navigation includes book, chapter, verse

### Navigation
- [ ] Back arrow works on all screens
- [ ] Bottom tabs visible (no hiding) ✅ FIXED
- [ ] Timeline accessible from hamburger menu
- [ ] Event detail accessible from timeline
- [ ] Related events navigation works (push, not replace)

### Visual Design
- [ ] Dark theme consistent (#0A1628, #1A2638)
- [ ] Cyan accent color (#00F3FF) used correctly
- [ ] Category dots show correct colors
- [ ] Date circles styled correctly
- [ ] Typography readable and consistent

### Data Integrity
- [ ] All 223 events load correctly
- [ ] No missing data (dates, persons, references)
- [ ] Event IDs unique and valid
- [ ] Era grouping correct

---

## Cross-Feature Testing

### Performance
- [ ] App loads quickly (<3 seconds)
- [ ] Scrolling smooth on both features
- [ ] No memory leaks
- [ ] Offline functionality works (all data local)

### Accessibility
- [ ] Text readable at all sizes
- [ ] Touch targets large enough (44x44 minimum)
- [ ] Color contrast meets standards

### Error Handling
- [ ] Graceful handling of missing data
- [ ] Error messages user-friendly
- [ ] No app crashes

---

## Platform-Specific

### iOS
- [ ] Native time picker (wheel)
- [ ] Notifications work
- [ ] Back gestures work

### Android
- [ ] Native time picker (dialog)
- [ ] Notifications work
- [ ] Back button works

### Web
- [ ] All features functional
- [ ] Responsive design
- [ ] Mouse/keyboard navigation
