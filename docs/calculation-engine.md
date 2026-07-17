# Calculation Engine

The Calculation Engine ([`calculationEngine.ts`](file:///d:/2. Projects and compititions/4th year/office-render-app/office-render-app/client/src/calculations/calculationEngine.ts)) computes structural takeoffs and feasibility factors.

## Calculated Metrics

### 1. Concrete Slab Takeoff
* **Equation:**
  $$\text{Concrete Volume } (m^3) = \text{Length} \times \text{Width} \times 0.2 \times \text{Floors} \times 1.25$$
  *(Includes standard column foundations and shear walls).*

### 2. Reinforcement Steel Mass
* **Equation:**
  $$\text{Steel Mass } (kg) = \text{Concrete Volume} \times 110$$

### 3. Glass Window Surface Area
* Computes glazing surface area based on the facade perimeter:
  $$\text{Glazing Area } (m^2) = \text{Number of Windows} \times 2.0 \times 1.8$$

### 4. Thermal Energy Rating
* Calculated based on active scenario envelope R-values:
  $$\text{Energy Score} = \text{Clamp}\left(10 + \frac{\text{R-value} \times 20}{\text{Glazing Ratio}}, 10, 100\right)$$
