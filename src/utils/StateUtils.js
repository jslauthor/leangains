// @flow
import get from "lodash.get";
export type GenderType = "M" | "F" | string;
export type MassType = "M" | "VM" | string;
export type Macros = [number, number];
type Range = { start: number, end: number };

export type QueryState = {
  name: string,
  gender: GenderType, // derived from gender, Male and Female respectively
  weight: number, // cumulative,
  height: number, // Tall, Short, Normal
  bodyFatPercentage: number,
  muscleMassAttr: MassType,
  age: number,
  stepsPerDay: number,
  metric: boolean,
  base: number,
  bmr: number,
  macroPercents: Array<Macros> // P, C
};

export const defaultMacros: Macros = [60, 25];

export const getDefaultCaloricAdjustment: GenderType => number = (
  gender: GenderType
) => {
  switch (gender) {
    case "F":
      return -350;
    case "M":
    default:
      return -500;
  }
};

const convertGendertoBase: GenderType => number = (gender: GenderType) => {
  switch (gender) {
    case "F":
      return 26;
    case "M":
    default:
      return 28;
  }
};

const convertBodyFatPercentToBase: (GenderType, number) => number = (
  gender: GenderType,
  bodyFatPercent: number
) => {
  const isMale = gender === "M";
  const lowWeight: Range = isMale
    ? { start: 0, end: 10 }
    : { start: 0, end: 18 };
  const midWeight: Range = isMale
    ? { start: 20, end: 24 }
    : { start: 25, end: 29 };

  if (bodyFatPercent <= lowWeight.end) {
    return 0.5;
  } else if (
    bodyFatPercent >= midWeight.start &&
    bodyFatPercent <= midWeight.end
  ) {
    return -0.5;
  } else if (bodyFatPercent > midWeight.end) {
    return -(0.5 + Math.ceil((bodyFatPercent - midWeight.end) / 5));
  }

  return 0;
};

const convertHeightToBase: (GenderType, number, boolean) => number = (
  gender: GenderType,
  height: number,
  metric: boolean
) => {
  const short = gender === "M" ? 167 : 153;
  const tall = gender === "M" ? 185 : 170;

  if (height > tall) {
    return 1;
  } else if (height < short) {
    return -1;
  }

  return 0;
};

const convertMuscleMassToBase: MassType => number = (mass: MassType) => {
  //'M' | 'VM' | 'NA'
  switch (mass) {
    case "M":
      return 0.5;
    case "VM":
      return 1;
    default:
      return 0;
  }
};

const convertAgeToBase: number => number = (age: number) => {
  if (age > 45) {
    return -0.5;
  } else if (age < 25) {
    return 0.5;
  }

  return 0;
};

const convertStepsToBase: number => number = (steps: number) => {
  if (steps >= 6000 && steps <= 7499) {
    return 0.5;
  } else if (steps >= 7500) {
    return 0.5 + Math.ceil((steps - 7499) / 1250) * 0.5;
  }

  return 0;
};

const sum = (total, value) => total + value;

export const stateToQueryString: QueryState => string = data => {
  return btoa(JSON.stringify(data));
};

export const getStateFromQuery: string => QueryState = (data: string) => {
  let state;
  try {
    state = JSON.parse(atob(data));
  } catch (e) {}

  const gender = get(state, "gender", "M");
  const weight = get(state, "weight", 0);
  const height = get(state, "height", 0);
  const bodyFatPercentage = get(state, "bodyFatPercentage", 0);
  const muscleMassAttr = get(state, "muscleMassAttr", "NA");
  const age = get(state, "age", 0);
  const stepsPerDay = get(state, "stepsPerDay", 0);
  const metric = get(state, "metric", true);

  const base = [
    convertGendertoBase((gender: GenderType)),
    convertBodyFatPercentToBase(gender, Number(bodyFatPercentage)),
    convertHeightToBase(gender, Number(height), metric),
    convertMuscleMassToBase(muscleMassAttr),
    convertAgeToBase(Number(age)),
    convertStepsToBase(Number(stepsPerDay))
  ].reduce(sum, 0);

  return {
    name: get(state, "name", ""),
    gender,
    weight,
    height,
    bodyFatPercentage,
    muscleMassAttr,
    age,
    stepsPerDay,
    metric,
    base,
    bmr: base * Number(weight),
    macroPercents: get(state, "macroPercents", [
      defaultMacros,
      defaultMacros,
      defaultMacros,
      defaultMacros
    ])
  };
};
