// @flow
export type GenderType = "M" | "F" | string;
export type MassType = "M" | "VM" | string;
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
  bmr: number
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

// localhost:3000/?data=Leonard%20Souza,M,200,182.88,13,M,38,6600,1

export const stateToQueryString: QueryState => string = ({
  name,
  gender,
  weight,
  height,
  bodyFatPercentage,
  muscleMassAttr,
  age,
  stepsPerDay,
  metric,
  base,
  bmr
}) => {
  const metricBit = metric ? 1 : 0;
  return [
    name,
    gender,
    weight,
    height,
    bodyFatPercentage,
    muscleMassAttr,
    age,
    stepsPerDay,
    metricBit
  ]
    .map(String)
    .join(",");
};

export const getStateFromQuery: string => QueryState = (data: string) => {
  let [
    name,
    gender = "M",
    weight,
    height,
    bodyFatPercentage,
    muscleMassAttr = "NA",
    age,
    stepsPerDay,
    metric = true
  ] = data.split(",");

  metric = !!Number(metric);

  const base = [
    convertGendertoBase((gender: GenderType)),
    convertBodyFatPercentToBase(gender, Number(bodyFatPercentage)),
    convertHeightToBase(gender, Number(height), metric),
    convertMuscleMassToBase(muscleMassAttr),
    convertAgeToBase(Number(age)),
    convertStepsToBase(Number(stepsPerDay))
  ].reduce(sum, 0);

  return {
    name: decodeURI(name),
    gender,
    weight: Number(weight),
    height: Number(height),
    bodyFatPercentage: Number(bodyFatPercentage),
    muscleMassAttr,
    age: Number(age),
    stepsPerDay: Number(stepsPerDay),
    metric,
    base,
    bmr: base * Number(weight)
  };
};
