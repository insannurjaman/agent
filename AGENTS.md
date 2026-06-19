# Quick Agent System — Codex Instructions

This project is a Figma Make exported prototype for Quick Agent System.

## Product direction
Quick Agent System is a dark, technical, agent-console style prototype. It should feel like a premium AI/developer tool: dense but clear, precise, calm, structured, and production-grade.

## Visual direction
Use an Oxide-inspired interface:
- Dark technical UI
- Crisp borders
- Minimal radius
- Mono/terminal-inspired details
- Orange (#FF3E01) accent only where useful
- Avoid colorful SaaS gradients
- Avoid generic AI dashboard visuals
- Preserve a polished enterprise/developer-tool feel

## Current stack
- Vite
- React 18
- React Router
- Tailwind v4
- shadcn/Radix components
- lucide-react icons
- Figma Make exported structure

## Design rules
- Preserve the existing route structure unless asked.
- Prefer reusable components.
- Do not delete existing screens unless asked.
- Keep desktop quality high.
- Mobile must not horizontally overflow.
- Tables should become cards on mobile.
- Inspectors should become drawers or full-screen detail views on smaller screens.
- Use existing components before creating new ones.
- Keep all copy specific to Quick Agent System, not generic placeholder text.

## Working rules
- Make small, reviewable changes.
- After each change, explain what changed and which files were edited.
- Run build checks when possible.
- Do not introduce backend dependencies.
- This is still a prototype, so static/mock data is acceptable.