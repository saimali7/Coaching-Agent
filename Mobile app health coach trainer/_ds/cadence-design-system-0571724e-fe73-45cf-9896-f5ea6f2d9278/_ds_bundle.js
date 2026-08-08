/* @ds-bundle: {"format":4,"namespace":"CadenceDesignSystem_057172","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"BarSeries","sourcePath":"components/data/BarSeries.jsx"},{"name":"MetricRing","sourcePath":"components/data/MetricRing.jsx"},{"name":"MetricTile","sourcePath":"components/data/MetricTile.jsx"},{"name":"ProgressBar","sourcePath":"components/data/ProgressBar.jsx"},{"name":"ScaleGauge","sourcePath":"components/data/ScaleGauge.jsx"},{"name":"StatRow","sourcePath":"components/data/StatRow.jsx"},{"name":"TrendDelta","sourcePath":"components/data/TrendDelta.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"InsightCallout","sourcePath":"components/feedback/InsightCallout.jsx"},{"name":"Sheet","sourcePath":"components/feedback/Sheet.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"DateStepper","sourcePath":"components/navigation/DateStepper.jsx"},{"name":"NavHeader","sourcePath":"components/navigation/NavHeader.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"f9f47e76ca62","components/core/Button.jsx":"b9a3df03f669","components/core/Card.jsx":"0abf2d6430c0","components/core/Chip.jsx":"306d5fc3a782","components/core/Icon.jsx":"851568d9241f","components/core/IconButton.jsx":"688c61f992b1","components/data/BarSeries.jsx":"434bb7c35cb1","components/data/MetricRing.jsx":"eb4c0a987857","components/data/MetricTile.jsx":"2ddb155c6b54","components/data/ProgressBar.jsx":"0c1ee896080d","components/data/ScaleGauge.jsx":"e33d02f950cb","components/data/StatRow.jsx":"d456768b30cc","components/data/TrendDelta.jsx":"ed161edf5acb","components/feedback/EmptyState.jsx":"17df72816535","components/feedback/InsightCallout.jsx":"93198957fe86","components/feedback/Sheet.jsx":"499e9e77a5d7","components/feedback/Toast.jsx":"64e3cd76d1c0","components/feedback/Tooltip.jsx":"eda92a2ff3a4","components/forms/Checkbox.jsx":"5a1ce13e4886","components/forms/Input.jsx":"58d308ce9f19","components/forms/SegmentedControl.jsx":"e8516d58c1b2","components/forms/Select.jsx":"f679b5d63f3c","components/forms/Slider.jsx":"5b48d4936628","components/forms/Switch.jsx":"b14be20e9898","components/navigation/DateStepper.jsx":"471cac7d84e1","components/navigation/NavHeader.jsx":"995cc1043760","components/navigation/TabBar.jsx":"274fa314cf79","components/navigation/Tabs.jsx":"a564caf4a319","ui_kits/app/CoachScreen.jsx":"b3c30020b028","ui_kits/app/HealthspanScreen.jsx":"69da130233fb","ui_kits/app/ProfileScreen.jsx":"b6369b269ed0","ui_kits/app/SleepScreen.jsx":"b12b6df742d9","ui_kits/app/TodayScreen.jsx":"29574c4847e4","ui_kits/app/TrendsScreen.jsx":"7b301b8cc9c4","ui_kits/app/data.js":"a52b55e7b328","ui_kits/marketing/BandSection.jsx":"075ff5724eb3","ui_kits/marketing/FeatureGrid.jsx":"bd976ec357db","ui_kits/marketing/Hero.jsx":"79e38a95921b","ui_kits/marketing/PlanSection.jsx":"615ee868e051","ui_kits/marketing/ProofStrip.jsx":"760458c517b4","ui_kits/marketing/SiteFooter.jsx":"0af917394fcf","ui_kits/marketing/SiteHeader.jsx":"6438b26ed082"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CadenceDesignSystem_057172 = window.CadenceDesignSystem_057172 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Cadence ships the Lucide 24px outline set as flat SVG files in assets/icons.
// Icons are painted with a CSS mask so they inherit currentColor.
const BASE = typeof window !== 'undefined' && window.CADENCE_ICON_BASE || '../../assets/icons';
function Icon({
  name,
  size = 20,
  strokeScale = 1,
  color = 'currentColor',
  style,
  ...rest
}) {
  const url = 'url("' + BASE + '/' + name + '.svg")';
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": name,
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      flex: '0 0 auto',
      background: color,
      WebkitMaskImage: url,
      maskImage: url,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      opacity: strokeScale,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    fg: 'var(--text-secondary)',
    bg: 'rgba(255,255,255,.08)'
  },
  good: {
    fg: 'var(--mint-300)',
    bg: 'rgba(47,214,156,.14)'
  },
  caution: {
    fg: 'var(--amber-300)',
    bg: 'rgba(255,168,24,.14)'
  },
  poor: {
    fg: 'var(--coral-300)',
    bg: 'rgba(255,98,71,.14)'
  },
  sleep: {
    fg: 'var(--iris-300)',
    bg: 'rgba(115,118,236,.16)'
  },
  info: {
    fg: 'var(--sky-300)',
    bg: 'rgba(51,169,251,.14)'
  }
};
function Badge({
  children,
  tone = 'neutral',
  icon,
  solid = false,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: 22,
      padding: '0 9px',
      borderRadius: 'var(--radius-xs)',
      background: solid ? t.fg : t.bg,
      color: solid ? 'var(--ink-1000)' : t.fg,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 12
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 32,
    padding: '0 14px',
    fontSize: 11,
    gap: 6,
    icon: 14
  },
  md: {
    height: 42,
    padding: '0 20px',
    fontSize: 12,
    gap: 8,
    icon: 16
  },
  lg: {
    height: 52,
    padding: '0 28px',
    fontSize: 13,
    gap: 10,
    icon: 18
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--action-primary-bg)',
    color: 'var(--action-primary-fg)',
    border: '1px solid transparent'
  },
  secondary: {
    background: 'var(--action-secondary-bg)',
    color: 'var(--action-secondary-fg)',
    border: '1px solid transparent'
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent'
  },
  danger: {
    background: 'var(--state-poor)',
    color: 'var(--ink-1000)',
    border: '1px solid transparent'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  fullWidth = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const hoverStyle = !disabled && hover ? {
    primary: {
      background: 'var(--action-primary-bg-hover)'
    },
    secondary: {
      background: 'var(--action-secondary-bg-hover)'
    },
    outline: {
      borderColor: 'var(--text-primary)'
    },
    ghost: {
      color: 'var(--text-primary)',
      background: 'var(--action-secondary-bg)'
    },
    danger: {
      background: 'var(--coral-400)'
    }
  }[variant] : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: fullWidth ? '100%' : undefined,
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-display)',
      fontSize: s.fontSize,
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.38 : 1,
      transform: press && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), transform var(--dur-instant) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      ...v,
      ...hoverStyle,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children, iconAfter ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconAfter,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  title,
  action,
  accent,
  interactive = false,
  padding,
  tone = 'card',
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const bg = tone === 'raised' ? 'var(--surface-raised)' : tone === 'flat' ? 'transparent' : 'var(--surface-card)';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: interactive && hover ? 'var(--surface-card-hover)' : bg,
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      padding: padding !== undefined ? padding : 'var(--card-pad)',
      boxShadow: tone === 'flat' ? 'none' : 'var(--shadow-card)',
      cursor: interactive ? 'pointer' : undefined,
      transition: 'background var(--dur-base) var(--ease-standard)',
      ...style
    }
  }, rest), accent ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: '0 auto 0 0',
      width: 3,
      background: accent
    }
  }) : null, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, title), action || (interactive ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-tertiary)"
  }) : null)) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  children,
  selected = false,
  icon,
  onClick,
  disabled = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 34,
      padding: '0 14px',
      borderRadius: 'var(--radius-pill)',
      background: selected ? 'var(--ink-000)' : hover ? 'var(--action-secondary-bg-hover)' : 'var(--action-secondary-bg)',
      color: selected ? 'var(--ink-1000)' : 'var(--text-secondary)',
      border: '1px solid ' + (selected ? 'transparent' : 'var(--border-hairline)'),
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body-sm)',
      fontWeight: 'var(--weight-semibold)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.38 : 1,
      whiteSpace: 'nowrap',
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }) : null, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    box: 32,
    icon: 16
  },
  md: {
    box: 40,
    icon: 20
  },
  lg: {
    box: 48,
    icon: 24
  }
};
function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  label,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const base = {
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-subtle)'
    },
    solid: {
      background: 'var(--action-secondary-bg)',
      color: 'var(--text-primary)',
      border: '1px solid transparent'
    },
    accent: {
      background: 'var(--action-primary-bg)',
      color: 'var(--action-primary-fg)',
      border: '1px solid transparent'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label || icon,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: s.box,
      height: s.box,
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.38 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      ...base,
      ...(hover && !disabled && variant !== 'accent' ? {
        background: 'var(--action-secondary-bg-hover)'
      } : null),
      ...(hover && !disabled && variant === 'accent' ? {
        background: 'var(--action-primary-bg-hover)'
      } : null),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/BarSeries.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Daily/weekly series. Bars, never lines — Cadence charts are discrete readings.
function BarSeries({
  data = [],
  max,
  color = 'var(--metric-recovery)',
  height = 120,
  labels,
  highlightIndex,
  gap = 4,
  radius = 3,
  baselineValue,
  onSelect,
  style,
  ...rest
}) {
  const peak = max || Math.max(1, ...data);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      gap,
      height
    }
  }, baselineValue !== undefined ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: baselineValue / peak * height,
      borderTop: '1px dashed var(--border-subtle)',
      pointerEvents: 'none'
    }
  }) : null, data.map((v, i) => {
    const on = highlightIndex === undefined || highlightIndex === i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: onSelect ? () => onSelect(i) : undefined,
      style: {
        flex: 1,
        height: Math.max(2, v / peak * height),
        background: on ? color : 'var(--ink-700)',
        borderRadius: radius + 'px ' + radius + 'px 2px 2px',
        cursor: onSelect ? 'pointer' : undefined,
        transition: 'height var(--dur-slow) var(--ease-out), background var(--dur-fast) var(--ease-standard)'
      }
    });
  })), labels ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      marginTop: 8
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: highlightIndex === i ? 'var(--text-primary)' : 'var(--text-tertiary)'
    }
  }, l))) : null);
}
Object.assign(__ds_scope, { BarSeries });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarSeries.jsx", error: String((e && e.message) || e) }); }

// components/data/MetricRing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// The Cadence signature: a single thick arc on a dim track, with the number inside.
function MetricRing({
  value = 0,
  max = 100,
  size = 220,
  stroke,
  color = 'var(--metric-recovery)',
  label,
  sublabel,
  display,
  glow = true,
  animate = true,
  children,
  style,
  ...rest
}) {
  const sw = stroke || Math.max(8, Math.round(size * 0.064));
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const [drawn, setDrawn] = React.useState(animate ? 0 : pct);
  React.useEffect(() => {
    if (!animate) {
      setDrawn(pct);
      return;
    }
    const t = setTimeout(() => setDrawn(pct), 60);
    return () => clearTimeout(t);
  }, [pct, animate]);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: size,
      height: size,
      ...style
    }
  }, rest), glow ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '12%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, ' + 'color-mix(in oklab, ' + color + ' 28%, transparent)' + ' 0%, transparent 68%)',
      filter: 'blur(14px)',
      pointerEvents: 'none'
    }
  }) : null, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: '0 0 ' + size + ' ' + size,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(255,255,255,.07)",
    strokeWidth: sw
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeDasharray: circ,
    strokeDashoffset: circ * (1 - drawn),
    style: {
      transition: 'stroke-dashoffset var(--dur-reveal) var(--ease-ring)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      textAlign: 'center'
    }
  }, children || /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontWeight: 'var(--weight-bold)',
      fontFeatureSettings: '"tnum" 1',
      letterSpacing: 'var(--tracking-display)',
      lineHeight: 'var(--leading-tight)',
      fontSize: Math.round(size * 0.29),
      color: 'var(--text-primary)'
    }
  }, display !== undefined ? display : Math.round(value)), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: Math.max(10, Math.round(size * 0.055)),
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label) : null, sublabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 'var(--weight-semibold)',
      color: color,
      marginTop: 4
    }
  }, sublabel) : null)));
}
Object.assign(__ds_scope, { MetricRing });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MetricRing.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressBar({
  value = 0,
  max = 100,
  color = 'var(--metric-recovery)',
  height = 6,
  label,
  valueLabel,
  segments,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      ...style
    }
  }, rest), label || valueLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 13,
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)'
    }
  }, valueLabel)) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height,
      borderRadius: height / 2,
      background: 'var(--ink-700)',
      overflow: 'hidden',
      display: 'flex'
    }
  }, segments ? segments.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: s.pct + '%',
      background: s.color,
      height: '100%'
    }
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: pct + '%',
      height: '100%',
      background: color,
      borderRadius: height / 2,
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/ScaleGauge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Tick-scale readout: a dense comb of ticks with a single marker, used for
// bounded rates where the position on the scale matters more than the number.
function ScaleGauge({
  value = 0,
  min = -1,
  max = 1,
  ticks = 61,
  minLabel,
  maxLabel,
  midLabel,
  color = 'var(--text-primary)',
  display,
  height = 46,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const markerIndex = Math.round(pct * (ticks - 1));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      ...style
    }
  }, rest), display !== undefined ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontFamily: 'var(--font-numeric)',
      fontWeight: 'var(--weight-bold)',
      fontFeatureSettings: '"tnum" 1',
      fontSize: 'var(--size-metric-md)',
      letterSpacing: 'var(--tracking-title)',
      marginBottom: 10,
      color: 'var(--text-primary)'
    }
  }, display) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      height
    }
  }, Array.from({
    length: ticks
  }).map((_, i) => {
    const isMarker = i === markerIndex;
    const near = Math.abs(i - markerIndex) <= 1;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        flex: 1,
        height: isMarker ? height : near ? height * 0.78 : height * 0.42,
        background: isMarker ? color : near ? 'var(--text-secondary)' : 'var(--ink-600)',
        borderRadius: 1,
        transition: 'height var(--dur-base) var(--ease-standard)'
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 8,
      fontFamily: 'var(--font-numeric)',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, minLabel), /*#__PURE__*/React.createElement("span", null, midLabel), /*#__PURE__*/React.createElement("span", null, maxLabel)));
}
Object.assign(__ds_scope, { ScaleGauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ScaleGauge.jsx", error: String((e && e.message) || e) }); }

// components/data/StatRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatRow({
  label,
  value,
  unit,
  icon,
  iconColor = 'var(--text-tertiary)',
  bar,
  barColor = 'var(--metric-recovery)',
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 'var(--touch-min)',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-hairline)',
      cursor: onClick ? 'pointer' : undefined,
      opacity: onClick && hover ? 0.75 : 1,
      transition: 'opacity var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: iconColor
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body)',
      color: 'var(--text-secondary)'
    }
  }, label), bar !== undefined ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: 'var(--ink-700)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: Math.max(0, Math.min(100, bar)) + '%',
      height: '100%',
      background: barColor,
      borderRadius: 2
    }
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 'var(--size-body-lg)',
      fontWeight: 'var(--weight-bold)',
      fontFeatureSettings: '"tnum" 1',
      color: 'var(--text-primary)'
    }
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, unit) : null));
}
Object.assign(__ds_scope, { StatRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatRow.jsx", error: String((e && e.message) || e) }); }

// components/data/TrendDelta.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TrendDelta({
  value = 0,
  unit = '',
  direction = 'up-good',
  neutralBelow = 0.0001,
  style,
  ...rest
}) {
  const up = value > 0;
  const flat = Math.abs(value) < neutralBelow;
  const good = direction === 'up-bad' ? !up : up;
  const color = flat ? 'var(--text-tertiary)' : good ? 'var(--state-good)' : 'var(--state-poor)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      color,
      ...style
    }
  }, rest), !flat ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: up ? 'trending-up' : 'trending-down',
    size: 13
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 13,
      fontWeight: 'var(--weight-bold)',
      fontFeatureSettings: '"tnum" 1'
    }
  }, flat ? '—' : (up ? '+' : '') + value + unit));
}
Object.assign(__ds_scope, { TrendDelta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/TrendDelta.jsx", error: String((e && e.message) || e) }); }

// components/data/MetricTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function MetricTile({
  label,
  value,
  unit,
  icon,
  color = 'var(--text-primary)',
  delta,
  deltaDirection,
  footnote,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: 'var(--card-pad-sm)',
      background: onClick && hover ? 'var(--surface-card-hover)' : 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-md)',
      cursor: onClick ? 'pointer' : undefined,
      transition: 'background var(--dur-base) var(--ease-standard)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14,
    color: color
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontWeight: 'var(--weight-bold)',
      fontFeatureSettings: '"tnum" 1',
      fontSize: 'var(--size-metric-md)',
      lineHeight: 'var(--leading-tight)',
      letterSpacing: 'var(--tracking-title)',
      color: 'var(--text-primary)'
    }
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-tertiary)'
    }
  }, unit) : null), delta !== undefined || footnote ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, delta !== undefined ? /*#__PURE__*/React.createElement(__ds_scope.TrendDelta, {
    value: delta,
    direction: deltaDirection
  }) : null, footnote ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, footnote) : null) : null);
}
Object.assign(__ds_scope, { MetricTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MetricTile.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function EmptyState({
  icon = 'compass',
  title,
  description,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 12,
      padding: '48px 24px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: '1px solid var(--border-subtle)',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24,
    color: "var(--text-tertiary)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-title)',
      color: 'var(--text-primary)'
    }
  }, title), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      maxWidth: 320,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-tertiary)'
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 8
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/InsightCallout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// The plain-language interpretation of a metric, anchored to the chart above it.
function InsightCallout({
  title,
  children,
  accent = 'var(--mint-400)',
  pointerLeft,
  actionLabel,
  onAction,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      ...style
    }
  }, rest), pointerLeft !== undefined ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -7,
      left: pointerLeft,
      width: 14,
      height: 14,
      background: 'var(--surface-card)',
      borderLeft: '1px solid var(--border-hairline)',
      borderTop: '1px solid var(--border-hairline)',
      transform: 'translateX(-50%) rotate(45deg)'
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--card-pad)'
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-title)',
      color: 'var(--text-primary)',
      marginBottom: 8
    }
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-secondary)'
    }
  }, children), actionLabel ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      padding: 0,
      border: 'none',
      background: 'transparent',
      color: accent,
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, actionLabel, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 16
  })) : null));
}
Object.assign(__ds_scope, { InsightCallout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/InsightCallout.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Sheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Sheet({
  open = false,
  onClose,
  title,
  children,
  footer,
  height = 'auto',
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 40,
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--surface-scrim)',
      backdropFilter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: '100%',
      maxHeight: '88%',
      height,
      background: 'var(--surface-raised)',
      borderTopLeftRadius: 'var(--radius-sheet)',
      borderTopRightRadius: 'var(--radius-sheet)',
      borderTop: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sheet)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'cad-sheet-in var(--dur-base) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, '@keyframes cad-sheet-in{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--ink-600)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 20px 8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-title)',
      color: 'var(--text-primary)'
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    size: "sm",
    label: "Close",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 20px 20px'
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 20px 20px',
      borderTop: '1px solid var(--border-hairline)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    icon: 'info',
    color: 'var(--text-primary)'
  },
  good: {
    icon: 'circle-check',
    color: 'var(--state-good)'
  },
  caution: {
    icon: 'triangle-alert',
    color: 'var(--state-caution)'
  },
  poor: {
    icon: 'circle-alert',
    color: 'var(--state-poor)'
  }
};
function Toast({
  message,
  tone = 'neutral',
  action,
  onAction,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'rgba(29,27,26,.94)',
      backdropFilter: 'var(--blur-chrome)',
      WebkitBackdropFilter: 'var(--blur-chrome)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-raised)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 18,
    color: t.color
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body-sm)',
      color: 'var(--text-primary)'
    }
  }, message), action ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--text-accent)',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, action) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  children,
  content,
  placement = 'top',
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const pos = placement === 'bottom' ? {
    top: 'calc(100% + 8px)'
  } : {
    bottom: 'calc(100% + 8px)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false)
  }, rest), children, open ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      ...pos,
      padding: '7px 10px',
      maxWidth: 240,
      whiteSpace: 'nowrap',
      background: 'var(--ink-000)',
      color: 'var(--ink-1000)',
      borderRadius: 'var(--radius-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 'var(--weight-semibold)',
      boxShadow: 'var(--shadow-raised)',
      zIndex: 30,
      pointerEvents: 'none'
    }
  }, content) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      minHeight: 'var(--touch-min)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      padding: '8px 0',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 auto',
      width: 22,
      height: 22,
      marginTop: 1,
      borderRadius: 'var(--radius-xs)',
      background: checked ? 'var(--mint-500)' : 'transparent',
      border: '1px solid ' + (checked ? 'var(--mint-500)' : 'var(--border-strong)'),
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
    }
  }, checked ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    color: "var(--ink-1000)"
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body)',
      color: 'var(--text-primary)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'var(--text-tertiary)',
      lineHeight: 1.5
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  suffix,
  error,
  hint,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--state-poor)' : focus ? 'var(--focus-ring)' : 'var(--border-subtle)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 48,
      padding: '0 14px',
      background: 'var(--surface-card)',
      border: '1px solid ' + borderColor,
      borderRadius: 'var(--radius-control)',
      opacity: disabled ? 0.45 : 1,
      transition: 'border-color var(--dur-fast) var(--ease-standard)'
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: "var(--text-tertiary)"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body)'
    }
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'var(--text-tertiary)'
    }
  }, suffix) : null), error || hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: error ? 'var(--state-poor)' : 'var(--text-tertiary)'
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  fullWidth = true,
  style,
  ...rest
}) {
  const h = size === 'sm' ? 32 : 40;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      padding: 3,
      gap: 2,
      background: 'var(--action-secondary-bg)',
      borderRadius: 'var(--radius-pill)',
      ...style
    }
  }, rest), options.map(o => {
    const on = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      type: "button",
      onClick: () => onChange && onChange(o.value),
      style: {
        flex: 1,
        height: h,
        padding: '0 16px',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        background: on ? 'var(--ink-000)' : 'transparent',
        color: on ? 'var(--ink-1000)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)'
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  hint,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: '100%',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: 48,
      background: 'var(--surface-card)',
      border: '1px solid ' + (focus ? 'var(--focus-ring)' : 'var(--border-subtle)'),
      borderRadius: 'var(--radius-control)',
      opacity: disabled ? 0.45 : 1,
      transition: 'border-color var(--dur-fast) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      flex: 1,
      height: '100%',
      padding: '0 40px 0 14px',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value,
    style: {
      background: 'var(--ink-900)'
    }
  }, o.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    color: "var(--text-tertiary)",
    style: {
      position: 'absolute',
      right: 14,
      pointerEvents: 'none'
    }
  })), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  valueLabel,
  color = 'var(--mint-500)',
  disabled = false,
  style,
  ...rest
}) {
  const pct = (value - min) / (max - min) * 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, label || valueLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label-sm)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 16,
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)'
    }
  }, valueLabel)) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 24,
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 4,
      borderRadius: 2,
      background: 'var(--ink-700)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      width: pct + '%',
      height: 4,
      borderRadius: 2,
      background: color
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 'calc(' + pct + '% - 11px)',
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: 'var(--ink-000)',
      boxShadow: '0 2px 8px rgba(0,0,0,.6)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    disabled: disabled,
    onChange: e => onChange && onChange(Number(e.target.value)),
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      opacity: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      margin: 0
    }
  }, rest))));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      minHeight: 'var(--touch-min)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      ...style
    }
  }, rest), label || description ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body)',
      color: 'var(--text-primary)'
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'var(--text-tertiary)'
    }
  }, description) : null) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      flex: '0 0 auto',
      width: 48,
      height: 28,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--mint-500)' : 'var(--ink-700)',
      transition: 'background var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 23 : 3,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: checked ? 'var(--ink-1000)' : 'var(--ink-300)',
      transition: 'left var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-standard)'
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/DateStepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function DateStepper({
  label,
  onPrev,
  onNext,
  disableNext = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-left",
    size: "sm",
    label: "Previous period",
    onClick: onPrev
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label-wide)',
      textTransform: 'uppercase',
      color: 'var(--text-primary)',
      minWidth: 180,
      textAlign: 'center'
    }
  }, label), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-right",
    size: "sm",
    label: "Next period",
    onClick: onNext,
    disabled: disableNext
  }));
}
Object.assign(__ds_scope, { DateStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/DateStepper.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function NavHeader({
  title,
  subtitle,
  onBack,
  action,
  transparent = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: '44px 1fr 44px',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      minHeight: 56,
      background: transparent ? 'transparent' : 'var(--surface-page)',
      borderBottom: transparent ? 'none' : '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, onBack ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-left",
    size: "md",
    label: "Back",
    onClick: onBack
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-label)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-label-wide)',
      textTransform: 'uppercase',
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, subtitle) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, action));
}
Object.assign(__ds_scope, { NavHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TabBar({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      alignItems: 'stretch',
      gap: 4,
      padding: '8px 8px calc(8px + env(safe-area-inset-bottom, 0px))',
      background: 'rgba(12,11,10,.86)',
      backdropFilter: 'var(--blur-chrome)',
      WebkitBackdropFilter: 'var(--blur-chrome)',
      borderTop: '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minHeight: 'var(--touch-min)',
        padding: '6px 0',
        border: 'none',
        background: 'transparent',
        color: on ? 'var(--text-primary)' : 'var(--text-tertiary)',
        cursor: 'pointer',
        transition: 'color var(--dur-fast) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 22
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase'
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 24,
      borderBottom: '1px solid var(--border-hairline)',
      overflowX: 'auto',
      ...style
    }
  }, rest), items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      style: {
        position: 'relative',
        padding: '0 0 12px',
        border: 'none',
        background: 'transparent',
        color: on ? 'var(--text-primary)' : 'var(--text-tertiary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--size-label)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color var(--dur-fast) var(--ease-standard)'
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: on ? 'var(--mint-500)' : 'transparent'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/CoachScreen.jsx
try { (() => {
const {
  Card,
  Button,
  Badge,
  Chip,
  StatRow,
  InsightCallout,
  EmptyState,
  ProgressBar,
  Icon
} = window.CadenceDesignSystem_057172;
function CoachScreen() {
  const [filter, setFilter] = React.useState('all');
  const plan = [{
    name: 'Zone 2 ride',
    detail: '60 min · target strain 12.0',
    icon: 'activity',
    tone: 'strain'
  }, {
    name: 'Mobility',
    detail: '15 min · hips and thoracic',
    icon: 'footprints',
    tone: 'recovery'
  }, {
    name: 'Lights out by 10:25 pm',
    detail: 'Closes a 39 min sleep gap',
    icon: 'moon',
    tone: 'sleep'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-.02em',
      marginBottom: 4
    }
  }, "Today's plan"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-tertiary)',
      fontSize: 14,
      marginBottom: 18
    }
  }, "Built from last night's recovery and your 14-day load."), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    label: "Optimal strain target",
    valueLabel: "14.2 / 16.0",
    value: 14.2,
    max: 16,
    color: "var(--metric-strain)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      color: 'var(--text-secondary)',
      fontSize: 14,
      lineHeight: 1.6
    }
  }, "You have room for one hard effort. Anything above 16.0 today will cost you tomorrow's recovery.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 12,
      overflowX: 'auto'
    }
  }, [['all', 'All'], ['train', 'Training'], ['recover', 'Recovery'], ['sleep', 'Sleep']].map(([v, l]) => /*#__PURE__*/React.createElement(Chip, {
    key: v,
    selected: filter === v,
    onClick: () => setFilter(v)
  }, l))), /*#__PURE__*/React.createElement(Card, {
    title: "Recommended",
    padding: 16,
    style: {
      marginBottom: 12
    }
  }, plan.map((p, i) => /*#__PURE__*/React.createElement(StatRow, {
    key: p.name,
    icon: p.icon,
    iconColor: 'var(--metric-' + p.tone + ')',
    label: p.name,
    value: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-tertiary)'
      }
    }, p.detail),
    style: i === plan.length - 1 ? {
      borderBottom: 'none'
    } : null
  }))), /*#__PURE__*/React.createElement(InsightCallout, {
    title: "Two weeks of rising load",
    accent: "var(--amber-300)",
    actionLabel: "Plan a deload",
    style: {
      marginBottom: 12
    }
  }, "Your training load has climbed 18% over 14 days while sleep held flat. A lighter week now protects the gains."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    iconAfter: "arrow-right"
  }, "Start Zone 2 ride"));
}
window.CoachScreen = CoachScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/CoachScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/HealthspanScreen.jsx
try { (() => {
const {
  MetricRing,
  ScaleGauge,
  Card,
  InsightCallout,
  NavHeader,
  DateStepper,
  IconButton,
  StatRow,
  Badge
} = window.CadenceDesignSystem_057172;
function HealthspanScreen({
  onBack,
  onInfo
}) {
  const h = window.CAD_DATA.healthspan;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NavHeader, {
    title: "Healthspan",
    subtitle: "Next update in 6 days",
    onBack: onBack,
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "info",
      variant: "outline",
      size: "sm",
      label: "About Healthspan",
      onClick: onInfo
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 24px'
    }
  }, /*#__PURE__*/React.createElement(DateStepper, {
    label: h.range,
    disableNext: true,
    style: {
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: '10px 0 22px'
    }
  }, /*#__PURE__*/React.createElement(MetricRing, {
    value: 70,
    size: 232,
    display: h.age,
    label: "Cadence age",
    sublabel: h.delta,
    color: "var(--metric-recovery)"
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Pace of aging",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(ScaleGauge, {
    value: h.pace,
    min: -1,
    max: 1.6,
    ticks: 49,
    display: h.pace + 'x',
    minLabel: "-1.0x",
    midLabel: "1.0x",
    maxLabel: "1.6x"
  })), /*#__PURE__*/React.createElement(InsightCallout, {
    title: "Steady and healthy",
    accent: "var(--mint-400)",
    actionLabel: "View your plan",
    style: {
      marginBottom: 12
    }
  }, "Your Cadence age is lower than your calendar age and your pace of aging is slow, driven by your VO2 max. Keep your current habits to hold this pace."), /*#__PURE__*/React.createElement(Card, {
    title: "What moves this number",
    padding: 16
  }, /*#__PURE__*/React.createElement(StatRow, {
    icon: "activity",
    iconColor: "var(--metric-cardio)",
    label: "VO2 max",
    value: "52.4",
    unit: "ml/kg",
    bar: 86
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "moon",
    iconColor: "var(--metric-sleep)",
    label: "Sleep consistency",
    value: "84",
    unit: "%",
    bar: 84,
    barColor: "var(--metric-sleep)"
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "heart",
    iconColor: "var(--metric-stress)",
    label: "Resting HR",
    value: "48",
    unit: "bpm",
    bar: 72,
    barColor: "var(--metric-stress)"
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "footprints",
    iconColor: "var(--metric-strain)",
    label: "Daily movement",
    value: "9,240",
    unit: "steps",
    bar: 61,
    barColor: "var(--metric-strain)",
    style: {
      borderBottom: 'none'
    }
  }))));
}
window.HealthspanScreen = HealthspanScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/HealthspanScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ProfileScreen.jsx
try { (() => {
const {
  Card,
  Switch,
  Select,
  StatRow,
  Button,
  Badge,
  Icon,
  Input
} = window.CadenceDesignSystem_057172;
function ProfileScreen() {
  const [coach, setCoach] = React.useState(true);
  const [haptics, setHaptics] = React.useState(false);
  const [goal, setGoal] = React.useState('perform');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'var(--mint-500)',
      color: 'var(--ink-1000)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: '.04em'
    }
  }, "TR"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, "Taylor Reyes"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-tertiary)',
      fontSize: 13,
      marginTop: 2
    }
  }, "Member since 2023 \xB7 412 days logged"))), /*#__PURE__*/React.createElement(Card, {
    title: "Band",
    padding: 16,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(StatRow, {
    icon: "battery-full",
    iconColor: "var(--metric-recovery)",
    label: "Battery",
    value: "72",
    unit: "%"
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "refresh-cw",
    label: "Last sync",
    value: "2 min ago"
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "shield",
    label: "Firmware",
    value: "4.2.1",
    style: {
      borderBottom: 'none'
    }
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Coaching",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Sleep goal",
    value: goal,
    onChange: e => setGoal(e.target.value),
    options: [{
      value: 'peak',
      label: 'Peak — perform at your best'
    }, {
      value: 'perform',
      label: 'Perform — stay sharp'
    }, {
      value: 'getby',
      label: 'Get by — minimum viable'
    }],
    style: {
      marginBottom: 16
    }
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: coach,
    onChange: setCoach,
    label: "Sleep coach",
    description: "Nightly bedtime target based on strain",
    style: {
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: haptics,
    onChange: setHaptics,
    label: "Haptic alarm",
    description: "Silent wake inside your sleep window"
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Account",
    padding: 16,
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(StatRow, {
    icon: "user",
    label: "Personal details",
    value: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 16,
      color: "var(--text-tertiary)"
    }),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "lock",
    label: "Privacy",
    value: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 16,
      color: "var(--text-tertiary)"
    }),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "users",
    label: "Teams",
    value: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 16,
      color: "var(--text-tertiary)"
    }),
    onClick: () => {},
    style: {
      borderBottom: 'none'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    fullWidth: true
  }, "Sign out"));
}
window.ProfileScreen = ProfileScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/SleepScreen.jsx
try { (() => {
const {
  MetricRing,
  Card,
  StatRow,
  ProgressBar,
  BarSeries,
  InsightCallout,
  NavHeader,
  IconButton,
  SegmentedControl,
  Badge
} = window.CadenceDesignSystem_057172;
function SleepScreen({
  onBack,
  onInfo
}) {
  const s = window.CAD_DATA.sleep;
  const [range, setRange] = React.useState('w');
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NavHeader, {
    title: "Sleep",
    subtitle: "Last night \xB7 11:04 pm \u2013 6:46 am",
    onBack: onBack,
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "info",
      variant: "outline",
      size: "sm",
      label: "How sleep is scored",
      onClick: onInfo
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(MetricRing, {
    value: s.performance,
    size: 200,
    display: s.total,
    label: "Hours of sleep",
    sublabel: s.performance + '% of your ' + s.need + ' need',
    color: "var(--metric-sleep)"
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Stages",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    segments: s.stages.map(st => ({
      pct: st.pct,
      color: st.color
    })),
    height: 8,
    style: {
      marginBottom: 14
    }
  }), s.stages.map((st, i) => /*#__PURE__*/React.createElement(StatRow, {
    key: st.label,
    label: st.label,
    value: st.value,
    unit: st.pct + '%',
    bar: st.pct,
    barColor: st.color,
    style: i === s.stages.length - 1 ? {
      borderBottom: 'none'
    } : null
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Efficiency"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 34,
      fontWeight: 700,
      marginTop: 8
    }
  }, s.efficiency, "%")), /*#__PURE__*/React.createElement(Card, {
    padding: 14
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Cycles"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 34,
      fontWeight: 700,
      marginTop: 8
    }
  }, s.cycles))), /*#__PURE__*/React.createElement(Card, {
    title: "Sleep performance",
    action: /*#__PURE__*/React.createElement(SegmentedControl, {
      size: "sm",
      fullWidth: false,
      value: range,
      onChange: setRange,
      options: [{
        value: 'w',
        label: 'W'
      }, {
        value: 'm',
        label: 'M'
      }]
    }),
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(BarSeries, {
    data: s.week,
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    color: "var(--metric-sleep)",
    baselineValue: 84,
    height: 92,
    highlightIndex: 6
  })), /*#__PURE__*/React.createElement(InsightCallout, {
    title: "One more cycle would close the gap",
    accent: "var(--iris-300)",
    actionLabel: "Set a bedtime"
  }, "You were 39 minutes short of your sleep need. Going to bed by 10:25 pm tonight puts you back at 100%.")));
}
window.SleepScreen = SleepScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/SleepScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/TodayScreen.jsx
try { (() => {
const {
  MetricRing,
  MetricTile,
  Card,
  StatRow,
  InsightCallout,
  Chip,
  Badge,
  BarSeries,
  Icon,
  IconButton
} = window.CadenceDesignSystem_057172;
function TodayScreen({
  onOpen
}) {
  const d = window.CAD_DATA;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 20px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0 18px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '.2em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, d.today.date), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-.02em',
      marginTop: 4
    }
  }, "Good morning, ", d.user.name)), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    variant: "ghost",
    label: "Notifications"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: '6px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(MetricRing, {
    value: d.today.recovery,
    size: 228,
    label: "Recovery",
    display: d.today.recovery + '%',
    sublabel: d.today.recoveryLabel,
    color: "var(--metric-recovery)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(MetricTile, {
    label: "HRV",
    value: d.today.hrv,
    unit: "ms",
    icon: "activity",
    color: "var(--metric-cardio)",
    delta: d.today.hrvDelta,
    footnote: "vs 30-day"
  }), /*#__PURE__*/React.createElement(MetricTile, {
    label: "Resting HR",
    value: d.today.rhr,
    unit: "bpm",
    icon: "heart",
    color: "var(--metric-stress)",
    delta: d.today.rhrDelta,
    deltaDirection: "up-bad",
    footnote: "vs 30-day"
  }), /*#__PURE__*/React.createElement(MetricTile, {
    label: "Day strain",
    value: d.today.strain,
    icon: "flame",
    color: "var(--metric-strain)",
    footnote: "Optimal 13-16"
  }), /*#__PURE__*/React.createElement(MetricTile, {
    label: "Sleep",
    value: d.today.sleepScore,
    unit: "%",
    icon: "moon",
    color: "var(--metric-sleep)",
    onClick: () => onOpen('sleep'),
    footnote: "7h 42m"
  })), /*#__PURE__*/React.createElement(InsightCallout, {
    title: "Primed to train",
    accent: "var(--mint-400)",
    actionLabel: "See today's plan",
    onAction: () => onOpen('coach'),
    style: {
      marginBottom: 12
    }
  }, "Your HRV rose 4ms overnight and your resting heart rate is 2bpm below baseline. A hard session today is well supported."), /*#__PURE__*/React.createElement(Card, {
    title: "Last 7 days",
    action: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 16,
      color: "var(--text-tertiary)"
    }),
    interactive: true,
    onClick: () => onOpen('trends'),
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(BarSeries, {
    data: d.today.week,
    labels: d.today.weekLabels,
    highlightIndex: 6,
    baselineValue: 72,
    height: 84
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Today's activity",
    padding: 16
  }, d.activities.map((a, i) => /*#__PURE__*/React.createElement(StatRow, {
    key: a.name,
    icon: a.icon,
    iconColor: a.color,
    label: a.name + ' · ' + a.time,
    value: a.strain,
    style: i === d.activities.length - 1 ? {
      borderBottom: 'none'
    } : null
  }))));
}
window.TodayScreen = TodayScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/TodayScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/TrendsScreen.jsx
try { (() => {
const {
  SegmentedControl,
  Tabs,
  Card,
  BarSeries,
  MetricTile,
  StatRow,
  Chip,
  TrendDelta
} = window.CadenceDesignSystem_057172;
function TrendsScreen() {
  const [range, setRange] = React.useState('m');
  const [tab, setTab] = React.useState('recovery');
  const series = {
    recovery: {
      data: [62, 71, 58, 80, 74, 88, 82, 69, 77, 84, 91, 66, 73, 86],
      color: 'var(--metric-recovery)',
      avg: 76
    },
    strain: {
      data: [12, 8, 15, 6, 14, 17, 11, 9, 16, 13, 7, 18, 12, 10],
      color: 'var(--metric-strain)',
      avg: 12
    },
    sleep: {
      data: [88, 74, 91, 66, 80, 95, 92, 71, 84, 89, 77, 93, 81, 90],
      color: 'var(--metric-sleep)',
      avg: 84
    }
  }[tab];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-.02em',
      marginBottom: 16
    }
  }, "Trends"), /*#__PURE__*/React.createElement(SegmentedControl, {
    value: range,
    onChange: setRange,
    options: [{
      value: 'w',
      label: 'Week'
    }, {
      value: 'm',
      label: 'Month'
    }, {
      value: 'y',
      label: '6 months'
    }],
    style: {
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'recovery',
      label: 'Recovery'
    }, {
      value: 'strain',
      label: 'Strain'
    }, {
      value: 'sleep',
      label: 'Sleep'
    }],
    style: {
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 44,
      fontWeight: 700,
      letterSpacing: '-.03em'
    }
  }, series.avg), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, "14-day average")), /*#__PURE__*/React.createElement(TrendDelta, {
    value: 6,
    unit: "%"
  })), /*#__PURE__*/React.createElement(BarSeries, {
    data: series.data,
    color: series.color,
    baselineValue: series.avg,
    height: 120,
    gap: 3
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(MetricTile, {
    label: "Best day",
    value: "91",
    icon: "award",
    color: "var(--metric-recovery)",
    footnote: "Sat 22 Aug"
  }), /*#__PURE__*/React.createElement(MetricTile, {
    label: "Consistency",
    value: "84",
    unit: "%",
    icon: "target",
    color: "var(--metric-cardio)",
    delta: 3
  })), /*#__PURE__*/React.createElement(Card, {
    title: "What changed",
    padding: 16
  }, /*#__PURE__*/React.createElement(StatRow, {
    icon: "moon",
    iconColor: "var(--metric-sleep)",
    label: "Sleep debt",
    value: "-1:12"
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "droplet",
    iconColor: "var(--metric-cardio)",
    label: "Hydration logs",
    value: "18",
    unit: "days"
  }), /*#__PURE__*/React.createElement(StatRow, {
    icon: "wind",
    iconColor: "var(--metric-stress)",
    label: "Respiratory rate",
    value: "14.8",
    unit: "rpm",
    style: {
      borderBottom: 'none'
    }
  })));
}
window.TrendsScreen = TrendsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/TrendsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
// Sample readings for the Cadence app kit. Static, illustrative.
window.CAD_DATA = {
  user: {
    name: 'Taylor',
    initials: 'TR'
  },
  today: {
    date: 'Wed 26 Aug',
    recovery: 82,
    recoveryLabel: 'Primed to train',
    strain: 14.2,
    sleepScore: 92,
    hrv: 68,
    hrvDelta: 4,
    rhr: 48,
    rhrDelta: -2,
    respiratory: 14.8,
    skinTemp: '+0.2',
    week: [62, 71, 58, 80, 74, 88, 82],
    weekLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  },
  sleep: {
    total: '7:42',
    need: '8:21',
    performance: 92,
    efficiency: 94,
    cycles: 5,
    stages: [{
      label: 'Awake',
      value: '0:18',
      pct: 4,
      color: 'var(--ink-500)'
    }, {
      label: 'Light',
      value: '3:46',
      pct: 49,
      color: 'var(--iris-300)'
    }, {
      label: 'REM',
      value: '1:52',
      pct: 24,
      color: 'var(--iris-400)'
    }, {
      label: 'Deep',
      value: '1:46',
      pct: 23,
      color: 'var(--iris-600)'
    }],
    week: [88, 74, 91, 66, 80, 95, 92]
  },
  healthspan: {
    age: '29.9',
    delta: '4.7 years younger',
    pace: 0.8,
    range: 'Aug 19 - Aug 26'
  },
  activities: [{
    name: 'Strength',
    time: '6:12 am',
    strain: '11.4',
    icon: 'dumbbell',
    color: 'var(--metric-strain)'
  }, {
    name: 'Walk',
    time: '12:40 pm',
    strain: '4.1',
    icon: 'footprints',
    color: 'var(--metric-strain)'
  }, {
    name: 'Sleep',
    time: '11:04 pm',
    strain: '7h 42m',
    icon: 'bed',
    color: 'var(--metric-sleep)'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/BandSection.jsx
try { (() => {
const {
  Button,
  Badge,
  StatRow
} = window.CadenceDesignSystem_057172;
function BandSection() {
  return /*#__PURE__*/React.createElement("section", {
    "data-theme": "light",
    style: {
      background: 'var(--surface-page)',
      color: 'var(--text-primary)',
      padding: '96px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '4 / 3',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-strong)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: 'var(--surface-sunken)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, "Product photograph"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-tertiary)'
    }
  }, "Band on wrist, studio light, warm neutral ground")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "good"
  }, "Hardware"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '20px 0 16px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-display-3)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-display)'
    }
  }, "No screen. Nothing to check."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 28px',
      maxWidth: 460,
      fontSize: 'var(--size-body-lg)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-secondary)'
    }
  }, "The band measures and disappears. Everything you need to see lives in the app, once a day, at the moment it is useful."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(StatRow, {
    label: "Battery",
    value: "5",
    unit: "days",
    icon: "battery-full"
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "Water resistance",
    value: "10",
    unit: "ATM",
    icon: "droplet"
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "Sampling",
    value: "100",
    unit: "Hz",
    icon: "activity"
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "Weight",
    value: "24",
    unit: "g",
    icon: "target",
    style: {
      borderBottom: 'none'
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Get the band"))));
}
window.BandSection = BandSection;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/BandSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/FeatureGrid.jsx
try { (() => {
const {
  Card,
  Icon,
  BarSeries,
  ScaleGauge,
  ProgressBar
} = window.CadenceDesignSystem_057172;
function FeatureGrid() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '96px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 12px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-display-3)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-display)',
      color: 'var(--text-primary)'
    }
  }, "Four numbers, every morning."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 40px',
      maxWidth: 560,
      fontSize: 'var(--size-body-lg)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-secondary)'
    }
  }, "Recovery tells you what your body can take. Strain tells you what you asked of it. Sleep and Healthspan tell you where it is heading."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      gridRow: 'span 2',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 320
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    size: 24,
    color: "var(--metric-recovery)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '16px 0 8px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-2)',
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, "Recovery"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.62,
      color: 'var(--text-secondary)',
      maxWidth: 340
    }
  }, "Heart rate variability, resting heart rate, respiratory rate and sleep, resolved into one number before you get out of bed.")), /*#__PURE__*/React.createElement(BarSeries, {
    data: [62, 71, 58, 80, 74, 88, 82],
    labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    baselineValue: 72,
    height: 110
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      minHeight: 152
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flame",
    size: 20,
    color: "var(--metric-strain)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0 6px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, "Strain"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--text-secondary)'
    }
  }, "Cardiovascular load on a 0\u201321 scale, updated live.")), /*#__PURE__*/React.createElement(Card, {
    style: {
      minHeight: 152
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "moon",
    size: 20,
    color: "var(--metric-sleep)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0 10px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, "Sleep"), /*#__PURE__*/React.createElement(ProgressBar, {
    segments: [{
      pct: 49,
      color: 'var(--iris-300)'
    }, {
      pct: 24,
      color: 'var(--iris-400)'
    }, {
      pct: 23,
      color: 'var(--iris-600)'
    }],
    height: 8
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      gridColumn: 'span 2'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "compass",
    size: 20,
    color: "var(--metric-cardio)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0 14px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, "Healthspan"), /*#__PURE__*/React.createElement(ScaleGauge, {
    value: 0.8,
    min: -1,
    max: 1.6,
    ticks: 45,
    display: "0.8x",
    minLabel: "-1.0x",
    midLabel: "1.0x",
    maxLabel: "1.6x",
    height: 34
  })))));
}
window.FeatureGrid = FeatureGrid;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/FeatureGrid.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
const {
  Button,
  MetricRing,
  Badge,
  MetricTile
} = window.CadenceDesignSystem_057172;
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      padding: '96px 40px 88px',
      background: 'radial-gradient(ellipse 1100px 620px at 22% -10%, rgba(47,214,156,.16), transparent 68%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1.05fr .95fr',
      gap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "good"
  }, "Cadence Band 4"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '20px 0 20px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-display-2)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-display)',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--text-primary)'
    }
  }, "Your body has been keeping notes."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 32px',
      maxWidth: 480,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--size-body-lg)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-secondary)'
    }
  }, "Cadence measures recovery, strain and sleep every second you wear it, then tells you one thing to do about it today."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Join Cadence"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "lg",
    iconAfter: "arrow-right"
  }, "See the science")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 32,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Free band with membership"), /*#__PURE__*/React.createElement("span", null, "Cancel anytime"), /*#__PURE__*/React.createElement("span", null, "5-day battery"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(MetricRing, {
    value: 82,
    size: 280,
    display: "82%",
    label: "Recovery",
    sublabel: "Primed to train",
    color: "var(--metric-recovery)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(MetricTile, {
    label: "HRV",
    value: "68",
    unit: "ms",
    icon: "activity",
    color: "var(--metric-cardio)",
    delta: 4
  }), /*#__PURE__*/React.createElement(MetricTile, {
    label: "Sleep",
    value: "7:42",
    icon: "moon",
    color: "var(--metric-sleep)"
  }), /*#__PURE__*/React.createElement(MetricTile, {
    label: "Strain",
    value: "14.2",
    icon: "flame",
    color: "var(--metric-strain)"
  })))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/PlanSection.jsx
try { (() => {
const {
  Card,
  Button,
  Badge,
  Icon
} = window.CadenceDesignSystem_057172;
function PlanSection({
  onJoin
}) {
  const plans = [{
    name: 'Monthly',
    price: '$30',
    per: '/ month',
    note: 'Rolling. Cancel anytime.',
    features: ['Band included', 'All metrics', 'Daily plan'],
    primary: false
  }, {
    name: '12 months',
    price: '$24',
    per: '/ month',
    note: 'Billed $288 up front.',
    features: ['Band included', 'All metrics', 'Daily plan', 'Healthspan', 'Priority support'],
    primary: true
  }, {
    name: 'Teams',
    price: 'Custom',
    per: '',
    note: 'From 10 members.',
    features: ['Everything in 12 months', 'Team dashboards', 'Coach seats'],
    primary: false
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '96px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 40px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-display-3)',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-display)'
    }
  }, "Membership"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 16
    }
  }, plans.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    tone: p.primary ? 'raised' : 'card',
    style: p.primary ? {
      borderColor: 'var(--border-accent)'
    } : null
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--size-title-3)',
      fontWeight: 700,
      letterSpacing: '-.02em'
    }
  }, p.name), p.primary ? /*#__PURE__*/React.createElement(Badge, {
    tone: "good"
  }, "Best value") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 44,
      fontWeight: 700,
      letterSpacing: '-.03em'
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-tertiary)'
    }
  }, p.per)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-tertiary)',
      marginBottom: 20
    }
  }, p.note), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 24
    }
  }, p.features.map(ft => /*#__PURE__*/React.createElement("span", {
    key: ft,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 14,
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "var(--mint-400)"
  }), ft))), /*#__PURE__*/React.createElement(Button, {
    variant: p.primary ? 'primary' : 'secondary',
    fullWidth: true,
    onClick: onJoin
  }, p.name === 'Teams' ? 'Talk to us' : 'Join'))))));
}
window.PlanSection = PlanSection;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/PlanSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/ProofStrip.jsx
try { (() => {
function ProofStrip() {
  const items = [['24/7', 'continuous measurement'], ['5 days', 'of battery'], ['9', 'physiological inputs'], ['1', 'recommendation a day']];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderTop: '1px solid var(--border-hairline)',
      borderBottom: '1px solid var(--border-hairline)',
      padding: '40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 40
    }
  }, items.map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-numeric)',
      fontSize: 40,
      fontWeight: 700,
      letterSpacing: '-.03em',
      color: 'var(--text-primary)'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, l)))));
}
window.ProofStrip = ProofStrip;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/ProofStrip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SiteFooter.jsx
try { (() => {
function SiteFooter() {
  const cols = [['Product', ['Band', 'App', 'Healthspan', 'Teams']], ['Company', ['About', 'Science', 'Careers', 'Press']], ['Support', ['Help centre', 'Warranty', 'Contact', 'Status']], ['Legal', ['Privacy', 'Terms', 'Data', 'Accessibility']]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-hairline)',
      padding: '64px 40px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr repeat(4,1fr)',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: '-.04em'
    }
  }, "Cadence"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 0',
      maxWidth: 260,
      fontSize: 13,
      lineHeight: 1.62,
      color: 'var(--text-tertiary)'
    }
  }, "Continuous physiological measurement, translated into one useful decision a day.")), cols.map(([h, links]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      marginBottom: 14
    }
  }, h), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)'
    }
  }, l)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      paddingTop: 20,
      borderTop: '1px solid var(--border-hairline)',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Cadence Health"), /*#__PURE__*/React.createElement("span", null, "Not a medical device. Cadence does not diagnose or treat any condition."))));
}
window.SiteFooter = SiteFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SiteHeader.jsx
try { (() => {
const {
  Button,
  Icon
} = window.CadenceDesignSystem_057172;
function SiteHeader({
  onCta
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      padding: '16px 40px',
      background: 'rgba(12,11,10,.72)',
      backdropFilter: 'var(--blur-chrome)',
      WebkitBackdropFilter: 'var(--blur-chrome)',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 21,
      fontWeight: 700,
      letterSpacing: '-.04em',
      color: 'var(--text-primary)'
    }
  }, "Cadence"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28
    }
  }, ['Band', 'Membership', 'Science', 'Teams', 'Support'].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onCta
  }, "Join Cadence")));
}
window.SiteHeader = SiteHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SiteHeader.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.BarSeries = __ds_scope.BarSeries;

__ds_ns.MetricRing = __ds_scope.MetricRing;

__ds_ns.MetricTile = __ds_scope.MetricTile;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ScaleGauge = __ds_scope.ScaleGauge;

__ds_ns.StatRow = __ds_scope.StatRow;

__ds_ns.TrendDelta = __ds_scope.TrendDelta;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.InsightCallout = __ds_scope.InsightCallout;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.DateStepper = __ds_scope.DateStepper;

__ds_ns.NavHeader = __ds_scope.NavHeader;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
