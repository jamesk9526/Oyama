# ZenTODO - Oyama App Polish Roadmap

A comprehensive checklist for transforming Oyama from functional to enterprise-grade with a zen aesthetic. Focus areas: **Agents**, **Crews**, and overall app polish.

**Philosophy**: Reduce visual noise, improve whitespace, use subtle animations, enhance typography, and create a calm, professional experience.

---

## Phase 1: Critical (Agents & Crews) - Foundation Polish

### 1.1 Agent Card Component Refinement
- [x] Refactor AgentCard to remove playful elements
- [x] Implement subtle hover animations (accent line)
- [x] Better icon container with hover effects
- [x] Improve typography hierarchy with tracking-wide labels
- [x] Three-dot menu for secondary actions
- [ ] Add capability tags with monospace font for technical feel
- [ ] Test all role badge colors for zen aesthetic
- [ ] Add smooth transition for menu reveal (opacity/slide)
- [ ] Verify icon display consistency (emoji vs URL images)

### 1.2 Agent Grid Layout Improvements
- [x] Increase grid padding from 4 to 6 for breathing room
- [x] Increase gap from 4 to 6 for better spacing
- [ ] Consider max-width for grid container (maybe 1600px) on large screens
- [ ] Add subtle grid background pattern (optional, very light)
- [ ] Improve empty state design (larger icon, better copy)
- [ ] Add loading state skeleton cards instead of text

### 1.3 Crew Card Component
- [ ] Create professional CrewCard component (similar refactor to AgentCard)
- [ ] Show agent composition visually (mini badges or avatars)
- [ ] Display workflow type (sequential/parallel) with clear indicator
- [ ] Add workflow visualization (arrow chain or flow diagram)
- [ ] Better status indicators for crew runs
- [ ] Implement hover animations consistent with AgentCard

### 1.4 Crew List Layout
- [ ] Refactor from list view to grid view
- [ ] Apply same spacing/gap improvements as agents page
- [ ] Improve empty state (consistent with agents)
- [ ] Add loading skeleton cards

### 1.5 Agent/Crew Creation Modal
- [ ] Refactor modal styling for modern look
- [ ] Better form field organization
- [ ] Improve help text and tooltips
- [ ] Better button grouping (Primary action prominent)
- [ ] Add confirmation step before creation
- [ ] Consider wizard/step-based approach for complex creation

---

## Phase 2: High Priority (Core Experience)

### 2.1 Chat Interface Polish
- [ ] Improve message bubble styling
- [ ] Better visual hierarchy for sender/role badges
- [ ] Improve code block styling and syntax highlighting
- [ ] Better loading states (typing indicator animations)
- [ ] Refine markdown rendering appearance
- [ ] Better error message styling
- [ ] Improve attachment display styling

### 2.2 Chat Sidebar Enhancement
- [ ] Better conversation list styling
- [ ] Improve search/filter UI
- [ ] Better "new chat" button placement
- [ ] Loading states for conversation list
- [ ] Hover effects for better interactivity
- [ ] Better selection indication for active conversation

### 2.3 Floating Toolbar Refinement
- [x] Proximity detection working smoothly
- [x] Size reduction (50% smaller)
- [ ] Test responsiveness on all screen sizes
- [ ] Improve mobile experience (maybe dock to bottom?)
- [ ] Consider accessibility (keyboard navigation)
- [ ] Better visual feedback for selected agent/model

### 2.4 Settings Page Polish
- [x] Added memory management tab
- [x] Added backup/restore functionality
- [ ] Reorganize tabs for better flow
- [ ] Better form styling in memory management
- [ ] Improve backup/restore UI (clearer status, better buttons)
- [ ] Better visual separation of settings sections
- [ ] Add more help text/descriptions
- [ ] Consistent spacing throughout

### 2.5 Home Page Enhancement
- [x] Added setup wizard reminder
- [ ] Better setup wizard reminder (card styling)
- [ ] Improve quick action buttons
- [ ] Better statistics/overview display
- [ ] Add shortcuts for common actions
- [ ] Improve call-to-action buttons

---

## Phase 3: Medium Priority (Component Library & Details)

### 3.1 Button Component Audit
- [ ] Verify all button sizes are consistent
- [ ] Check button hover/focus states
- [ ] Improve button text clarity
- [ ] Better disabled state styling
- [ ] Ensure proper spacing in button groups

### 3.2 Input & Form Components
- [ ] Better input focus states
- [ ] Improve label styling and positioning
- [ ] Better error message styling
- [ ] Improve placeholder text colors
- [ ] Better focus ring visibility

### 3.3 Badge Component Refinement
- [ ] Verify size variants are consistent
- [ ] Better color options
- [ ] Improve text contrast in all variants
- [ ] Better visual hierarchy between badge types

### 3.4 Modal Component Enhancement
- [ ] Better modal header/footer styling
- [ ] Improve close button visibility
- [ ] Better backdrop effect
- [ ] Smooth animations for modal open/close
- [ ] Better responsive behavior on mobile

### 3.5 Card Component Polish
- [ ] Verify border colors across themes
- [ ] Better hover effects
- [ ] Improve spacing consistency
- [ ] Better shadow effects for depth

### 3.6 Select Component Improvement
- [ ] Better dropdown styling
- [ ] Improve option highlighting
- [ ] Better keyboard navigation
- [ ] Smooth animations for dropdown

---

## Phase 4: Low Priority (Polish & Accessibility)

### 4.1 Accessibility Audit
- [ ] Verify ARIA labels on all interactive elements
- [ ] Check keyboard navigation throughout app
- [ ] Verify color contrast ratios (WCAG AA minimum)
- [ ] Test with screen readers
- [ ] Better focus indicators
- [ ] Proper heading hierarchy

### 4.2 Performance Optimization
- [ ] Optimize component re-renders
- [ ] Lazy load grid images where possible
- [ ] Optimize CSS animations for performance
- [ ] Consider image optimization
- [ ] Verify no memory leaks in components

### 4.3 Animation & Micro-interactions
- [ ] Add subtle hover animations to all interactive elements
- [ ] Better loading states throughout app
- [ ] Smooth transitions between pages
- [ ] Refine existing animations (zen-float-approach, zen-glow, etc.)
- [ ] Add subtle transitions to color changes

### 4.4 Theming & Colors
- [ ] Verify color palette consistency
- [ ] Check dark mode appearance throughout
- [ ] Better color names and organization
- [ ] Improve opacity levels for better hierarchy
- [ ] Consider adding new color variants for zen aesthetic

### 4.5 Typography
- [ ] Audit all font sizes for consistency
- [ ] Improve font weight hierarchy
- [ ] Better line spacing (line-height) throughout
- [ ] Consider font for better zen feel
- [ ] Verify code font consistency (font-mono)

### 4.6 Documentation
- [ ] Add JSDoc comments to main components
- [ ] Document design system decisions
- [ ] Create component usage guide
- [ ] Document color and spacing tokens
- [ ] Add accessibility guidelines

---

## Implementation Strategy

### Phase Breakdown
1. **Phase 1** (Week 1): Agents & Crews - The visual foundation
2. **Phase 2** (Week 2): Chat & Core Features - Daily driver experience
3. **Phase 3** (Week 3): Component Library - Consistency throughout
4. **Phase 4** (Week 4+): Polish & Accessibility - Production readiness

### Per-Task Checklist Format
Each task should follow this pattern:
1. **Analyze** current state
2. **Design** improvements with zen principles
3. **Implement** changes
4. **Test** across devices/browsers
5. **Verify** accessibility
6. **Document** changes if needed

### Zen Design Principles
- ✨ **Simplicity**: Remove unnecessary elements
- 🎯 **Focus**: Draw attention to important content
- 🌬️ **Breathing**: Use whitespace generously
- 🎨 **Harmony**: Consistent colors, spacing, typography
- ⚡ **Subtlety**: Animate smoothly, don't distract
- 🔤 **Typography**: Clear hierarchy, readable text
- 🎭 **Contrast**: Enough visual distinction without noise

---

## Current Status

### Completed in Session
- ✅ AgentCard component professional refactor (removed childish elements)
- ✅ Increased agent grid spacing (padding 4→6, gap 4→6)
- ✅ Added subtle accent line on hover
- ✅ Better icon container with hover effects
- ✅ Improved typography with tracking-wide labels
- ✅ Menu button interaction (three-dot menu with actions)
- ✅ Created comprehensive ZenTODO.md roadmap

### Pending
- ⏳ Crew card refactor
- ⏳ Crew grid layout improvement
- ⏳ Chat interface refinement
- ⏳ Settings page final polish

---

## Notes & Considerations

### Agent Cards
- Current colors are subtle (8-20% opacity) - good foundation
- Font weights and sizes create good hierarchy
- Action menu hides until hover - keeps UI clean
- Icon containers have good visual weight
- Professional aesthetic achieved through:
  - Reduced color saturation
  - Clear visual hierarchy
  - Ample whitespace
  - Subtle animations
  - Practical information focus

### Crew Cards
- Will need similar professional treatment
- Should visually show agent composition
- Workflow type must be immediately clear
- Status indicators for recent runs

### General App Polish
- Focus on subtle animations over flashy effects
- Use consistent spacing (multiples of 4: 4, 8, 12, 16, 24, 32)
- Ensure good contrast without harsh colors
- Make interactive elements obvious but not intrusive
- Keep loading states visible but unobtrusive

---

## Success Criteria

The app will feel "zen" and professional when:
- ✅ No visual clutter or unnecessary elements
- ✅ Ample whitespace between components
- ✅ Consistent typography throughout
- ✅ Smooth, purposeful animations
- ✅ All interactive elements clearly discoverable
- ✅ Colors support hierarchy without being harsh
- ✅ Mobile and desktop experiences equally refined
- ✅ Users feel calm and focused while using the app
