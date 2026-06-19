// Quick Agent System — Figma Handoff Builder Plugin
// Builds the complete component library, variables, and route frames

// ============================================================
// SECTION 1: COLOR TOKENS & VARIABLES
// ============================================================

const PRIMITIVES = {
  // Oxide Neutrals
  "oxide-50": { r: 0.949, g: 0.961, b: 0.953 },
  "oxide-100": { r: 0.820, g: 0.851, b: 0.835 },
  "oxide-200": { r: 0.663, g: 0.698, b: 0.682 },
  "oxide-300": { r: 0.435, g: 0.478, b: 0.463 },
  "oxide-400": { r: 0.306, g: 0.345, b: 0.329 },
  "oxide-500": { r: 0.216, g: 0.251, b: 0.235 },
  "oxide-600": { r: 0.145, g: 0.180, b: 0.165 },
  "oxide-700": { r: 0.098, g: 0.122, b: 0.110 },
  "oxide-800": { r: 0.071, g: 0.086, b: 0.078 },
  "oxide-900": { r: 0.051, g: 0.063, b: 0.055 },
  "oxide-950": { r: 0.031, g: 0.039, b: 0.035 },
  "oxide-1000": { r: 0.020, g: 0.027, b: 0.024 },

  // Orange Brand Scale
  "orange-50": { r: 1.0, g: 0.965, b: 0.937 },
  "orange-100": { r: 1.0, g: 0.898, b: 0.827 },
  "orange-200": { r: 1.0, g: 0.792, b: 0.651 },
  "orange-300": { r: 1.0, g: 0.682, b: 0.475 },
  "orange-400": { r: 1.0, g: 0.573, b: 0.298 },
  "orange-500": { r: 1.0, g: 0.243, b: 0.004 },
  "orange-600": { r: 0.902, g: 0.216, b: 0.0 },
  "orange-700": { r: 0.690, g: 0.161, b: 0.0 },
  "orange-800": { r: 0.478, g: 0.110, b: 0.0 },
  "orange-900": { r: 0.267, g: 0.059, b: 0.0 },

  // Success (Green)
  "green-50": { r: 0.878, g: 0.969, b: 0.929 },
  "green-100": { r: 0.694, g: 0.918, b: 0.816 },
  "green-200": { r: 0.510, g: 0.867, b: 0.702 },
  "green-300": { r: 0.325, g: 0.816, b: 0.588 },
  "green-400": { r: 0.224, g: 0.765, b: 0.541 },
  "green-500": { r: 0.145, g: 0.722, b: 0.533 },

  // Warning (Amber)
  "amber-50": { r: 0.996, g: 0.961, b: 0.820 },
  "amber-100": { r: 0.992, g: 0.922, b: 0.651 },
  "amber-200": { r: 0.988, g: 0.882, b: 0.482 },
  "amber-300": { r: 0.953, g: 0.788, b: 0.412 },
  "amber-400": { r: 0.933, g: 0.722, b: 0.365 },

  // Error (Red)
  "red-50": { r: 1.0, g: 0.910, b: 0.910 },
  "red-100": { r: 1.0, g: 0.780, b: 0.780 },
  "red-200": { r: 1.0, g: 0.651, b: 0.651 },
  "red-300": { r: 1.0, g: 0.420, b: 0.420 },
  "red-400": { r: 1.0, g: 0.294, b: 0.294 },
  "red-500": { r: 1.0, g: 0.420, b: 0.420 },

  // Information (Blue)
  "blue-50": { r: 0.910, g: 0.949, b: 1.0 },
  "blue-100": { r: 0.780, g: 0.878, b: 1.0 },
  "blue-200": { r: 0.651, g: 0.812, b: 1.0 },
  "blue-300": { r: 0.420, g: 0.651, b: 1.0 },
  "blue-400": { r: 0.420, g: 0.651, b: 1.0 },

  // Lineage (Purple)
  "purple-50": { r: 0.949, g: 0.929, b: 1.0 },
  "purple-100": { r: 0.878, g: 0.847, b: 1.0 },
  "purple-200": { r: 0.780, g: 0.745, b: 0.965 },
  "purple-300": { r: 0.651, g: 0.600, b: 0.933 },
  "purple-400": { r: 0.545, g: 0.486, b: 0.902 },
  "purple-500": { r: 0.478, g: 0.420, b: 0.867 },

  // Chart colors
  "chart-1": { r: 1.0, g: 0.243, b: 0.004 },    // orange
  "chart-2": { r: 0.180, g: 0.831, b: 0.749 },    // teal
  "chart-3": { r: 0.953, g: 0.788, b: 0.412 },    // amber
  "chart-4": { r: 0.545, g: 0.486, b: 0.902 },    // purple
  "chart-5": { r: 1.0, g: 0.420, b: 0.420 },      // red
};

const SEMANTIC_DARK = {
  "background": { r: 0.031, g: 0.039, b: 0.043 },
  "foreground": { r: 0.949, g: 0.961, b: 0.953 },
  "card": { r: 0.051, g: 0.063, b: 0.071 },
  "card-foreground": { r: 0.949, g: 0.961, b: 0.953 },
  "popover": { r: 0.071, g: 0.086, b: 0.098 },
  "popover-foreground": { r: 0.949, g: 0.961, b: 0.953 },
  "primary": { r: 1.0, g: 0.243, b: 0.004 },
  "primary-foreground": { r: 0.031, g: 0.039, b: 0.043 },
  "secondary": { r: 0.071, g: 0.086, b: 0.098 },
  "secondary-foreground": { r: 0.949, g: 0.961, b: 0.953 },
  "muted": { r: 0.071, g: 0.086, b: 0.098 },
  "muted-foreground": { r: 0.435, g: 0.478, b: 0.463 },
  "accent": { r: 0.102, g: 0.055, b: 0.039 },
  "accent-foreground": { r: 0.949, g: 0.961, b: 0.953 },
  "destructive": { r: 1.0, g: 0.420, b: 0.420 },
  "border": { r: 0.145, g: 0.169, b: 0.188 },
  "input": { r: 0.145, g: 0.169, b: 0.188 },
  "ring": { r: 1.0, g: 0.243, b: 0.004 },
  "sidebar": { r: 0.051, g: 0.063, b: 0.071 },
};

const SEMANTIC_LIGHT = {
  "background": { r: 1.0, g: 1.0, b: 1.0 },
  "foreground": { r: 0.102, g: 0.114, b: 0.118 },
  "card": { r: 0.973, g: 0.976, b: 0.980 },
  "card-foreground": { r: 0.102, g: 0.114, b: 0.118 },
  "popover": { r: 1.0, g: 1.0, b: 1.0 },
  "popover-foreground": { r: 0.102, g: 0.114, b: 0.118 },
  "primary": { r: 0.831, g: 0.212, b: 0.0 },
  "primary-foreground": { r: 1.0, g: 1.0, b: 1.0 },
  "secondary": { r: 0.945, g: 0.953, b: 0.961 },
  "secondary-foreground": { r: 0.102, g: 0.114, b: 0.118 },
  "muted": { r: 0.945, g: 0.953, b: 0.961 },
  "muted-foreground": { r: 0.541, g: 0.584, b: 0.565 },
  "accent": { r: 0.996, g: 0.949, b: 0.933 },
  "accent-foreground": { r: 0.102, g: 0.114, b: 0.118 },
  "destructive": { r: 0.863, g: 0.149, b: 0.149 },
  "border": { r: 0.878, g: 0.890, b: 0.882 },
  "input": { r: 0.878, g: 0.890, b: 0.882 },
  "ring": { r: 0.831, g: 0.212, b: 0.0 },
  "sidebar": { r: 0.973, g: 0.976, b: 0.980 },
};

const SPACING = {
  "0": 0,
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
  "14": 56,
  "16": 64,
  "20": 80,
  "24": 96,
};

const RADIUS = {
  "none": 0,
  "sm": 2,
  "md": 4,
  "lg": 6,
  "xl": 8,
  "full": 9999,
};

const SIZING = {
  "icon-sm": 16,
  "icon-md": 18,
  "icon-lg": 20,
  "icon-xl": 22,
  "control-h": 36,
  "control-h-lg": 40,
  "input-h": 36,
  "nav-rail-collapsed": 56,
  "nav-rail-expanded": 240,
  "bottom-nav-h": 56,
  "inspector-w": 380,
  "inspector-w-lg": 400,
  "touch-target": 44,
  "topbar-h": 52,
};

const TYPOGRAPHY = {
  "family-sans": "Inter",
  "family-mono": "JetBrains Mono",
  "weight-regular": 400,
  "weight-medium": 500,
  "weight-semibold": 600,
  "size-2xs": 10,
  "size-xs": 12,
  "size-sm": 13,
  "size-base": 14,
  "size-md": 15,
  "size-lg": 16,
  "size-xl": 18,
  "size-2xl": 21,
  "lh-tight": 1.3,
  "lh-normal": 1.5,
  "lh-relaxed": 1.625,
};

const OPACITY = {
  "disabled": 0.4,
  "muted": 0.6,
  "overlay": 0.5,
  "decorative": 0.15,
};

// ============================================================
// SECTION 2: COMPONENT DEFINITIONS
// ============================================================

function createVariableCollections(figma) {
  const collections = {};

  // Primitives
  collections.primitives = figma.variables.createVariableCollection("Primitives");
  const defaultMode = collections.primitives.modes[0].modeId;

  Object.entries(PRIMITIVES).forEach(([name, color]) => {
    const v = figma.variables.createVariable(`Primitives/${name}`, collections.primitives, "COLOR");
    v.setValueForMode(defaultMode, { r: color.r, g: color.g, b: color.b, a: 1 });
  });

  // Spacing
  collections.spacing = figma.variables.createVariableCollection("Spacing");
  const spacingMode = collections.spacing.modes[0].modeId;
  Object.entries(SPACING).forEach(([name, value]) => {
    const v = figma.variables.createVariable(`Spacing/${name}`, collections.spacing, "FLOAT");
    v.setValueForMode(spacingMode, value);
  });

  // Radius
  collections.radius = figma.variables.createVariableCollection("Radius");
  const radiusMode = collections.radius.modes[0].modeId;
  Object.entries(RADIUS).forEach(([name, value]) => {
    const v = figma.variables.createVariable(`Radius/${name}`, collections.radius, "FLOAT");
    v.setValueForMode(radiusMode, value);
  });

  // Sizing
  collections.sizing = figma.variables.createVariableCollection("Sizing");
  const sizingMode = collections.sizing.modes[0].modeId;
  Object.entries(SIZING).forEach(([name, value]) => {
    const v = figma.variables.createVariable(`Sizing/${name}`, collections.sizing, "FLOAT");
    v.setValueForMode(sizingMode, value);
  });

  // Typography
  collections.typography = figma.variables.createVariableCollection("Typography");
  const typoMode = collections.typography.modes[0].modeId;
  Object.entries(TYPOGRAPHY).forEach(([name, value]) => {
    const type = typeof value === "string" ? "STRING" : "FLOAT";
    const v = figma.variables.createVariable(`Typography/${name}`, collections.typography, type);
    v.setValueForMode(typoMode, value);
  });

  // Opacity
  collections.opacity = figma.variables.createVariableCollection("Opacity");
  const opacityMode = collections.opacity.modes[0].modeId;
  Object.entries(OPACITY).forEach(([name, value]) => {
    const v = figma.variables.createVariable(`Opacity/${name}`, collections.opacity, "FLOAT");
    v.setValueForMode(opacityMode, value);
  });

  // Color (semantic) - with Light and Dark modes
  collections.color = figma.variables.createVariableCollection("Color");
  const lightModeId = collections.color.modes[0].modeId;
  collections.color.renameMode(lightModeId, "Light");
  const darkModeId = collections.color.addMode("Dark");

  Object.entries(SEMANTIC_LIGHT).forEach(([name, color]) => {
    const v = figma.variables.createVariable(`Color/${name}`, collections.color, "COLOR");
    v.setValueForMode(lightModeId, { r: color.r, g: color.g, b: color.b, a: 1 });
    const darkColor = SEMANTIC_DARK[name];
    if (darkColor) {
      v.setValueForMode(darkModeId, { r: darkColor.r, g: darkColor.g, b: darkColor.b, a: 1 });
    }
  });

  return collections;
}

// ============================================================
// SECTION 3: COMPONENT BUILDERS
// ============================================================

function buildButtonComponent(figma) {
  const variants = [];

  // Button variants
  const sizes = ["sm", "md", "lg"];
  const tones = ["primary", "secondary", "ghost", "destructive"];
  const states = ["default", "hover", "active", "disabled", "loading"];

  const frame = figma.createComponentSet();
  frame.name = "Button";
  frame.description = "Primary action button. Use primary for CTAs, ghost for secondary actions, destructive for removals.";

  // Create simplified variants for the 30-combo limit
  for (const tone of tones) {
    for (const size of sizes) {
      const component = figma.createComponent();
      component.name = `Tone=${tone}, Size=${size}`;
      component.resize(120, size === "sm" ? 32 : size === "md" ? 36 : 40);
      component.layoutMode = "HORIZONTAL";
      component.primaryAxisAlignItems = "CENTER";
      component.counterAxisAlignItems = "CENTER";
      component.paddingLeft = 16;
      component.paddingRight = 16;
      component.itemSpacing = 8;

      // Background
      const fills = [];
      if (tone === "primary") {
        fills.push({ type: "SOLID", color: { r: 1, g: 0.243, b: 0.004 } });
      } else if (tone === "secondary") {
        fills.push({ type: "SOLID", color: { r: 0.071, g: 0.086, b: 0.098 } });
      } else if (tone === "destructive") {
        fills.push({ type: "SOLID", color: { r: 1, g: 0.420, b: 0.420 } });
      }
      component.fills = fills;

      // Border
      component.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
      component.strokeWeight = 1;
      component.cornerRadius = 4;

      // Text
      const text = figma.createText();
      text.characters = "Button";
      text.fontSize = size === "sm" ? 12 : size === "md" ? 13 : 14;
      text.fontName = { family: "Inter", style: "Medium" };
      text.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.953 } }];
      text.textAlignHorizontal = "CENTER";
      text.textAlignVertical = "CENTER";
      component.appendChild(text);

      component.layoutSizingHorizontal = "HUG";
      component.layoutSizingVertical = "HUG";

      variants.push(component);
      frame.appendChild(component);
    }
  }

  frame.layoutMode = "VERTICAL";
  frame.itemSpacing = 8;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;

  return frame;
}

function buildStatusBadgeComponent(figma) {
  const frame = figma.createComponentSet();
  frame.name = "StatusBadge";
  frame.description = "Universal status indicator with 14 semantic tones. Use for finding confidence, question status, and system health.";

  const tones = [
    { name: "success", color: { r: 0.145, g: 0.722, b: 0.533 }, bg: { r: 0.078, g: 0.196, b: 0.145 } },
    { name: "warning", color: { r: 0.953, g: 0.788, b: 0.412 }, bg: { r: 0.196, g: 0.165, b: 0.078 } },
    { name: "error", color: { r: 1, g: 0.420, b: 0.420 }, bg: { r: 0.196, g: 0.078, b: 0.078 } },
    { name: "info", color: { r: 0.420, g: 0.651, b: 1 }, bg: { r: 0.078, g: 0.122, b: 0.196 } },
    { name: "brand", color: { r: 1, g: 0.243, b: 0.004 }, bg: { r: 0.102, g: 0.055, b: 0.039 } },
    { name: "lineage", color: { r: 0.545, g: 0.486, b: 0.902 }, bg: { r: 0.122, g: 0.110, b: 0.196 } },
    { name: "neutral", color: { r: 0.663, g: 0.698, b: 0.682 }, bg: { r: 0.122, g: 0.133, b: 0.125 } },
  ];

  for (const tone of tones) {
    const component = figma.createComponent();
    component.name = `Tone=${tone.name}`;
    component.resize(80, 24);
    component.layoutMode = "HORIZONTAL";
    component.primaryAxisAlignItems = "CENTER";
    component.counterAxisAlignItems = "CENTER";
    component.paddingLeft = 8;
    component.paddingRight = 8;
    component.itemSpacing = 4;
    component.fills = [{ type: "SOLID", color: tone.bg }];
    component.strokes = [{ type: "SOLID", color: tone.color }];
    component.strokeWeight = 1;
    component.cornerRadius = 4;

    // Status dot
    const dot = figma.createEllipse();
    dot.resize(6, 6);
    dot.fills = [{ type: "SOLID", color: tone.color }];
    component.appendChild(dot);

    // Label
    const text = figma.createText();
    text.characters = tone.name;
    text.fontSize = 11;
    text.fontName = { family: "JetBrains Mono", style: "Medium" };
    text.fills = [{ type: "SOLID", color: tone.color }];
    text.textAlignHorizontal = "LEFT";
    text.textAlignVertical = "CENTER";
    text.layoutSizingHorizontal = "HUG";
    component.appendChild(text);

    component.layoutSizingHorizontal = "HUG";
    component.layoutSizingVertical = "HUG";
    frame.appendChild(component);
  }

  frame.layoutMode = "HORIZONTAL";
  frame.itemSpacing = 8;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;

  return frame;
}

function buildInputComponent(figma) {
  const frame = figma.createComponentSet();
  frame.name = "Input";
  frame.description = "Text input field. Variants for default, focused, error, and disabled states.";

  const states = [
    { name: "default", border: { r: 0.145, g: 0.169, b: 0.188 }, bg: { r: 0.071, g: 0.086, b: 0.098 } },
    { name: "focused", border: { r: 1, g: 0.243, b: 0.004 }, bg: { r: 0.071, g: 0.086, b: 0.098 } },
    { name: "error", border: { r: 1, g: 0.420, b: 0.420 }, bg: { r: 0.071, g: 0.086, b: 0.098 } },
    { name: "disabled", border: { r: 0.145, g: 0.169, b: 0.188 }, bg: { r: 0.051, g: 0.063, b: 0.071 } },
  ];

  for (const state of states) {
    const component = figma.createComponent();
    component.name = `State=${state.name}`;
    component.resize(240, 36);
    component.layoutMode = "HORIZONTAL";
    component.primaryAxisAlignItems = "MIN";
    component.counterAxisAlignItems = "CENTER";
    component.paddingLeft = 12;
    component.paddingRight = 12;
    component.fills = [{ type: "SOLID", color: state.bg }];
    component.strokes = [{ type: "SOLID", color: state.border }];
    component.strokeWeight = 1;
    component.cornerRadius = 4;

    const placeholder = figma.createText();
    placeholder.characters = "Enter value...";
    placeholder.fontSize = 13;
    placeholder.fontName = { family: "Inter", style: "Regular" };
    placeholder.fills = [{ type: "SOLID", color: { r: 0.435, g: 0.478, b: 0.463 } }];
    placeholder.textAlignVertical = "CENTER";
    placeholder.layoutSizingHorizontal = "FILL";
    component.appendChild(placeholder);

    component.layoutSizingHorizontal = "FILL";
    component.layoutSizingVertical = "HUG";
    frame.appendChild(component);
  }

  frame.layoutMode = "VERTICAL";
  frame.itemSpacing = 8;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;

  return frame;
}

function buildInspectorFrameComponent(figma) {
  const component = figma.createComponent();
  component.name = "InspectorFrame";
  component.description = "Right-side detail inspector panel. 380px on lg+, full-width overlay on mobile.";
  component.resize(380, 600);
  component.layoutMode = "VERTICAL";
  component.primaryAxisAlignItems = "MIN";
  component.counterAxisAlignItems = "STRETCH";
  component.fills = [{ type: "SOLID", color: { r: 0.051, g: 0.063, b: 0.071 } }];
  component.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  component.strokeWeight = 1;
  component.strokeAlign = "INSIDE";

  // Header
  const header = figma.createFrame();
  header.name = "Inspector Header";
  header.resize(380, 48);
  header.layoutMode = "HORIZONTAL";
  header.primaryAxisAlignItems = "SPACE_BETWEEN";
  header.counterAxisAlignItems = "CENTER";
  header.paddingLeft = 16;
  header.paddingRight = 16;
  header.fills = [{ type: "SOLID", color: { r: 0.071, g: 0.086, b: 0.098 } }];
  header.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  header.strokeWeight = 1;
  header.strokeAlign = "INSIDE";

  const title = figma.createText();
  title.characters = "Inspector";
  title.fontSize = 15;
  title.fontName = { family: "Inter", style: "Medium" };
  title.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.953 } }];
  title.textAlignVertical = "CENTER";
  header.appendChild(title);

  const closeBtn = figma.createText();
  closeBtn.characters = "×";
  closeBtn.fontSize = 18;
  closeBtn.fontName = { family: "Inter", style: "Regular" };
  closeBtn.fills = [{ type: "SOLID", color: { r: 0.435, g: 0.478, b: 0.463 } }];
  closeBtn.textAlignVertical = "CENTER";
  header.appendChild(closeBtn);

  header.layoutSizingHorizontal = "FILL";
  component.appendChild(header);

  // Content area
  const content = figma.createFrame();
  content.name = "Content";
  content.resize(380, 552);
  content.layoutMode = "VERTICAL";
  content.paddingLeft = 16;
  content.paddingRight = 16;
  content.paddingTop = 16;
  content.paddingBottom = 16;
  content.itemSpacing = 16;
  content.fills = [];
  content.layoutSizingHorizontal = "FILL";
  content.layoutSizingVertical = "FILL";
  component.appendChild(content);

  return component;
}

function buildTopBarComponent(figma) {
  const component = figma.createComponent();
  component.name = "TopBar";
  component.description = "Global header bar with logo, search, and status indicator.";
  component.resize(1440, 52);
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisAlignItems = "SPACE_BETWEEN";
  component.counterAxisAlignItems = "CENTER";
  component.paddingLeft = 16;
  component.paddingRight = 16;
  component.fills = [{ type: "SOLID", color: { r: 0.051, g: 0.063, b: 0.071 } }];
  component.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  component.strokeWeight = 1;
  component.strokeAlign = "INSIDE";

  // Logo
  const logo = figma.createText();
  logo.characters = "QAS";
  logo.fontSize = 14;
  logo.fontName = { family: "JetBrains Mono", style: "Bold" };
  logo.fills = [{ type: "SOLID", color: { r: 1, g: 0.243, b: 0.004 } }];
  logo.textAlignVertical = "CENTER";
  component.appendChild(logo);

  // Search bar
  const search = figma.createFrame();
  search.name = "Search Bar";
  search.resize(320, 32);
  search.layoutMode = "HORIZONTAL";
  search.primaryAxisAlignItems = "MIN";
  search.counterAxisAlignItems = "CENTER";
  search.paddingLeft = 12;
  search.paddingRight = 12;
  search.itemSpacing = 8;
  search.fills = [{ type: "SOLID", color: { r: 0.071, g: 0.086, b: 0.098 } }];
  search.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  search.strokeWeight = 1;
  search.cornerRadius = 4;

  const searchText = figma.createText();
  searchText.characters = "⌘K Search knowledge...";
  searchText.fontSize = 13;
  searchText.fontName = { family: "Inter", style: "Regular" };
  searchText.fills = [{ type: "SOLID", color: { r: 0.435, g: 0.478, b: 0.463 } }];
  searchText.textAlignVertical = "CENTER";
  search.appendChild(searchText);
  component.appendChild(search);

  // Status pill
  const statusPill = figma.createFrame();
  statusPill.name = "Status Pill";
  statusPill.resize(120, 24);
  statusPill.layoutMode = "HORIZONTAL";
  statusPill.primaryAxisAlignItems = "CENTER";
  statusPill.counterAxisAlignItems = "CENTER";
  statusPill.paddingLeft = 8;
  statusPill.paddingRight = 8;
  statusPill.itemSpacing = 6;
  statusPill.fills = [{ type: "SOLID", color: { r: 0.078, g: 0.196, b: 0.145 } }];
  statusPill.cornerRadius = 12;

  const dot = figma.createEllipse();
  dot.resize(6, 6);
  dot.fills = [{ type: "SOLID", color: { r: 0.145, g: 0.722, b: 0.533 } }];
  statusPill.appendChild(dot);

  const statusText = figma.createText();
  statusText.characters = "Backend connected";
  statusText.fontSize = 11;
  statusText.fontName = { family: "JetBrains Mono", style: "Regular" };
  statusText.fills = [{ type: "SOLID", color: { r: 0.145, g: 0.722, b: 0.533 } }];
  statusText.textAlignVertical = "CENTER";
  statusPill.appendChild(statusText);
  component.appendChild(statusPill);

  component.layoutSizingHorizontal = "FILL";
  component.layoutSizingVertical = "FIXED";

  return component;
}

function buildNavRailComponent(figma) {
  const component = figma.createComponent();
  component.name = "NavRail";
  component.description = "Collapsible left icon rail. 240px expanded, 56px collapsed. Uses localStorage for persistence.";
  component.resize(56, 848);
  component.layoutMode = "VERTICAL";
  component.primaryAxisAlignItems = "MIN";
  component.counterAxisAlignItems = "CENTER";
  component.paddingTop = 8;
  component.itemSpacing = 4;
  component.fills = [{ type: "SOLID", color: { r: 0.051, g: 0.063, b: 0.071 } }];
  component.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  component.strokeWeight = 1;
  component.strokeAlign = "INSIDE";

  // Nav items
  const navItems = [
    { icon: "overview", label: "Overview", active: false },
    { icon: "findings", label: "Findings", active: true },
    { icon: "experiments", label: "Experiments", active: false },
    { icon: "search", label: "Search", active: false },
    { icon: "graph", label: "Graph", active: false },
    { icon: "lineage", label: "Lineage", active: false },
    { icon: "chat", label: "Chat", active: false },
    { icon: "status", label: "Status", active: false },
  ];

  for (const item of navItems) {
    const navItem = figma.createFrame();
    navItem.name = item.label;
    navItem.resize(40, 40);
    navItem.layoutMode = "VERTICAL";
    navItem.primaryAxisAlignItems = "CENTER";
    navItem.counterAxisAlignItems = "CENTER";
    navItem.paddingTop = 8;
    navItem.paddingBottom = 8;
    navItem.itemSpacing = 2;
    navItem.cornerRadius = 4;

    if (item.active) {
      navItem.fills = [{ type: "SOLID", color: { r: 1, g: 0.243, b: 0.004, a: 0.1 } }];
    }

    // Icon placeholder
    const icon = figma.createRectangle();
    icon.resize(20, 20);
    icon.cornerRadius = 4;
    icon.fills = [{ type: "SOLID", color: item.active ? { r: 1, g: 0.243, b: 0.004 } : { r: 0.435, g: 0.478, b: 0.463 } }];
    navItem.appendChild(icon);

    // Label
    const label = figma.createText();
    label.characters = item.label;
    label.fontSize = 9;
    label.fontName = { family: "JetBrains Mono", style: "Regular" };
    label.fills = [{ type: "SOLID", color: item.active ? { r: 1, g: 0.243, b: 0.004 } : { r: 0.435, g: 0.478, b: 0.463 } }];
    label.textAlignHorizontal = "CENTER";
    navItem.appendChild(label);

    navItem.layoutSizingHorizontal = "HUG";
    navItem.layoutSizingVertical = "HUG";
    component.appendChild(navItem);
  }

  component.layoutSizingHorizontal = "FIXED";
  component.layoutSizingVertical = "FILL";

  return component;
}

function buildBottomNavComponent(figma) {
  const component = figma.createComponent();
  component.name = "BottomNav";
  component.description = "Mobile bottom navigation. 5 primary routes plus More menu.";
  component.resize(390, 56);
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisAlignItems = "SPACE_BETWEEN";
  component.counterAxisAlignItems = "CENTER";
  component.paddingLeft = 8;
  component.paddingRight = 8;
  component.fills = [{ type: "SOLID", color: { r: 0.051, g: 0.063, b: 0.071 } }];
  component.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  component.strokeWeight = 1;
  component.strokeAlign = "INSIDE";

  const navItems = [
    { label: "Findings", active: true },
    { label: "Experiments", active: false },
    { label: "Graph", active: false },
    { label: "Chat", active: false },
    { label: "More", active: false },
  ];

  for (const item of navItems) {
    const navItem = figma.createFrame();
    navItem.name = item.label;
    navItem.resize(64, 44);
    navItem.layoutMode = "VERTICAL";
    navItem.primaryAxisAlignItems = "CENTER";
    navItem.counterAxisAlignItems = "CENTER";
    navItem.paddingTop = 4;
    navItem.paddingBottom = 4;
    navItem.itemSpacing = 2;

    if (item.active) {
      navItem.fills = [{ type: "SOLID", color: { r: 1, g: 0.243, b: 0.004, a: 0.1 } }];
      navItem.cornerRadius = 4;
    }

    const icon = figma.createRectangle();
    icon.resize(20, 20);
    icon.cornerRadius = 4;
    icon.fills = [{ type: "SOLID", color: item.active ? { r: 1, g: 0.243, b: 0.004 } : { r: 0.435, g: 0.478, b: 0.463 } }];
    navItem.appendChild(icon);

    const label = figma.createText();
    label.characters = item.label;
    label.fontSize = 10;
    label.fontName = { family: "JetBrains Mono", style: "Regular" };
    label.fills = [{ type: "SOLID", color: item.active ? { r: 1, g: 0.243, b: 0.004 } : { r: 0.435, g: 0.478, b: 0.463 } }];
    label.textAlignHorizontal = "CENTER";
    navItem.appendChild(label);

    navItem.layoutSizingHorizontal = "HUG";
    navItem.layoutSizingVertical = "HUG";
    component.appendChild(navItem);
  }

  component.layoutSizingHorizontal = "FILL";
  component.layoutSizingVertical = "FIXED";

  return component;
}

function buildScreenHeaderComponent(figma) {
  const component = figma.createComponent();
  component.name = "ScreenHeader";
  component.description = "Page title block with optional right slot for actions.";
  component.resize(800, 56);
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisAlignItems = "SPACE_BETWEEN";
  component.counterAxisAlignItems = "CENTER";
  component.paddingLeft = 24;
  component.paddingRight = 24;
  component.fills = [];

  const title = figma.createText();
  title.characters = "Screen Title";
  title.fontSize = 18;
  title.fontName = { family: "Inter", style: "Medium" };
  title.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.953 } }];
  title.textAlignVertical = "CENTER";
  component.appendChild(title);

  // Action slot
  const slot = figma.createFrame();
  slot.name = "Action Slot";
  slot.resize(120, 32);
  slot.fills = [];
  component.appendChild(slot);

  component.layoutSizingHorizontal = "FILL";
  component.layoutSizingVertical = "FIXED";

  return component;
}

function buildCardComponent(figma) {
  const component = figma.createComponent();
  component.name = "Card";
  component.description = "Generic card container for data display items.";
  component.resize(320, 120);
  component.layoutMode = "VERTICAL";
  component.primaryAxisAlignItems = "MIN";
  component.counterAxisAlignItems = "STRETCH";
  component.paddingLeft = 16;
  component.paddingRight = 16;
  component.paddingTop = 16;
  component.paddingBottom = 16;
  component.itemSpacing = 12;
  component.fills = [{ type: "SOLID", color: { r: 0.051, g: 0.063, b: 0.071 } }];
  component.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  component.strokeWeight = 1;
  component.cornerRadius = 4;

  const title = figma.createText();
  title.characters = "Card Title";
  title.fontSize = 15;
  title.fontName = { family: "Inter", style: "Medium" };
  title.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.953 } }];
  component.appendChild(title);

  const body = figma.createText();
  body.characters = "Card body text goes here with supporting information.";
  body.fontSize = 13;
  body.fontName = { family: "Inter", style: "Regular" };
  body.fills = [{ type: "SOLID", color: { r: 0.663, g: 0.698, b: 0.682 } }];
  body.layoutSizingHorizontal = "FILL";
  component.appendChild(body);

  component.layoutSizingHorizontal = "FILL";
  component.layoutSizingVertical = "HUG";

  return component;
}

function buildEmptyStateComponent(figma) {
  const component = figma.createComponent();
  component.name = "EmptyState";
  component.description = "Empty state with icon, title, and hint text.";
  component.resize(320, 200);
  component.layoutMode = "VERTICAL";
  component.primaryAxisAlignItems = "CENTER";
  component.counterAxisAlignItems = "CENTER";
  component.itemSpacing = 12;
  component.fills = [];

  const icon = figma.createRectangle();
  icon.resize(48, 48);
  icon.cornerRadius = 8;
  icon.fills = [{ type: "SOLID", color: { r: 0.122, g: 0.133, b: 0.125 } }];
  component.appendChild(icon);

  const title = figma.createText();
  title.characters = "No results found";
  title.fontSize = 15;
  title.fontName = { family: "Inter", style: "Medium" };
  title.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.953 } }];
  title.textAlignHorizontal = "CENTER";
  component.appendChild(title);

  const hint = figma.createText();
  hint.characters = "Try adjusting your filters or search terms.";
  hint.fontSize = 13;
  hint.fontName = { family: "Inter", style: "Regular" };
  hint.fills = [{ type: "SOLID", color: { r: 0.435, g: 0.478, b: 0.463 } }];
  hint.textAlignHorizontal = "CENTER";
  component.appendChild(hint);

  component.layoutSizingHorizontal = "FILL";
  component.layoutSizingVertical = "HUG";

  return component;
}

// ============================================================
// SECTION 4: SCREEN BUILDERS
// ============================================================

function buildFindingsScreen(figma, components) {
  const frames = {};

  // Desktop
  const desktop = figma.createFrame();
  desktop.name = "Findings / Desktop";
  desktop.resize(1440, 900);
  desktop.layoutMode = "HORIZONTAL";
  desktop.primaryAxisAlignItems = "MIN";
  desktop.counterAxisAlignItems = "STRETCH";
  desktop.fills = [{ type: "SOLID", color: { r: 0.031, g: 0.039, b: 0.043 } }];
  desktop.clipContent = true;

  // Nav Rail
  const navRail = components.navRail.createInstance();
  navRail.resize(56, 900);
  desktop.appendChild(navRail);

  // Content area
  const content = figma.createFrame();
  content.name = "Content";
  content.resize(1440 - 56 - 380, 900);
  content.layoutMode = "VERTICAL";
  content.primaryAxisAlignItems = "MIN";
  content.counterAxisAlignItems = "STRETCH";
  content.fills = [];

  // TopBar
  const topBar = components.topBar.createInstance();
  content.appendChild(topBar);

  // Screen Header
  const header = components.screenHeader.createInstance();
  header.resize(1440 - 56 - 380, 56);
  content.appendChild(header);

  // Tab bar
  const tabBar = figma.createFrame();
  tabBar.name = "Tab Bar";
  tabBar.resize(1440 - 56 - 380, 40);
  tabBar.layoutMode = "HORIZONTAL";
  tabBar.paddingLeft = 24;
  tabBar.itemSpacing = 0;
  tabBar.fills = [];

  const tabs = ["All", "Findings", "Questions"];
  tabs.forEach((tab, i) => {
    const tabItem = figma.createFrame();
    tabItem.name = tab;
    tabItem.resize(80, 40);
    tabItem.layoutMode = "VERTICAL";
    tabItem.primaryAxisAlignItems = "CENTER";
    tabItem.counterAxisAlignItems = "CENTER";
    tabItem.paddingBottom = 8;
    if (i === 0) {
      tabItem.strokes = [{ type: "SOLID", color: { r: 1, g: 0.243, b: 0.004 } }];
      tabItem.strokeWeight = 2;
    }

    const tabText = figma.createText();
    tabText.characters = tab;
    tabText.fontSize = 13;
    tabText.fontName = { family: "Inter", style: i === 0 ? "Medium" : "Regular" };
    tabText.fills = [{ type: "SOLID", color: i === 0 ? { r: 1, g: 0.243, b: 0.004 } : { r: 0.663, g: 0.698, b: 0.682 } }];
    tabText.textAlignHorizontal = "CENTER";
    tabText.textAlignVertical = "CENTER";
    tabItem.appendChild(tabText);
    tabItem.layoutSizingHorizontal = "HUG";
    tabItem.layoutSizingVertical = "HUG";
    tabBar.appendChild(tabItem);
  });

  tabBar.layoutSizingHorizontal = "FILL";
  tabBar.layoutSizingVertical = "FIXED";
  content.appendChild(tabBar);

  // Table
  const table = figma.createFrame();
  table.name = "Findings Table";
  table.resize(1440 - 56 - 380, 700);
  table.layoutMode = "VERTICAL";
  table.primaryAxisAlignItems = "MIN";
  table.counterAxisAlignItems = "STRETCH";
  table.fills = [];
  table.layoutSizingHorizontal = "FILL";
  table.layoutSizingVertical = "FILL";

  // Table header
  const tableHeader = figma.createFrame();
  tableHeader.name = "Table Header";
  tableHeader.resize(1440 - 56 - 380, 36);
  tableHeader.layoutMode = "HORIZONTAL";
  tableHeader.paddingLeft = 16;
  tableHeader.paddingRight = 16;
  tableHeader.counterAxisAlignItems = "CENTER";
  tableHeader.fills = [{ type: "SOLID", color: { r: 0.071, g: 0.086, b: 0.098 } }];
  tableHeader.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
  tableHeader.strokeWeight = 1;
  tableHeader.layoutSizingHorizontal = "FILL";

  const headers = ["ID", "Category", "Title", "Confidence", "Status", ""];
  headers.forEach(h => {
    const headerText = figma.createText();
    headerText.characters = h;
    headerText.fontSize = 11;
    headerText.fontName = { family: "JetBrains Mono", style: "Medium" };
    headerText.fills = [{ type: "SOLID", color: { r: 0.435, g: 0.478, b: 0.463 } }];
    headerText.textAlignVertical = "CENTER";
    headerText.layoutSizingHorizontal = h === "Title" ? "FILL" : "HUG";
    tableHeader.appendChild(headerText);
  });
  table.appendChild(tableHeader);

  // Table rows (sample)
  const rowColors = [
    { confidence: "high", actionable: true },
    { confidence: "medium", actionable: true },
    { confidence: "low", actionable: false },
    { confidence: "high", actionable: false },
    { confidence: "medium", actionable: true },
  ];

  rowColors.forEach((row, i) => {
    const tableRow = figma.createFrame();
    tableRow.name = `Row ${i + 1}`;
    tableRow.resize(1440 - 56 - 380, 44);
    tableRow.layoutMode = "HORIZONTAL";
    tableRow.paddingLeft = 16;
    tableRow.paddingRight = 16;
    tableRow.counterAxisAlignItems = "CENTER";
    tableRow.itemSpacing = 16;
    tableRow.fills = i % 2 === 0 ? [] : [{ type: "SOLID", color: { r: 0.051, g: 0.063, b: 0.071 } }];
    tableRow.strokes = [{ type: "SOLID", color: { r: 0.145, g: 0.169, b: 0.188 } }];
    tableRow.strokeWeight = 0;
    tableRow.layoutSizingHorizontal = "FILL";

    const id = figma.createText();
    id.characters = `F-000${i + 1}`;
    id.fontSize = 12;
    id.fontName = { family: "JetBrains Mono", style: "Regular" };
    id.fills = [{ type: "SOLID", color: { r: 0.663, g: 0.698, b: 0.682 } }];
    id.textAlignVertical = "CENTER";
    tableRow.appendChild(id);

    const cat = figma.createText();
    cat.characters = ["process", "equipment", "quality", "phenomena", "method"][i];
    cat.fontSize = 12;
    cat.fontName = { family: "Inter", style: "Regular" };
    cat.fills = [{ type: "SOLID", color: { r: 0.663, g: 0.698, b: 0.682 } }];
    cat.textAlignVertical = "CENTER";
    tableRow.appendChild(cat);

    const title = figma.createText();
    title.characters = `Finding title ${i + 1}`;
    title.fontSize = 13;
    title.fontName = { family: "Inter", style: "Regular" };
    title.fills = [{ type: "SOLID", color: { r: 0.949, g: 0.961, b: 0.953 } }];
    title.textAlignVertical = "CENTER";
    title.layoutSizingHorizontal = "FILL";
    tableRow.appendChild(title);

    const conf = figma.createText();
    conf.characters = row.confidence;
    conf.fontSize = 11;
    conf.fontName = { family: "JetBrains Mono", style: "Medium" };
    conf.fills = [{ type: "SOLID", color: row.confidence === "high" ? { r: 0.145, g: 0.722, b: 0.533 } : row.confidence === "medium" ? { r: 0.953, g: 0.788, b: 0.412 } : { r: 1, g: 0.420, b: 0.420 } }];
    conf.textAlignVertical = "CENTER";
    tableRow.appendChild(conf);

    const action = figma.createText();
    action.characters = row.actionable ? "●" : "○";
    action.fontSize = 12;
    action.fontName = { family: "Inter", style: "Regular" };
    action.fills = [{ type: "SOLID", color: row.actionable ? { r: 1, g: 0.243, b: 0.004 } : { r: 0.435, g: 0.478, b: 0.463 } }];
    action.textAlignVertical = "CENTER";
    tableRow.appendChild(action);

    table.appendChild(tableRow);
  });

  content.appendChild(table);
  desktop.appendChild(content);

  // Inspector
  const inspector = components.inspector.createInstance();
  inspector.resize(380, 900);
  desktop.appendChild(inspector);

  frames.desktop = desktop;

  // Tablet
  const tablet = figma.createFrame();
  tablet.name = "Findings / Tablet";
  tablet.resize(900, 900);
  tablet.layoutMode = "HORIZONTAL";
  tablet.primaryAxisAlignItems = "MIN";
  tablet.counterAxisAlignItems = "STRETCH";
  tablet.fills = [{ type: "SOLID", color: { r: 0.031, g: 0.039, b: 0.043 } }];
  tablet.clipContent = true;
  frames.tablet = tablet;

  // Mobile
  const mobile = figma.createFrame();
  mobile.name = "Findings / Mobile";
  mobile.resize(390, 844);
  mobile.layoutMode = "VERTICAL";
  mobile.primaryAxisAlignItems = "MIN";
  mobile.counterAxisAlignItems = "STRETCH";
  mobile.fills = [{ type: "SOLID", color: { r: 0.031, g: 0.039, b: 0.043 } }];
  mobile.clipContent = true;
  frames.mobile = mobile;

  return frames;
}

// ============================================================
// SECTION 5: MAIN PLUGIN EXECUTION
// ============================================================

async function main() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "JetBrains Mono", style: "Regular" });
  await figma.loadFontAsync({ family: "JetBrains Mono", style: "Medium" });
  await figma.loadFontAsync({ family: "JetBrains Mono", style: "Bold" });

  figma.notify("Building Quick Agent System handoff...");

  // Step 1: Create variable collections
  figma.notify("Creating variable collections...");
  const collections = createVariableCollections(figma);

  // Step 2: Build components
  figma.notify("Building component library...");
  const components = {};

  // Actions & Forms
  const buttonPage = figma.root.children.find(p => p.name === "Components / Actions & Forms");
  if (buttonPage) {
    components.button = buildButtonComponent(figma);
    components.input = buildInputComponent(figma);
    buttonPage.appendChild(components.button);
    buttonPage.appendChild(components.input);
    components.button.x = 40;
    components.button.y = 40;
    components.input.x = 40;
    components.input.y = 400;
  }

  // Navigation
  const navPage = figma.root.children.find(p => p.name === "Components / Navigation");
  if (navPage) {
    components.topBar = buildTopBarComponent(figma);
    components.navRail = buildNavRailComponent(figma);
    components.bottomNav = buildBottomNavComponent(figma);
    navPage.appendChild(components.topBar);
    navPage.appendChild(components.navRail);
    navPage.appendChild(components.bottomNav);
    components.topBar.x = 40;
    components.topBar.y = 40;
    components.navRail.x = 40;
    components.navRail.y = 120;
    components.bottomNav.x = 40;
    components.bottomNav.y = 1020;
  }

  // Data Display
  const dataPage = figma.root.children.find(p => p.name === "Components / Data Display");
  if (dataPage) {
    components.statusBadge = buildStatusBadgeComponent(figma);
    components.card = buildCardComponent(figma);
    dataPage.appendChild(components.statusBadge);
    dataPage.appendChild(components.card);
    components.statusBadge.x = 40;
    components.statusBadge.y = 40;
    components.card.x = 40;
    components.card.y = 200;
  }

  // Overlays
  const overlayPage = figma.root.children.find(p => p.name === "Components / Overlays");
  if (overlayPage) {
    components.inspector = buildInspectorFrameComponent(figma);
    overlayPage.appendChild(components.inspector);
    components.inspector.x = 40;
    components.inspector.y = 40;
  }

  // Common
  const commonPage = figma.root.children.find(p => p.name === "---");
  if (commonPage) {
    components.screenHeader = buildScreenHeaderComponent(figma);
    components.emptyState = buildEmptyStateComponent(figma);
  }

  // Step 3: Build route screens
  figma.notify("Building route screens...");

  const findingsPage = figma.root.children.find(p => p.name === "Findings");
  if (findingsPage && components.navRail && components.topBar && components.screenHeader && components.inspector) {
    const findingsFrames = buildFindingsScreen(figma, components);
    Object.values(findingsFrames).forEach(f => findingsPage.appendChild(f));
  }

  // Step 4: Organize foundations
  const foundationsPage = figma.root.children.find(p => p.name === "Foundations");
  if (foundationsPage) {
    // Color swatches
    const colorFrame = figma.createFrame();
    colorFrame.name = "Color Palette / Primitives";
    colorFrame.resize(1200, 400);
    colorFrame.layoutMode = "HORIZONTAL";
    colorFrame.itemSpacing = 8;
    colorFrame.paddingTop = 40;
    colorFrame.paddingLeft = 40;
    colorFrame.paddingBottom = 40;
    colorFrame.fills = [{ type: "SOLID", color: { r: 0.031, g: 0.039, b: 0.043 } }];

    const swatchGroups = [
      { name: "Neutrals", colors: ["oxide-50", "oxide-100", "oxide-200", "oxide-300", "oxide-400", "oxide-500", "oxide-600", "oxide-700", "oxide-800", "oxide-900", "oxide-950", "oxide-1000"] },
      { name: "Orange", colors: ["orange-50", "orange-100", "orange-200", "orange-300", "orange-400", "orange-500", "orange-600", "orange-700", "orange-800", "orange-900"] },
      { name: "Green", colors: ["green-50", "green-100", "green-200", "green-300", "green-400", "green-500"] },
      { name: "Amber", colors: ["amber-50", "amber-100", "amber-200", "amber-300", "amber-400"] },
      { name: "Red", colors: ["red-50", "red-100", "red-200", "red-300", "red-400", "red-500"] },
      { name: "Blue", colors: ["blue-50", "blue-100", "blue-200", "blue-300", "blue-400"] },
      { name: "Purple", colors: ["purple-50", "purple-100", "purple-200", "purple-300", "purple-400", "purple-500"] },
    ];

    swatchGroups.forEach(group => {
      const groupFrame = figma.createFrame();
      groupFrame.name = group.name;
      groupFrame.layoutMode = "VERTICAL";
      groupFrame.itemSpacing = 4;

      const groupTitle = figma.createText();
      groupTitle.characters = group.name;
      groupTitle.fontSize = 12;
      groupTitle.fontName = { family: "JetBrains Mono", style: "Medium" };
      groupTitle.fills = [{ type: "SOLID", color: { r: 0.663, g: 0.698, b: 0.682 } }];
      groupFrame.appendChild(groupTitle);

      const swatchRow = figma.createFrame();
      swatchRow.layoutMode = "HORIZONTAL";
      swatchRow.itemSpacing = 4;
      swatchRow.fills = [];

      group.colors.forEach(colorName => {
        const color = PRIMITIVES[colorName];
        if (color) {
          const swatch = figma.createFrame();
          swatch.name = colorName;
          swatch.resize(48, 48);
          swatch.cornerRadius = 4;
          swatch.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b } }];
          swatchRow.appendChild(swatch);
        }
      });

      groupFrame.appendChild(swatchRow);
      groupFrame.layoutSizingHorizontal = "HUG";
      groupFrame.layoutSizingVertical = "HUG";
      colorFrame.appendChild(groupFrame);
    });

    colorFrame.layoutSizingHorizontal = "HUG";
    foundationsPage.appendChild(colorFrame);
  }

  figma.notify("✅ Quick Agent System handoff built successfully!", { timeout: 5000 });
  figma.closePlugin();
}

main().catch(err => {
  figma.notify("❌ Error: " + err.message, { error: true });
  figma.closePlugin();
});
