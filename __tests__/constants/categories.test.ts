import {
  CATEGORIES,
  CATEGORY_MAP,
  SUB_TYPES,
  SUB_TYPE_MAP,
  SUB_TYPES_BY_CATEGORY,
} from '../../src/constants/categories';

describe('categories and sub-types templates', () => {
  it('defines the core categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(8);
    expect(CATEGORY_MAP.homeAppliance).toBeDefined();
    expect(CATEGORY_MAP.electronics).toBeDefined();
    expect(CATEGORY_MAP.vehicle).toBeDefined();
    expect(CATEGORY_MAP.furniture).toBeDefined();
    expect(CATEGORY_MAP.homeEquipment).toBeDefined();
    expect(CATEGORY_MAP.tools).toBeDefined();
    expect(CATEGORY_MAP.importantDocument).toBeDefined();
    expect(CATEGORY_MAP.custom).toBeDefined();
  });

  it('has valid template configurations for common products', () => {
    const ac = SUB_TYPE_MAP.airConditioner;
    expect(ac).toBeDefined();
    expect(ac.category).toBe('homeAppliance');
    expect(ac.suggestedLocations.length).toBeGreaterThan(0);

    const phone = SUB_TYPE_MAP.smartphone;
    expect(phone).toBeDefined();
    expect(phone.category).toBe('electronics');
    expect(phone.showImei).toBe(true);

    const car = SUB_TYPE_MAP.car;
    expect(car).toBeDefined();
    expect(car.category).toBe('vehicle');
    expect(car.suggestedLocations).toContain('Garage');
  });

  it('groups all subTypes by category correctly', () => {
    for (const subType of SUB_TYPES) {
      expect(SUB_TYPES_BY_CATEGORY[subType.category]).toBeDefined();
      expect(
        SUB_TYPES_BY_CATEGORY[subType.category].some((st) => st.key === subType.key)
      ).toBe(true);
    }
  });
});
