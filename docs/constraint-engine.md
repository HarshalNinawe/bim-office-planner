# Constraint Engine

The Constraint Engine ([`constraintEngine.ts`](file:///d:/2. Projects and compititions/4th year/office-render-app/office-render-app/client/src/constraints/constraintEngine.ts)) audits building layouts.

## Standard Validation Rules

| Rule Code | Category | Condition |
| --- | --- | --- |
| `ERR_SITE_BOUND` | Spatial boundary | Building or canvas objects extend beyond property lines |
| `ERR_OVERLAP` | Spatial intersection | Bounding boxes intersect on active canvas plane |
| `WARN_PARKING` | Transportation | Total active parking slots < 1 per 10 target employees |
| `WARN_GREEN_SPACE` | Sustainability | Green vegetation total footprint area < 15% of site area |
| `WARN_FIRE_SAFETY` | Security | Building is closer than 10 meters to site property lines |
| `WARN_HVAC` | Energy efficiency | Glazing facade area > 45% of total outer wall area |
